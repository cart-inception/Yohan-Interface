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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMessages = useRef<Map<string, { content: string; timestamp: string; sentAt: number }>>(new Map());
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        case 'status_update': {
          // Handle initial connection status with session info
          if (message.payload.session_id) {
            setSessionId(message.payload.session_id);
            setUserId(message.payload.user_id);
            console.log('📋 Session established:', message.payload.session_id);
          }
          break;
        }
        
        case 'chat_history': {
          // Handle chat history restoration
          if (message.payload.messages && Array.isArray(message.payload.messages)) {
            console.log('📚 Restoring chat history:', message.payload.messages.length, 'messages');
            message.payload.messages.forEach((msg: any) => {
              // Don't display system messages (like context) in the UI
              if (msg.role === 'system') {
                console.log('🔧 System message (hidden from UI):', msg.content.substring(0, 100) + '...');
                return;
              }
              
              const chatMessage: ChatMessageType = {
                id: `${msg.role}-${Date.now()}-${Math.random()}`,
                content: msg.content,
                timestamp: msg.timestamp,
                sender: msg.role === 'user' ? 'user' : 'assistant',
              };
              addChatMessage(chatMessage);
            });
          }
          break;
        }
        
        case 'session_context': {
          // Context information sent once per session (for debugging)
          console.log('🌍 Received session context:', message.payload);
          break;
        }
        
        case 'voice_status': {
          const voiceMessage = message as VoiceStatusMessage;
          setVoiceStatus(voiceMessage.payload.status);
          break;
        }
        
        case 'llm_response': {
          const llmMessage = message as LLMResponseMessage;
          const chatMessage: ChatMessageType = {
            id: llmMessage.payload.message_id || `assistant-${Date.now()}`,
            content: llmMessage.payload.message,
            timestamp: llmMessage.payload.timestamp,
            sender: 'assistant',
          };
          addChatMessage(chatMessage);
          
          // Remove from pending messages if this was a reply
          if (llmMessage.payload.in_reply_to) {
            console.log(`🎯 Clearing pending message: ${llmMessage.payload.in_reply_to}`);
            pendingMessages.current.delete(llmMessage.payload.in_reply_to);
          } else {
            // Fallback: clear the most recent pending message if no in_reply_to
            const pendingKeys = Array.from(pendingMessages.current.keys());
            if (pendingKeys.length > 0) {
              const oldestPending = pendingKeys[0];
              console.log(`🎯 Clearing oldest pending message (no in_reply_to): ${oldestPending}`);
              pendingMessages.current.delete(oldestPending);
            }
          }
          break;
        }
        
        case 'message_ack': {
          // Handle message acknowledgments
          const ackPayload = message.payload;
          console.log(`📧 Message ${ackPayload.message_id} status: ${ackPayload.status}`);
          
          if (ackPayload.status === 'error') {
            setError(`Message failed: ${ackPayload.error_message || 'Unknown error'}`);
            // Remove from pending on error
            pendingMessages.current.delete(ackPayload.message_id);
          } else if (ackPayload.status === 'delivered') {
            // Message was successfully delivered and processed
            pendingMessages.current.delete(ackPayload.message_id);
          }
          break;
        }
        
        case 'error': {
          const errorMessage = message.payload.error || message.payload.message || 'Unknown WebSocket error';
          setError(errorMessage);
          console.error('WebSocket error:', errorMessage);
          break;
        }
        
        case 'pong': {
          // Heartbeat response - no action needed
          console.log('💓 Received heartbeat pong');
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
      
      // Clear pending messages on disconnect to prevent stuck "Processing..." state
      if (pendingMessages.current.size > 0) {
        console.log(`🧹 Clearing ${pendingMessages.current.size} pending messages due to disconnect`);
        pendingMessages.current.clear();
      }

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
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      const message: WebSocketMessage = {
        event_type: 'llm_query',
        payload: {
          message: content,
          timestamp,
          message_id: messageId,
          conversation_id: sessionId,
        },
      };
      
      // Track pending message with timeout
      pendingMessages.current.set(messageId, { content, timestamp, sentAt: Date.now() });
      
      sendJsonMessage(message);
      
      // Add user message to chat history
      const userMessage: ChatMessageType = {
        id: messageId,
        content,
        timestamp,
        sender: 'user',
      };
      addChatMessage(userMessage);
      
      console.log('📤 Sent message:', messageId);
    } else {
      console.error('WebSocket is not connected');
      setError('Cannot send message: WebSocket not connected');
    }
  }, [readyState, sendJsonMessage, addChatMessage, setError, sessionId]);

  // Effect to clean up stale pending messages
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      const staleThreshold = 60000; // 60 seconds
      
      for (const [messageId, messageData] of pendingMessages.current.entries()) {
        if (now - messageData.sentAt > staleThreshold) {
          console.log(`🧹 Cleaning up stale pending message: ${messageId}`);
          pendingMessages.current.delete(messageId);
        }
      }
    };

    // Run cleanup every 30 seconds
    const interval = setInterval(cleanup, 30000);
    
    return () => clearInterval(interval);
  }, []);

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
    
    // Session information
    sessionId,
    userId,
    pendingMessageCount: pendingMessages.current.size,

    // Actions
    sendChatMessage,
    sendJsonMessage,

    // WebSocket instance (for advanced usage)
    getWebSocket,
  };
}
