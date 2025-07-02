from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
import uuid
import json
from datetime import datetime

from ..models.database import get_db
from ..models.chat import ChatSession, ChatMessage, ConnectionLog

class ChatHistoryService:
    """
    Service for managing chat history persistence and retrieval.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_session(self, session_id: str, user_id: str, title: Optional[str] = None) -> ChatSession:
        """
        Create a new chat session.
        
        Args:
            session_id: Unique session identifier
            user_id: User identifier
            title: Optional session title
            
        Returns:
            Created ChatSession object
        """
        session = ChatSession(
            session_id=session_id,
            user_id=user_id,
            title=title or f"Chat Session {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session
    
    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """
        Get a chat session by ID.
        
        Args:
            session_id: Session identifier
            
        Returns:
            ChatSession object or None if not found
        """
        return self.db.query(ChatSession).filter(
            ChatSession.session_id == session_id
        ).first()
    
    def get_user_sessions(self, user_id: str, limit: int = 50) -> List[ChatSession]:
        """
        Get all sessions for a user.
        
        Args:
            user_id: User identifier
            limit: Maximum number of sessions to return
            
        Returns:
            List of ChatSession objects
        """
        return self.db.query(ChatSession).filter(
            ChatSession.user_id == user_id,
            ChatSession.is_active == True
        ).order_by(desc(ChatSession.updated_at)).limit(limit).all()
    
    def add_message(
        self, 
        session_id: str, 
        role: str, 
        content: str,
        token_count: Optional[int] = None,
        model_used: Optional[str] = None,
        processing_time: Optional[int] = None,
        context_data: Optional[Dict[str, Any]] = None
    ) -> ChatMessage:
        """
        Add a message to a chat session.
        
        Args:
            session_id: Session identifier
            role: Message role ('user' or 'assistant')
            content: Message content
            token_count: Optional token count
            model_used: Optional model identifier
            processing_time: Optional processing time in milliseconds
            context_data: Optional context data (weather, calendar, etc.)
            
        Returns:
            Created ChatMessage object
        """
        message = ChatMessage(
            session_id=session_id,
            message_id=str(uuid.uuid4()),
            role=role,
            content=content,
            token_count=token_count,
            model_used=model_used,
            processing_time=processing_time,
            context_data=json.dumps(context_data) if context_data else None
        )
        
        self.db.add(message)
        
        # Update session timestamp
        session = self.get_session(session_id)
        if session:
            session.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(message)
        return message
    
    def get_session_messages(
        self, 
        session_id: str, 
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[ChatMessage]:
        """
        Get messages for a session.
        
        Args:
            session_id: Session identifier
            limit: Optional limit on number of messages
            offset: Number of messages to skip
            
        Returns:
            List of ChatMessage objects
        """
        query = self.db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.timestamp)
        
        if offset > 0:
            query = query.offset(offset)
        
        if limit:
            query = query.limit(limit)
            
        return query.all()
    
    def get_recent_messages(
        self, 
        session_id: str, 
        count: int = 10
    ) -> List[ChatMessage]:
        """
        Get the most recent messages for a session.
        
        Args:
            session_id: Session identifier
            count: Number of recent messages to retrieve
            
        Returns:
            List of ChatMessage objects in chronological order
        """
        messages = self.db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(desc(ChatMessage.timestamp)).limit(count).all()
        
        # Reverse to get chronological order
        return list(reversed(messages))
    
    def log_connection_event(
        self,
        session_id: str,
        user_id: str,
        event_type: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> ConnectionLog:
        """
        Log a connection event.
        
        Args:
            session_id: Session identifier
            user_id: User identifier
            event_type: Type of event ('connect', 'disconnect', 'error')
            ip_address: Optional client IP address
            user_agent: Optional client user agent
            error_message: Optional error message
            
        Returns:
            Created ConnectionLog object
        """
        log_entry = ConnectionLog(
            session_id=session_id,
            user_id=user_id,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent,
            error_message=error_message
        )
        
        self.db.add(log_entry)
        self.db.commit()
        self.db.refresh(log_entry)
        return log_entry
    
    def get_session_context(self, session_id: str, message_limit: int = 20) -> Dict[str, Any]:
        """
        Get full session context including metadata and recent messages.
        
        Args:
            session_id: Session identifier
            message_limit: Maximum number of recent messages to include
            
        Returns:
            Dictionary with session info and messages
        """
        session = self.get_session(session_id)
        if not session:
            return {}
        
        messages = self.get_recent_messages(session_id, message_limit)
        
        return {
            "session": {
                "id": session.session_id,
                "user_id": session.user_id,
                "title": session.title,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat()
            },
            "messages": [
                {
                    "id": msg.message_id,
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                    "context_data": json.loads(msg.context_data) if msg.context_data else None
                }
                for msg in messages
            ]
        }

def get_chat_service(db: Session = next(get_db())) -> ChatHistoryService:
    """
    Factory function to create ChatHistoryService instances.
    """
    return ChatHistoryService(db)