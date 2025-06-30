# Yohan Smart Calendar: In-Depth Development Plan

This document provides a highly detailed, phased development plan. Each task is broken down into granular sub-tasks with specific instructions, commands, and code examples to ensure a clear and actionable roadmap.

---

## Phase 1: Backend Foundation (Python/FastAPI)

**Goal:** Establish a robust backend server, including project structure, configuration management, and core API endpoints.

- **1.1: Project Scaffolding & Dependencies**
  - [x] 1.1.1: Create the main project directory: `mkdir yohan-backend`.
  - [x] 1.1.2: Navigate into the directory and create a Python virtual environment: `cd yohan-backend && python3 -m venv venv`.
  - [x] 1.1.3: Activate the environment: `source venv/bin/activate`.
  - [x] 1.1.4: Create `requirements.txt` and add foundational libraries for the web server, async operations, and configuration: `fastapi`, `uvicorn[standard]`, `python-dotenv`, `pydantic`.
  - [x] 1.1.5: Install dependencies: `pip install -r requirements.txt`.
  - [x] 1.1.6: Create the application source structure: `mkdir -p app/services app/routers app/schemas`.
  - [x] 1.1.7: Create `__init__.py` in each new directory to mark them as Python packages: `touch app/__init__.py app/services/__init__.py app/routers/__init__.py app/schemas/__init__.py`.

- **1.2: API Key & Configuration Management**
  - [x] 1.2.1: Create `app/settings.py`. Define a `Settings` class using `pydantic.BaseSettings` to load environment variables for API keys and URLs. This provides validation and type safety.
  - [x] 1.2.2: Create a `.env.example` file in the project root to serve as a template for all required environment variables.
  - [x] 1.2.3: Create a `.env` file (copy from the example), add it to `.gitignore`, and populate it with your actual API keys and the calendar `.ics` link.

- **1.3: Basic FastAPI Server**
  - [x] 1.3.1: Create `app/main.py`. Import `FastAPI` and the `settings` object.
  - [x] 1.3.2: Instantiate the app: `app = FastAPI(title="Yohan Backend")`.
  - [x] 1.3.3: Add a health check endpoint `GET /health` that returns a simple JSON response like `{"status": "ok"}`.
  - [x] 1.3.4: Verify the setup by running `uvicorn app.main:app --reload` and accessing `http://127.0.0.1:8000/health` and `http://127.0.0.1:8000/docs`.

- **1.4: Data Schemas (Pydantic)**
  - [x] 1.4.1: In `app/schemas/weather.py`, define Pydantic models for `WeatherData`, `CurrentWeather`, and `ForecastDay` to structure the data from the OpenWeatherMap API.
  - [x] 1.4.2: In `app/schemas/calendar.py`, define a `CalendarEvent` model with fields like `summary`, `start_time`, and `end_time`.
  - [x] 1.4.3: In `app/schemas/websockets.py`, define models for WebSocket messages, such as `WebSocketMessage` with fields for `event_type` (e.g., `status_update`, `llm_response`) and `payload`.

- **1.5: Service Layer**
  - [x] 1.5.1: Add `httpx` and `icalendar` to `requirements.txt` and install them.
  - [x] 1.5.2: Create `app/services/weather_service.py`. Implement an `async` function `get_weather_data` that uses `httpx` to call the OpenWeatherMap API and returns data parsed into your Pydantic schemas.
  - [x] 1.5.3: Create `app/services/calendar_service.py`. Implement a function `get_calendar_events` that fetches the `.ics` file, parses it with `icalendar`, and returns a list of `CalendarEvent` objects.

- **1.6: API Routers**
  - [x] 1.6.1: Create `app/routers/weather.py`. Define an `APIRouter`, create a `GET /` endpoint that calls the `weather_service`, and set the `response_model` to your Pydantic schema.
  - [x] 1.6.2: Create `app/routers/calendar.py` with a similar structure for the calendar endpoint.
  - [x] 1.6.3: In `app/main.py`, include these new routers in the main FastAPI app using `app.include_router()`.

- **1.7: WebSocket Endpoint**
  - [x] 1.7.1: Create `app/websocket_manager.py`. Implement a `ConnectionManager` class to manage active WebSocket connections (connect, disconnect, send messages).
  - [x] 1.7.2: Create `app/routers/comms.py`. Define the `WS /ws/comms` endpoint. Use the `ConnectionManager` to handle clients and implement a loop to listen for incoming messages and broadcast responses.

---

## Phase 2: Frontend Foundation (React/TypeScript)

**Goal:** Set up a modern frontend project, establish the UI framework and state management, and connect to the backend.

- **2.1: Project Scaffolding with Vite**
  - [x] 2.1.1: In a separate directory, create the frontend project: `npm create vite@latest yohan-frontend -- --template react-ts`.
  - [x] 2.1.2: `cd yohan-frontend` and install dependencies: `npm install`.
  - [x] 2.1.3: Clean up default boilerplate from `App.tsx` and `index.css`.
  - [x] 2.1.4: Create a clear directory structure: `src/components`, `src/views`, `src/hooks`, `src/lib`, `src/store`, `src/types`.

- **2.2: UI Framework & Styling**
  - [x] 2.2.1: Install Tailwind CSS and its dependencies: `npm install -D tailwindcss postcss autoprefixer` and initialize: `npx tailwindcss init -p`.
  - [x] 2.2.2: Configure `tailwind.config.js` and `index.css` according to the official documentation.
  - [x] 2.2.3: Use the `shadcn/ui` CLI to initialize the component library: `npx shadcn-ui@latest init`.
  - [x] 2.2.4: Add a few base components to start: `npx shadcn-ui@latest add card button`.

- **2.3: State Management & Types**
  - [x] 2.3.1: Install Zustand: `npm install zustand`.
  - [x] 2.3.2: In `src/types`, create files to mirror the backend's Pydantic schemas (e.g., `weather.ts`, `calendar.ts`).
  - [x] 2.3.3: Create `src/store/appStore.ts`. Define a store that holds `weatherData`, `calendarEvents`, `chatHistory`, and `voiceStatus`. Create actions to update this state.

- **2.4: API & WebSocket Client**
  - [x] 2.4.1: Create `src/lib/api.ts`. Implement `fetchWeather()` and `fetchCalendar()` functions that call the backend endpoints and return typed data.
  - [x] 2.4.2: Install a WebSocket client library: `npm install react-use-websocket`.
  - [x] 2.4.3: In `App.tsx` or a dedicated hook (`src/hooks/useAppWebSocket.ts`), establish the WebSocket connection. Use the `onMessage` callback to parse incoming messages and update the Zustand store accordingly.
  - [x] 2.4.4: On initial app load, call the API functions to fetch and display the initial weather and calendar data.

---

## Phase 3: Core Feature Implementation

**Goal:** Build the primary UI views and integrate the LLM for chat functionality.

- **3.1: Main Dashboard View**
  - [x] 3.1.1: Create `src/views/DashboardView.tsx`. Use Tailwind CSS grid to create the main layout.
  - [x] 3.1.2: Create `src/components/widgets/ClockWidget.tsx`. Use a `useEffect` hook with an interval to keep the time updated.
  - [x] 3.1.3: Create `src/components/widgets/WeatherWidget.tsx`. It should read from the Zustand store and display the current temperature and conditions in a `Card` component.
  - [x] 3.1.4: Create `src/components/widgets/UpcomingEventsWidget.tsx`. It should read from the store, map over the next few events, and display them in a list.

- **3.2: Dedicated Views**
  - [ ] 3.2.1: Create `src/views/WeatherView.tsx`. Build a more detailed view with hourly and daily forecast components, using data from the store.
  - [ ] 3.2.2: Create `src/views/CalendarView.tsx`. Integrate a full calendar component (e.g., `react-big-calendar`) and populate it with events.
  - [ ] 3.2.3: Implement a simple routing or state-based mechanism in `App.tsx` to switch between the dashboard and the dedicated views.

- **3.3: LLM Chat Integration**
  - [ ] 3.3.1: (Backend) Add `anthropic` to `requirements.txt`. Create `app/services/llm_service.py` to handle communication with the Anthropic API.
  - [ ] 3.3.2: (Backend) In the WebSocket endpoint, when a message of type `llm_query` is received, pass the text to the `llm_service` and broadcast the response.
  - [ ] 3.3.3: (Frontend) Create `src/views/ChatView.tsx`.
  - [ ] 3.3.4: (Frontend) Build `src/components/ChatMessage.tsx` to display individual messages (user vs. AI).
  - [ ] 3.3.5: (Frontend) Build an input form in `ChatView` that, on submit, sends the message via the WebSocket and updates the `chatHistory` in the store.

---

## Phase 4: Voice Integration

**Goal:** Implement the full hands-free voice interaction loop.

- **4.1: Voice Service (Backend)**
  - [ ] 4.1.1: Add `pvporcupine`, `vosk`, and `elevenlabs` to `requirements.txt`.
  - [ ] 4.1.2: Create `app/services/voice_service.py`.
  - [ ] 4.1.3: Implement a `WakeWordListener` class that runs Porcupine in a separate thread.
  - [ ] 4.1.4: When the wake word is detected, the listener should use a callback to notify the main app, which then broadcasts a `status: listening` message via WebSocket.
  - [ ] 4.1.5: Implement an `STT` class that uses Vosk to listen and transcribe audio after the wake word is detected.
  - [ ] 4.1.6: Implement a `TTS` class that takes text and uses the Eleven Labs API to generate and play audio.

- **4.2: Voice Control Flow (Backend)**
  - [ ] 4.2.1: Orchestrate the voice services. After the wake word, start STT. After transcription, send the text to the LLM service. Take the LLM's text response and send it to the TTS service.
  - [ ] 4.2.2: Update the WebSocket status at each step: `listening` -> `processing` -> `speaking` -> `idle`.

- **4.3: Voice Indicator (Frontend)**
  - [ ] 4.3.1: Create `src/components/VoiceIndicator.tsx`. It should have different visual states (e.g., icon, color, animation) based on the `voiceStatus` from the Zustand store.
  - [ ] 4.3.2: Place this indicator in a persistent location in the main layout.

---

## Phase 5: System Integration & Deployment

**Goal:** Prepare the application for production on the Raspberry Pi.

- **5.1: Final Integration**
  - [ ] 5.1.1: (Frontend) Run `npm run build` to create a production build of the React app in the `dist/` directory.
  - [ ] 5.1.2: (Backend) In `app/main.py`, configure FastAPI's `StaticFiles` middleware to serve the contents of the frontend's `dist` directory.
  - [ ] 5.1.3: Perform end-to-end testing of the fully integrated application.

- **5.2: Deployment & Documentation**
  - [ ] 5.2.1: Create a `docs/setup_guide.md` detailing all steps for setting up the project on a fresh Raspberry Pi OS.
  - [ ] 5.2.2: Write a `setup.sh` script to automate installation of system dependencies (`portaudio`, `git`), Python, Node.js, and all project requirements.
  - [ ] 5.2.3: Document how to configure the Raspberry Pi to launch a browser in kiosk mode on boot, pointing to the local server address.

- **5.3: Systemd Service**
  - [ ] 5.3.1: Create a `yohan.service` file for `systemd` to manage the backend process.
  - [ ] 5.3.2: The service file should specify the user, working directory, and the command to run Uvicorn (without `--reload`).
  - [ ] 5.3.3: Add instructions to the setup guide for copying, enabling, and starting the `systemd` service.
