import { create } from 'zustand';
import type { WeatherData, CalendarEvent, ChatMessage } from '../types';

// Voice status type
export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

// App state interface
interface AppState {
  // Data state
  weatherData: WeatherData | null;
  calendarEvents: CalendarEvent[];
  chatHistory: ChatMessage[];
  voiceStatus: VoiceStatus;
  
  // UI state
  currentView: 'dashboard' | 'weather' | 'calendar' | 'chat';
  isLoading: boolean;
  error: string | null;

  // Actions for updating weather data
  setWeatherData: (data: WeatherData) => void;
  clearWeatherData: () => void;

  // Actions for updating calendar events
  setCalendarEvents: (events: CalendarEvent[]) => void;
  addCalendarEvent: (event: CalendarEvent) => void;
  clearCalendarEvents: () => void;

  // Actions for managing chat history
  addChatMessage: (message: ChatMessage) => void;
  setChatHistory: (messages: ChatMessage[]) => void;
  clearChatHistory: () => void;

  // Actions for voice status
  setVoiceStatus: (status: VoiceStatus) => void;

  // Actions for UI state
  setCurrentView: (view: 'dashboard' | 'weather' | 'calendar' | 'chat') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create the Zustand store
export const useAppStore = create<AppState>((set) => ({
  // Initial state
  weatherData: null,
  calendarEvents: [],
  chatHistory: [],
  voiceStatus: 'idle',
  currentView: 'dashboard',
  isLoading: false,
  error: null,

  // Weather actions
  setWeatherData: (data) => set({ weatherData: data, error: null }),
  clearWeatherData: () => set({ weatherData: null }),

  // Calendar actions
  setCalendarEvents: (events) => set({ calendarEvents: events, error: null }),
  addCalendarEvent: (event) => set((state) => ({
    calendarEvents: [...state.calendarEvents, event]
  })),
  clearCalendarEvents: () => set({ calendarEvents: [] }),

  // Chat actions
  addChatMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, message]
  })),
  setChatHistory: (messages) => set({ chatHistory: messages }),
  clearChatHistory: () => set({ chatHistory: [] }),

  // Voice status actions
  setVoiceStatus: (status) => set({ voiceStatus: status }),

  // UI actions
  setCurrentView: (view) => set({ currentView: view }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
