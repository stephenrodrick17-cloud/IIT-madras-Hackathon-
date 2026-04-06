# SafeGuard — Smart Emergency Response System

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                │
│  Port 3000   Map | SOS Button | Services | Insights       │
└──────────────┬───────────────────────────────────────────┘
               │ HTTP + WebSocket
┌──────────────▼───────────────────────────────────────────┐
│               BACKEND (Node.js + Express)                 │
│  Port 5000   REST API + Socket.IO real-time events        │
│  /api/emergency  →  Google Places / mock services         │
│  /api/sos        →  Twilio SMS + Socket broadcast         │
│  /api/insights   →  Proxy → Python / fallback data        │
└──────────────┬───────────────────────────────────────────┘
               │ HTTP
┌──────────────▼───────────────────────────────────────────┐
│               ANALYSIS (Python + FastAPI)                 │
│  Port 8000   12,000-record accident dataset               │
│  /insights   /risk   /heatmap   /charts/*                 │
└──────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install & run backend
```bash
cd backend
npm install
npm run dev
```

### 2. Install & run Python analysis (optional but recommended)
```bash
cd analysis
pip install -r requirements.txt
python main.py
```

### 3. Install & run frontend
```bash
cd frontend
npm install
npm run dev
```

App opens at → **http://localhost:3000**

---

## API Keys (optional — app works without them)

| Service | Purpose | Where to get |
|---------|---------|--------------|
| Google Maps | Real nearby services | console.cloud.google.com |
| Twilio | SMS alerts | twilio.com |

Set keys in `backend/.env` and `frontend/.env`

---

## Emergency Numbers (India)
- **112** — National Emergency
- **108** — Ambulance
- **100** — Police
- **101** — Fire

## Features
- 🗺 Real-time map with Leaflet dark theme
- 📍 Live GPS tracking with address geocoding
- 🚨 One-tap SOS → SMS via Twilio + Socket.IO broadcast
- ⚡ AI insights from 12,000 accident records
- 🔥 Risk gauge, weekly patterns, condition analysis
- 📞 One-tap emergency calls (112, 108, 100)
- 🔄 Auto-refresh every 5 minutes
