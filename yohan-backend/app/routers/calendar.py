from fastapi import APIRouter, HTTPException
from typing import List

from ..services import calendar_service
from ..schemas.calendar import CalendarEvent

router = APIRouter(
    prefix="/calendar",
    tags=["calendar"],
)

@router.get("/", response_model=List[CalendarEvent])
async def get_calendar_events():
    """
    Endpoint to get upcoming calendar events from the configured iCalendar URL.
    
    Returns:
        A list of upcoming calendar events sorted by start time.
    """
    try:
        events = calendar_service.get_calendar_events()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
