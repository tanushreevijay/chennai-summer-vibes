# Chennai Summer Vibes 🌴

A cute pastel PWA that suggests fun, creative things to do in Chennai during summer. Wake up to a new suggestion every day — from hidden gem explorations to local food adventures!

## Features

- **Daily Suggestion**: Get a fresh, AI-generated activity suggestion each morning
- **Surprise Me**: Tap for a new random suggestion anytime
- **Category Filter**: Pick from 15+ categories (exploring, cooking, beach, photography, etc.)
- **Installable PWA**: Add to your Android home screen as a widget-like app
- **Pastel UI**: Cute, minimal design with soft colors
- **Chennai-Specific**: All suggestions are tailored to Chennai's summer scene

## Tech Stack

- **Backend**: Python / FastAPI
- **AI**: Google Gemini (1.5 Flash) for creative suggestions
- **Frontend**: React (Vite) PWA
- **Styling**: Custom CSS with pastel design system

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file with your Gemini API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

uvicorn main:app --reload --port 8000
```

Get a free Gemini API key at: https://aistudio.google.com/apikey

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For production build:
```bash
npm run build
```

### Install on Android

1. Open the deployed frontend URL in Chrome on your Android phone
2. Tap the "Add to Home Screen" prompt (or use Chrome menu → "Install app")
3. The app will appear on your home screen like a native app!

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /suggestion/today` | Get today's daily suggestion (cached per day) |
| `GET /suggestion/new` | Get a fresh random suggestion |
| `GET /suggestion/new?category=cooking` | Get a suggestion for a specific category |
| `GET /categories` | List all available categories |
| `GET /health` | Health check |

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `VITE_API_URL` | Backend API URL (frontend, defaults to `http://localhost:8000`) |
