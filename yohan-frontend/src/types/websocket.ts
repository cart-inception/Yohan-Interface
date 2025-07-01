// TypeScript interfaces that mirror the backend Pydantic WebSocket schemas

export interface WebSocketMessage {
  event_type: string;
  payload: Record<string, any>;
}

// Specific message types for better type safety
export interface VoiceStatusMessage extends WebSocketMessage {
  event_type: 'voice_status';
  payload: {
    status: 'idle' | 'listening' | 'processing' | 'speaking';
  };
}

export interface LLMResponseMessage extends WebSocketMessage {
  event_type: 'llm_response';
  payload: {
    message: string;
    timestamp: string;
  };
}



// Union type for all possible WebSocket messages
export type AppWebSocketMessage = VoiceStatusMessage | LLMResponseMessage | WebSocketMessage;
