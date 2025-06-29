from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENWEATHERMAP_API_KEY: str
    CALENDAR_ICS_URL: str
    ANTHROPIC_API_KEY: str
    ELEVENLABS_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
