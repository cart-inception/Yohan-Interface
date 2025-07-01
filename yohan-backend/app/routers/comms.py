from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import logging
import asyncio
from typing import Dict, Any
from datetime import datetime

from ..websocket_manager import manager
from ..schemas.websockets import (
    WebSocketMessage,
    LLMQueryMessage,
    LLMResponseMessage,
    ErrorMessage,
    LLMResponsePayload,
    ErrorPayload
)
from ..schemas.llm import LLMContext
from ..services.llm_service import llm_service
from ..services.weather_service import get_weather_data
from ..services.calendar_service import get_calendar_events

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/comms")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time communication between backend and frontend.

    Handles:
    - Voice system status updates (idle, listening, processing, speaking)
    - LLM chat messages and responses
    - Real-time data updates

    Message format:
    {
        "event_type": "status_update" | "llm_query" | "llm_response" | "data_update",
        "payload": { ... }
    }
    """
    logger.info(f"WebSocket connection attempt from: {websocket.client}")
    await manager.connect(websocket)
    
    try:
        # Send initial status message to the newly connected client
        initial_message = WebSocketMessage(
            event_type="status_update",
            payload={"status": "idle", "message": "Connected to Yohan backend"}
        )
        await manager.send_personal_json(initial_message.dict(), websocket)
        
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
                await handle_websocket_message(ws_message, websocket)
                
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
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")


async def handle_websocket_message(message: WebSocketMessage, websocket: WebSocket):
    """
    Handle different types of WebSocket messages.
    
    Args:
        message: The parsed WebSocketMessage
        websocket: The WebSocket connection that sent the message
    """
    event_type = message.event_type
    payload = message.payload
    
    if event_type == "llm_query":
        # Handle LLM chat queries from the frontend
        await handle_llm_query(payload, websocket)
        
    elif event_type == "ping":
        # Handle ping messages for connection health checks
        pong_response = WebSocketMessage(
            event_type="pong",
            payload={"timestamp": payload.get("timestamp", "")}
        )
        await manager.send_personal_json(pong_response.dict(), websocket)
        
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


async def handle_llm_query(payload: Dict[str, Any], websocket: WebSocket):
    """
    Handle LLM query messages from the frontend.

    Gathers context from weather and calendar services, calls the LLM service,
    and broadcasts the response to all connected clients.

    Args:
        payload: The message payload containing the user's query
        websocket: The WebSocket connection that sent the query
    """
    user_message = payload.get("message", "")
    timestamp = payload.get("timestamp", datetime.now().isoformat())
    conversation_id = payload.get("conversation_id")

    if not user_message:
        error_response = ErrorMessage(
            event_type="error",
            payload=ErrorPayload(
                error="No message provided in LLM query",
                error_type="validation_error",
                timestamp=datetime.now().isoformat()
            )
        )
        await manager.send_personal_json(error_response.dict(), websocket)
        return

    logger.info(f"Processing LLM query: {user_message}")

    try:
        # Gather context from weather and calendar services
        context = await gather_context()

        # Call the LLM service with the user's message and context
        llm_response = await llm_service.generate_response(
            message=user_message,
            context=context
        )

        # Create response message
        response_message = LLMResponseMessage(
            event_type="llm_response",
            payload=LLMResponsePayload(
                message=llm_response.content,
                timestamp=datetime.now().isoformat(),
                conversation_id=conversation_id,
                usage=llm_response.usage,
                model=llm_response.model
            )
        )

        # Broadcast the response to all connected clients
        await manager.broadcast_json(response_message.dict())
        logger.info(f"Successfully processed LLM query and sent response")

    except Exception as e:
        logger.error(f"Error processing LLM query: {str(e)}")

        # Send error response
        error_response = ErrorMessage(
            event_type="error",
            payload=ErrorPayload(
                error=f"Failed to process LLM query: {str(e)}",
                error_type="llm_error",
                timestamp=datetime.now().isoformat()
            )
        )
        await manager.send_personal_json(error_response.dict(), websocket)


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

    try:
        # Gather weather data
        logger.info("Gathering weather context...")
        weather_data = await get_weather_data()

        # Convert weather data to dictionary format for context
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
        context_data["weather_data"] = weather_dict

        # Update location from weather data if available
        if weather_data.location:
            context_data["location"] = weather_data.location

        logger.info("Weather context gathered successfully")

    except Exception as e:
        logger.warning(f"Failed to gather weather context: {str(e)}")
        context_data["weather_data"] = None

    try:
        # Gather calendar data
        logger.info("Gathering calendar context...")
        calendar_events = get_calendar_events()

        # Convert calendar events to dictionary format for context
        events_dict = []
        for event in calendar_events[:10]:  # Limit to next 10 events
            events_dict.append({
                "summary": event.summary,
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat()
            })

        context_data["calendar_events"] = events_dict
        logger.info(f"Calendar context gathered successfully: {len(events_dict)} events")

    except Exception as e:
        logger.warning(f"Failed to gather calendar context: {str(e)}")
        context_data["calendar_events"] = []

    return LLMContext(**context_data)
