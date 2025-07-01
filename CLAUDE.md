# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend Development
```bash
# Navigate to backend directory
cd yohan-backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn app.main:app --reload

# Run backend tests
python scripts/test_anthropic.py
python scripts/test_llm_service.py
python scripts/test_websocket_llm.py
```

### Frontend Development
```bash
# Navigate to frontend directory
cd yohan-frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

This is a full-stack smart calendar application with a Python/FastAPI backend and React/TypeScript frontend.

### Backend Architecture (yohan-backend/)
- **FastAPI** application with modular router structure
- **Services** handle business logic (weather_service.py, calendar_service.py, llm_service.py)
- **Schemas** define Pydantic models for request/response validation
- **WebSocket Manager** handles real-time connections (currently unused for chat)
- **Settings** centralize configuration via environment variables

Key API endpoints:
- `/api/weather/*` - Weather data from OpenWeatherMap
- `/api/calendar/*` - Calendar events from iCal files
- `/api/chat/*` - LLM chat via Anthropic Claude
- `/api/comms/*` - WebSocket connections

### Frontend Architecture (yohan-frontend/)
- **Views** contain main application screens (Dashboard, Weather, Calendar, Chat)
- **Components** are reusable UI elements using shadcn/ui
- **Store** manages global state with Zustand
- **Hooks** provide WebSocket and HTTP utilities
- **API Client** (lib/api.ts) centralizes backend communication

State management flow:
1. Views dispatch actions to Zustand store
2. Store updates trigger component re-renders
3. API calls are made through centralized client
4. Responses update store state

### Key Implementation Notes

1. **Chat Feature**: Recently migrated from WebSocket to HTTP endpoints. Chat history clears when navigating away from the chat view.

2. **Environment Variables**: Backend requires `.env` file with:
   - `ANTHROPIC_API_KEY` for LLM integration
   - `OPENWEATHERMAP_API_KEY` for weather data
   - `CALENDAR_URL` for iCal feed

3. **CORS Configuration**: Backend configured for local development (localhost:5173)

4. **Type Safety**: Frontend uses TypeScript with defined types in `src/types/`. Backend uses Pydantic for validation.

5. **Widget System**: Dashboard displays widgets that link to dedicated views. Each widget can show preview data.

### Development Workflow

When modifying features:
1. Update backend service/router if changing data flow
2. Update Pydantic schemas for API contract changes
3. Update TypeScript types to match backend schemas
4. Update Zustand store for state changes
5. Update views/components for UI changes

When adding new features:
1. Create backend router in `app/routers/`
2. Create service in `app/services/`
3. Define schemas in `app/schemas/`
4. Add API client methods in `yohan-frontend/src/lib/api.ts`
5. Add TypeScript types in `yohan-frontend/src/types/`
6. Update store if needed
7. Create view/components as needed