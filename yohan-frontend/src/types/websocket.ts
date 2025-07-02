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
    conversation_id?: string;
    usage?: Record<string, any>;
    model?: string;
    message_id?: string;
    in_reply_to?: string;
  };
}

export interface MessageAckMessage extends WebSocketMessage {
  event_type: 'message_ack';
  payload: {
    message_id: string;
    status: 'received' | 'processing' | 'delivered' | 'error';
    timestamp: string;
    error_message?: string;
  };
}



// Union type for all possible WebSocket messages
export type AppWebSocketMessage = VoiceStatusMessage | LLMResponseMessage | MessageAckMessage | WebSocketMessage;
