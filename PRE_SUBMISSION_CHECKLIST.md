# Pre-Submission System Validation Checklist

Use this checklist to perform a final end-to-end verification of the **Crop Health & Anomaly Agent (MCHAA)** before hackathon submission or live presentation.

---

## 1. Environment & Configuration Check

- [ ] **Backend `.env` File Prepared**
  - Path: `backend/.env` (copied from `backend/.env.example`)
  - `GEMINI_API_KEY` is populated with a valid Google Gemini API key.
  - (Optional) `AGROMONITORING_API_KEY` is set for live satellite soil/NDVI data.
- [ ] **Dependencies Installed**
  - Backend: `pip install -r requirements.txt` executed cleanly.
  - Frontend: `npm install` executed cleanly with 0 missing modules.
- [ ] **Clean Repository State**
  - No temporary secrets or private API keys committed to Git.
  - `.gitignore` properly excludes `backend/.env`, `venv/`, `.next/`, and `node_modules/`.

---

## 2. Server Startup & API Health Validation

- [ ] **Backend API Server Online**
  - Run command: `cd backend && uvicorn main:app --reload --port 8000`
  - Verify `http://localhost:8000/health` returns `{"status": "healthy"}`.
  - Verify Swagger API Docs load at `http://localhost:8000/docs`.
- [ ] **Database Initialization & Seeding**
  - SQLite database `crop_health.db` auto-creates on startup.
  - Initial seed data creates `farm-001` ("Sindh Agricultural Farm"), `field-001` ("Field B"), and `field-002` ("Field C").
- [ ] **Frontend Dev Server Online**
  - Run command: `cd frontend && npm run dev`
  - Web dashboard accessible at `http://localhost:3000`.
  - Browser console shows 0 CORS errors connecting to port 8000.

---

## 3. Core Feature Validation

### Feature A: Gemini Vision Crop Photo Upload & Diagnosis
- [ ] **Photo Upload**: On homepage or field detail page, upload a crop leaf/field image (or select a sample image).
- [ ] **AI Classification**: Verify backend POST `/api/analyze` triggers Gemini Vision (`gemini-3.6-flash`).
- [ ] **Diagnosis Output**: UI renders problem headline, severity badge (Red/Yellow), probable cause, and recommended action.
- [ ] **DB Persistence**: Verify new `Anomaly`, `Diagnosis`, and `Recommendation` rows are created.

### Feature B: Interactive Draw-a-Field Polygon & Satellite Telemetry
- [ ] **Map Interaction**: On the Leaflet map, click the draw polygon tool and draw a custom field boundary.
- [ ] **Field Creation**: Submitting the polygon calls `POST /api/fields`, calculating centroid coordinates and area (ha).
- [ ] **Live Area Analysis**: Clicking "Analyze Drawn Area" calls `POST /api/fields/{id}/analyze-area`.
- [ ] **Satellite Data Integration**: Verifies soil moisture, surface temp, and rainfall data fetch (or mock fallback if API key omitted).

### Feature C: 45-Day Telemetry Dashboard
- [ ] **Recharts Graphs**: Field detail page (`/field/[fieldId]`) renders interactive timeseries charts for:
  - Soil Moisture (%)
  - Temperature (°C)
  - 7-Day Rainfall (mm)
  - NDVI Vegetation Index
- [ ] **Crop Threshold Alignment**: Verify optimal range indicators match selected crop type (e.g. Wheat vs Rice).

### Feature D: Bilingual Support & Urdu RTL Layout
- [ ] **Language Toggle**: Clicking the EN / UR switch in top navbar toggles all page text smoothly.
- [ ] **RTL Rendering**: Urdu mode applies `dir="rtl"` layout, right-aligning text and navigation elements.
- [ ] **Translation Completeness**: Main headlines, status tags, button labels, and crop names render in Urdu.

### Feature E: Voice Alerts & Low-Bandwidth SMS Preview
- [ ] **Web Speech API Audio**: Clicking "Play Voice Diagnosis" speaks the diagnosis aloud via browser TTS in selected language.
- [ ] **Audio Script Endpoint**: GET `/api/anomalies/{id}/voice` returns formatted spoken script.
- [ ] **SMS Payload Preview**: GET `/api/anomalies/{id}/sms` returns compressed cellular message (<160 characters).

### Feature F: Crop Encyclopedia & Rotation Advice
- [ ] **Encyclopedia Page**: Navigating to `/crops` displays starter crops (Wheat, Rice, Cotton, Sugarcane).
- [ ] **Crop Selection Update**: Changing active field crop (`PUT /api/fields/{id}/crop`) updates field parameters.
- [ ] **Smart Rotation Suggestion**: Rotation advice endpoint (`GET /api/fields/{id}/rotation-advice`) displays non-forcing, nitrogen-restoring crop suggestions.

---

## 4. Final Submission Documentation Readiness

- [ ] **Architecture Flow Diagram**: Mermaid flowchart present in [PROJECT_SUBMISSION_DOCS.md](file:///c:/Users/user/OneDrive/Desktop/MCHAA---Hackathon/PROJECT_SUBMISSION_DOCS.md).
- [ ] **Sequence Diagrams**: 3 sequence diagrams present for Image Analysis, Satellite Telemetry, and Voice/SMS workflows.
- [ ] **Database Schemas**: ER Diagram + SQL DDL statements included in submission docs.
- [ ] **README.md**: Updated with setup instructions, tech stack breakdown, and feature list.

---

### Verification Sign-Off

| Verification Area | Verified By | Status |
| :--- | :--- | :--- |
| **Backend Code & APIs** | Automated (`py_compile` & FastAPI test) | `READY` |
| **Frontend Code & Build** | Automated (`npm run build` Turbopack) | `READY` |
| **Database Schema & ORM** | Automated (SQLAlchemy SQLite test) | `READY` |
| **End-to-End User Flow** | Manual User Test | `[ ] PENDING SIGN-OFF` |
