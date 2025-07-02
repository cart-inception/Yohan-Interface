from typing import List, Dict, Optional
from fastapi import WebSocket
import json
import logging
import uuid
from datetime import datetime
from .schemas.websockets import WebSocketMessage

logger = logging.getLogger(__name__)

class Connection:
    """
    Represents a WebSocket connection with user session metadata.
    """
    def __init__(self, websocket: WebSocket, user_id: Optional[str] = None):
        self.websocket = websocket
        self.session_id = str(uuid.uuid4())
        self.user_id = user_id or f"user_{self.session_id[:8]}"
        self.connected_at = datetime.utcnow()
        self.last_ping = datetime.utcnow()
        self.metadata: Dict[str, any] = {}
    
    def update_ping(self):
        """Update the last ping timestamp."""
        self.last_ping = datetime.utcnow()
    
    def to_dict(self) -> Dict:
        """Convert connection info to dictionary."""
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "connected_at": self.connected_at.isoformat(),
            "last_ping": self.last_ping.isoformat(),
            "metadata": self.metadata
        }

class ConnectionManager:
    """
    Manages WebSocket connections for real-time communication between backend and frontend.
    
    Handles connecting, disconnecting, and broadcasting messages with user session support.
    """
    
    def __init__(self):
        self.active_connections: Dict[str, Connection] = {}
        self.user_connections: Dict[str, List[str]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None) -> str:
        """
        Accept a new WebSocket connection and add it to the active connections.
        
        Args:
            websocket: The WebSocket connection to accept and manage
            user_id: Optional user identifier for the connection
            
        Returns:
            session_id: The unique session ID for this connection
        """
        await websocket.accept()
        connection = Connection(websocket, user_id)
        
        self.active_connections[connection.session_id] = connection
        
        # Track user connections
        if connection.user_id not in self.user_connections:
            self.user_connections[connection.user_id] = []
        self.user_connections[connection.user_id].append(connection.session_id)
        
        logger.info(f"WebSocket connected. Session: {connection.session_id}, User: {connection.user_id}, Total connections: {len(self.active_connections)}")
        return connection.session_id
    
    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection from the active connections.
        
        Args:
            websocket: The WebSocket connection to remove
        """
        session_to_remove = None
        connection_to_remove = None
        
        # Find the connection by websocket
        for session_id, connection in self.active_connections.items():
            if connection.websocket == websocket:
                session_to_remove = session_id
                connection_to_remove = connection
                break
        
        if session_to_remove:
            self._remove_connection(session_to_remove, connection_to_remove)
    
    def disconnect_session(self, session_id: str):
        """
        Remove a WebSocket connection by session ID.
        
        Args:
            session_id: The session ID of the connection to remove
        """
        if session_id in self.active_connections:
            connection = self.active_connections[session_id]
            self._remove_connection(session_id, connection)
    
    def _remove_connection(self, session_id: str, connection: Connection):
        """
        Internal method to remove a connection and clean up user tracking.
        """
        # Remove from active connections
        del self.active_connections[session_id]
        
        # Remove from user connections
        if connection.user_id in self.user_connections:
            if session_id in self.user_connections[connection.user_id]:
                self.user_connections[connection.user_id].remove(session_id)
            
            # Clean up empty user entries
            if not self.user_connections[connection.user_id]:
                del self.user_connections[connection.user_id]
        
        logger.info(f"WebSocket disconnected. Session: {session_id}, User: {connection.user_id}, Total connections: {len(self.active_connections)}")
    
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
    
    async def send_to_session(self, session_id: str, data: dict):
        """
        Send JSON data to a specific session.
        
        Args:
            session_id: The target session ID
            data: The data to send as JSON
        """
        if session_id in self.active_connections:
            connection = self.active_connections[session_id]
            try:
                await connection.websocket.send_json(data)
            except Exception as e:
                logger.error(f"Error sending to session {session_id}: {e}")
                self.disconnect_session(session_id)
    
    async def send_to_user(self, user_id: str, data: dict):
        """
        Send JSON data to all sessions for a specific user.
        
        Args:
            user_id: The target user ID
            data: The data to send as JSON
        """
        if user_id in self.user_connections:
            session_ids = self.user_connections[user_id].copy()
            for session_id in session_ids:
                await self.send_to_session(session_id, data)
    
    async def broadcast_message(self, message: str):
        """
        Broadcast a text message to all active WebSocket connections.
        
        Args:
            message: The message to broadcast (JSON string)
        """
        disconnected_sessions = []
        
        for session_id, connection in self.active_connections.items():
            try:
                await connection.websocket.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message to session {session_id}: {e}")
                disconnected_sessions.append(session_id)
        
        # Remove disconnected connections
        for session_id in disconnected_sessions:
            self.disconnect_session(session_id)
    
    async def broadcast_json(self, data: dict):
        """
        Broadcast JSON data to all active WebSocket connections.
        
        Args:
            data: The data to broadcast as JSON
        """
        disconnected_sessions = []
        
        for session_id, connection in self.active_connections.items():
            try:
                await connection.websocket.send_json(data)
            except Exception as e:
                logger.error(f"Error broadcasting JSON to session {session_id}: {e}")
                disconnected_sessions.append(session_id)
        
        # Remove disconnected connections
        for session_id in disconnected_sessions:
            self.disconnect_session(session_id)
    
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
    
    def get_user_count(self) -> int:
        """
        Get the number of unique users connected.
        
        Returns:
            The number of unique users
        """
        return len(self.user_connections)
    
    def get_connection_info(self, session_id: str) -> Optional[Dict]:
        """
        Get connection information for a session.
        
        Args:
            session_id: The session ID to get info for
            
        Returns:
            Connection info dictionary or None if not found
        """
        if session_id in self.active_connections:
            return self.active_connections[session_id].to_dict()
        return None
    
    def get_user_sessions(self, user_id: str) -> List[str]:
        """
        Get all session IDs for a user.
        
        Args:
            user_id: The user ID to get sessions for
            
        Returns:
            List of session IDs
        """
        return self.user_connections.get(user_id, [])
    
    def update_connection_ping(self, websocket: WebSocket):
        """
        Update the ping timestamp for a connection.
        
        Args:
            websocket: The WebSocket connection to update
        """
        for connection in self.active_connections.values():
            if connection.websocket == websocket:
                connection.update_ping()
                break
    
    def get_session_by_websocket(self, websocket: WebSocket) -> Optional[str]:
        """
        Get the session ID for a WebSocket connection.
        
        Args:
            websocket: The WebSocket connection
            
        Returns:
            Session ID or None if not found
        """
        for session_id, connection in self.active_connections.items():
            if connection.websocket == websocket:
                return session_id
        return None


# Global connection manager instance
manager = ConnectionManager()
