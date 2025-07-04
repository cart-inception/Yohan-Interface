from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from . import settings
from .routers import weather, calendar, comms, chat, tts
from .services.heartbeat_service import heartbeat_service
from .models.init_db import create_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_tables()
    await heartbeat_service.start()
    yield
    # Shutdown
    await heartbeat_service.stop()

app = FastAPI(title="Yohan Backend", lifespan=lifespan)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",  # Primary Vite dev server port
        "http://localhost:5173",  # Backup Vite port
        "http://localhost:5174",  # Backup Vite port
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(weather.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(tts.router)

# Include WebSocket router
app.include_router(comms.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
