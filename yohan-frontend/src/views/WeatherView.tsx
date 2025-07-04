import { useAppStore } from '../store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function WeatherView() {
  const { weatherData, isLoading } = useAppStore();

  if (isLoading) {
    return (
      <div className="bg-background p-2" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="max-w-6xl mx-auto h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-muted-foreground text-sm">Loading weather data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="bg-background p-2" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="max-w-6xl mx-auto h-full">
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">No Weather Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Unable to load weather information. Please check your connection and try again.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const { current, hourly, daily } = weatherData;

  // Helper function to format temperature
  const formatTemp = (temp: number) => `${Math.round(temp)}°`;

  // Helper function to format time
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    });
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get next 12 hours starting from current time
  const next12Hours = (() => {
    const now = new Date();

    // Find the current or next hour in the hourly array
    const currentHourIndex = hourly.findIndex(hour => {
      const hourTime = new Date(hour.time);
      return hourTime >= now;
    });

    // If current hour is found, start from there, otherwise start from beginning
    const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;
    return hourly.slice(startIndex, startIndex + 12);
  })();

  // Get next 7 days starting from today
  const next7Days = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

    // Find today's index in the daily array
    const todayIndex = daily.findIndex(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime();
    });

    // If today is found, start from today, otherwise start from first available day
    const startIndex = todayIndex >= 0 ? todayIndex : 0;
    return daily.slice(startIndex, startIndex + 7);
  })();

  return (
    <div className="bg-background p-1.5" style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      <div className="h-full max-w-6xl mx-auto">
        {/* Two-row layout optimized for 1024x600 - using specific heights */}
        <div className="h-full grid" style={{ gridTemplateRows: '45% 55%', gap: '8px' }}>

          {/* Top Row - Current Weather */}
          <Card className="window-container overflow-hidden">
            <CardContent className="p-2 h-full">
              <div className="grid grid-cols-2 gap-3 h-full items-center">

                {/* Current Temperature and Conditions */}
                <div className="text-center">
                  <div className="text-base font-semibold text-primary mb-1">
                    {weatherData.location || 'Des Moines, Iowa'}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-3xl font-light text-foreground">
                      {formatTemp(current.temp)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground capitalize">
                        {current.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Feels like {formatTemp(current.feels_like)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Weather Details */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary/50 rounded-lg p-2 text-center">
                    <div className="text-lg font-semibold text-foreground">
                      {current.humidity}%
                    </div>
                    <div className="text-xs text-muted-foreground">Humidity</div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-2 text-center">
                    <div className="text-lg font-semibold text-foreground">
                      {Math.round(current.wind_speed)} mph
                    </div>
                    <div className="text-xs text-muted-foreground">Wind Speed</div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-2 text-center">
                    <div className="text-sm font-semibold text-foreground">
                      {formatTime(current.sunrise)}
                    </div>
                    <div className="text-xs text-muted-foreground">Sunrise</div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-2 text-center">
                    <div className="text-sm font-semibold text-foreground">
                      {formatTime(current.sunset)}
                    </div>
                    <div className="text-xs text-muted-foreground">Sunset</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Row - Split between Hourly and Daily Forecasts */}
          <div className="grid grid-cols-2 gap-2 h-full">

            {/* Hourly Forecast - Compact for 7-inch screen */}
            <Card className="h-full flex flex-col overflow-hidden">
              <CardHeader className="py-1.5 px-2.5">
                <CardTitle className="text-sm font-semibold text-foreground">12-Hour Forecast</CardTitle>
              </CardHeader>
              <CardContent className="p-1.5 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-1">
                  {next12Hours.slice(0, 8).map((hour, index) => (
                    <div
                      key={index}
                      className="bg-secondary/30 rounded p-1 text-center hover:bg-secondary/50 transition-colors"
                    >
                      <div className="text-xs text-muted-foreground">
                        {formatTime(hour.time)}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {formatTemp(hour.temp)}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize truncate">
                        {hour.description}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 7-Day Forecast - Compact for 7-inch screen */}
            <Card className="h-full flex flex-col overflow-hidden">
              <CardHeader className="py-1.5 px-2.5">
                <CardTitle className="text-sm font-semibold text-foreground">7-Day Forecast</CardTitle>
              </CardHeader>
              <CardContent className="p-1.5 flex-1 overflow-y-auto">
                <div className="space-y-0.5">
                  {next7Days.slice(0, 7).map((day, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-1 bg-secondary/30 rounded hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 flex-1">
                        <div className="text-xs font-medium text-foreground min-w-[40px]">
                          {(() => {
                            const dayDate = new Date(day.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            dayDate.setHours(0, 0, 0, 0);
                            const isToday = dayDate.getTime() === today.getTime();
                            return isToday ? 'Today' : formatDate(day.date).split(',')[0];
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize truncate">
                          {day.description}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-foreground">
                          {formatTemp(day.max_temp)}
                        </span>
                        <span className="text-muted-foreground text-xs mx-0.5">/</span>
                        <span className="text-muted-foreground text-xs">
                          {formatTemp(day.min_temp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
