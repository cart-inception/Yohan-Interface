import { useAppStore } from '../store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function WeatherView() {
  const { weatherData, isLoading } = useAppStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading weather data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="max-w-md mx-auto mt-20">
            <CardHeader>
              <CardTitle>No Weather Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Unable to load weather information. Please check your connection and try again.
              </p>
            </CardContent>
          </Card>
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
    <div className="h-screen bg-background p-4 dashboard-optimized overflow-hidden">
      <div className="h-full max-w-6xl mx-auto">
        {/* Two-row layout optimized for 1024x600 */}
        <div className="h-full grid grid-rows-2 gap-4">

          {/* Top Row - Current Weather */}
          <Card className="window-container">
            <CardContent className="p-4 h-full">
              <div className="grid grid-cols-2 gap-6 h-full items-center">

                {/* Current Temperature and Conditions */}
                <div className="text-center">
                  <div className="mb-2">
                    <div className="text-xl font-semibold text-primary mb-1">
                      {weatherData.location || 'Des Moines, Iowa'}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="text-5xl font-light text-foreground">
                      {formatTemp(current.temp)}
                    </div>
                    <div className="text-left">
                      <p className="text-lg text-muted-foreground capitalize">
                        {current.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Feels like {formatTemp(current.feels_like)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Weather Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/50 rounded-lg p-3 text-center weather-detail-card">
                    <div className="text-xl font-semibold text-foreground">
                      {current.humidity}%
                    </div>
                    <div className="text-xs text-muted-foreground">Humidity</div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-3 text-center weather-detail-card">
                    <div className="text-xl font-semibold text-foreground">
                      {Math.round(current.wind_speed)} mph
                    </div>
                    <div className="text-xs text-muted-foreground">Wind Speed</div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-3 text-center weather-detail-card">
                    <div className="text-sm font-semibold text-foreground">
                      {formatTime(current.sunrise)}
                    </div>
                    <div className="text-xs text-muted-foreground">Sunrise</div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-3 text-center weather-detail-card">
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
          <div className="grid grid-cols-2 gap-4 h-full">

            {/* Hourly Forecast */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-foreground">12-Hour Forecast</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {next12Hours.map((hour, index) => (
                    <div
                      key={index}
                      className="bg-secondary/30 rounded-lg p-2 text-center hover:bg-secondary/50 transition-colors"
                    >
                      <div className="text-xs text-muted-foreground mb-1">
                        {formatTime(hour.time)}
                      </div>
                      <div className="text-lg font-semibold text-foreground mb-1">
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

            {/* 7-Day Forecast */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-foreground">7-Day Forecast</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {next7Days.map((day, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="text-sm font-medium text-foreground min-w-[60px]">
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
                        <span className="text-sm font-semibold text-foreground">
                          {formatTemp(day.max_temp)}
                        </span>
                        <span className="text-muted-foreground text-xs mx-1">/</span>
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
