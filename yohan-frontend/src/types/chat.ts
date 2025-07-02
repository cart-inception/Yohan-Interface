// TypeScript interfaces for chat functionality

export interface ChatMessageType {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'assistant';
  status?: 'sending' | 'sent' | 'error';
}

export interface ChatState {
  messages: ChatMessageType[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
}

// Note: WebSocket message types are now defined in websocket.ts to avoid duplication
