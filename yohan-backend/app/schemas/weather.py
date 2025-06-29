from pydantic import BaseModel
from typing import List
from datetime import datetime, date

class CurrentWeather(BaseModel):
    temp: float
    feels_like: float
    humidity: int
    wind_speed: float
    description: str
    sunrise: datetime
    sunset: datetime

class ForecastDay(BaseModel):
    date: date
    max_temp: float
    min_temp: float
    description: str

class HourlyForecast(BaseModel):
    time: datetime
    temp: float
    description: str

class WeatherData(BaseModel):
    current: CurrentWeather
    hourly: List[HourlyForecast]
    daily: List[ForecastDay]
