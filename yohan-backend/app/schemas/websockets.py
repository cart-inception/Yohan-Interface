from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class WebSocketMessage(BaseModel):
    event_type: str
    payload: Dict[str, Any]

# Specific message types for LLM integration

class LLMQueryPayload(BaseModel):
    """Payload for LLM query messages from frontend"""
    message: str
    timestamp: str
    conversation_id: Optional[str] = None

class LLMResponsePayload(BaseModel):
    """Payload for LLM response messages to frontend"""
    message: str
    timestamp: str
    conversation_id: Optional[str] = None
    usage: Optional[Dict[str, Any]] = None
    model: Optional[str] = None

class VoiceStatusPayload(BaseModel):
    """Payload for voice status updates"""
    status: str  # 'idle', 'listening', 'processing', 'speaking'
    timestamp: Optional[str] = None

class ErrorPayload(BaseModel):
    """Payload for error messages"""
    error: str
    error_type: Optional[str] = None
    timestamp: Optional[str] = None

# Typed WebSocket message classes

class LLMQueryMessage(WebSocketMessage):
    """WebSocket message for LLM queries"""
    event_type: str = "llm_query"
    payload: LLMQueryPayload

class LLMResponseMessage(WebSocketMessage):
    """WebSocket message for LLM responses"""
    event_type: str = "llm_response"
    payload: LLMResponsePayload

class VoiceStatusMessage(WebSocketMessage):
    """WebSocket message for voice status updates"""
    event_type: str = "voice_status"
    payload: VoiceStatusPayload

class ErrorMessage(WebSocketMessage):
    """WebSocket message for errors"""
    event_type: str = "error"
    payload: ErrorPayload
