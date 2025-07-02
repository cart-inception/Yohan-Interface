from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class ChatSession(Base):
    """
    Represents a chat session for a user.
    """
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), unique=True, index=True, nullable=False)
    user_id = Column(String(255), index=True, nullable=False)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationship to messages
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    """
    Represents a single message in a chat session.
    """
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), ForeignKey("chat_sessions.session_id"), nullable=False)
    message_id = Column(String(36), unique=True, index=True, nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Optional metadata
    token_count = Column(Integer, nullable=True)
    model_used = Column(String(100), nullable=True)
    processing_time = Column(Integer, nullable=True)  # milliseconds
    context_data = Column(Text, nullable=True)  # JSON string for weather/calendar context
    
    # Relationship to session
    session = relationship("ChatSession", back_populates="messages")

class ConnectionLog(Base):
    """
    Logs WebSocket connection events for monitoring and analytics.
    """
    __tablename__ = "connection_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), index=True, nullable=False)
    user_id = Column(String(255), index=True, nullable=False)
    event_type = Column(String(20), nullable=False)  # 'connect', 'disconnect', 'error'
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Optional metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)