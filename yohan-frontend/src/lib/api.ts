// API client functions for communicating with the Yohan backend

import type { WeatherData, CalendarEvent } from '../types';
import type { ChatMessageType } from '../types/chat';

// Configuration
const API_BASE_URL = 'http://localhost:8000'; // Backend server URL

// Error handling utility
export class ApiError extends Error {
  status?: number;
  statusText?: string;

  constructor(
    message: string,
    status?: number,
    statusText?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

// Generic fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, finalOptions);

    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors or other fetch failures
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      'Network Error'
    );
  }
}

/**
 * Fetch weather data from the backend
 * 
 * @param lat - Optional latitude for location-specific weather
 * @param lon - Optional longitude for location-specific weather
 * @returns Promise<WeatherData> - Weather data including current, hourly, and daily forecasts
 */
export async function fetchWeather(lat?: number, lon?: number): Promise<WeatherData> {
  let endpoint = '/api/weather';
  
  // Add query parameters if coordinates are provided
  if (lat !== undefined && lon !== undefined) {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
    });
    endpoint += `?${params.toString()}`;
  }

  return apiRequest<WeatherData>(endpoint);
}

/**
 * Fetch calendar events from the backend
 * 
 * @returns Promise<CalendarEvent[]> - Array of upcoming calendar events
 */
export async function fetchCalendar(): Promise<CalendarEvent[]> {
  return apiRequest<CalendarEvent[]>('/api/calendar');
}

/**
 * Health check endpoint to verify backend connectivity
 *
 * @returns Promise<{status: string}> - Health status response
 */
export async function healthCheck(): Promise<{ status: string }> {
  return apiRequest<{ status: string }>('/health');
}

// Chat API types
interface ChatRequest {
  message: string;
  conversation_id?: string;
  conversation_history?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
}

interface ChatResponse {
  message: string;
  timestamp: string;
  conversation_id?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

/**
 * Send a message to the LLM and get a response
 *
 * @param message - The user's message
 * @param conversationHistory - Optional conversation history for context
 * @param conversationId - Optional conversation ID for tracking
 * @returns Promise<ChatResponse> - LLM response with metadata
 */
export async function sendChatMessage(
  message: string,
  conversationHistory?: ChatMessageType[],
  conversationId?: string
): Promise<ChatResponse> {
  // Convert ChatMessageType[] to the format expected by the API
  const apiConversationHistory = conversationHistory?.map(msg => ({
    role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.content,
    timestamp: msg.timestamp
  }));

  const requestBody: ChatRequest = {
    message,
    conversation_id: conversationId,
    conversation_history: apiConversationHistory
  };

  return apiRequest<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
}


