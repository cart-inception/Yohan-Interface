import { useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { useAppStore } from '../store/appStore';
import { Card, CardContent } from '@/components/ui/card';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

export function CalendarView() {
  const { calendarEvents, isLoading } = useAppStore();

  // Transform calendar events to the format expected by react-big-calendar
  const calendarData = useMemo(() => {
    return calendarEvents.map((event, index) => ({
      id: index,
      title: event.summary,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      resource: event,
    }));
  }, [calendarEvents]);

  // Custom event component for better styling
  const EventComponent = ({ event }: { event: any }) => (
    <div className="text-xs font-medium truncate">
      {event.title}
    </div>
  );

  // Custom toolbar component to match our theme - compact for 7-inch screen
  const CustomToolbar = ({ label, onNavigate, onView, view }: any) => (
    <div className="flex items-center justify-between mb-3 p-2 bg-secondary/30 rounded-lg">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onNavigate('PREV')}
          className="px-2 py-1 bg-primary/20 hover:bg-primary/30 rounded text-primary transition-colors text-sm"
        >
          ‹
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-2 py-1 bg-primary/20 hover:bg-primary/30 rounded text-primary transition-colors text-sm"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="px-2 py-1 bg-primary/20 hover:bg-primary/30 rounded text-primary transition-colors text-sm"
        >
          ›
        </button>
      </div>

      <h2 className="text-lg font-semibold text-foreground">{label}</h2>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onView(Views.MONTH)}
          className={`px-2 py-1 rounded transition-colors text-sm ${
            view === Views.MONTH
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => onView(Views.WEEK)}
          className={`px-2 py-1 rounded transition-colors text-sm ${
            view === Views.WEEK
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => onView(Views.DAY)}
          className={`px-2 py-1 rounded transition-colors text-sm ${
            view === Views.DAY
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          Day
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading calendar events...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background p-4 dashboard-optimized overflow-hidden">
      <div className="h-full max-w-6xl mx-auto">
        {/* Single Calendar Card - Full Height */}
        <Card className="h-full window-container">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="calendar-container flex-1" style={{ height: 'calc(100vh - 140px)' }}>
              <Calendar
                localizer={localizer}
                events={calendarData}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                defaultView={Views.MONTH}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                components={{
                  event: EventComponent,
                  toolbar: CustomToolbar,
                }}
                eventPropGetter={() => ({
                  style: {
                    backgroundColor: 'hsl(var(--primary))',
                    borderColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                  },
                })}
                dayPropGetter={(date) => ({
                  style: {
                    backgroundColor: date.getDay() === 0 || date.getDay() === 6
                      ? 'hsl(var(--secondary) / 0.3)'
                      : 'transparent',
                  },
                })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
