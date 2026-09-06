# Crop Health & Anomaly Agent (MCHAA)

AI-powered crop health monitoring platform. Upload field images or draw polygons on the map to get instant Gemini-powered diagnosis, severity scoring, and actionable recommendations — with full English/Urdu language support.

---

## Features

- **Gemini Vision Image Analysis** — upload a photo of your crop and get AI-classified anomaly detection (pest, disease, water stress, etc.) with cause, reasoning, and recommended action
- **Draw-a-Field** — draw a polygon on the map to define a custom field, auto-registered on Agromonitoring for live soil moisture, NDVI, and weather data
- **Satellite Data** — real soil moisture, NDVI, and weather data from Open-Meteo and Agromonitoring APIs
- **AI Diagnosis** — Gemini LLM generates farmer-friendly diagnosis, cause, reasoning, and recommended action tailored to the specific crop type (wheat, rice, cotton, sugarcane)
- **Voice Alerts** — browser speech synthesis reads the diagnosis aloud (English + Urdu)
- **English/Urdu Toggle** — full bilingual support with RTL layout
- **Crop Rotation Advice** — smart non-forcing rotation suggestions based on crop history

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS, Leaflet + leaflet-draw, Recharts |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, SQLite |
| AI | Google Gemini (gemini-3.6-flash) for image analysis + LLM diagnosis |
| Data | Agromonitoring API (soil/NDVI), Open-Meteo API (weather archive) |
| Voice | Web Speech API (browser-native speech synthesis) |

---

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Create .env from template and add your keys
cp .env.example .env

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for image analysis + diagnosis |
| `AGROMONITORING_API_KEY` | No | Agromonitoring API key for live soil/NDVI data (free tier available) |
| `CLAUDE_API_KEY` | No | Anthropic Claude API key (optional; falls back to Gemini) |

---

## Project Structure

```
backend/
├── main.py                 # FastAPI app, CORS, DB init
├── database.py             # SQLAlchemy setup (SQLite)
├── models.py               # ORM models (Field, Anomaly, Diagnosis, etc.)
├── schemas.py              # Pydantic request/response schemas
├── api/
│   └── endpoints.py        # All API routes
└── services/
    ├── image_analysis.py   # Gemini Vision + LLM diagnosis
    ├── agent_service.py    # AI diagnosis orchestration
    ├── live_data.py        # Agromonitoring + Open-Meteo integration
    ├── mock_data.py        # Mock data for offline dev
    └── voice_service.py    # Voice script generation

frontend/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── page.jsx        # Homepage (farm overview + map)
│   │   ├── field/[fieldId]/page.jsx   # Field detail + drawn-area overlay
│   │   ├── anomaly/[anomalyId]/page.jsx  # Anomaly detail (satellite + image)
│   │   └── crops/page.jsx # Crop encyclopedia
│   ├── components/         # React components
│   ├── api/api.js          # Axios client + mock guards
│   ├── context/            # LanguageContext (EN/UR)
│   ├── i18n/               # en.js, ur.js translation files
│   └── mock/mockData.js    # Mock data for offline dev
└── package.json
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/farms/{farm_id}` | Farm with field list |
| `GET` | `/api/fields/{field_id}` | Field with anomalies |
| `GET` | `/api/fields/{field_id}/telemetry` | 45-day NDVI/soil/temp/rain history |
| `POST` | `/api/fields` | Create field from drawn polygon |
| `POST` | `/api/fields/{field_id}/analyze-area` | Analyze drawn area (live data) |
| `POST` | `/api/analyze` | Upload image + Gemini analysis |
| `GET` | `/api/anomalies/{anomaly_id}` | Full anomaly with diagnosis + recommendation |
| `GET` | `/api/crops` | Crop catalog |

---

## How It Works

```
1. User uploads a crop image or draws a polygon on the map
   ↓
2. Backend: Gemini Vision classifies the image / fetches live satellite data
   ↓
3. Backend: Creates Anomaly record in DB
   ↓
4. Backend: Gemini LLM generates diagnosis (cause, reasoning, action)
   ↓
5. Backend: Stores Diagnosis + Recommendation in DB
   ↓
6. Frontend: Displays problem + solution with voice alert
```

---

## License

Hackathon project — educational use only.
