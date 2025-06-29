import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ClockWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time immediately
    setCurrentTime(new Date());

    // Set up interval to update every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Format time for display - Simple format for small widget
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date for display - Compact format
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="h-full transition-all duration-200">
      <CardContent className="p-6 flex flex-col justify-center h-full">
        <div className="text-center">
          {/* Time Display - Positioned like in mockup */}
          <div className="text-4xl font-bold text-foreground mb-4 font-mono">
            {formatTime(currentTime)}
          </div>

          {/* Date Display - More readable */}
          <div className="text-base text-muted-foreground">
            {formatDate(currentTime)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
