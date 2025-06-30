import { useAppStore } from '../store/appStore';
import { ClockWidget } from '../components/widgets/ClockWidget';
import { WeatherWidget } from '../components/widgets/WeatherWidget';
import { UpcomingEventsWidget } from '../components/widgets/UpcomingEventsWidget';

export function DashboardView() {
  const { setCurrentView, weatherData, calendarEvents } = useAppStore();

  // Debug info for development (remove in production)
  const isDev = import.meta.env.DEV;

  // Add console logging for debugging
  if (isDev) {
    console.log('DashboardView rendering', { weatherData, calendarEvents });
  }

  return (
    <div className="h-screen bg-background overflow-hidden dashboard-optimized no-select">
      {/* Optimized for 1024x600 touchscreen - Full screen layout */}
      <div className="h-full p-6">
        {/* Main Dashboard Grid - Full height utilization */}
        <div className="h-full">
          {/* Two-row layout for 1024x600 - More space for widgets */}
          <div className="h-full grid grid-rows-2 gap-6">

            {/* Top Row - Weather and Clock side by side */}
            <div className="grid grid-cols-3 gap-6 h-full min-h-0">
              {/* Weather Widget - Takes 2/3 of top row */}
              <div className="col-span-2 cursor-pointer touch-target h-full min-h-0" onClick={() => setCurrentView('weather')}>
                <WeatherWidget />
              </div>

              {/* Clock Widget - Takes 1/3 of top row */}
              <div className="h-full min-h-0">
                <ClockWidget />
              </div>
            </div>

            {/* Bottom Row - Events and Chat side by side */}
            <div className="grid grid-cols-3 gap-6 h-full min-h-0">
              {/* Upcoming Events Widget - Takes 2/3 of bottom row */}
              <div className="col-span-2 cursor-pointer touch-target h-full min-h-0" onClick={() => setCurrentView('calendar')}>
                <UpcomingEventsWidget />
              </div>

              {/* Chat Access Widget - Takes 1/3 of bottom row */}
              <div
                className="cursor-pointer touch-target h-full min-h-0"
                onClick={() => setCurrentView('chat')}
              >
                <div className="h-full relative rounded-2xl bg-card text-card-foreground border-2 border-transparent bg-gradient-to-br from-blue-500/50 via-blue-400/30 to-blue-500/50 p-[2px] card-glow transition-all duration-200">
                  <div className="h-full w-full rounded-xl bg-card p-6">
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">AI Assistant</h3>
                      <p className="text-sm text-muted-foreground">
                        How can I assist you today?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
