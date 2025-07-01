# Yohan Interface - Smart Calendar Dashboard

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

A modern, AI-powered smart calendar dashboard application designed for Raspberry Pi deployment. This full-stack application provides an intuitive interface for managing calendars, viewing weather information, and interacting with an AI assistant.

## 🚀 Tech Stack

### Backend
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=flat-square&logo=pydantic&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn-499848?style=flat-square&logo=gunicorn&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-000000?style=flat-square&logo=react&logoColor=white)

### APIs & Services
![OpenWeatherMap](https://img.shields.io/badge/OpenWeatherMap-E5602C?style=flat-square&logo=openweathermap&logoColor=white)
![Anthropic](https://img.shields.io/badge/Anthropic_Claude-5A67D8?style=flat-square&logo=anthropic&logoColor=white)

## ✨ Features

- **📅 Smart Calendar Integration**: Sync and display events from iCalendar (.ics) feeds
- **🌤️ Real-time Weather**: Current conditions and 5-day forecast from OpenWeatherMap
- **🤖 AI Chat Assistant**: Integrated Claude AI for intelligent conversations
- **🎨 Modern UI**: Clean, responsive design with multiple view modes
- **🔄 Real-time Updates**: WebSocket support for live data synchronization
- **📱 Multi-view Interface**: Dashboard overview and dedicated views for each feature

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn package manager
- Active API keys for:
  - OpenWeatherMap API
  - Anthropic Claude API
- Access to an iCalendar feed URL

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Yohan-Interface.git
cd Yohan-Interface
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd yohan-backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API keys
cat > .env << EOF
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here
CALENDAR_URL=your_ical_feed_url_here
WEATHER_LAT=your_latitude
WEATHER_LON=your_longitude
EOF
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd yohan-frontend

# Install dependencies
npm install

# Create .env file for frontend (optional)
cat > .env << EOF
VITE_API_URL=http://localhost:8000
EOF
```

## 🚀 Running the Application

### Start the Backend Server

```bash
# From yohan-backend directory with activated virtual environment
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`
API documentation is available at `http://localhost:8000/docs`

### Start the Frontend Development Server

```bash
# From yohan-frontend directory
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
Yohan-Interface/
├── yohan-backend/              # Python backend application
│   ├── app/
│   │   ├── routers/           # API endpoint definitions
│   │   │   ├── weather.py     # Weather-related endpoints
│   │   │   ├── calendar.py    # Calendar endpoints
│   │   │   ├── chat.py        # AI chat endpoints
│   │   │   └── comms.py       # WebSocket endpoints
│   │   ├── services/          # Business logic
│   │   │   ├── weather_service.py
│   │   │   ├── calendar_service.py
│   │   │   └── llm_service.py
│   │   ├── schemas/           # Pydantic models
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── settings.py       # Configuration management
│   │   └── websocket_manager.py
│   ├── scripts/              # Test and utility scripts
│   └── requirements.txt      # Python dependencies
│
└── yohan-frontend/           # React frontend application
    ├── src/
    │   ├── components/       # Reusable UI components
    │   │   ├── ui/          # shadcn/ui components
    │   │   └── widgets/     # Dashboard widgets
    │   ├── hooks/           # Custom React hooks
    │   ├── lib/             # Utilities and API client
    │   ├── store/           # Zustand state management
    │   ├── types/           # TypeScript type definitions
    │   ├── views/           # Main application screens
    │   │   ├── Dashboard.tsx
    │   │   ├── WeatherView.tsx
    │   │   ├── CalendarView.tsx
    │   │   └── ChatView.tsx
    │   ├── App.tsx          # Main app component
    │   └── main.tsx         # React entry point
    ├── public/              # Static assets
    └── package.json         # Node dependencies
```

## 🔌 API Endpoints

### Weather Endpoints
- `GET /api/weather/current` - Get current weather conditions
- `GET /api/weather/forecast` - Get 5-day weather forecast

### Calendar Endpoints
- `GET /api/calendar/events` - Get calendar events
- `GET /api/calendar/sync` - Sync calendar from iCal feed

### Chat Endpoints
- `POST /api/chat/message` - Send message to AI assistant
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/history` - Clear chat history

### WebSocket Endpoints
- `WS /api/comms/ws/{client_id}` - WebSocket connection for real-time updates

## ⚙️ Configuration

### Backend Configuration (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | API key for Claude AI | Yes |
| `OPENWEATHERMAP_API_KEY` | API key for weather data | Yes |
| `CALENDAR_URL` | URL to iCalendar feed | Yes |
| `WEATHER_LAT` | Latitude for weather location | Yes |
| `WEATHER_LON` | Longitude for weather location | Yes |
| `CORS_ORIGINS` | Allowed CORS origins | No (defaults to localhost:5173) |

### Frontend Configuration

The frontend is configured to connect to the backend at `http://localhost:8000` by default. This can be modified in `yohan-frontend/src/lib/api.ts`.

## 🧪 Development

### Running Tests

Backend tests:
```bash
cd yohan-backend
python scripts/test_anthropic.py
python scripts/test_llm_service.py
python scripts/test_websocket_llm.py
```

Frontend linting:
```bash
cd yohan-frontend
npm run lint
```

### Building for Production

Frontend build:
```bash
cd yohan-frontend
npm run build
```

The production build will be output to `yohan-frontend/dist/`.

### 🚀 Deployment Considerations

1. **Environment Variables**: Ensure all required environment variables are set in production
2. **CORS**: Update CORS settings in backend for production domain
3. **HTTPS**: Configure HTTPS for secure communication
4. **Process Management**: Use systemd or supervisor for backend process management
5. **Reverse Proxy**: Configure nginx or similar for serving frontend and proxying API requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure all API keys are correctly set in the `.env` file
2. **CORS Issues**: Check that the frontend URL is included in the backend CORS configuration
3. **Calendar Sync Failures**: Verify the iCal URL is accessible and returns valid data
4. **WebSocket Connection Issues**: Ensure the backend is running and accessible from the frontend

### Debug Mode

Enable debug logging:
```bash
# Backend
export LOG_LEVEL=DEBUG
uvicorn app.main:app --reload --log-level debug

# Frontend
npm run dev -- --debug
```

## 🔮 Future Enhancements

- [ ] Voice command integration
- [ ] Mobile responsive design improvements
- [ ] Additional weather providers
- [ ] Calendar event creation/editing
- [ ] Multi-user support
- [ ] Docker containerization
- [ ] Automated testing suite

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenWeatherMap for weather data
- Anthropic for Claude AI capabilities
- shadcn/ui for beautiful UI components
- The FastAPI and React communities

---

Built with ❤️ for smart home enthusiasts