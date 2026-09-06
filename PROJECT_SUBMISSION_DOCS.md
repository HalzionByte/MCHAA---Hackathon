# Crop Health & Anomaly Agent (MCHAA) - Project Submission Package

## 1. Executive Summary & Verification Report

The **Crop Health & Anomaly Agent (MCHAA)** is an AI-powered agricultural monitoring platform designed for smallholder farmers and agricultural managers. It integrates **Google Gemini Vision** for crop photo diagnostics, **Agromonitoring & Open-Meteo APIs** for live satellite telemetry (NDVI, soil moisture, rainfall, temperature), and **browser-native Web Speech API** for bilingual (English & Urdu) voice guidance.

### System Verification & Validation Log

| Component | Test / Validation Performed | Result | Status |
| :--- | :--- | :--- | :--- |
| **Backend Core** | `python -m py_compile` on all backend scripts (`main.py`, `models.py`, `schemas.py`, `endpoints.py`, `services/*`) | 0 compilation errors across 10 modules | `PASSED` |
| **Database ORM** | SQLAlchemy engine & SQLite schema creation test | All 7 tables (`farms`, `fields`, `images`, `anomalies`, `diagnoses`, `evidence`, `recommendations`) created & seeded | `PASSED` |
| **FastAPI App** | Router initialization and route mapping verification | All 12 endpoints mapped with CORS enabled | `PASSED` |
| **AI Integration** | Gemini Vision (gemini-3.6-flash) prompt formatting & fallback logic | Schema valid, multimodal base64 payload handling active | `PASSED` |
| **Frontend App** | Next.js 16 Next build (`npm run build`) & TypeScript check | Compiled successfully in 19.9s, TypeScript 0 errors across all routes (`/`, `/field/[id]`, `/anomaly/[id]`, `/crops`) | `PASSED` |

---

## 2. System Architecture & High-Level Flow Diagram

The following system flow diagram illustrates the end-to-end architecture, user interactions, backend orchestration, external API integrations, and database storage.

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Layer (Browser / Mobile)"]
        UI["Next.js 16 Web App (React 19 + Tailwind)"]
        MapComp["Leaflet + Leaflet-Draw (Field Polygon Editor)"]
        ChartComp["Recharts Dashboard (45-Day Telemetry)"]
        VoiceEngine["Web Speech API (EN / UR Audio Synthesis)"]
        LangContext["Bilingual Context (English & Urdu RTL)"]
    end

    subgraph APIGateway ["Backend Service (FastAPI / Uvicorn)"]
        API["FastAPI REST API Router"]
        
        subgraph Services ["Service Orchestrators"]
            VisionSvc["Image Analysis Service (Gemini Vision)"]
            AgentSvc["AI Diagnosis Orchestrator"]
            LiveSvc["Live Data Service (Agromonitoring + Open-Meteo)"]
            VoiceSvc["Voice Script & SMS Generator"]
            MockSvc["Encyclopedia & Telemetry Mock Provider"]
        end
    end

    subgraph AIDataLayer ["AI & External Services"]
        Gemini["Google Gemini API (gemini-3.6-flash)"]
        AgroAPI["Agromonitoring API (Soil Moisture & NDVI Satellite)"]
        MeteoAPI["Open-Meteo Archive API (Historical Weather)"]
    end

    subgraph DatabaseLayer ["Data Persistence"]
        DB[(SQLite / PostgreSQL Database)]
    end

    %% User interactions
    UI -->|1. Upload Crop Photo| API
    MapComp -->|2. Draw Field Polygon| API
    UI -->|3. Request Telemetry & Crop Info| API
    
    %% API Routing to Services
    API -->|Photo Payload| VisionSvc
    API -->|Polygon Coordinates| LiveSvc
    API -->|Query Anomalies| AgentSvc
    API -->|Fetch Voice Script| VoiceSvc
    API -->|Crop Encyclopedia| MockSvc

    %% External & AI Integrations
    VisionSvc -->|Multimodal Image Prompt| Gemini
    AgentSvc -->|LLM Diagnosis Prompt| Gemini
    LiveSvc -->|Register Polygon & Fetch Soil/NDVI| AgroAPI
    LiveSvc -->|Fetch 45-Day Rain/Temp| MeteoAPI

    %% Persistence
    VisionSvc -->|Save Image & Anomaly| DB
    AgentSvc -->|Save Diagnosis & Recommendation| DB
    LiveSvc -->|Save Evidence Records| DB
    API <-->|Read / Write Farms, Fields| DB

    %% Responses back to Client
    API -->|JSON Response| UI
    UI -->|Render Leaflet Map| MapComp
    UI -->|Render Telemetry Charts| ChartComp
    UI -->|Trigger Speech Utterance| VoiceEngine
    UI -->|Apply i18n Translations| LangContext
```

---

## 3. Sequence Diagrams

### Sequence Diagram 1: Gemini Vision Image Analysis & AI Diagnosis Flow

This sequence highlights what happens when a farmer uploads a photo of a sick or pest-infested crop.

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Farmer / User
    participant Frontend as Next.js Frontend
    participant FastAPI as FastAPI Backend (/api/analyze)
    participant DB as SQLite / ORM Database
    participant VisionSvc as Image Analysis Service
    participant Gemini as Google Gemini AI (Vision + LLM)

    Farmer->>Frontend: Uploads crop leaf/field image
    Frontend->>FastAPI: POST /api/analyze { field_id, image_url (base64) }
    FastAPI->>DB: Verify field_id exists
    FastAPI->>DB: Insert Image record (stored_url, source="user_upload")
    FastAPI->>VisionSvc: analyze_crop_image(image_url)
    VisionSvc->>Gemini: Prompt with Image (gemini-3.6-flash)
    Gemini-->>VisionSvc: Return JSON: { anomaly_type, severity, confidence, reasoning, actions }
    VisionSvc-->>FastAPI: Formatted vision response
    FastAPI->>DB: Insert Anomaly record (type, severity, zone="uploaded_image")
    FastAPI->>Gemini: Prompt LLM for structured diagnosis & recommendations
    Gemini-->>FastAPI: Return cause, reasoning, and prioritized actions
    FastAPI->>DB: Insert Diagnosis & Recommendation records
    FastAPI-->>Frontend: Return complete anomaly JSON (details, impact metrics, voice script)
    Frontend->>Farmer: Display diagnosis UI card with alert badge
    Frontend->>Farmer: Auto-trigger Web Speech API voice alert (EN/UR)
```

---

### Sequence Diagram 2: Draw-a-Field & Live Satellite Telemetry Flow

This sequence describes a farmer drawing a field boundary on the interactive Leaflet map to trigger satellite telemetry analysis.

```mermaid
sequenceDiagram
    autonumber
    actor User as Farm Manager
    participant Map as Leaflet Map Component
    participant Frontend as Next.js Frontend
    participant API as FastAPI Backend
    participant LiveSvc as Live Data Service
    participant Agro as Agromonitoring API
    participant Meteo as Open-Meteo API
    participant DB as Database

    User->>Map: Draw field polygon boundary
    Map->>Frontend: Polygon Lat/Lng array
    Frontend->>API: POST /api/fields { farm_id, name, crop_type, polygon }
    API->>API: Calculate centroid (lat/lng) and area in hectares
    API->>DB: Insert Field record
    API->>LiveSvc: create_polygon_from_coords(name, polygon)
    LiveSvc->>Agro: POST /agro/1.0/polygons (GeoJSON)
    Agro-->>LiveSvc: Return Agromonitoring polygon_id
    API-->>Frontend: Field created response with field_id
    
    User->>Frontend: Click "Analyze Drawn Area"
    Frontend->>API: POST /api/fields/{field_id}/analyze-area
    API->>LiveSvc: build_evidence_from_live(field_id, lat, lng, crop_type)
    par Fetch Soil & Satellite Data
        LiveSvc->>Agro: GET /agro/1.0/soil (polygon_id)
        Agro-->>LiveSvc: Soil moisture & surface temp
    and Fetch Historical Weather
        LiveSvc->>Meteo: GET /v1/forecast (historical rain/temp)
        Meteo-->>LiveSvc: 7-day & 45-day weather telemetry
    end
    LiveSvc-->>API: Consolidated evidence dictionary
    API->>API: Evaluate crop moisture thresholds (optimal vs measured)
    API->>DB: Save Anomaly, Evidence, Diagnosis & Recommendation records
    API-->>Frontend: Return evidence, telemetry timeline, and anomaly summary
    Frontend->>User: Render Recharts telemetry graphs & evidence dashboard
```

---

### Sequence Diagram 3: Bilingual Voice Alert & Low-Bandwidth SMS Script Flow

This sequence details how voice audio scripts and low-bandwidth SMS messages are produced for low-literacy or low-connectivity farmers.

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Farmer
    participant UI as Next.js UI (LanguageContext)
    participant Speech as Web Speech API (Browser)
    participant API as FastAPI Backend
    participant VoiceSvc as Voice & SMS Service

    Farmer->>UI: Click "Play Voice Diagnosis" (or toggle UR/EN)
    UI->>API: GET /api/anomalies/{anomaly_id}/voice
    API->>VoiceSvc: generate_farmer_voice_script(field_name, zone, action, reason, saved_usd)
    VoiceSvc-->>API: Return { audio_url, spoken_script (EN & UR) }
    API-->>UI: Voice script JSON payload
    UI->>Speech: window.speechSynthesis.speak(SpeechSynthesisUtterance)
    Speech-->>Farmer: Audio output ("Attention Farmer: Water Zone B3 today...")

    opt Low Bandwidth SMS Preview
        Farmer->>UI: Request SMS Preview
        UI->>API: GET /api/anomalies/{anomaly_id}/sms
        API->>VoiceSvc: generate_sms_payload(zone, color, what, saved)
        VoiceSvc-->>API: Return { sms_text, character_count (<160 chars) }
        API-->>UI: SMS payload
        UI-->>Farmer: Display formatted SMS card ready for cellular broadcast
    end
```

---

## 4. Database Schema Specifications & ER Diagram

### Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    FARMS ||--o{ FIELDS : "contains"
    FIELDS ||--o{ IMAGES : "has uploaded"
    FIELDS ||--o{ ANOMALIES : "exhibits"
    IMAGES ||--o| ANOMALIES : "triggers"
    ANOMALIES ||--o| DIAGNOSES : "has"
    ANOMALIES ||--o| EVIDENCE : "backed by"
    ANOMALIES ||--o| RECOMMENDATIONS : "prescribes"

    FARMS {
        string farm_id PK
        string name
        string location
        float area_hectares
        datetime created_at
        datetime updated_at
    }

    FIELDS {
        string field_id PK
        string farm_id FK
        string name
        string crop_type
        float boundary_lat
        float boundary_lng
        float area_hectares
        datetime created_at
        datetime updated_at
    }

    IMAGES {
        string image_id PK
        string field_id FK
        text image_url
        string source
        int resolution_width
        int resolution_height
        datetime uploaded_at
    }

    ANOMALIES {
        string anomaly_id PK
        string field_id FK
        string image_id FK
        string anomaly_type
        float severity
        float confidence
        string zone
        float detected_lat
        float detected_lng
        datetime detected_at
        datetime created_at
    }

    DIAGNOSES {
        string diagnosis_id PK
        string anomaly_id FK, UK
        string probable_cause
        float confidence
        text reasoning
        datetime created_at
    }

    EVIDENCE {
        string evidence_id PK
        string anomaly_id FK, UK
        float soil_moisture_percent
        float rainfall_7d_mm
        float temperature_c
        float humidity_percent
        float vegetation_ndvi_change
        datetime captured_at
        datetime created_at
    }

    RECOMMENDATIONS {
        string recommendation_id PK
        string anomaly_id FK, UK
        string action
        int priority
        string target_zone
        text description
        datetime created_at
    }
```

---

### Detailed Table Schemas

#### 1. Table: `farms`
Stores agricultural farm properties and ownership parameters.
* **`farm_id`**: `VARCHAR(36)` | **PRIMARY KEY** (UUID)
* **`name`**: `VARCHAR(255)` | `NOT NULL` — e.g. "Sindh Agricultural Farm"
* **`location`**: `VARCHAR(255)` — City / Region
* **`area_hectares`**: `DECIMAL(10,2)` — Total farm area in hectares
* **`created_at`**: `TIMESTAMP` | Default: `CURRENT_TIMESTAMP`
* **`updated_at`**: `TIMESTAMP` | Default: `CURRENT_TIMESTAMP`

#### 2. Table: `fields`
Stores individual plot or field definitions within a farm.
* **`field_id`**: `VARCHAR(36)` | **PRIMARY KEY** (UUID)
* **`farm_id`**: `VARCHAR(36)` | **FOREIGN KEY** -> `farms(farm_id)` ON DELETE CASCADE
* **`name`**: `VARCHAR(255)` | `NOT NULL` — Field identifier (e.g. "Field B")
* **`crop_type`**: `VARCHAR(100)` — Active crop (`wheat`, `rice`, `cotton`, `sugarcane`)
* **`boundary_lat`**: `DECIMAL(10,8)` — Centroid latitude coordinate
* **`boundary_lng`**: `DECIMAL(11,8)` — Centroid longitude coordinate
* **`area_hectares`**: `DECIMAL(10,2)` — Computed field surface area
* **`created_at`**: `TIMESTAMP` | Default: `CURRENT_TIMESTAMP`
* **`updated_at`**: `TIMESTAMP` | Default: `CURRENT_TIMESTAMP`

#### 3. Table: `images`
Stores metadata and URLs for user-uploaded crop photographs.
* **`image_id`**: `VARCHAR(36)` | **PRIMARY KEY** (UUID)
* **`field_id`**: `VARCHAR(36)` | **FOREIGN KEY** -> `fields(field_id)` ON DELETE CASCADE
* **`image_url`**: `TEXT` | `NOT NULL` — Base64 Data URL or storage URI
* **`source`**: `VARCHAR(100)` — Source tag (`user_upload`, `drone`, `satellite`)
* **`resolution_width`**: `INT` — Image width in pixels
* **`resolution_height`**: `INT` — Image height in pixels
* **`uploaded_at`**: `TIMESTAMP` | Default: `CURRENT_TIMESTAMP`

#### 4. Table: `anomalies`
Central repository for detected agricultural issues (diseases, water stress, pests).
* **`anomaly_id`**: `VARCHAR(36)` | **PRIMARY KEY** (UUID)
* **`field_id`**: `VARCHAR(36)` | **FOREIGN KEY** -> `fields(field_id)` ON DELETE CASCADE
* **`image_id`**: `VARCHAR(36)` | **FOREIGN KEY** -> `images(image_id)` ON DELETE SET NULL
* **`anomaly_type`**: `VARCHAR(100)` | `NOT NULL` — `water_stress`, `fungal_disease`, `pest_infestation`, `healthy`
* **`severity`**: `DECIMAL(3,2)` | `NOT NULL` — Score from 0.00 to 1.00
* **`confidence`**: `DECIMAL(3,2)` | `NOT NULL` — Detection confidence (0.00 - 1.00)
* **`zone`**: `VARCHAR(50)` — Field grid sector (e.g. "B3", "drawn_area", "uploaded_image")
* **`detected_lat`**: `DECIMAL(10,8)` — Specific anomaly GPS latitude
* **`detected_lng`**: `DECIMAL(11,8)` — Specific anomaly GPS longitude
* **`detected_at`**: `TIMESTAMP` | Default: `CURRENT_TIMESTAMP`
* **`created_at`**: `TIMESTAMP` | Default: `CURRENT_TIMESTAMP`

#### 5. Table: `diagnoses`
Contains Gemini AI LLM explanation of the underlying biological / environmental cause.
* **`diagnosis_id`**: `VARCHAR(36)` | **PRIMARY KEY** (UUID)
* **`anomaly_id`**: `VARCHAR(36)` | `NOT NULL`, **UNIQUE**, **FOREIGN KEY** -> `anomalies(anomaly_id)` ON DELETE CASCADE
* **`probable_cause`**: `VARCHAR(500)` | `NOT NULL` — AI cause diagnosis headline
* **`confidence`**: `DECIMAL(3,2)` | `NOT NULL` — Diagnosis confidence rating
* **`reasoning`**: `TEXT` — Detailed technical reasoning & symptoms observed
* **`created_at`**: `TIMESTAMP` | Default: `CURRENT_TIMESTAMP`

#### 6. Table: `evidence`
Stores live satellite & weather telemetry parameters captured at anomaly detection time.
* **`evidence_id`**: `VARCHAR(36)` | **PRIMARY KEY** (UUID)
* **`anomaly_id`**: `VARCHAR(36)` | `NOT NULL`, **UNIQUE**, **FOREIGN KEY** -> `anomalies(anomaly_id)` ON DELETE CASCADE
* **`soil_moisture_percent`**: `DECIMAL(5,2)` — Volumetric soil moisture percentage
* **`rainfall_7d_mm`**: `DECIMAL(6,2)` — Cumulative 7-day precipitation in mm
* **`temperature_c`**: `DECIMAL(5,2)` — Ambient temperature in Celsius
* **`humidity_percent`**: `DECIMAL(5,2)` — Relative air humidity percentage
* **`vegetation_ndvi_change`**: `DECIMAL(4,2)` — NDVI vegetation index delta
* **`captured_at`**: `TIMESTAMP` — Timestamp of satellite measurement
* **`created_at`**: `TIMESTAMP` | Default: `CURRENT_TIMESTAMP`

#### 7. Table: `recommendations`
Stores actionable remedies and priority intervention steps for farmers.
* **`recommendation_id`**: `VARCHAR(36)` | **PRIMARY KEY** (UUID)
* **`anomaly_id`**: `VARCHAR(36)` | `NOT NULL`, **UNIQUE**, **FOREIGN KEY** -> `anomalies(anomaly_id)` ON DELETE CASCADE
* **`action`**: `VARCHAR(100)` | `NOT NULL` — `prioritize_irrigation`, `apply_fungicide`, `pest_control`
* **`priority`**: `INT` | `NOT NULL` — Action priority rating (1 = Critical, 2 = High, 3 = Medium)
* **`target_zone`**: `VARCHAR(50)` — Specific area requiring treatment
* **`description`**: `TEXT` — Detailed step-by-step instructions for application
* **`created_at`**: `TIMESTAMP` | Default: `CURRENT_TIMESTAMP`

---

## 5. SQL Schema Definition (DDL)

```sql
-- PostgreSQL / SQLite Compatible DDL Schema for Crop Health Agent

CREATE TABLE farms (
  farm_id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  area_hectares DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fields (
  field_id VARCHAR(36) PRIMARY KEY,
  farm_id VARCHAR(36) NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  crop_type VARCHAR(100),
  boundary_lat DECIMAL(10, 8),
  boundary_lng DECIMAL(11, 8),
  area_hectares DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE images (
  image_id VARCHAR(36) PRIMARY KEY,
  field_id VARCHAR(36) NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  source VARCHAR(100),
  resolution_width INT,
  resolution_height INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE anomalies (
  anomaly_id VARCHAR(36) PRIMARY KEY,
  field_id VARCHAR(36) NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  image_id VARCHAR(36) REFERENCES images(image_id) ON DELETE SET NULL,
  anomaly_type VARCHAR(100) NOT NULL,
  severity DECIMAL(3, 2) NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL,
  zone VARCHAR(50),
  detected_lat DECIMAL(10, 8),
  detected_lng DECIMAL(11, 8),
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diagnoses (
  diagnosis_id VARCHAR(36) PRIMARY KEY,
  anomaly_id VARCHAR(36) NOT NULL UNIQUE REFERENCES anomalies(anomaly_id) ON DELETE CASCADE,
  probable_cause VARCHAR(500) NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evidence (
  evidence_id VARCHAR(36) PRIMARY KEY,
  anomaly_id VARCHAR(36) NOT NULL UNIQUE REFERENCES anomalies(anomaly_id) ON DELETE CASCADE,
  soil_moisture_percent DECIMAL(5, 2),
  rainfall_7d_mm DECIMAL(6, 2),
  temperature_c DECIMAL(5, 2),
  humidity_percent DECIMAL(5, 2),
  vegetation_ndvi_change DECIMAL(4, 2),
  captured_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommendations (
  recommendation_id VARCHAR(36) PRIMARY KEY,
  anomaly_id VARCHAR(36) NOT NULL UNIQUE REFERENCES anomalies(anomaly_id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  priority INT NOT NULL,
  target_zone VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_fields_farm_id ON fields(farm_id);
CREATE INDEX idx_anomalies_field_id ON anomalies(field_id);
CREATE INDEX idx_anomalies_type ON anomalies(anomaly_type);
CREATE INDEX idx_images_field_id ON images(field_id);
```
