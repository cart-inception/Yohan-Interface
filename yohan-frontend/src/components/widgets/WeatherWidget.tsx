import { useAppStore } from '../../store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function WeatherWidget() {
  const { weatherData, isLoading } = useAppStore();

  if (isLoading) {
    return (
      <Card className="h-full transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">Weather</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) {
    return (
      <Card className="h-full transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">Weather</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-muted-foreground text-center">
            <p>No weather data</p>
            <p className="text-sm">Tap to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { current } = weatherData;

  // Add safety check for current data
  if (!current) {
    return (
      <Card className="h-full transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">Weather</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-muted-foreground text-center">
            <p>Weather data loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get weather icon based on description
  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('sun') || desc.includes('clear')) {
      return '☀️';
    } else if (desc.includes('cloud')) {
      return '☁️';
    } else if (desc.includes('rain')) {
      return '🌧️';
    } else if (desc.includes('snow')) {
      return '❄️';
    } else if (desc.includes('storm') || desc.includes('thunder')) {
      return '⛈️';
    } else {
      return '🌤️';
    }
  };

  return (
    <Card className="h-full transition-all duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-foreground">Weather</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main weather display - Larger with more space */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <div className="text-6xl font-bold text-foreground">
                {Math.round(current.temp)}°
              </div>
              <div className="text-lg text-muted-foreground font-medium">
                {weatherData.location || 'Des Moines, IA'}
              </div>
            </div>
            <div className="text-base text-muted-foreground capitalize">
              {current.description}
            </div>
          </div>
          <div className="text-6xl">
            {getWeatherIcon(current.description)}
          </div>
        </div>

        {/* 5-day forecast - horizontal layout like mockup */}
        <div className="grid grid-cols-5 gap-2 text-center text-sm">
          {/* Filter to start from today and show next 5 days */}
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

            // Find today's index in the daily array
            const todayIndex = weatherData.daily.findIndex(day => {
              const dayDate = new Date(day.date);
              dayDate.setHours(0, 0, 0, 0);
              return dayDate.getTime() === today.getTime();
            });

            // If today is found, start from today, otherwise start from first available day
            const startIndex = todayIndex >= 0 ? todayIndex : 0;
            const forecastDays = weatherData.daily.slice(startIndex, startIndex + 5);

            return forecastDays.map((day, index) => {
              const dayDate = new Date(day.date);
              const isToday = index === 0 && todayIndex >= 0; // First day in our filtered array and we found today

              return (
                <div key={`${day.date}-${index}`} className="flex flex-col items-center space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    {isToday ? 'TODAY' : dayDate.toLocaleDateString([], { weekday: 'short' }).toUpperCase()}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {Math.round(day.max_temp)}°
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(day.min_temp)}°
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
