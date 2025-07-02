from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import json
import logging
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ..websocket_manager import manager
from ..models.database import get_db
from ..services.chat_history_service import ChatHistoryService
from ..services.heartbeat_service import heartbeat_service
from ..schemas.websockets import (
    WebSocketMessage,
    LLMQueryMessage,
    LLMResponseMessage,
    ErrorMessage,
    MessageAckMessage,
    LLMResponsePayload,
    ErrorPayload,
    MessageAckPayload
)
from ..schemas.llm import LLMContext, LLMMessage
from ..services.llm_service import llm_service
from ..services.weather_service import get_weather_data
from ..services.calendar_service import get_calendar_events

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/comms")
async def websocket_endpoint(websocket: WebSocket, user_id: Optional[str] = None):
    """
    WebSocket endpoint for real-time communication between backend and frontend.

    Handles:
    - Voice system status updates (idle, listening, processing, speaking)
    - LLM chat messages and responses with session persistence
    - Real-time data updates

    Message format:
    {
        "event_type": "status_update" | "llm_query" | "llm_response" | "data_update",
        "payload": { ... }
    }
    """
    logger.info(f"WebSocket connection attempt from: {websocket.client}")
    
    # Connect with session management
    session_id = await manager.connect(websocket, user_id)
    
    # Initialize database session
    db = next(get_db())
    chat_service = ChatHistoryService(db)
    
    try:
        # Create or get chat session
        chat_session = chat_service.get_session(session_id)
        if not chat_session:
            user_id_for_session = user_id or f"user_{session_id[:8]}"
            chat_session = chat_service.create_session(session_id, user_id_for_session)
        
        # Log connection event
        chat_service.log_connection_event(
            session_id=session_id,
            user_id=chat_session.user_id,
            event_type="connect",
            ip_address=str(websocket.client.host) if websocket.client else None
        )
        
        # Send initial status message with session info
        initial_message = WebSocketMessage(
            event_type="status_update",
            payload={
                "status": "idle", 
                "message": "Connected to Yohan backend",
                "session_id": session_id,
                "user_id": chat_session.user_id
            }
        )
        await manager.send_personal_json(initial_message.dict(), websocket)
        
        # Send chat history if available
        recent_messages = chat_service.get_recent_messages(session_id, count=20)
        if recent_messages:
            history_message = WebSocketMessage(
                event_type="chat_history",
                payload={
                    "messages": [
                        {
                            "role": msg.role,
                            "content": msg.content,
                            "timestamp": msg.timestamp.isoformat()
                        }
                        for msg in recent_messages
                    ]
                }
            )
            await manager.send_personal_json(history_message.dict(), websocket)
        
        # Gather and store current context (weather/calendar) once per session
        # Only add context if this is a new session (no existing messages)
        if not recent_messages:
            try:
                logger.info(f"Gathering session context for new session {session_id}")
                context = await gather_context()
                
                # Create a system context message to store in database
                context_content = f"""Current session context:
Location: {context.location}
Time: {context.current_time.strftime('%Y-%m-%d %H:%M:%S')}

Weather:
{f"Temperature: {context.weather_data['current']['temp']}°F (feels like {context.weather_data['current']['feels_like']}°F)" if context.weather_data else "Weather data unavailable"}
{f"Conditions: {context.weather_data['current']['description']}" if context.weather_data else ""}
{f"Humidity: {context.weather_data['current']['humidity']}%" if context.weather_data else ""}

Calendar Events:
{chr(10).join([f"- {event['summary']} at {event['start_time']}" for event in context.calendar_events[:5]]) if context.calendar_events else "No upcoming events"}
"""
                
                # Store context as a system message in the database
                chat_service.add_message(
                    session_id=session_id,
                    role="system",
                    content=context_content
                )
                
                logger.info(f"Session context stored for {session_id}")
                
            except Exception as e:
                logger.warning(f"Failed to gather session context for {session_id}: {e}")
                # Don't fail the connection if context gathering fails
        
        while True:
            # Listen for incoming messages from the client
            data = await websocket.receive_text()
            
            try:
                # Parse the incoming message
                message_data = json.loads(data)
                
                # Validate the message structure
                if "event_type" not in message_data or "payload" not in message_data:
                    error_response = WebSocketMessage(
                        event_type="error",
                        payload={"error": "Invalid message format. Expected 'event_type' and 'payload' fields."}
                    )
                    await manager.send_personal_json(error_response.dict(), websocket)
                    continue
                
                # Create WebSocketMessage object
                ws_message = WebSocketMessage(**message_data)
                
                # Handle different message types
                await handle_websocket_message(ws_message, websocket, session_id, chat_service)
                
            except json.JSONDecodeError:
                error_response = WebSocketMessage(
                    event_type="error",
                    payload={"error": "Invalid JSON format"}
                )
                await manager.send_personal_json(error_response.dict(), websocket)
                
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                error_response = WebSocketMessage(
                    event_type="error",
                    payload={"error": f"Error processing message: {str(e)}"}
                )
                await manager.send_personal_json(error_response.dict(), websocket)
    
    except WebSocketDisconnect:
        # Log disconnection event
        chat_service.log_connection_event(
            session_id=session_id,
            user_id=chat_session.user_id if 'chat_session' in locals() else "unknown",
            event_type="disconnect"
        )
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")
    finally:
        if 'db' in locals():
            db.close()


async def handle_websocket_message(
    message: WebSocketMessage, 
    websocket: WebSocket, 
    session_id: str, 
    chat_service: ChatHistoryService
):
    """
    Handle different types of WebSocket messages.
    
    Args:
        message: The parsed WebSocketMessage
        websocket: The WebSocket connection that sent the message
        session_id: The session ID for this connection
        chat_service: The chat history service instance
    """
    event_type = message.event_type
    payload = message.payload
    
    if event_type == "llm_query":
        # Handle LLM chat queries from the frontend
        await handle_llm_query(payload, websocket, session_id, chat_service)
        
    elif event_type == "ping":
        # Handle ping messages for connection health checks
        manager.update_connection_ping(websocket)
        pong_response = WebSocketMessage(
            event_type="pong",
            payload={"timestamp": payload.get("timestamp", "")}
        )
        await manager.send_personal_json(pong_response.dict(), websocket)
        
    elif event_type == "pong":
        # Handle pong responses from heartbeat service
        timestamp = payload.get("timestamp", "")
        heartbeat_service.handle_pong(session_id, timestamp)
        
    elif event_type == "status_request":
        # Handle requests for current system status
        status_response = WebSocketMessage(
            event_type="status_update",
            payload={"status": "idle", "connections": manager.get_connection_count()}
        )
        await manager.send_personal_json(status_response.dict(), websocket)
        
    else:
        # Handle unknown message types
        logger.warning(f"Unknown WebSocket message type: {event_type}")
        error_response = WebSocketMessage(
            event_type="error",
            payload={"error": f"Unknown message type: {event_type}"}
        )
        await manager.send_personal_json(error_response.dict(), websocket)


async def handle_llm_query(
    payload: Dict[str, Any], 
    websocket: WebSocket, 
    session_id: str, 
    chat_service: ChatHistoryService
):
    """
    Handle LLM query messages from the frontend.

    Gathers context from weather and calendar services, calls the LLM service,
    saves the conversation to database, and sends response to the user.

    Args:
        payload: The message payload containing the user's query
        websocket: The WebSocket connection that sent the query
        session_id: The session ID for this connection
        chat_service: The chat history service instance
    """
    user_message = payload.get("message", "")
    timestamp = payload.get("timestamp", datetime.now().isoformat())
    conversation_id = payload.get("conversation_id")
    message_id = payload.get("message_id")

    if not user_message:
        error_response = ErrorMessage(
            event_type="error",
            payload=ErrorPayload(
                error="No message provided in LLM query",
                error_type="validation_error",
                timestamp=datetime.now().isoformat()
            )
        )
        await manager.send_to_session(session_id, error_response.dict())
        return

    logger.info(f"Processing LLM query for session {session_id}: {user_message}")

    # Send acknowledgment that message was received
    if message_id:
        ack_message = MessageAckMessage(
            event_type="message_ack",
            payload=MessageAckPayload(
                message_id=message_id,
                status="received",
                timestamp=datetime.now().isoformat()
            )
        )
        await manager.send_to_session(session_id, ack_message.dict())

    try:
        # Send acknowledgment that message is being processed
        if message_id:
            processing_ack = MessageAckMessage(
                event_type="message_ack",
                payload=MessageAckPayload(
                    message_id=message_id,
                    status="processing",
                    timestamp=datetime.now().isoformat()
                )
            )
            await manager.send_to_session(session_id, processing_ack.dict())

        # Save user message to database
        start_time = datetime.now()
        user_msg_record = chat_service.add_message(
            session_id=session_id,
            role="user",
            content=user_message
        )

        # Get conversation history from database for context
        recent_messages = chat_service.get_recent_messages(session_id, count=20)
        conversation_history = []
        for msg in recent_messages:
            conversation_history.append(LLMMessage(
                role=msg.role,
                content=msg.content,
                timestamp=msg.timestamp.isoformat()
            ))
        
        # Call the LLM service with conversation history (includes initial context)
        llm_response = await llm_service.generate_response(
            message=user_message,
            context=None,  # Context provided once per session
            conversation_history=conversation_history
        )

        # Calculate processing time
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

        # Save assistant response to database
        assistant_msg_record = chat_service.add_message(
            session_id=session_id,
            role="assistant",
            content=llm_response.content,
            token_count=llm_response.usage.get("total_tokens") if llm_response.usage else None,
            model_used=llm_response.model,
            processing_time=processing_time,
            context_data=None  # Context is provided once per session, not per message
        )

        # Create response message
        response_message = LLMResponseMessage(
            event_type="llm_response",
            payload=LLMResponsePayload(
                message=llm_response.content,
                timestamp=datetime.now().isoformat(),
                conversation_id=conversation_id,
                usage=llm_response.usage,
                model=llm_response.model,
                message_id=assistant_msg_record.message_id,
                in_reply_to=message_id
            )
        )

        # Send response only to the requesting user
        await manager.send_to_session(session_id, response_message.dict())

        # Send final acknowledgment that message was delivered
        if message_id:
            delivered_ack = MessageAckMessage(
                event_type="message_ack",
                payload=MessageAckPayload(
                    message_id=message_id,
                    status="delivered",
                    timestamp=datetime.now().isoformat()
                )
            )
            await manager.send_to_session(session_id, delivered_ack.dict())

        logger.info(f"Successfully processed LLM query for session {session_id} and sent response")

    except Exception as e:
        logger.error(f"Error processing LLM query for session {session_id}: {str(e)}")

        # Log error in chat history
        try:
            chat_service.add_message(
                session_id=session_id,
                role="assistant",
                content=f"Error: {str(e)}"
            )
        except Exception as db_error:
            logger.error(f"Failed to log error message to database: {db_error}")

        # Send error acknowledgment
        if message_id:
            error_ack = MessageAckMessage(
                event_type="message_ack",
                payload=MessageAckPayload(
                    message_id=message_id,
                    status="error",
                    timestamp=datetime.now().isoformat(),
                    error_message=str(e)
                )
            )
            await manager.send_to_session(session_id, error_ack.dict())

        # Send error response
        error_response = ErrorMessage(
            event_type="error",
            payload=ErrorPayload(
                error=f"Failed to process LLM query: {str(e)}",
                error_type="llm_error",
                timestamp=datetime.now().isoformat()
            )
        )
        await manager.send_to_session(session_id, error_response.dict())


async def gather_context() -> LLMContext:
    """
    Gather context information from weather and calendar services.

    Returns:
        LLMContext object with current weather and calendar data
    """
    context_data = {
        "current_time": datetime.now(),
        "location": "Des Moines, Iowa"
    }

    # Gather weather and calendar data in parallel with timeouts
    async def get_weather_with_timeout():
        try:
            logger.info("Gathering weather context...")
            weather_data = await asyncio.wait_for(get_weather_data(), timeout=3.0)
            
            weather_dict = {
                "current": {
                    "temp": weather_data.current.temp,
                    "feels_like": weather_data.current.feels_like,
                    "humidity": weather_data.current.humidity,
                    "wind_speed": weather_data.current.wind_speed,
                    "description": weather_data.current.description,
                    "sunrise": weather_data.current.sunrise.isoformat(),
                    "sunset": weather_data.current.sunset.isoformat()
                },
                "location": weather_data.location
            }
            
            if weather_data.location:
                context_data["location"] = weather_data.location
                
            logger.info("Weather context gathered successfully")
            return weather_dict
        except Exception as e:
            logger.warning(f"Failed to gather weather context: {str(e)}")
            return None

    async def get_calendar_with_timeout():
        try:
            logger.info("Gathering calendar context...")
            # Wrap sync function in executor for timeout
            calendar_events = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(None, get_calendar_events), 
                timeout=2.0
            )
            
            events_dict = []
            for event in calendar_events[:10]:  # Limit to next 10 events
                events_dict.append({
                    "summary": event.summary,
                    "start_time": event.start_time.isoformat(),
                    "end_time": event.end_time.isoformat()
                })
            
            logger.info(f"Calendar context gathered successfully: {len(events_dict)} events")
            return events_dict
        except Exception as e:
            logger.warning(f"Failed to gather calendar context: {str(e)}")
            return []

    # Run both context gathering operations in parallel
    weather_task = get_weather_with_timeout()
    calendar_task = get_calendar_with_timeout()
    
    weather_dict, events_dict = await asyncio.gather(weather_task, calendar_task)
    
    context_data["weather_data"] = weather_dict
    context_data["calendar_events"] = events_dict

    return LLMContext(**context_data)
