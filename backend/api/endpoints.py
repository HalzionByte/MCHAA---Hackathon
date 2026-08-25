from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Anomaly, Diagnosis, Evidence, Recommendation, Field, Farm, Image
from schemas import AnalyzeRequestSchema, AnomalyResponseSchema, ErrorResponseSchema
from services.anomaly_service import detect_anomaly
from services.agent_service import run_agent
from datetime import datetime
import uuid
import asyncio

router = APIRouter()

@router.post("/api/analyze")
async def analyze_image(request: AnalyzeRequestSchema, db: Session = Depends(get_db)):
    """
    Upload image and analyze for anomalies.
    """
    
    # Validate field exists
    field = db.query(Field).filter(Field.field_id == request.field_id).first()
    if not field:
        return JSONResponse(
            status_code=400,
            content={"error": "invalid_field_id", "message": f"Field {request.field_id} not found"}
        )

    
    # Create Image record
    image = Image(
        image_id=str(uuid.uuid4()),
        field_id=request.field_id,
        image_url=request.image_url,
        source="user_upload"
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    
    # Detect anomaly (mock for MVP)
    anomaly_data = detect_anomaly(request.image_url, request.field_id)
    
    # Create Anomaly record
    anomaly = Anomaly(
        anomaly_id=str(uuid.uuid4()),
        field_id=request.field_id,
        image_id=image.image_id,
        anomaly_type=anomaly_data["anomaly_type"],
        severity=anomaly_data["severity"],
        confidence=anomaly_data["confidence"],
        zone=anomaly_data["zone"],
        detected_lat=anomaly_data["lat"],
        detected_lng=anomaly_data["lng"]
    )
    db.add(anomaly)
    db.commit()
    db.refresh(anomaly)
    
    # Prepare evidence data for agent
    evidence_data = {
        "soil_moisture_percent": 18,
        "rainfall_7d_mm": 2,
        "temperature_c": 34,
        "humidity_percent": 45,
        "vegetation_ndvi_change": -0.14,
        "zone": anomaly.zone
    }
    
    # Run agent asynchronously (non-blocking)
    asyncio.create_task(
        run_agent(
            anomaly.anomaly_id,
            request.field_id,
            anomaly.anomaly_type,
            evidence_data
        )
    )

    
    # Return anomaly details with partial response (agent runs in background)
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
        return JSONResponse(
            status_code=404,
            content={"error": "field_not_found", "message": f"Field {field_id} not found"}
        )
    
    return {
        "field_id": field.field_id,
        "farm_id": field.farm_id,
        "name": field.name,
        "crop_type": field.crop_type,
        "boundary": {
            "lat": field.boundary_lat,
            "lng": field.boundary_lng
        },
        "anomalies": [
            {
                "anomaly_id": a.anomaly_id,
                "anomaly_type": a.anomaly_type,
                "severity": a.severity,
                "zone": a.zone,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in field.anomalies
        ]
    }

@router.get("/api/farms/{farm_id}")
async def get_farm(farm_id: str, db: Session = Depends(get_db)):
    """Get farm overview with field summaries"""
    farm = db.query(Farm).filter(Farm.farm_id == farm_id).first()
    if not farm:
        return JSONResponse(
            status_code=404,
            content={"error": "farm_not_found", "message": f"Farm {farm_id} not found"}
        )
    
    return {
        "farm_id": farm.farm_id,
        "name": farm.name,
        "location": farm.location,
        "fields": [
            {
                "field_id": f.field_id,
                "name": f.name,
                "crop_type": f.crop_type,
                "status": "alert" if f.anomalies else "healthy",
                "anomaly_count": len(f.anomalies),
                "last_analyzed": f.updated_at.isoformat() if f.updated_at else None
            }
            for f in farm.fields
        ]
    }

def get_anomaly_details(anomaly_id: str, db: Session):
    """Helper to fetch complete anomaly with all related data"""
    anomaly = db.query(Anomaly).filter(Anomaly.anomaly_id == anomaly_id).first()
    if not anomaly:
        return JSONResponse(
            status_code=404,
            content={"error": "anomaly_not_found", "message": f"Anomaly {anomaly_id} not found"}
        )

    
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
            "humidity_percent": evidence.humidity_percent if evidence else None,
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
        "created_at": anomaly.created_at.isoformat() if anomaly.created_at else None
    }
