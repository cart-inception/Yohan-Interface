from typing import List
from fastapi import WebSocket
import json
import logging
from .schemas.websockets import WebSocketMessage

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages WebSocket connections for real-time communication between backend and frontend.
    
    Handles connecting, disconnecting, and broadcasting messages to all connected clients.
    """
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """
        Accept a new WebSocket connection and add it to the active connections list.
        
        Args:
            websocket: The WebSocket connection to accept and manage
        """
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection from the active connections list.
        
        Args:
            websocket: The WebSocket connection to remove
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """
        Send a message to a specific WebSocket connection.
        
        Args:
            message: The message to send (JSON string)
            websocket: The target WebSocket connection
        """
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)
    
    async def send_personal_json(self, data: dict, websocket: WebSocket):
        """
        Send JSON data to a specific WebSocket connection.
        
        Args:
            data: The data to send as JSON
            websocket: The target WebSocket connection
        """
        try:
            await websocket.send_json(data)
        except Exception as e:
            logger.error(f"Error sending personal JSON: {e}")
            self.disconnect(websocket)
    
    async def broadcast_message(self, message: str):
        """
        Broadcast a text message to all active WebSocket connections.
        
        Args:
            message: The message to broadcast (JSON string)
        """
        disconnected_connections = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message to connection: {e}")
                disconnected_connections.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected_connections:
            self.disconnect(connection)
    
    async def broadcast_json(self, data: dict):
        """
        Broadcast JSON data to all active WebSocket connections.
        
        Args:
            data: The data to broadcast as JSON
        """
        disconnected_connections = []
        
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception as e:
                logger.error(f"Error broadcasting JSON to connection: {e}")
                disconnected_connections.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected_connections:
            self.disconnect(connection)
    
    async def broadcast_websocket_message(self, ws_message: WebSocketMessage):
        """
        Broadcast a WebSocketMessage to all active connections.
        
        Args:
            ws_message: The WebSocketMessage to broadcast
        """
        message_dict = ws_message.dict()
        await self.broadcast_json(message_dict)
    
    def get_connection_count(self) -> int:
        """
        Get the number of active WebSocket connections.
        
        Returns:
            The number of active connections
        """
        return len(self.active_connections)


# Global connection manager instance
manager = ConnectionManager()
