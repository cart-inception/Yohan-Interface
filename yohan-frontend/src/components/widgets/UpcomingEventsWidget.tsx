import { useAppStore } from '../../store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UpcomingEventsWidget() {
  const { calendarEvents, isLoading } = useAppStore();

  if (isLoading) {
    return (
      <Card className="h-full transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">Calendar</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading events...</div>
        </CardContent>
      </Card>
    );
  }

  // Get the next few events (limit to 4 for the widget)
  const upcomingEvents = calendarEvents
    .filter(event => new Date(event.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 4);

  if (upcomingEvents.length === 0) {
    return (
      <Card className="h-full transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">Calendar</CardTitle>
          <div className="text-base text-muted-foreground">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-muted-foreground text-center">
            <p>No upcoming events</p>
            <p className="text-sm">Tap to view calendar</p>
          </div>
        </CardContent>
      </Card>
    );
  }



  return (
    <Card className="h-full transition-all duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-foreground">Calendar</CardTitle>
        <div className="text-base text-muted-foreground">
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingEvents.slice(0, 3).map((event, index) => (
          <div key={index} className="flex items-center space-x-3 py-2">
            <div className="text-sm text-muted-foreground min-w-[80px]">
              {new Date(event.start_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
            <div className="font-medium text-base text-foreground line-clamp-1">
              {event.summary}
            </div>
          </div>
        ))}

        {calendarEvents.length > 3 && (
          <div className="text-sm text-muted-foreground text-center pt-3 border-t border-border/50">
            +{calendarEvents.length - 3} more events
          </div>
        )}

        {calendarEvents.length <= 3 && calendarEvents.length > 0 && (
          <div className="text-sm text-muted-foreground text-center pt-3 border-t border-border/50">
            Tap to view full calendar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
