# Project Feature Sheet: Yohan AI System

## Project Vision
A highly capable, personalized AI assistant built on a Raspberry Pi 5, featuring intuitive voice and touch interactions, powered by Large Language Model (LLM) APIs and advanced AI agent principles.

## I. User Interface & Interaction

### A. Voice Interaction (Core)

#### Wake Word Detection
- **(Future Enhancement for hands-free)** Dedicated local processing for initiating interaction (e.g., "Hey Yohan")
- **Prototype:** Button press in UI to initiate listening

#### Speech-to-Text (STT)
- **Cloud-based API integration** for high accuracy transcription (e.g., Google Cloud STT, Azure Speech)
- **Local STT options** as a fallback or for privacy-sensitive commands (e.g., Vosk, Whisper smaller models if feasible)

#### Natural Language Understanding (NLU)
- Primarily handled by the integrated LLM API for interpreting complex user intent and queries

#### Text-to-Speech (TTS)
- **Cloud-based API integration** for natural-sounding voice responses (e.g., Google Cloud TTS, AWS Polly)
- **Local TTS options** (e.g., Piper, Coqui TTS for offline capability, espeak-ng for basic prototyping)

#### Conversational Features
- **Conversational Follow-up:** Ability to understand context from previous turns in the conversation (LLM-driven)
- **Contextual Commands:** Interpret commands based on the current UI screen or ongoing task

### B. Touchscreen User Interface (7-10 inch display planned)

#### Prototype
- Initial testing via standard monitor and mouse/keyboard using a simple GUI framework (e.g., PySimpleGUI, Tkinter)

#### Dashboard View
- **Customizable widgets** (clock, weather, calendar summary, quick smart home toggles)
- **Status indicators** (Wi-Fi, system status, notifications)

#### Dedicated Control Screens
- **Smart Home:** Visual layout for room/device control (taps, sliders, toggles)
- **Media Control:** Browse/play media, display album art, playback controls
- **Calendar & Tasks:** View agenda, manage to-do lists
- **Information Display:** Browser-like view for search results, articles, recipes

#### "Agent Mode" Screen
- Visual feedback during voice interaction (transcription, "thinking" animation, query-relevant info)

#### Settings & Configuration
- Manage device integrations, API keys, user preferences, UI themes

#### Responsive Design
- Adaptable to the specific screen size chosen

## II. Core AI Assistant Capabilities

### A. Information Retrieval & Q&A
- Leverage LLM to answer general knowledge questions
- Fetch and display real-time information (news headlines, stock prices, sports scores, flight status via API integrations)
- Display how-to guides, recipes, and other structured information

### B. Personalized Assistance
- **Daily Briefing:** Customizable morning summary (calendar, weather, news, reminders)
- **Contextual Reminders:** Set and trigger reminders based on time, location (future integration), or context
- **Learning Preferences (Advanced):** Over time, adapt to user routines, preferred news, music, common requests

### C. Task Management & Productivity
- Manage to-do lists (creation, completion, display)
- Set timers and alarms with voice or touch
- Dictate notes or short emails (with integration)

### D. Communication (Potential Future Enhancement)
- Initiate calls or send messages (via phone integration or VoIP services)
- Intercom functionality (if multiple devices are part of a larger system)

## III. Smart Home Control

### A. Device Integration
- Control smart lights, thermostats, locks, cameras, plugs, and other compatible appliances
- Integration via platforms like Home Assistant (recommended for broad compatibility) or direct device APIs
- Support for standards like Matter (future consideration)

### B. Scene Control
- Define and activate custom scenes (e.g., "Movie Time," "Good Morning," "Away Mode") through voice or touch

## IV. Advanced AI Agent Features (Leveraging LLMs)

### A. Robust Intent Recognition (via LLM Function Calling/Tool Use)
- Define specific "tools" (Python functions) that the LLM can request to execute (e.g., `set_thermostat(temp, room)`, `get_calendar_events()`)
- Move beyond simple string matching for more reliable action execution

### B. Contextual Awareness & Memory (Retrieval Augmented Generation - RAG concepts)
- Store key details from past interactions and user preferences
- Retrieve relevant context to provide more informed and personalized LLM responses

### C. Proactive Assistance (Future Goal)
- Anticipate user needs based on learned patterns, calendar, and external data (e.g., traffic alerts before a meeting)
- Offer timely suggestions or automate routine tasks

### D. Multi-Agent System Potential (Advanced Future Goal)
- Modular design where different "agents" specialize in tasks (e.g., scheduling, smart home, news) and are orchestrated by a primary LLM
- Frameworks like LangChain, AutoGen, or CrewAI could be explored

### E. Hyper-Personalization (Long-term Goal)
- System adapts its responses, suggestions, and interaction style based on a deep understanding of the user

## V. System & Technical Features

### A. Platform
- Raspberry Pi 5

### B. Core Logic
- Python-based application

### C. AI Processing
- **Primary LLM intelligence** via API calls (user-specified provider, e.g., OpenAI, Google Gemini)
- **Local processing for:**
  - Initial STT/TTS (for prototyping or basic use)
  - Wake word detection (when implemented)
  - UI rendering and management
  - Execution of local commands and smart home integrations

### D. Autostart Capability
- Application launches automatically on Raspberry Pi boot-up, running as a dedicated system (e.g., using LXDE autostart or systemd service)

### E. Modularity
- Designed for easier addition of new features and integrations

### F. API Key Management
- Secure handling of API keys (e.g., environment variables, configuration files)

## VI. Integrations (Examples & Potential)

- **Smart Home:** Home Assistant, direct device APIs (Philips Hue, Shelly, etc.)
- **Productivity:** Google Calendar/Outlook, Todoist, etc. (via APIs)
- **Information:** News APIs, Weather APIs (OpenWeatherMap), Wikipedia
- **Media:** Spotify, other music services (via APIs, if available)
- **Communication:** (Future) Twilio, VoIP services