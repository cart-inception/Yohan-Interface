from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import logging
from typing import Dict, Any

from ..websocket_manager import manager
from ..schemas.websockets import WebSocketMessage

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
    
    This is a placeholder for future LLM integration.
    In Phase 3, this will be connected to the Anthropic API.
    
    Args:
        payload: The message payload containing the user's query
        websocket: The WebSocket connection that sent the query
    """
    user_message = payload.get("message", "")
    
    if not user_message:
        error_response = WebSocketMessage(
            event_type="error",
            payload={"error": "No message provided in LLM query"}
        )
        await manager.send_personal_json(error_response.dict(), websocket)
        return
    
    # For now, send a placeholder response
    # This will be replaced with actual LLM integration in Phase 3
    response_message = WebSocketMessage(
        event_type="llm_response",
        payload={
            "message": f"Echo: {user_message}",
            "timestamp": "placeholder",
            "is_placeholder": True
        }
    )
    
    await manager.send_personal_json(response_message.dict(), websocket)
    logger.info(f"Handled LLM query: {user_message}")
