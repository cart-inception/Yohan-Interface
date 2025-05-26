# Project Yohan: Task List

This task list outlines a step-by-step approach to building the Yohan AI System, based on the `featuresheet.md` and `guide.md`.

## Phase 0: Project Setup & Core Infrastructure

### 1. Development Environment Setup
- [ ] 1.1. Setup Raspberry Pi 5 OS and basic configuration (network, SSH, etc.)
- [ ] 1.2. Install Python (ensure a recent version like 3.9+ is available) and necessary system dependencies (e.g., `portaudio` for PyAudio, build tools).
- [ ] 1.3. Create project directory structure (e.g., `yohan_app/`, `yohan_app/core`, `yohan_app/modules`, `yohan_app/ui`, `config/`, `tests/`, `scripts/`).
- [ ] 1.4. Initialize Git repository (`git init`).
- [ ] 1.5. Setup Python virtual environment (e.g., `python -m venv .venv` and activate).
- [ ] 1.6. Create initial `requirements.txt` (and add to it as libraries are chosen).

### 2. Core Application Structure
- [ ] 2.1. Design main application loop/entry point (`main.py` or `app.py`).
- [ ] 2.2. Implement basic configuration management.
    - [ ] 2.2.1. Choose method for storing API keys and settings (e.g., YAML/JSON config file, environment variables via `.env` file with `python-dotenv`).
    - [ ] 2.2.2. Implement secure loading of API keys and settings (ensure config files with secrets are in `.gitignore`).
- [ ] 2.3. Setup logging framework (e.g., Python's `logging` module) with configurable levels and output (console/file).

## Phase 1: User Interface & Interaction (Prototype First)

### 1. Voice Interaction (Prototype - Button Initiated)
- [ ] 1.1. Speech-to-Text (STT) - Cloud API Focus
    - [ ] 1.1.1. Choose and integrate primary cloud STT API (e.g., Google Cloud STT, Azure Speech).
        - [ ] 1.1.1.1. Sign up for the service and obtain API keys.
        - [ ] 1.1.1.2. Install the Python SDK (e.g., `google-cloud-speech`).
        - [ ] 1.1.1.3. Implement audio capture from microphone (using `PyAudio` or `sounddevice`).
        - [ ] 1.1.1.4. Implement function to send audio data to the STT API and receive transcription.
        - [ ] 1.1.1.5. Add error handling for API calls and audio issues.
    - [ ] 1.1.2. (Future Research) Investigate local STT options (e.g., Vosk, Whisper smaller models) for potential fallback or offline capabilities.
- [ ] 1.2. Natural Language Understanding (NLU) - LLM API Focus
    - [ ] 1.2.1. Choose and integrate primary LLM API (e.g., OpenAI GPT models, Google Gemini).
        - [ ] 1.2.1.1. Sign up for the service and obtain API keys.
        - [ ] 1.2.1.2. Install the Python SDK (e.g., `openai`, `google-generativeai`).
        - [ ] 1.2.1.3. Implement function to send transcribed text (from STT) to the LLM API.
        - [ ] 1.2.1.4. Design initial prompt structure for basic Q&A and intent recognition.
        - [ ] 1.2.1.5. Implement function to parse LLM response to extract intent or answer.
        - [ ] 1.2.1.6. Add error handling for LLM API calls.
- [ ] 1.3. Text-to-Speech (TTS) - Cloud API Focus
    - [ ] 1.3.1. Choose and integrate primary cloud TTS API (e.g., Google Cloud TTS, AWS Polly, ElevenLabs).
        - [ ] 1.3.1.1. Sign up for the service and obtain API keys.
        - [ ] 1.3.1.2. Install the Python SDK (e.g., `google-cloud-texttospeech`).
        - [ ] 1.3.1.3. Implement function to send text (from LLM response or system messages) to TTS API and receive audio data.
        - [ ] 1.3.1.4. Implement audio playback for the received audio stream/file (e.g., `pygame.mixer`, `playsound`, `sounddevice`).
        - [ ] 1.3.1.5. Add error handling for API calls and audio playback.
    - [ ] 1.3.2. (Future Research) Investigate local TTS options (e.g., Piper, Coqui TTS, pyttsx3) for offline capability or faster responses.
- [ ] 1.4. Basic Voice Interaction Loop (Button Triggered)
    - [ ] 1.4.1. Implement a UI button in the prototype GUI to initiate listening.
    - [ ] 1.4.2. Connect STT -> NLU (LLM) -> TTS pipeline: Button press triggers audio capture -> STT -> LLM -> TTS -> audio output.
    - [ ] 1.4.3. Implement basic state management for the interaction (e.g., idle, listening, processing, speaking).

### 2. Touchscreen User Interface (Prototype - Tkinter on Monitor)
- [ ] 2.1. Setup Tkinter (or chosen prototype GUI framework e.g. PySimpleGUI).
    - [ ] 2.1.1. Create the main application window and basic layout structure.
- [ ] 2.2. "Agent Mode" Screen (Initial Version for Voice Interaction Feedback)
    - [ ] 2.2.1. Create a display area (e.g., text widget or label) for real-time STT transcription (or after full phrase).
    - [ ] 2.2.2. Create a display area for LLM responses (text format).
    - [ ] 2.2.3. Integrate the voice input trigger button (from 1.4.1).
    - [ ] 2.2.4. Implement basic visual feedback for system status (e.g., text messages like "Listening...", "Processing...", "Speaking...").
- [ ] 2.3. Settings & Configuration Screen (Basic)
    - [ ] 2.3.1. Create UI elements (input fields) to view/edit API keys (connect to config management from Phase 0).
    - [ ] 2.3.2. (Optional) UI elements for any early user preferences (e.g., choosing STT/TTS voice if options exist).

## Phase 2: Core AI Assistant Capabilities

### 1. Information Retrieval & Q&A
- [ ] 1.1. Enhance LLM integration for general knowledge questions (refine prompts from Phase 1 for better Q&A).
- [ ] 1.2. Real-time Information (Choose 1-2 for initial implementation, e.g., Weather & News).
    - [ ] 1.2.1. Weather API Integration
        - [ ] 1.2.1.1. Select and sign up for a weather API (e.g., OpenWeatherMap API).
        - [ ] 1.2.1.2. Implement Python function to fetch weather data for a given location (use `requests` library).
        - [ ] 1.2.1.3. Integrate with NLU (LLM) to understand weather requests (e.g., "What's the weather in London?"). Extract location entity.
        - [ ] 1.2.1.4. Display formatted weather data in the UI and/or speak via TTS.
    - [ ] 1.2.2. News Headlines API Integration
        - [ ] 1.2.2.1. Select and sign up for a news API (e.g., NewsAPI.org).
        - [ ] 1.2.2.2. Implement Python function to fetch news headlines (optionally by category or keyword).
        - [ ] 1.2.2.3. Integrate with NLU for news requests (e.g., "Tell me the latest news").
        - [ ] 1.2.2.4. Display headlines in UI and/or speak summaries via TTS.
- [ ] 1.3. (Optional) Displaying structured information (e.g., LLM provides a recipe, format it for UI/TTS).

### 2. Personalized Assistance (Basic)
- [ ] 2.1. Daily Briefing (Simple Version)
    - [ ] 2.1.1. Create a function to gather data for the briefing:
        - [ ] 2.1.1.1. Current date and time.
        - [ ] 2.1.1.2. Weather information (reuse from 1.2.1).
        - [ ] 2.1.1.3. (Placeholder for Calendar events and Reminders - to be added later).
    - [ ] 2.1.2. Implement a command (voice or UI button) to trigger the daily briefing.
    - [ ] 2.1.3. Format the collected information into a coherent summary and deliver via TTS.
- [ ] 2.2. Task Management & Productivity (Basic To-Do List)
    - [ ] 2.2.1. Implement simple to-do list storage (e.g., JSON file, or SQLite database using `sqlite3`).
    - [ ] 2.2.2. Implement voice commands and NLU integration for:
        - [ ] 2.2.2.1. Adding a task (e.g., "Add 'buy milk' to my to-do list").
        - [ ] 2.2.2.2. Listing tasks (e.g., "What's on my to-do list?").
        - [ ] 2.2.2.3. (Optional) Removing or marking tasks as complete.
    - [ ] 2.2.3. (Optional) Display the to-do list in a dedicated section of the UI.
- [ ] 2.3. Timers and Alarms (Basic Timers)
    - [ ] 2.3.1. Implement voice command to set a simple timer (e.g., "Set a timer for 5 minutes").
    - [ ] 2.3.2. Implement timer logic using Python's `threading.Timer` or `asyncio.sleep` for non-blocking timers.
    - [ ] 2.3.3. Implement a notification (sound played via `playsound`/`pygame.mixer` and/or TTS announcement) when the timer ends.

## Phase 3: Expanding UI & Smart Home (Basic/Mocked)

### 1. Touchscreen UI Enhancements (Continue with Prototype Framework)
- [ ] 1.1. Dashboard View (Initial Widgets)
    - [ ] 1.1.1. Implement a clock widget (displaying current time, updating regularly).
    - [ ] 1.1.2. Implement a weather display widget (using data fetched in Phase 2).
    - [ ] 1.1.3. (Placeholder) Design space for Calendar summary widget.
    - [ ] 1.1.4. (Placeholder) Design space for Smart Home quick toggles.
    - [ ] 1.1.5. (Placeholder) Status indicators (e.g., Wi-Fi - can be mocked initially).
- [ ] 1.2. Dedicated Control Screens (Basic Structure & Placeholders)
    - [ ] 1.2.1. Smart Home Screen: Design basic layout (e.g., for rooms/devices). Initially, no live controls.
    - [ ] 1.2.2. Calendar & Tasks Screen: Design layout. Integrate to-do list display (from 2.2.3).
    - [ ] 1.2.3. Information Display Screen: Basic view for displaying results from API calls like news, or formatted LLM content (e.g., recipes).
- [ ] 1.3. Refine "Agent Mode" Screen
    - [ ] 1.3.1. Improve visual feedback during voice interaction (e.g., clearer status indicators, perhaps simple animations if the GUI framework allows easily).

### 2. Smart Home Control (Conceptual - Mocked Implementation First)
- [ ] 2.1. Research Home Assistant Integration (if chosen as primary control hub).
    - [ ] 2.1.1. Understand Home Assistant's REST API or WebSocket API.
    - [ ] 2.1.2. Review Python libraries for Home Assistant (e.g., `homeassistant-api`, or plan to use `requests`).
- [ ] 2.2. Define Mock Smart Home Devices and Functions.
    - [ ] 2.2.1. Create Python functions that simulate controlling devices (e.g., `def toggle_light(room_name, device_name, state): print(f"MOCK: Light {device_name} in {room_name} set to {state}")`).
    - [ ] 2.2.2. Include examples for different device types (lights, thermostats, plugs).
- [ ] 2.3. Integrate Mock Smart Home Controls with NLU/LLM.
    - [ ] 2.3.1. Design intents for smart home commands (e.g., "Turn on the living room lamp", "Set thermostat to 20 degrees").
    - [ ] 2.3.2. Configure LLM (or local NLU logic) to recognize these intents and extract entities (device, room, state, temperature).
    - [ ] 2.3.3. Connect NLU output to call the corresponding mock smart home functions.
- [ ] 2.4. (Optional) Add basic UI toggles on the Smart Home Screen (from 1.2.1) that call these mock functions.

## Phase 4: Advanced AI Agent Features & Refinements

### 1. Robust Intent Recognition (LLM Function Calling/Tool Use)
- [ ] 1.1. Refactor existing NLU integrations (weather, news, to-do, timers, mock smart home) to use LLM Function Calling (OpenAI) or Tool Use (Gemini).
    - [ ] 1.1.1. Define Python functions (your "tools") that perform the actions (e.g., `get_weather(location)`, `add_todo_item(task_description)`).
    - [ ] 1.1.2. Create schemas/definitions for these tools that the LLM can understand.
    - [ ] 1.1.3. Update LLM interaction logic: send tool definitions with the prompt, parse LLM response for tool call requests, execute the function, and optionally send results back to LLM for a natural language response.

### 2. Conversational Features
- [ ] 2.1. Implement Conversational Follow-up (Context Maintenance).
    - [ ] 2.1.1. Store a short-term history of the conversation (e.g., last few user queries and AI responses).
    - [ ] 2.1.2. Include this history (or a summarized version) in subsequent prompts to the LLM to provide context.
    - [ ] 2.1.3. Implement strategies for managing conversation history length to stay within LLM token limits.
- [ ] 2.2. Implement Contextual Commands (Basic).
    - [ ] 2.2.1. Implement basic application state tracking (e.g., which UI screen is currently active or what was the last major topic).
    - [ ] 2.2.2. Pass this contextual information to the LLM as part of the prompt, or use it in local logic to help disambiguate commands (e.g., if on "Media Control" screen, "play" refers to media).

### 3. Contextual Awareness & Memory (Basic RAG Concepts)
- [ ] 3.1. Store User Preferences (Simple & Explicit).
    - [ ] 3.1.1. Create a mechanism (e.g., in the settings UI and config file) to save key user preferences (e.g., preferred news categories, default weather location, preferred units °C/°F).
    - [ ] 3.1.2. Modify relevant functions (e.g., weather, news) to use these stored preferences if available.
    - [ ] 3.1.3. (Optional) Allow LLM to update these preferences via function calling (e.g., "Remember my preferred city is New York").
- [ ] 3.2. (Future RAG Research) Investigate storing summaries of important interactions or key facts learned about the user for longer-term memory. Explore simple file-based storage before considering vector databases for RPi.

## Phase 5: System & Deployment on Raspberry Pi

### 1. Raspberry Pi Specific Setup & Transition
- [ ] 1.1. Transition UI development and testing to the actual Raspberry Pi with the target touchscreen.
    - [ ] 1.1.1. Install the chosen GUI framework and all other Python dependencies on the Raspberry Pi.
    - [ ] 1.1.2. Test UI performance on the RPi. Optimize drawing, resource usage if needed.
    - [ ] 1.1.3. Adapt UI layout for the specific touchscreen dimensions and input methods (touch vs. mouse).
    - [ ] 1.1.4. Configure and test microphone input and audio output on the RPi, ensuring they work reliably with `PyAudio`/`sounddevice` and selected TTS playback method.
- [ ] 1.2. (If pursuing local options) Implement and Test Local STT/TTS as fallbacks.
    - [ ] 1.2.1. Integrate a chosen local STT engine (e.g., Vosk, or Whisper via `whisper.cpp` bindings). Test performance and accuracy on RPi.
    - [ ] 1.2.2. Integrate a chosen local TTS engine (e.g., Piper). Test voice quality and generation speed on RPi.
    - [ ] 1.2.3. Add a setting to switch between cloud and local STT/TTS.
- [ ] 1.3. Wake Word Detection (If decided as a core feature for hands-free prototype)
    - [ ] 1.3.1. Choose a wake word detection library (e.g., Picovoice Porcupine, OpenWakeWord).
    - [ ] 1.3.2. Integrate the library. This typically runs in a separate, low-resource thread or process.
    - [ ] 1.3.3. Implement logic to trigger the main voice interaction loop upon wake word detection.
    - [ ] 1.3.4. Test thoroughly for false positives/negatives and resource usage.

### 2. System Features
- [ ] 2.1. Autostart Capability.
    - [ ] 2.1.1. Configure the Yohan application to launch automatically on Raspberry Pi boot-up. Choose method:
        - [ ] 2.1.1.1. LXDE autostart (if running a desktop environment): Create a `.desktop` file in `~/.config/autostart/`.
        - [ ] 2.1.1.2. systemd service (more robust, for headless or dedicated operation): Create a service file in `/etc/systemd/system/`.
- [ ] 2.2. Modularity Review and Refinement.
    - [ ] 2.2.1. Ensure the codebase is well-organized into logical Python modules (e.g., `voice_processing.py`, `ui_manager.py`, `smart_home_interface.py`, `llm_agent.py`, `config_manager.py`).
    - [ ] 2.2.2. Use classes effectively to encapsulate related data and functionality.
    - [ ] 2.2.3. Ensure clear separation of concerns between modules.
- [ ] 2.3. Error Handling and System Resilience.
    - [ ] 2.3.1. Implement robust error handling for API failures (with retries where appropriate), network connectivity issues, hardware problems (e.g., microphone not found).
    - [ ] 2.3.2. Ensure graceful degradation of functionality if certain services are unavailable (e.g., if no network, cloud STT/TTS won't work, fall back to local if available, or inform user).

## Phase 6: Expanding Features (Based on Feature Sheet)

### 1. Full Smart Home Integration (Beyond Mocked)
- [ ] 1.1. Setup Home Assistant instance if it's the chosen platform and user has one.
- [ ] 1.2. Implement connection from Yohan application to the live Home Assistant API (or other chosen smart home platform APIs like Philips Hue, Shelly directly if HA is not used).
- [ ] 1.3. Replace mock smart home functions with actual API calls to control devices (lights, thermostats, plugs, etc.).
- [ ] 1.4. Implement Scene Control: Allow defining and activating scenes (either via Home Assistant scenes or custom Yohan scenes that trigger multiple device actions).
- [ ] 1.5. Update the Smart Home UI screen with real device status and controls.

### 2. Enhanced Personalized Assistance
- [ ] 2.1. Full Daily Briefing.
    - [ ] 2.1.1. Integrate with a calendar API (e.g., Google Calendar API, Microsoft Outlook Calendar API via Microsoft Graph) to fetch today's events.
    - [ ] 2.1.2. Allow users to specify preferred news sources or categories, and use these in news fetching.
- [ ] 2.2. Contextual Reminders (Time-based first).
    - [ ] 2.2.1. Implement persistent storage for reminders (e.g., SQLite database).
    - [ ] 2.2.2. Implement a background process (e.g., using `apscheduler` or a simple timed check) to monitor for due reminders and trigger notifications (TTS/UI).
    - [ ] 2.2.3. (Future) Explore context-based reminders ("Remind me when I open X screen").
- [ ] 2.3. Dictate Notes or Short Emails (Basic Integration).
    - [ ] 2.3.1. For notes: After STT, provide a command to save the transcribed text as a note (e.g., stored in a text file or simple database).
    - [ ] 2.3.2. For emails (basic): Explore `smtplib` for sending (requires email server configuration and credentials) or look into simple email sending APIs. This is a complex feature; keep initial scope small.

### 3. UI Polish and Full Dashboard Implementation
- [ ] 3.1. Implement all planned Dashboard View widgets from `featuresheet.md` (clock, weather, calendar summary, quick smart home toggles, status indicators).
- [ ] 3.2. Fully develop the Dedicated Control Screens:
    - [ ] 3.2.1. Smart Home: Visual layout for room/device control (taps, sliders, toggles) linked to live controls.
    - [ ] 3.2.2. Media Control: (If media playback is a feature) Browse/play media, display album art, playback controls.
    - [ ] 3.2.3. Calendar & Tasks: View agenda from integrated calendar, manage to-do lists.
    - [ ] 3.2.4. Information Display: Improved browser-like view for search results, articles, recipes.
- [ ] 3.3. Address Responsive Design: Ensure UI adapts reasonably to the chosen touchscreen size.

### 4. Advanced AI Features (Exploration & Incremental Implementation)
- [ ] 4.1. Deeper RAG Implementation for Contextual Awareness & Memory.
    - [ ] 4.1.1. Explore storing key facts from conversations or user profile data in a structured way (e.g., simple vector store like FAISS on CPU if feasible on RPi, or enhanced keyword search on text logs).
    - [ ] 4.1.2. Retrieve relevant context to augment LLM prompts for more personalized and informed responses.
- [ ] 4.2. Proactive Assistance (Begin with simple, clearly beneficial use cases).
    - [ ] 4.2.1. Example: If a calendar event has a location, offer to check traffic 30 mins before (requires calendar integration and a traffic API).
    - [ ] 4.2.2. Design carefully to avoid being intrusive.
- [ ] 4.3. (Research) Multi-Agent System Frameworks (LangChain, AutoGen, CrewAI).
    - [ ] 4.3.1. Evaluate if these frameworks can help modularize complex tasks or orchestrate different specialized capabilities (e.g., a dedicated scheduling agent, a smart home agent).
    - [ ] 4.3.2. This is an advanced topic, start with well-defined Python modules and classes first.

## Future Enhancements (Post-MVP / Long-term Goals from Feature Sheet)

- [ ] Communication Features (Initiate calls, send messages - requires significant integration with VoIP services like Twilio or phone APIs).
- [ ] Intercom functionality (if multiple Yohan devices are planned).
- [ ] Matter support for Smart Home (as SDKs and Python support mature).
- [ ] Hyper-Personalization (long-term R&D: adapting interaction style, deeper understanding of user nuances).
- [ ] Continuous improvement of local STT/TTS quality and performance.
- [ ] Advanced learning of user preferences and routines.

This list should be treated as a living document. Tasks can be re-prioritized, broken down further, or adjusted as the project progresses and new insights are gained. Remember to commit changes to Git regularly after completing significant tasks or subtasks.
