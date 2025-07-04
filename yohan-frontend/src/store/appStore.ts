import { create } from 'zustand';
import type { WeatherData, CalendarEvent } from '../types';
import type { ChatMessageType } from '../types/chat';

// Voice status type
export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

// Voice settings interface
export interface VoiceSettings {
  enabled: boolean;
  wakeWordEnabled: boolean;
  wakeWords: string[];
  language: string;
  autoSpeak: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsVolume: number;
  voiceName: string | null;
}

// Voice state interface
export interface VoiceState {
  status: VoiceStatus;
  isWakeWordActive: boolean;
  isAwake: boolean;
  lastCommand: string | null;
  lastResponse: string | null;
  detectedWakeWord: string | null;
  confidenceScore: number;
  error: string | null;
  settings: VoiceSettings;
}

// App state interface
interface AppState {
  // Data state
  weatherData: WeatherData | null;
  calendarEvents: CalendarEvent[];
  chatHistory: ChatMessageType[];
  voice: VoiceState;
  
  // UI state
  currentView: 'dashboard' | 'weather' | 'calendar' | 'chat' | 'voice-test' | 'tts-test';
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
  addChatMessage: (message: ChatMessageType) => void;
  setChatHistory: (messages: ChatMessageType[]) => void;
  clearChatHistory: () => void;

  // Actions for voice management
  setVoiceStatus: (status: VoiceStatus) => void;
  setVoiceWakeWordActive: (active: boolean) => void;
  setVoiceAwake: (awake: boolean, wakeWord?: string) => void;
  setVoiceCommand: (command: string) => void;
  setVoiceResponse: (response: string) => void;
  setVoiceConfidence: (confidence: number) => void;
  setVoiceError: (error: string | null) => void;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  resetVoiceState: () => void;

  // Actions for UI state
  setCurrentView: (view: 'dashboard' | 'weather' | 'calendar' | 'chat' | 'voice-test' | 'tts-test') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Default voice settings
const defaultVoiceSettings: VoiceSettings = {
  enabled: false,
  wakeWordEnabled: false,
  wakeWords: ['hey yohan', 'ok yohan', 'yohan'],
  language: 'en-US',
  autoSpeak: true,
  ttsRate: 1.0,
  ttsPitch: 1.0,
  ttsVolume: 1.0,
  voiceName: null,
};

// Initial voice state
const initialVoiceState: VoiceState = {
  status: 'idle',
  isWakeWordActive: false,
  isAwake: false,
  lastCommand: null,
  lastResponse: null,
  detectedWakeWord: null,
  confidenceScore: 0,
  error: null,
  settings: defaultVoiceSettings,
};

// Create the Zustand store
export const useAppStore = create<AppState>((set) => ({
  // Initial state
  weatherData: null,
  calendarEvents: [],
  chatHistory: [],
  voice: initialVoiceState,
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

  // Voice actions
  setVoiceStatus: (status) => set((state) => ({
    voice: { ...state.voice, status }
  })),
  setVoiceWakeWordActive: (active) => set((state) => ({
    voice: { ...state.voice, isWakeWordActive: active }
  })),
  setVoiceAwake: (awake, wakeWord) => set((state) => ({
    voice: { 
      ...state.voice, 
      isAwake: awake, 
      detectedWakeWord: wakeWord || null 
    }
  })),
  setVoiceCommand: (command) => set((state) => ({
    voice: { ...state.voice, lastCommand: command }
  })),
  setVoiceResponse: (response) => set((state) => ({
    voice: { ...state.voice, lastResponse: response }
  })),
  setVoiceConfidence: (confidence) => set((state) => ({
    voice: { ...state.voice, confidenceScore: confidence }
  })),
  setVoiceError: (error) => set((state) => ({
    voice: { ...state.voice, error }
  })),
  updateVoiceSettings: (settings) => set((state) => ({
    voice: { 
      ...state.voice, 
      settings: { ...state.voice.settings, ...settings }
    }
  })),
  resetVoiceState: () => set({ voice: initialVoiceState }),

  // UI actions
  setCurrentView: (view) => set({ currentView: view }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
