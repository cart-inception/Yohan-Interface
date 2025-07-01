// Alternative WebSocket hook using native WebSocket API
// This is a fallback in case react-use-websocket has compatibility issues

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import type {
  WebSocketMessage,
  VoiceStatusMessage,
  LLMResponseMessage
} from '../types';
import type { ChatMessageType } from '../types/chat';

// WebSocket configuration
const WEBSOCKET_URL = 'ws://localhost:8000/ws/comms';

export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
  UNINSTANTIATED = -1,
}

/**
 * Native WebSocket hook as an alternative to react-use-websocket
 * Provides the same interface but uses the native WebSocket API
 */
export function useNativeWebSocket() {
  console.log('🔌 Initializing Native WebSocket hook, connecting to:', WEBSOCKET_URL);

  // WebSocket state
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.UNINSTANTIATED);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

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
      console.log('📨 Received WebSocket message:', message);

      switch (message.event_type) {
        case 'voice_status':
          const voiceMessage = message as VoiceStatusMessage;
          setVoiceStatus(voiceMessage.payload.status);
          break;

        case 'llm_response':
          const llmMessage = message as LLMResponseMessage;
          const assistantMessage: ChatMessageType = {
            id: `assistant-${Date.now()}`,
            content: llmMessage.payload.message,
            timestamp: llmMessage.payload.timestamp,
            sender: 'assistant',
          };
          addChatMessage(assistantMessage);
          break;

        case 'status_update':
          console.log('📊 Status update:', message.payload);
          break;

        case 'error':
          console.error('❌ Server error:', message.payload);
          setError(`Server error: ${message.payload.error || 'Unknown error'}`);
          break;

        case 'pong':
          console.log('🏓 Received pong:', message.payload);
          break;

        default:
          console.log('❓ Unknown message type:', message.event_type);
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
      console.error('Raw message data:', event.data);
    }
  }, [setVoiceStatus, addChatMessage, setError]);

  // Connect function
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    try {
      console.log('🔌 Attempting to connect to WebSocket...');
      setReadyState(ReadyState.CONNECTING);
      
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = (event) => {
        console.log('✅ Native WebSocket connected successfully to:', WEBSOCKET_URL);
        console.log('🔌 Connection event:', event);
        setReadyState(ReadyState.OPEN);
        setConnectionAttempts(0);
        setLastError(null);
        setError(null);
        
        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        console.log('❌ Native WebSocket disconnected:', event.code, event.reason);
        console.log('🔌 Close event details:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          type: event.type
        });
        
        setReadyState(ReadyState.CLOSED);
        setConnectionAttempts(prev => prev + 1);
        
        // Set error message based on close reason
        let errorMsg = '';
        if (event.code === 1006) {
          errorMsg = 'Connection lost unexpectedly';
        } else if (event.code === 1000) {
          errorMsg = 'Connection closed normally';
        } else {
          errorMsg = `Connection closed with code ${event.code}: ${event.reason}`;
        }
        setLastError(errorMsg);

        // Attempt to reconnect if should reconnect
        if (shouldReconnectRef.current && connectionAttempts < 10) {
          const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000); // Exponential backoff, max 30s
          console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${connectionAttempts + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              connect();
            }
          }, delay);
        }
      };

      ws.onerror = (event) => {
        console.error('🚨 Native WebSocket error:', event);
        setConnectionAttempts(prev => prev + 1);
        setLastError(`WebSocket error occurred (attempt ${connectionAttempts + 1})`);
        setError(`WebSocket connection failed - retrying... (attempt ${connectionAttempts + 1})`);
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setReadyState(ReadyState.CLOSED);
      setLastError(`Failed to create WebSocket: ${error}`);
      setError(`Failed to create WebSocket: ${error}`);
    }
  }, [handleMessage, connectionAttempts, setError]);

  // Disconnect function
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setReadyState(ReadyState.CLOSED);
  }, []);

  // Send JSON message function
  const sendJsonMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const jsonString = JSON.stringify(message);
        wsRef.current.send(jsonString);
        console.log('📤 Sent message:', message);
      } catch (error) {
        console.error('❌ Failed to send message:', error);
        setError(`Failed to send message: ${error}`);
      }
    } else {
      console.error('❌ WebSocket is not connected, cannot send message');
      setError('Cannot send message: WebSocket not connected');
    }
  }, [setError]);

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

  // Get WebSocket instance
  const getWebSocket = useCallback(() => {
    return wsRef.current;
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    console.log('🔌 useNativeWebSocket: Initializing connection on mount');
    shouldReconnectRef.current = true;

    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      connect();
    }, 100);

    // Cleanup on unmount
    return () => {
      console.log('🔌 useNativeWebSocket: Cleaning up on unmount');
      clearTimeout(timer);
      disconnect();
    };
  }, [connect, disconnect]);

  // Monitor connection state changes
  useEffect(() => {
    console.log('🔌 Native WebSocket state changed:', {
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
    connect,
    disconnect,
    
    // WebSocket instance (for advanced usage)
    getWebSocket,
  };
}
