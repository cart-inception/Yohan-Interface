// Custom hook for managing WebSocket connection to the Yohan backend

import { useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAppStore } from '../store/appStore';
import type { 
  WebSocketMessage, 
  VoiceStatusMessage, 
  LLMResponseMessage, 
  ChatMessage 
} from '../types';

// WebSocket configuration
const WEBSOCKET_URL = 'ws://localhost:8000/ws/comms';

// Connection options
const WEBSOCKET_OPTIONS = {
  shouldReconnect: () => true, // Automatically reconnect on disconnect
  reconnectAttempts: 5, // Reduce attempts to prevent hanging
  reconnectInterval: 5000, // 5 seconds between reconnection attempts
  // Remove heartbeat for now to simplify debugging
};

/**
 * Custom hook for managing the WebSocket connection to the backend
 * Handles incoming messages and updates the Zustand store accordingly
 */
export function useAppWebSocket() {
  console.log('🔌 Initializing WebSocket hook, connecting to:', WEBSOCKET_URL);
  console.log('🔌 react-use-websocket version check:', typeof useWebSocket);

  // Get store actions
  const {
    setVoiceStatus,
    addChatMessage,
    setError,
  } = useAppStore();

  // Message handler for incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle different message types
      switch (message.event_type) {
        case 'voice_status': {
          const voiceMessage = message as VoiceStatusMessage;
          setVoiceStatus(voiceMessage.payload.status);
          break;
        }
        
        case 'llm_response': {
          const llmMessage = message as LLMResponseMessage;
          const chatMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            content: llmMessage.payload.message,
            timestamp: llmMessage.payload.timestamp,
            sender: 'assistant',
          };
          addChatMessage(chatMessage);
          break;
        }
        
        case 'error': {
          const errorMessage = message.payload.message || 'Unknown WebSocket error';
          setError(errorMessage);
          console.error('WebSocket error:', errorMessage);
          break;
        }
        
        case 'pong': {
          // Heartbeat response - no action needed
          break;
        }
        
        default: {
          console.warn('Unknown WebSocket message type:', message.event_type);
          break;
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      setError('Failed to parse WebSocket message');
    }
  }, [setVoiceStatus, addChatMessage, setError]);

  // Initialize WebSocket connection
  const {
    sendJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(WEBSOCKET_URL, {
    ...WEBSOCKET_OPTIONS,
    onMessage: handleMessage,
    onOpen: () => {
      console.log('✅ WebSocket connected successfully to:', WEBSOCKET_URL);
      setError(null); // Clear any previous connection errors
    },
    onClose: (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason);
    },
    onError: (event) => {
      console.error('🚨 WebSocket error:', event);
      // Don't set error immediately to prevent blocking the UI
      setTimeout(() => {
        setError('WebSocket connection failed - retrying...');
      }, 1000);
    },
  });

  // Function to send a chat message to the backend
  const sendChatMessage = useCallback((content: string) => {
    if (readyState === ReadyState.OPEN) {
      const message: WebSocketMessage = {
        event_type: 'llm_query',
        payload: {
          message: content,
          timestamp: new Date().toISOString(),
        },
      };
      
      sendJsonMessage(message);
      
      // Add user message to chat history
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content,
        timestamp: new Date().toISOString(),
        sender: 'user',
      };
      addChatMessage(userMessage);
    } else {
      console.error('WebSocket is not connected');
      setError('Cannot send message: WebSocket not connected');
    }
  }, [readyState, sendJsonMessage, addChatMessage, setError]);

  // Connection status helper
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Connected',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  // Return hook interface
  return {
    // Connection state
    isConnected: readyState === ReadyState.OPEN,
    connectionStatus,
    readyState,
    
    // Actions
    sendChatMessage,
    sendJsonMessage,
    
    // WebSocket instance (for advanced usage)
    getWebSocket,
  };
}
