// API client functions for communicating with the Yohan backend

import type { WeatherData, CalendarEvent } from '../types';

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
async function apiRequest<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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


