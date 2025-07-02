// HTTP-based chat hook using REST API instead of WebSocket
// This provides a simpler, more reliable alternative to WebSocket communication

import { useCallback, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { sendChatMessage as apiSendChatMessage } from '../lib/api';
import type { ChatMessageType } from '../types/chat';

/**
 * HTTP-based chat hook that uses REST API calls instead of WebSocket
 * Provides the same interface as the WebSocket version but more reliable
 */
export function useHttpChat() {
  console.log('💬 Initializing HTTP Chat hook');

  // Local state for tracking request status
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Get store actions
  const {
    chatHistory,
    addChatMessage,
    setError,
  } = useAppStore();

  // Function to send a chat message via HTTP API
  const sendChatMessage = useCallback(async (content: string) => {
    if (!content || !content.trim()) {
      console.error('Cannot send empty message');
      setError('Cannot send empty message');
      return;
    }

    const trimmedContent = content.trim();
    console.log('💬 Sending chat message via HTTP:', trimmedContent);

    // Create user message and add to chat history immediately
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      content: trimmedContent,
      timestamp: new Date().toISOString(),
      sender: 'user',
      status: 'sending',
    };
    
    addChatMessage(userMessage);
    setIsLoading(true);
    setLastError(null);
    setError(null);

    try {
      // Send the message to the API
      const response = await apiSendChatMessage(
        trimmedContent,
        chatHistory, // Pass conversation history for context
        `conversation-${Date.now()}` // Simple conversation ID
      );

      console.log('💬 Received response from API:', response);

      // User message status is implicitly 'sent' when we get a response
      
      // Create assistant message from response
      const assistantMessage: ChatMessageType = {
        id: `assistant-${Date.now()}`,
        content: response.message,
        timestamp: response.timestamp,
        sender: 'assistant',
        status: 'sent',
      };

      // Add both messages to store (user message update + assistant response)
      // Note: In a more sophisticated implementation, you might want to update
      // the existing user message instead of adding a new one
      addChatMessage(assistantMessage);

      console.log('💬 Successfully processed chat message');

    } catch (error) {
      console.error('💬 Error sending chat message:', error);
      
      // Error handling - user message status remains as 'sending' to indicate failure

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);
      setError(`Failed to send message: ${errorMessage}`);

      // You might want to add an error message to the chat
      const errorChatMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        sender: 'assistant',
        status: 'error',
      };
      
      addChatMessage(errorChatMessage);

    } finally {
      setIsLoading(false);
    }
  }, [chatHistory, addChatMessage, setError]);

  // Connection status - always "connected" for HTTP
  const connectionStatus = 'Connected (HTTP)';
  const isConnected = true; // HTTP is always "connected" if the network works

  // Return hook interface compatible with WebSocket version
  return {
    // Connection state
    isConnected,
    connectionStatus,
    isLoading,
    lastError,
    
    // Actions
    sendChatMessage,
    
    // Additional HTTP-specific info
    chatHistory,
  };
}
