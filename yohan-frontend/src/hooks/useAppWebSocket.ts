// Custom hook for managing WebSocket connection to the Yohan backend

import { useCallback, useEffect, useRef, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAppStore } from '../store/appStore';
import type {
  WebSocketMessage,
  VoiceStatusMessage,
  LLMResponseMessage
} from '../types';
import type { ChatMessageType } from '../types/chat';

// WebSocket configuration
const WEBSOCKET_URL = 'ws://localhost:8000/ws/comms';

// Connection options
const WEBSOCKET_OPTIONS = {
  shouldReconnect: () => true, // Automatically reconnect on disconnect
  reconnectAttempts: 10, // Increase attempts
  reconnectInterval: 3000, // 3 seconds between reconnection attempts
  // Add more debugging and error handling
  retryOnError: true,
  skipAssert: true, // Skip assertions that might cause issues with React 19
};

/**
 * Custom hook for managing the WebSocket connection to the backend
 * Handles incoming messages and updates the Zustand store accordingly
 */
export function useAppWebSocket() {
  console.log('🔌 Initializing WebSocket hook, connecting to:', WEBSOCKET_URL);
  console.log('🔌 react-use-websocket version check:', typeof useWebSocket);

  // Add connection state tracking
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          const chatMessage: ChatMessageType = {
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
    lastMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(WEBSOCKET_URL, {
    ...WEBSOCKET_OPTIONS,
    onMessage: handleMessage,
    onOpen: (event) => {
      console.log('✅ WebSocket connected successfully to:', WEBSOCKET_URL);
      console.log('🔌 Connection event:', event);
      setConnectionAttempts(0);
      setLastError(null);
      setError(null); // Clear any previous connection errors

      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    },
    onClose: (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason);
      console.log('🔌 Close event details:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        type: event.type
      });

      setConnectionAttempts(prev => prev + 1);

      // Set error message based on close reason
      if (event.code === 1006) {
        setLastError('Connection lost unexpectedly');
      } else if (event.code === 1000) {
        setLastError('Connection closed normally');
      } else {
        setLastError(`Connection closed with code ${event.code}: ${event.reason}`);
      }
    },
    onError: (event) => {
      console.error('🚨 WebSocket error:', event);
      console.error('🔌 Error event details:', {
        type: event.type,
        target: event.target,
        timeStamp: event.timeStamp
      });

      setConnectionAttempts(prev => prev + 1);
      setLastError(`WebSocket error occurred (attempt ${connectionAttempts + 1})`);

      // Don't set error immediately to prevent blocking the UI
      setTimeout(() => {
        setError(`WebSocket connection failed - retrying... (attempt ${connectionAttempts + 1})`);
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
      const userMessage: ChatMessageType = {
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

  // Add effect to monitor connection state changes
  useEffect(() => {
    console.log('🔌 WebSocket state changed:', {
      readyState,
      connectionAttempts,
      lastError,
      status: {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Connected',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
      }[readyState]
    });
  }, [readyState, connectionAttempts, lastError]);

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
    connectionAttempts,
    lastError,

    // Actions
    sendChatMessage,
    sendJsonMessage,

    // WebSocket instance (for advanced usage)
    getWebSocket,
  };
}
