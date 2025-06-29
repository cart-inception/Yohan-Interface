
# Project: Yohan

This document outlines the technical architecture and feature set for **Yohan**, a bespoke smart calendar application. The goal is to create a central household information hub with a clean, modern, and intuitive interface that is fully controllable via both a touchscreen and voice commands.

The application will feature a multi-view design, allowing users to switch between a main dashboard and dedicated full-screen views for more detailed information.

## Key User-Facing Features

### Unified Dashboard (Main View)
The primary screen that provides at-a-glance information. It will feature a grid of non-interactive or lightly-interactive widgets, including:
- **Weather Widget** showing the current temperature and conditions.
- **Upcoming Events Widget** listing the next few appointments from the integrated calendar.
- **Clock Widget** displaying the current date and time.
- **Voice Command Status Indicator** to show whether the system is listening or idle.

### Dedicated Calendar View
A full-screen, interactive calendar application. Users can navigate to this view to:
- Browse a full monthly calendar.
- Switch to a detailed daily or weekly agenda view.
- View details for specific events.

### Dedicated Weather View
A full-screen weather dashboard offering a comprehensive forecast, including:
- An hourly temperature and precipitation forecast for the current day.
- A 5-day or 7-day forecast with high and low temperatures.
- Other details like wind speed, humidity, and sunrise/sunset times.

### Dedicated LLM Chat View
A full-screen, conversational AI interface for interacting with the Anthropic model. This view will support:
- **Voice-to-Text Interaction:** Engage in a hands-free conversation with the assistant.
- **Typed Interaction:** Use an on-screen keyboard to type messages.
- **Conversation History:** View the log of the current chat session.

### Seamless Navigation
Users can effortlessly switch between the main dashboard and any dedicated view using either touch controls (tapping on widgets or navigation icons) or voice commands (e.g., “Hey Yohan, show the full calendar,” or “Hey Yohan, open chat”).

## High-Level Architecture: Client-Server Model
We will build this project using a decoupled, client-server architecture.

### Backend (Python)
- A Python web server will run continuously on the Raspberry Pi.
- It will handle all the heavy lifting: data fetching, processing voice commands, and interacting with the LLM.
- It will not render any UI itself.

### Frontend (TypeScript/Web)
- A modern, single-page web application (SPA) will run in a browser on the Raspberry Pi (in full-screen “kiosk” mode).
- This application will be responsible for everything the user sees and touches.
- It will communicate with the backend to get data and send commands.

This separation makes the UI development independent of the backend logic, allowing you to use modern web technologies for a polished and responsive interface.

## Backend Development (Python)
The backend will be an API server. We will use FastAPI as the framework because it's fast, modern, and has excellent built-in support for asynchronous operations and WebSockets.

### Core Components & Libraries
- **Web Framework:**
  - FastAPI: For building the API endpoints.
  - Uvicorn: An ASGI server to run the FastAPI application.
- **Calendar Integration:**
  - icalendar: A library to parse calendar data from .ics links (the standard format for Google Calendar, iCloud, etc.).
  - apscheduler: To schedule periodic checks for new calendar events in the background.
- **Weather Service:**
  - API Provider: OpenWeatherMap
  - httpx: A modern, async-ready HTTP client to fetch data from the OpenWeatherMap API.
- **LLM Integration (Cloud-based):**
  - API Provider: Anthropic
  - anthropic: The official Python client for Anthropic’s API.
- **API Key Management:**
  - Use a `.env` file with `python-dotenv` to manage API keys securely (never hardcode API keys).
- **Voice Processing:**
  - Wake Word Engine: pvporcupine from Picovoice.
  - Speech-to-Text (STT): vosk for offline recognition.
  - Text-to-Speech (TTS): Eleven Labs API for high-quality, realistic voice generation.
  - elevenlabs: The official Python client for the Eleven Labs API. (Requires an API key).

### Workflow
- A lightweight pvporcupine process runs continuously, listening for a specific phrase (e.g., "Hey Yohan").
- When the wake word is detected, the backend notifies the frontend via WebSocket to change the UI (e.g., show a "listening" icon).
- The backend then activates the vosk engine to capture and transcribe the user’s command.
- After transcription, the text is sent to the Eleven Labs API for speech synthesis, and the system reverts to listening for the wake word.

### Real-time Communication
- FastAPI's WebSocket support: For instant, two-way communication between the backend and frontend.

### API & WebSocket Endpoints
- **GET /api/calendar:** Returns a JSON object with a list of upcoming calendar events.
- **GET /api/weather:** Returns a JSON object with the current weather forecast.
- **WS /ws/comms:** A WebSocket endpoint for real-time communication.
- **Backend -> Frontend:** Push LLM responses, real-time voice system status (e.g., `{"status": "idle"}`, `{"status": "listening"}`), or the final transcribed commands.
- **Frontend -> Backend:** Send user text messages to the LLM.

## Frontend Development (TypeScript)
The frontend will be a modern web application built for a touch-first experience.

### Core Components & Technologies
- **Framework:** React with Vite: To build the dynamic, component-based user interface.
- **Styling:** Tailwind CSS: A utility-first CSS framework for creating a responsive, custom design that looks great on the touchscreen.
- **Component Library:** shadcn/ui: To provide a set of well-built, accessible, and fully customizable base components (like Cards, Buttons, and Dialogs) that integrate directly with Tailwind CSS.
- **State Management:** Zustand: A lightweight library to manage the application's shared state (e.g., current view, calendar events, chat history).
- **Custom UI Components:** You will build a set of reusable components using shadcn/ui as a foundation:
  - `DashboardView.tsx`: The main dashboard grid with all the widgets.
  - `CalendarView.tsx`: The full-screen calendar component.
  - `WeatherView.tsx`: The full-screen weather component.
  - `ChatWindow.tsx`: The chat interface, including the message history and text input.
  - `VoiceIndicator.tsx`: A small UI element that changes its appearance based on messages from the WebSocket (idle, listening, processing).

### Functionality
- On Load: The app fetches initial data from the backend's `/api/calendar` and `/api/weather` endpoints.
- WebSocket Connection: It establishes a persistent WebSocket connection to `/ws/comms`.
- Real-time Updates: It listens for messages from the WebSocket to update the UI in real-time (e.g., a new chat message appears, the voice indicator changes state).
- User Interaction: Touch events are handled by React (e.g., `onClick`). Text input for the LLM chat is captured and sent to the backend via the WebSocket.

## System Setup on Raspberry Pi
- **Backend:** The Python/FastAPI server runs as a background service (using systemd).
- **Frontend:** The compiled frontend (a set of static HTML, CSS, and JS files) is served by the same FastAPI application.
- **Display:** The Raspberry Pi is configured to launch a web browser (like Chromium) in “kiosk mode” on boot, pointing to the local address of your application (e.g., `http://localhost:8000`). This makes the UI full-screen and hides the browser chrome.