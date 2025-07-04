import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import type { ChatMessageType } from '../types/chat';

export interface VoiceCommandAction {
  type: 'chat' | 'weather' | 'calendar' | 'navigation' | 'system';
  payload: any;
}

export interface VoiceCommandRule {
  id: string;
  patterns: string[];
  description: string;
  action: (transcript: string, matches?: string[]) => VoiceCommandAction;
  examples: string[];
}

export interface VoiceCommandState {
  isActive: boolean;
  lastCommand: string | null;
  lastAction: VoiceCommandAction | null;
  error: string | null;
}

export interface VoiceCommandActions {
  parseCommand: (transcript: string) => VoiceCommandAction | null;
  executeCommand: (action: VoiceCommandAction) => Promise<void>;
  addCustomCommand: (rule: VoiceCommandRule) => void;
  removeCustomCommand: (id: string) => void;
  getAvailableCommands: () => VoiceCommandRule[];
}

// Default voice command rules
const defaultCommands: VoiceCommandRule[] = [
  // Chat commands
  {
    id: 'chat-general',
    patterns: [
      '*',
      'tell me *',
      'what is *',
      'how do *',
      'can you *',
      'please *',
      'help me *',
      'explain *'
    ],
    description: 'Send general chat message to LLM',
    action: (transcript) => ({
      type: 'chat',
      payload: { message: transcript }
    }),
    examples: ['Tell me about the weather', 'What is TypeScript?', 'Help me plan my day']
  },

  // Weather commands
  {
    id: 'weather-current',
    patterns: [
      'what\'s the weather',
      'how\'s the weather',
      'weather today',
      'current weather',
      'weather outside',
      'is it raining',
      'temperature outside'
    ],
    description: 'Get current weather information',
    action: () => ({
      type: 'weather',
      payload: { query: 'current' }
    }),
    examples: ['What\'s the weather?', 'How\'s the weather today?', 'Current weather']
  },

  {
    id: 'weather-forecast',
    patterns: [
      'weather tomorrow',
      'weather this week',
      'weather forecast',
      'will it rain tomorrow',
      'temperature tomorrow'
    ],
    description: 'Get weather forecast',
    action: () => ({
      type: 'weather',
      payload: { query: 'forecast' }
    }),
    examples: ['Weather tomorrow', 'Weather this week', 'Will it rain tomorrow?']
  },

  // Calendar commands
  {
    id: 'calendar-today',
    patterns: [
      'what\'s my schedule',
      'schedule today',
      'my appointments',
      'what do I have today',
      'today\'s events',
      'my calendar'
    ],
    description: 'Get today\'s calendar events',
    action: () => ({
      type: 'calendar',
      payload: { query: 'today' }
    }),
    examples: ['What\'s my schedule?', 'My appointments today', 'Today\'s events']
  },

  {
    id: 'calendar-week',
    patterns: [
      'schedule this week',
      'what\'s coming up',
      'upcoming events',
      'this week\'s schedule',
      'week schedule'
    ],
    description: 'Get this week\'s calendar events',
    action: () => ({
      type: 'calendar',
      payload: { query: 'week' }
    }),
    examples: ['Schedule this week', 'What\'s coming up?', 'Upcoming events']
  },

  // Navigation commands
  {
    id: 'navigate-dashboard',
    patterns: [
      'go to dashboard',
      'show dashboard',
      'home',
      'main screen',
      'go home'
    ],
    description: 'Navigate to dashboard',
    action: () => ({
      type: 'navigation',
      payload: { view: 'dashboard' }
    }),
    examples: ['Go to dashboard', 'Home', 'Main screen']
  },

  {
    id: 'navigate-weather',
    patterns: [
      'go to weather',
      'show weather',
      'weather view',
      'open weather'
    ],
    description: 'Navigate to weather view',
    action: () => ({
      type: 'navigation',
      payload: { view: 'weather' }
    }),
    examples: ['Go to weather', 'Show weather view']
  },

  {
    id: 'navigate-calendar',
    patterns: [
      'go to calendar',
      'show calendar',
      'calendar view',
      'open calendar'
    ],
    description: 'Navigate to calendar view',
    action: () => ({
      type: 'navigation',
      payload: { view: 'calendar' }
    }),
    examples: ['Go to calendar', 'Show calendar view']
  },

  {
    id: 'navigate-chat',
    patterns: [
      'go to chat',
      'show chat',
      'chat view',
      'open chat'
    ],
    description: 'Navigate to chat view',
    action: () => ({
      type: 'navigation',
      payload: { view: 'chat' }
    }),
    examples: ['Go to chat', 'Show chat view']
  },

  // System commands
  {
    id: 'system-stop-listening',
    patterns: [
      'stop listening',
      'stop voice',
      'disable voice',
      'voice off',
      'stop'
    ],
    description: 'Stop voice recognition',
    action: () => ({
      type: 'system',
      payload: { command: 'stop_listening' }
    }),
    examples: ['Stop listening', 'Voice off']
  },

  {
    id: 'system-clear-chat',
    patterns: [
      'clear chat',
      'clear history',
      'delete chat',
      'new conversation'
    ],
    description: 'Clear chat history',
    action: () => ({
      type: 'system',
      payload: { command: 'clear_chat' }
    }),
    examples: ['Clear chat', 'New conversation']
  }
];

export const useVoiceCommands = (): VoiceCommandState & VoiceCommandActions => {
  const commandRulesRef = useRef<VoiceCommandRule[]>(defaultCommands);
  const { 
    setCurrentView, 
    addChatMessage, 
    clearChatHistory,
    setVoiceCommand,
    setVoiceError 
  } = useAppStore();

  // Normalize text for pattern matching
  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
  };

  // Check if text matches a pattern
  const matchesPattern = useCallback((text: string, pattern: string): { matches: boolean; captures: string[] } => {
    const normalizedText = normalizeText(text);
    const normalizedPattern = normalizeText(pattern);

    // Handle wildcard patterns
    if (normalizedPattern === '*') {
      return { matches: true, captures: [text] };
    }

    // Handle patterns with wildcards
    if (normalizedPattern.includes('*')) {
      const regexPattern = normalizedPattern
        .replace(/\*/g, '(.*)')
        .replace(/\s+/g, '\\s+');
      
      try {
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        const match = normalizedText.match(regex);
        
        if (match) {
          return { matches: true, captures: match.slice(1) };
        }
      } catch (err) {
        console.warn('Invalid regex pattern:', regexPattern, err);
      }
    }

    // Handle exact phrase matching
    if (normalizedText.includes(normalizedPattern)) {
      return { matches: true, captures: [] };
    }

    // Handle fuzzy matching for short commands
    if (normalizedPattern.length <= 10) {
      const similarity = calculateSimilarity(normalizedText, normalizedPattern);
      if (similarity > 0.8) {
        return { matches: true, captures: [] };
      }
    }

    return { matches: false, captures: [] };
  }, []);

  // Calculate similarity between two strings
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const parseCommand = useCallback((transcript: string): VoiceCommandAction | null => {
    
    // Try to match against command patterns
    for (const rule of commandRulesRef.current) {
      for (const pattern of rule.patterns) {
        const result = matchesPattern(transcript, pattern);
        if (result.matches) {
          try {
            return rule.action(transcript, result.captures);
          } catch (err) {
            console.error('Error executing command action:', err);
            setVoiceError(`Error parsing command: ${err instanceof Error ? err.message : 'Unknown error'}`);
            return null;
          }
        }
      }
    }

    // If no specific command matches, treat as general chat
    return {
      type: 'chat',
      payload: { message: transcript }
    };
  }, [matchesPattern, setVoiceError]);

  const executeCommand = useCallback(async (action: VoiceCommandAction): Promise<void> => {
    try {
      switch (action.type) {
        case 'chat':
          const chatMessage: ChatMessageType = {
            id: Date.now().toString(),
            sender: 'user',
            content: action.payload.message,
            timestamp: new Date().toISOString(),
          };
          addChatMessage(chatMessage);
          setVoiceCommand(action.payload.message);
          break;

        case 'weather':
          if (action.payload.query === 'current') {
            const weatherQuery: ChatMessageType = {
              id: Date.now().toString(),
              sender: 'user',
              content: 'What\'s the current weather like? Please give me a detailed summary.',
              timestamp: new Date().toISOString(),
            };
            addChatMessage(weatherQuery);
            setVoiceCommand('Weather query: current conditions');
          } else if (action.payload.query === 'forecast') {
            const forecastQuery: ChatMessageType = {
              id: Date.now().toString(),
              sender: 'user',
              content: 'What\'s the weather forecast for today and upcoming days?',
              timestamp: new Date().toISOString(),
            };
            addChatMessage(forecastQuery);
            setVoiceCommand('Weather query: forecast');
          }
          break;

        case 'calendar':
          if (action.payload.query === 'today') {
            const calendarQuery: ChatMessageType = {
              id: Date.now().toString(),
              sender: 'user',
              content: 'What\'s my schedule for today? Please show me all my appointments and events.',
              timestamp: new Date().toISOString(),
            };
            addChatMessage(calendarQuery);
            setVoiceCommand('Calendar query: today\'s schedule');
          } else if (action.payload.query === 'week') {
            const weekQuery: ChatMessageType = {
              id: Date.now().toString(),
              sender: 'user',
              content: 'What\'s my schedule for this week? Show me upcoming appointments and events.',
              timestamp: new Date().toISOString(),
            };
            addChatMessage(weekQuery);
            setVoiceCommand('Calendar query: weekly schedule');
          }
          break;

        case 'navigation':
          setCurrentView(action.payload.view);
          setVoiceCommand(`Navigated to ${action.payload.view}`);
          break;

        case 'system':
          if (action.payload.command === 'clear_chat') {
            clearChatHistory();
            setVoiceCommand('Chat history cleared');
          } else if (action.payload.command === 'stop_listening') {
            setVoiceCommand('Voice recognition stopped');
            // This will be handled by the parent component
          }
          break;

        default:
          console.warn('Unknown command type:', action.type);
          setVoiceError(`Unknown command type: ${action.type}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error executing command';
      console.error('Error executing voice command:', err);
      setVoiceError(errorMessage);
    }
  }, [addChatMessage, setCurrentView, clearChatHistory, setVoiceCommand, setVoiceError]);

  const addCustomCommand = useCallback((rule: VoiceCommandRule) => {
    commandRulesRef.current = [
      ...commandRulesRef.current.filter(cmd => cmd.id !== rule.id),
      rule
    ];
  }, []);

  const removeCustomCommand = useCallback((id: string) => {
    commandRulesRef.current = commandRulesRef.current.filter(cmd => cmd.id !== id);
  }, []);

  const getAvailableCommands = useCallback(() => {
    return [...commandRulesRef.current];
  }, []);

  return {
    // State
    isActive: true,
    lastCommand: null,
    lastAction: null,
    error: null,

    // Actions
    parseCommand,
    executeCommand,
    addCustomCommand,
    removeCustomCommand,
    getAvailableCommands,
  };
};

export default useVoiceCommands;