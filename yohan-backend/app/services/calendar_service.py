import httpx
from icalendar import Calendar
from datetime import datetime, timezone
from typing import List
from ..schemas.calendar import CalendarEvent
from ..settings import settings

def get_calendar_events() -> List[CalendarEvent]:
    """
    Fetches and parses calendar events from the iCalendar URL.

    Returns:
        A list of CalendarEvent objects for upcoming events.
    """
    try:
        response = httpx.get(settings.CALENDAR_ICS_URL)
        response.raise_for_status()

        cal = Calendar.from_ical(response.text)
        events = []
        now = datetime.now(timezone.utc)

        for component in cal.walk():
            if component.name == "VEVENT":
                dtstart = component.get('dtstart').dt
                dtend = component.get('dtend').dt

                # Ensure timezone-aware comparison
                if dtstart.tzinfo is None:
                    dtstart = dtstart.replace(tzinfo=timezone.utc)
                if dtend.tzinfo is None:
                    dtend = dtend.replace(tzinfo=timezone.utc)

                if dtend > now:
                    events.append(
                        CalendarEvent(
                            summary=str(component.get('summary')),
                            start_time=dtstart,
                            end_time=dtend
                        )
                    )
        
        # Sort events by start time
        events.sort(key=lambda e: e.start_time)

        return events

    except httpx.HTTPStatusError as e:
        print(f"HTTP error occurred while fetching calendar: {e}")
        return []
    except Exception as e:
        print(f"An error occurred while parsing calendar: {e}")
        return []
