# Backend Skeleton (FastAPI + SQLAlchemy + PostgreSQL)

**Purpose:** Complete folder structure + starter code for backend engineer  
**Time to build:** ~8-10 hours (don't rush)

---

## Folder Structure

```
backend/
├── main.py                          # FastAPI app entry point
├── requirements.txt                 # Dependencies
├── .env.example                     # Environment template
├── database.py                      # SQLAlchemy setup
├── schemas.py                       # Pydantic models (request/response)
├── models.py                        # SQLAlchemy ORM models
├── api/
│   └── endpoints.py                 # All route handlers
└── services/
    ├── anomaly_service.py           # Anomaly detection logic
    ├── agent_service.py             # AI agent logic (tool calling)
    └── mock_data.py                 # Mock soil/weather data generators
```

---

## requirements.txt

```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pydantic==2.5.0
python-dotenv==1.0.0
requests==2.31.0
```

---

## database.py

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/crop_health")

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## models.py (SQLAlchemy ORM)

```python
from sqlalchemy import Column, String, Float, Int, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import uuid

class Farm(Base):
    __tablename__ = "farms"
    
    farm_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    location = Column(String(255))
    area_hectares = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")

class Field(Base):
    __tablename__ = "fields"
    
    field_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.farm_id"), nullable=False)
    name = Column(String(255), nullable=False)
    crop_type = Column(String(100))
    boundary_lat = Column(Float)
    boundary_lng = Column(Float)
    area_hectares = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    farm = relationship("Farm", back_populates="fields")
    anomalies = relationship("Anomaly", back_populates="field", cascade="all, delete-orphan")
    images = relationship("Image", back_populates="field", cascade="all, delete-orphan")

class Image(Base):
    __tablename__ = "images"
    
    image_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    field_id = Column(String(36), ForeignKey("fields.field_id"), nullable=False)
    image_url = Column(Text, nullable=False)
    source = Column(String(100))
    resolution_width = Column(Int)
    resolution_height = Column(Int)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    field = relationship("Field", back_populates="images")

class Anomaly(Base):
    __tablename__ = "anomalies"
    
    anomaly_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    field_id = Column(String(36), ForeignKey("fields.field_id"), nullable=False)
    image_id = Column(String(36), ForeignKey("images.image_id"), nullable=True)
    anomaly_type = Column(String(100), nullable=False)
    severity = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    zone = Column(String(50))
    detected_lat = Column(Float)
    detected_lng = Column(Float)
    detected_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    field = relationship("Field", back_populates="anomalies")
    diagnosis = relationship("Diagnosis", back_populates="anomaly", uselist=False, cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="anomaly", uselist=False, cascade="all, delete-orphan")
    recommendation = relationship("Recommendation", back_populates="anomaly", uselist=False, cascade="all, delete-orphan")

class Diagnosis(Base):
    __tablename__ = "diagnoses"
    
    diagnosis_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    anomaly_id = Column(String(36), ForeignKey("anomalies.anomaly_id"), nullable=False, unique=True)
    probable_cause = Column(String(500), nullable=False)
    confidence = Column(Float, nullable=False)
    reasoning = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    anomaly = relationship("Anomaly", back_populates="diagnosis")

class Evidence(Base):
    __tablename__ = "evidence"
    
    evidence_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    anomaly_id = Column(String(36), ForeignKey("anomalies.anomaly_id"), nullable=False, unique=True)
    soil_moisture_percent = Column(Float)
    rainfall_7d_mm = Column(Float)
    temperature_c = Column(Float)
    humidity_percent = Column(Float)
    vegetation_ndvi_change = Column(Float)
    captured_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    anomaly = relationship("Anomaly", back_populates="evidence")

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    recommendation_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    anomaly_id = Column(String(36), ForeignKey("anomalies.anomaly_id"), nullable=False, unique=True)
    action = Column(String(100), nullable=False)
    priority = Column(Int, nullable=False)
    target_zone = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    anomaly = relationship("Anomaly", back_populates="recommendation")
```

---

## schemas.py (Pydantic Models)

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ===== Evidence =====
class EvidenceSchema(BaseModel):
    soil_moisture_percent: Optional[float] = None
    rainfall_7d_mm: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    vegetation_ndvi_change: Optional[float] = None
    
    class Config:
        from_attributes = True

# ===== Diagnosis =====
class DiagnosisSchema(BaseModel):
    cause: str
    confidence: float
    reasoning: Optional[str] = None
    
    class Config:
        from_attributes = True

# ===== Recommendation =====
class RecommendationSchema(BaseModel):
    action: str
    priority: int
    target_zone: str
    description: str
    
    class Config:
        from_attributes = True

# ===== Detected Region =====
class DetectedRegionSchema(BaseModel):
    zone: str
    coordinates: dict = {"lat": 0.0, "lng": 0.0}

# ===== Anomaly (Full Response) =====
class AnomalyResponseSchema(BaseModel):
    anomaly_id: str
    field_id: str
    anomaly_type: str
    severity: float
    confidence: float
    detected_region: DetectedRegionSchema
    evidence: EvidenceSchema
    diagnosis: DiagnosisSchema
    recommendation: RecommendationSchema
    created_at: datetime
    
    class Config:
        from_attributes = True

# ===== Analyze Request =====
class AnalyzeRequestSchema(BaseModel):
    image_url: str
    field_id: str

# ===== Field Response =====
class FieldResponseSchema(BaseModel):
    field_id: str
    farm_id: str
    name: str
    crop_type: Optional[str] = None
    boundary: dict
    anomalies: list = []
    
    class Config:
        from_attributes = True

# ===== Farm Response =====
class FarmResponseSchema(BaseModel):
    farm_id: str
    name: str
    location: Optional[str] = None
    fields: list = []
    
    class Config:
        from_attributes = True
```

---

## api/endpoints.py (Route Handlers)

```python
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Anomaly, Diagnosis, Evidence, Recommendation, Field, Farm
from schemas import AnalyzeRequestSchema, AnomalyResponseSchema
from services.anomaly_service import detect_anomaly
from services.agent_service import run_agent
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/api/analyze")
async def analyze_image(request: AnalyzeRequestSchema, db: Session = Depends(get_db)):
    """
    1. Fetch field
    2. Trigger anomaly detection (mock for now)
    3. Run AI agent to generate diagnosis
    4. Store in DB
    5. Return result
    """
    
    field = db.query(Field).filter(Field.field_id == request.field_id).first()
    if not field:
        raise HTTPException(status_code=400, detail="Field not found")
    
    # TODO: Call vision model or use mock anomaly
    # For now, create a hardcoded anomaly
    anomaly_data = detect_anomaly(request.image_url, request.field_id)
    
    # Create anomaly record
    anomaly = Anomaly(
        anomaly_id=str(uuid.uuid4()),
        field_id=request.field_id,
        anomaly_type=anomaly_data["anomaly_type"],
        severity=anomaly_data["severity"],
        confidence=anomaly_data["confidence"],
        zone=anomaly_data["zone"],
        detected_lat=anomaly_data["lat"],
        detected_lng=anomaly_data["lng"]
    )
    db.add(anomaly)
    db.commit()
    
    # Run agent to diagnose
    diagnosis_result = await run_agent(anomaly.anomaly_id, db)
    
    # Return result
    return get_anomaly_details(anomaly.anomaly_id, db)

@router.get("/api/anomalies/{anomaly_id}")
async def get_anomaly(anomaly_id: str, db: Session = Depends(get_db)):
    """Fetch complete anomaly with diagnosis & recommendation"""
    return get_anomaly_details(anomaly_id, db)

@router.get("/api/fields/{field_id}")
async def get_field(field_id: str, db: Session = Depends(get_db)):
    """Get field with all anomalies"""
    field = db.query(Field).filter(Field.field_id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    return {
        "field_id": field.field_id,
        "farm_id": field.farm_id,
        "name": field.name,
        "crop_type": field.crop_type,
        "boundary": {"lat": field.boundary_lat, "lng": field.boundary_lng},
        "anomalies": [
            {
                "anomaly_id": a.anomaly_id,
                "anomaly_type": a.anomaly_type,
                "severity": a.severity,
                "zone": a.zone,
                "created_at": a.created_at
            }
            for a in field.anomalies
        ]
    }

@router.get("/api/farms/{farm_id}")
async def get_farm(farm_id: str, db: Session = Depends(get_db)):
    """Get farm overview"""
    farm = db.query(Farm).filter(Farm.farm_id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    return {
        "farm_id": farm.farm_id,
        "name": farm.name,
        "location": farm.location,
        "fields": [
            {
                "field_id": f.field_id,
                "name": f.name,
                "crop_type": f.crop_type,
                "status": "healthy" if not f.anomalies else "alert",
                "anomaly_count": len(f.anomalies),
                "last_analyzed": f.updated_at
            }
            for f in farm.fields
        ]
    }

def get_anomaly_details(anomaly_id: str, db: Session):
    """Helper to fetch complete anomaly with all related data"""
    anomaly = db.query(Anomaly).filter(Anomaly.anomaly_id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    
    diagnosis = db.query(Diagnosis).filter(Diagnosis.anomaly_id == anomaly_id).first()
    evidence = db.query(Evidence).filter(Evidence.anomaly_id == anomaly_id).first()
    recommendation = db.query(Recommendation).filter(Recommendation.anomaly_id == anomaly_id).first()
    
    return {
        "anomaly_id": anomaly.anomaly_id,
        "field_id": anomaly.field_id,
        "anomaly_type": anomaly.anomaly_type,
        "severity": anomaly.severity,
        "confidence": anomaly.confidence,
        "detected_region": {
            "zone": anomaly.zone,
            "coordinates": {
                "lat": anomaly.detected_lat,
                "lng": anomaly.detected_lng
            }
        },
        "evidence": {
            "soil_moisture_percent": evidence.soil_moisture_percent if evidence else None,
            "rainfall_7d_mm": evidence.rainfall_7d_mm if evidence else None,
            "temperature_c": evidence.temperature_c if evidence else None,
            "vegetation_ndvi_change": evidence.vegetation_ndvi_change if evidence else None
        } if evidence else {},
        "diagnosis": {
            "cause": diagnosis.probable_cause if diagnosis else None,
            "confidence": diagnosis.confidence if diagnosis else None,
            "reasoning": diagnosis.reasoning if diagnosis else None
        } if diagnosis else {},
        "recommendation": {
            "action": recommendation.action if recommendation else None,
            "priority": recommendation.priority if recommendation else None,
            "target_zone": recommendation.target_zone if recommendation else None,
            "description": recommendation.description if recommendation else None
        } if recommendation else {},
        "created_at": anomaly.created_at
    }
```

---

## services/mock_data.py

```python
"""Mock data generators for soil, weather, and environmental data"""

def get_mock_soil_data(field_id: str) -> dict:
    """Return simulated soil sensor readings"""
    return {
        "soil_moisture_percent": 18,
        "nitrogen_ppm": 25,
        "phosphorus_ppm": 10,
        "potassium_ppm": 150
    }

def get_mock_weather_data(field_id: str) -> dict:
    """Return simulated weather data"""
    return {
        "temperature_c": 34,
        "humidity_percent": 45,
        "rainfall_7d_mm": 2,
        "wind_speed_kmh": 12
    }

def get_mock_crop_history(field_id: str) -> dict:
    """Return simulated historical crop data"""
    return {
        "crop_type": "wheat",
        "prev_stress_events": ["water_stress_2023", "heat_stress_2022"],
        "avg_yield_kg_hectare": 4500
    }
```

---

## services/anomaly_service.py

```python
"""Anomaly detection logic (mock for MVP)"""

def detect_anomaly(image_url: str, field_id: str) -> dict:
    """
    For MVP, return hardcoded anomaly.
    In v2, integrate real vision model here.
    """
    return {
        "anomaly_type": "water_stress",
        "severity": 0.85,
        "confidence": 0.87,
        "zone": "B3",
        "lat": 31.5204,
        "lng": 74.3587
    }
```

---

## services/agent_service.py

```python
"""AI Agent with tool calling (uses Claude API)"""
import asyncio
from services.mock_data import get_mock_soil_data, get_mock_weather_data, get_mock_crop_history
from models import Diagnosis, Evidence, Recommendation
from sqlalchemy.orm import Session
import uuid
import json

AGENT_TOOLS = {
    "get_soil_data": get_mock_soil_data,
    "get_weather_data": get_mock_weather_data,
    "get_crop_history": get_mock_crop_history
}

async def run_agent(anomaly_id: str, db: Session):
    """
    Run the AI agent to diagnose the anomaly.
    
    Steps:
    1. Fetch anomaly data
    2. Call Claude API with tool definitions
    3. Claude requests tools
    4. Execute tools, return results
    5. Claude generates diagnosis
    6. Store diagnosis, evidence, recommendation in DB
    """
    
    # TODO: Integrate Claude API here
    # For MVP, generate mock diagnosis
    
    diagnosis = Diagnosis(
        diagnosis_id=str(uuid.uuid4()),
        anomaly_id=anomaly_id,
        probable_cause="Likely water stress caused by prolonged low soil moisture and insufficient rainfall.",
        confidence=0.87,
        reasoning="Low soil moisture (18%) + low rainfall (2mm in 7 days) + high temperature (34°C) + negative vegetation change indicate classic water stress pattern."
    )
    
    evidence = Evidence(
        evidence_id=str(uuid.uuid4()),
        anomaly_id=anomaly_id,
        soil_moisture_percent=18,
        rainfall_7d_mm=2,
        temperature_c=34,
        humidity_percent=45,
        vegetation_ndvi_change=-0.14
    )
    
    recommendation = Recommendation(
        recommendation_id=str(uuid.uuid4()),
        anomaly_id=anomaly_id,
        action="prioritize_irrigation",
        priority=1,
        target_zone="B3",
        description="Prioritize irrigation for Zone B3 to restore soil moisture."
    )
    
    db.add(diagnosis)
    db.add(evidence)
    db.add(recommendation)
    db.commit()
    
    return {
        "status": "diagnosed",
        "anomaly_id": anomaly_id
    }
```

---

## main.py (FastAPI App)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from api.endpoints import router
from models import *

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Crop Health Agent API",
    description="Multimodal crop anomaly detection and diagnosis",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)

@app.get("/")
async def root():
    return {"message": "Crop Health Agent API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## .env.example

```
DATABASE_URL=postgresql://user:password@localhost/crop_health
CLAUDE_API_KEY=your_api_key_here
FLASK_ENV=development
```

---

## Quick Start (Backend)

```bash
# 1. Create virtual env
python -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up .env
cp .env.example .env
# Edit .env with real DB credentials

# 4. Run migrations (create tables)
python main.py
# This will create all tables automatically

# 5. Start server
uvicorn main:app --reload --port 8000
```

---

## Next Steps for Backend Engineer

1. Set up PostgreSQL database
2. Install dependencies
3. Fill in `services/agent_service.py` with real Claude API calls
4. Add real image detection logic to `services/anomaly_service.py`
5. Test all endpoints with mock data
6. Connect to frontend once ready
