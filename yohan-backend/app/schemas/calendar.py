from pydantic import BaseModel
from datetime import datetime

class CalendarEvent(BaseModel):
    summary: str
    start_time: datetime
    end_time: datetime
