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

// WebSocket payload types for chat
export interface LLMQueryPayload {
  message: string;
  timestamp: string;
}

export interface LLMResponsePayload {
  message: string;
  timestamp: string;
}

// Chat-specific WebSocket message types
export interface LLMQueryMessage {
  event_type: 'llm_query';
  payload: LLMQueryPayload;
}

export interface LLMResponseMessage {
  event_type: 'llm_response';
  payload: LLMResponsePayload;
}
