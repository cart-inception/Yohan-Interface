from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import settings
from .routers import weather, calendar, comms, chat

app = FastAPI(title="Yohan Backend")

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

# Include WebSocket router
app.include_router(comms.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
