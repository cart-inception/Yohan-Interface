import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Set
from ..websocket_manager import manager
from ..schemas.websockets import WebSocketMessage

logger = logging.getLogger(__name__)

class HeartbeatService:
    """
    Service for managing WebSocket connection health through heartbeat monitoring.
    """
    
    def __init__(self, ping_interval: int = 30, timeout_threshold: int = 300):
        """
        Initialize the heartbeat service.
        
        Args:
            ping_interval: How often to send ping messages (seconds)
            timeout_threshold: How long to wait before considering a connection dead (seconds, default 5 minutes)
        """
        self.ping_interval = ping_interval
        self.timeout_threshold = timeout_threshold
        self.running = False
        self.task: asyncio.Task = None
        self.pending_pings: Dict[str, datetime] = {}
    
    async def start(self):
        """
        Start the heartbeat service.
        """
        if self.running:
            logger.warning("Heartbeat service is already running")
            return
        
        self.running = True
        self.task = asyncio.create_task(self._heartbeat_loop())
        logger.info(f"Heartbeat service started with {self.ping_interval}s interval")
    
    async def stop(self):
        """
        Stop the heartbeat service.
        """
        if not self.running:
            return
        
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        
        logger.info("Heartbeat service stopped")
    
    async def _heartbeat_loop(self):
        """
        Main heartbeat loop that sends pings and checks for timeouts.
        """
        while self.running:
            try:
                await self._send_pings()
                await self._check_timeouts()
                await asyncio.sleep(self.ping_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in heartbeat loop: {e}")
                await asyncio.sleep(5)  # Brief pause before retrying
    
    async def _send_pings(self):
        """
        Send ping messages to all active connections.
        """
        if not manager.active_connections:
            return
        
        current_time = datetime.utcnow()
        ping_message = WebSocketMessage(
            event_type="ping",
            payload={"timestamp": current_time.isoformat()}
        )
        
        # Send ping to all connections and track them
        session_ids = list(manager.active_connections.keys())
        for session_id in session_ids:
            try:
                await manager.send_to_session(session_id, ping_message.dict())
                self.pending_pings[session_id] = current_time
            except Exception as e:
                logger.warning(f"Failed to send ping to session {session_id}: {e}")
        
        logger.debug(f"Sent {len(session_ids)} ping messages")
    
    async def _check_timeouts(self):
        """
        Check for connections that haven't responded to pings within the timeout threshold.
        """
        current_time = datetime.utcnow()
        timeout_threshold = timedelta(seconds=self.timeout_threshold)
        
        # Check for timed out connections
        timed_out_sessions = []
        
        for session_id, connection in manager.active_connections.items():
            time_since_ping = current_time - connection.last_ping
            
            if time_since_ping > timeout_threshold:
                timed_out_sessions.append(session_id)
                logger.warning(f"Session {session_id} timed out (last ping: {connection.last_ping})")
        
        # Disconnect timed out sessions
        for session_id in timed_out_sessions:
            try:
                manager.disconnect_session(session_id)
                # Clean up pending ping
                self.pending_pings.pop(session_id, None)
                logger.info(f"Disconnected timed out session: {session_id}")
            except Exception as e:
                logger.error(f"Error disconnecting timed out session {session_id}: {e}")
    
    def handle_pong(self, session_id: str, timestamp: str):
        """
        Handle pong response from a client.
        
        Args:
            session_id: The session ID that sent the pong
            timestamp: The timestamp from the original ping
        """
        # Remove from pending pings
        self.pending_pings.pop(session_id, None)
        
        # Update connection ping time
        if session_id in manager.active_connections:
            manager.active_connections[session_id].update_ping()
            logger.debug(f"Received pong from session {session_id}")
    
    def get_connection_health(self) -> Dict[str, Dict]:
        """
        Get health information for all connections.
        
        Returns:
            Dictionary with connection health data
        """
        current_time = datetime.utcnow()
        health_data = {}
        
        for session_id, connection in manager.active_connections.items():
            time_since_ping = current_time - connection.last_ping
            is_pending_pong = session_id in self.pending_pings
            
            health_data[session_id] = {
                "user_id": connection.user_id,
                "connected_at": connection.connected_at.isoformat(),
                "last_ping": connection.last_ping.isoformat(),
                "time_since_ping_seconds": int(time_since_ping.total_seconds()),
                "pending_pong": is_pending_pong,
                "healthy": time_since_ping.total_seconds() < self.timeout_threshold
            }
        
        return health_data

# Global heartbeat service instance
heartbeat_service = HeartbeatService()