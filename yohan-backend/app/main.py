from fastapi import FastAPI
from . import settings
from .routers import weather, calendar

app = FastAPI(title="Yohan Backend")

# Include API routers
app.include_router(weather.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
