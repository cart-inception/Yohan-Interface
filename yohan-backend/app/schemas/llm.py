from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class LLMMessage(BaseModel):
    """Represents a single message in the conversation"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[datetime] = None

class LLMContext(BaseModel):
    """Context information to enrich LLM prompts"""
    weather_data: Optional[Dict[str, Any]] = None
    calendar_events: Optional[List[Dict[str, Any]]] = None
    current_time: Optional[datetime] = None
    location: Optional[str] = None

class LLMRequest(BaseModel):
    """Request model for LLM API calls"""
    message: str
    context: Optional[LLMContext] = None
    conversation_history: Optional[List[LLMMessage]] = None
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7

class LLMResponse(BaseModel):
    """Response model for LLM API calls"""
    content: str
    usage: Optional[Dict[str, Any]] = None
    model: Optional[str] = None
    finish_reason: Optional[str] = None
    timestamp: datetime

class LLMError(BaseModel):
    """Error model for LLM API failures"""
    error_type: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime
