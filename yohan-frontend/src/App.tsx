import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppStore } from './store/appStore';
import { useAppWebSocket } from './hooks/useAppWebSocket';
import { fetchWeather, fetchCalendar, healthCheck, ApiError } from './lib/api';
import { DashboardView } from './views/DashboardView';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Get store state and actions
  const {
    weatherData,
    calendarEvents,
    voiceStatus,
    currentView,
    isLoading,
    error,
    setWeatherData,
    setCalendarEvents,
    setLoading,
    setError,
    setCurrentView,
  } = useAppStore();

  // Initialize WebSocket connection
  const { isConnected, connectionStatus, sendChatMessage } = useAppWebSocket();

  // Function to load initial data
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      // First check if backend is healthy
      await healthCheck();
      setBackendStatus('connected');

      // Fetch weather and calendar data in parallel
      const [weatherResult, calendarResult] = await Promise.allSettled([
        fetchWeather(),
        fetchCalendar(),
      ]);

      // Handle weather data result
      if (weatherResult.status === 'fulfilled') {
        setWeatherData(weatherResult.value);
        console.log('Weather data loaded successfully');
      } else {
        console.error('Failed to load weather data:', weatherResult.reason);
      }

      // Handle calendar data result
      if (calendarResult.status === 'fulfilled') {
        setCalendarEvents(calendarResult.value);
        console.log('Calendar data loaded successfully');
      } else {
        console.error('Failed to load calendar data:', calendarResult.reason);
      }

      // If both failed, show an error
      if (weatherResult.status === 'rejected' && calendarResult.status === 'rejected') {
        setError('Failed to load initial data from backend');
      }

    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('error');
      if (error instanceof ApiError) {
        setError(`Backend connection failed: ${error.message}`);
      } else {
        setError('Failed to connect to backend server');
      }
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Retry function for failed connections
  const handleRetry = () => {
    setIsInitializing(true);
    setBackendStatus('checking');
    loadInitialData();
  };

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Yohan Smart Calendar</h1>
          <p className="text-muted-foreground mb-4">Initializing...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show error screen if backend connection failed
  if (backendStatus === 'error' && error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Connection Error</CardTitle>
            <CardDescription>Unable to connect to the backend server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={handleRetry} className="w-full">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main app with view switching
  return (
    <div className="min-h-screen bg-background dark">
      {/* Navigation Bar - only show if not on dashboard */}
      {currentView !== 'dashboard' && (
        <div className="bg-card border-b p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Button>

            {/* Voice Status Indicator */}
            <div className={`px-3 py-1 rounded-full text-sm ${
              voiceStatus === 'idle' ? 'bg-gray-500/20 text-gray-300' :
              voiceStatus === 'listening' ? 'bg-blue-500/20 text-blue-300' :
              voiceStatus === 'processing' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-purple-500/20 text-purple-300'
            }`}>
              {voiceStatus.charAt(0).toUpperCase() + voiceStatus.slice(1)}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'weather' && (
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Weather Forecast</h1>
          <p className="text-muted-foreground">Detailed weather view coming in Phase 3.2...</p>
        </div>
      )}
      {currentView === 'calendar' && (
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Calendar</h1>
          <p className="text-muted-foreground">Full calendar view coming in Phase 3.2...</p>
        </div>
      )}
      {currentView === 'chat' && (
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Chat Assistant</h1>
          <p className="text-muted-foreground">Chat interface coming in Phase 3.3...</p>
        </div>
      )}
    </div>
  )
}

export default App
