// TypeScript interfaces that mirror the backend Pydantic weather schemas

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  sunrise: string; // ISO datetime string
  sunset: string; // ISO datetime string
}

export interface ForecastDay {
  date: string; // ISO date string
  max_temp: number;
  min_temp: number;
  description: string;
}

export interface HourlyForecast {
  time: string; // ISO datetime string
  temp: number;
  description: string;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: ForecastDay[];
  location?: string; // Optional location field
}
