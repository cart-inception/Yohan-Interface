import httpx
from datetime import datetime, date
from ..schemas.weather import WeatherData, CurrentWeather, HourlyForecast, ForecastDay
from ..settings import settings

OPENWEATHERMAP_API_URL = "https://api.openweathermap.org/data/3.0/onecall"

async def get_weather_data(lat: float = 41.5868, lon: float = -93.6250) -> WeatherData:
    """
    Fetches weather data from the OpenWeatherMap API for Des Moines, Iowa.

    Args:
        lat: Latitude for the location (default: Des Moines, IA).
        lon: Longitude for the location (default: Des Moines, IA).

    Returns:
        A WeatherData object containing the parsed weather information.
    """
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.OPENWEATHERMAP_API_KEY,
        "units": "imperial",  # or 'metric'
        "exclude": "minutely,alerts"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(OPENWEATHERMAP_API_URL, params=params)
            response.raise_for_status()  # Raise an exception for bad status codes
            data = response.json()

            # Parse current weather
            current_weather = CurrentWeather(
                temp=data['current']['temp'],
                feels_like=data['current']['feels_like'],
                humidity=data['current']['humidity'],
                wind_speed=data['current']['wind_speed'],
                description=data['current']['weather'][0]['description'],
                sunrise=datetime.fromtimestamp(data['current']['sunrise']),
                sunset=datetime.fromtimestamp(data['current']['sunset'])
            )

            # Parse hourly forecast
            hourly_forecast = [
                HourlyForecast(
                    time=datetime.fromtimestamp(h['dt']),
                    temp=h['temp'],
                    description=h['weather'][0]['description']
                ) for h in data['hourly'][:24] # First 24 hours
            ]

            # Parse daily forecast
            daily_forecast = [
                ForecastDay(
                    date=date.fromtimestamp(d['dt']),
                    max_temp=d['temp']['max'],
                    min_temp=d['temp']['min'],
                    description=d['weather'][0]['description']
                ) for d in data['daily'][:7] # Next 7 days
            ]

            return WeatherData(
                current=current_weather,
                hourly=hourly_forecast,
                daily=daily_forecast,
                location="Des Moines, Iowa"
            )

        except httpx.HTTPStatusError as e:
            # Handle HTTP errors (e.g., 404, 500)
            print(f"HTTP error occurred: {e}")
            # Depending on requirements, you might want to return None, or a default object
            raise
        except (KeyError, IndexError) as e:
            # Handle missing keys in the JSON response
            print(f"Error parsing weather data: {e}")
            raise
        except Exception as e:
            # Handle other potential exceptions
            print(f"An unexpected error occurred: {e}")
            raise
