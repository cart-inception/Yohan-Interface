// TypeScript interfaces that mirror the backend Pydantic calendar schemas

export interface CalendarEvent {
  summary: string;
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
}
