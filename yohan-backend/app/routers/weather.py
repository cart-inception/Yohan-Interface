from fastapi import APIRouter, HTTPException
from typing import Optional

from ..services import weather_service
from ..schemas.weather import WeatherData

router = APIRouter(
    prefix="/weather",
    tags=["weather"],
)

@router.get("/", response_model=WeatherData)
async def get_weather(lat: Optional[float] = None, lon: Optional[float] = None):
    """
    Endpoint to get weather data. 
    If lat and lon are not provided, it uses the default from the service.
    """
    try:
        if lat is not None and lon is not None:
            weather_data = await weather_service.get_weather_data(lat, lon)
        else:
            weather_data = await weather_service.get_weather_data()
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
