from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from typing import Optional, List
from datetime import datetime

from ..services.llm_service import llm_service
from ..services.weather_service import get_weather_data
from ..services.calendar_service import get_calendar_events
from ..schemas.llm import LLMContext, LLMMessage

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response models for the chat API
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    conversation_history: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    message: str
    timestamp: str
    conversation_id: Optional[str] = None
    usage: Optional[dict] = None
    model: Optional[str] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_with_llm(request: ChatRequest):
    """
    Send a message to the LLM and get a response.
    
    This endpoint provides the same functionality as the WebSocket chat
    but through a simple HTTP POST request.
    """
    try:
        logger.info(f"Processing chat request: {request.message}")
        
        # Validate input
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Gather context from weather and calendar services
        context = await gather_context()
        
        # Convert conversation history if provided
        conversation_history = None
        if request.conversation_history:
            conversation_history = []
            for msg in request.conversation_history:
                if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                    conversation_history.append(LLMMessage(
                        role=msg['role'],
                        content=msg['content'],
                        timestamp=msg.get('timestamp', datetime.now().isoformat())
                    ))
        
        # Call the LLM service
        llm_response = await llm_service.generate_response(
            message=request.message.strip(),
            context=context,
            conversation_history=conversation_history
        )
        
        # Return the response
        response = ChatResponse(
            message=llm_response.content,
            timestamp=datetime.now().isoformat(),
            conversation_id=request.conversation_id,
            usage=llm_response.usage,
            model=llm_response.model
        )
        
        logger.info(f"Successfully processed chat request")
        return response
        
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process chat request: {str(e)}"
        )

async def gather_context() -> LLMContext:
    """
    Gather context information from weather and calendar services.
    
    This is the same context gathering logic used by the WebSocket handler.
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
