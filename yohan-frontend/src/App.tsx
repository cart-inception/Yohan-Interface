import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppStore } from './store/appStore';
import { useAppWebSocket } from './hooks/useAppWebSocket';
import { useHttpChat } from './hooks/useHttpChat';
import { fetchWeather, fetchCalendar, healthCheck, ApiError } from './lib/api';
import { DashboardView } from './views/DashboardView';
import { WeatherView } from './views/WeatherView';
import { CalendarView } from './views/CalendarView';
import { ChatView } from './views/ChatView';
import { VoiceTestView } from './views/VoiceTestView';
import TTSTest from './components/TTSTest';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Get store state and actions
  const {
    voice,
    currentView,
    error,
    setWeatherData,
    setCalendarEvents,
    setLoading,
    setError,
    setCurrentView,
  } = useAppStore();

  // Use WebSocket-based chat with HTTP fallback
  const webSocketHook = useAppWebSocket();
  const httpHook = useHttpChat();
  
  // Use WebSocket if connected, otherwise fall back to HTTP
  const isConnected = webSocketHook.isConnected || httpHook.isConnected;
  const connectionStatus = webSocketHook.isConnected ? 
    `WebSocket ${webSocketHook.connectionStatus}${webSocketHook.sessionId ? ` (${webSocketHook.sessionId.slice(0, 8)})` : ''}` : 
    `HTTP ${httpHook.connectionStatus}`;
  const sendChatMessage = webSocketHook.isConnected ? webSocketHook.sendChatMessage : httpHook.sendChatMessage;
  const isLoading = webSocketHook.isConnected ? (webSocketHook.pendingMessageCount > 0) : httpHook.isLoading;

  // Debug: Log chat status changes
  useEffect(() => {
    console.log('💬 App: Chat status changed:', {
      websocket: {
        connected: webSocketHook.isConnected,
        status: webSocketHook.connectionStatus,
        sessionId: webSocketHook.sessionId,
        pending: webSocketHook.pendingMessageCount
      },
      http: {
        connected: httpHook.isConnected,
        status: httpHook.connectionStatus,
        loading: httpHook.isLoading
      },
      active: webSocketHook.isConnected ? 'WebSocket' : 'HTTP'
    });
  }, [webSocketHook.isConnected, webSocketHook.connectionStatus, webSocketHook.sessionId, 
      webSocketHook.pendingMessageCount, httpHook.isConnected, httpHook.connectionStatus, httpHook.isLoading]);

  // Function to handle view changes (chat history now persists across navigation)
  const handleViewChange = (newView: 'dashboard' | 'weather' | 'calendar' | 'chat' | 'voice-test' | 'tts-test') => {
    setCurrentView(newView);
  };

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
      {/* Enhanced Navigation Bar - only show if not on dashboard */}
      {currentView !== 'dashboard' && (
        <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 p-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => handleViewChange('dashboard')}
                className="flex items-center gap-2 hover:bg-primary/20 hover:text-primary transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Button>

              {/* Current View Title */}
              <div className="text-lg font-semibold text-foreground capitalize">
                {currentView === 'weather' && 'Weather Forecast'}
                {currentView === 'calendar' && 'Calendar'}
                {currentView === 'chat' && 'AI Assistant'}
                {currentView === 'voice-test' && 'Voice Test'}
                {currentView === 'tts-test' && 'TTS Test'}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant={currentView === 'weather' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('weather')}
                  className="transition-all duration-200"
                >
                  Weather
                </Button>
                <Button
                  variant={currentView === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('calendar')}
                  className="transition-all duration-200"
                >
                  Calendar
                </Button>
                <Button
                  variant={currentView === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('chat')}
                  className="transition-all duration-200"
                >
                  Chat
                </Button>
              </div>

              {/* Enhanced Chat Status Indicator */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                webSocketHook.isConnected ? 'bg-blue-500/20 text-blue-400' :
                httpHook.isConnected ? 'bg-green-500/20 text-green-400' : 
                'bg-red-500/20 text-red-400'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isLoading ? 'bg-yellow-400 animate-pulse' :
                    webSocketHook.isConnected ? 'bg-blue-400' :
                    httpHook.isConnected ? 'bg-green-400' : 
                    'bg-red-400 animate-pulse'
                  }`}></div>
                  <div className="flex flex-col">
                    <span>
                      {isLoading ? 'Processing...' : 
                       webSocketHook.isConnected ? 'WebSocket' : 
                       httpHook.isConnected ? 'HTTP' : 'Disconnected'}
                    </span>
                    {webSocketHook.sessionId && (
                      <span className="text-[10px] opacity-70">
                        {webSocketHook.sessionId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  {webSocketHook.pendingMessageCount > 0 && (
                    <div className="bg-yellow-400 text-black rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                      {webSocketHook.pendingMessageCount}
                    </div>
                  )}
                </div>
              </div>

              {/* Voice Status Indicator */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                voice.status === 'idle' ? 'bg-secondary/50 text-muted-foreground' :
                voice.status === 'listening' ? 'bg-primary/20 text-primary animate-pulse' :
                voice.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' :
                'bg-purple-500/20 text-purple-400 animate-pulse'
              }`}>
                <div className="flex items-center gap-2">
                  {voice.status === 'listening' && (
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                  )}
                  {voice.status === 'processing' && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  )}
                  {voice.status === 'speaking' && (
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                  )}
                  {voice.isAwake && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                  {voice.status.charAt(0).toUpperCase() + voice.status.slice(1)}
                  {voice.isAwake && ' (Awake)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area with Smooth Transitions */}
      <div className="transition-all duration-300 ease-in-out">
        {currentView === 'dashboard' && (
          <div className="animate-in fade-in-0 duration-300">
            <DashboardView />
          </div>
        )}
        {currentView === 'weather' && (
          <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <WeatherView />
          </div>
        )}
        {currentView === 'calendar' && (
          <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <CalendarView />
          </div>
        )}
        {currentView === 'chat' && (
          <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <ChatView
              sendChatMessage={sendChatMessage}
              isConnected={isConnected}
              connectionStatus={connectionStatus}
            />
          </div>
        )}
        {currentView === 'voice-test' && (
          <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <VoiceTestView />
          </div>
        )}
        {currentView === 'tts-test' && (
          <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <div className="min-h-screen bg-background p-8 flex items-center justify-center">
              <TTSTest />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
