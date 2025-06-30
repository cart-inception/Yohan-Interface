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
            <div className="text-6xl font-bold mb-2 text-foreground">
              {Math.round(current.temp)}°
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
          {weatherData.daily.slice(0, 5).map((day, index) => (
            <div key={index} className="flex flex-col items-center space-y-1">
              <div className="text-xs text-muted-foreground font-medium">
                {index === 0 ? 'TODAY' : new Date(day.date).toLocaleDateString([], { weekday: 'short' }).toUpperCase()}
              </div>
              <div className="text-lg font-bold text-foreground">
                {Math.round(day.max_temp)}°
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(day.min_temp)}°
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
