from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Anomaly, Diagnosis, Evidence, Recommendation, Field, Farm, Image
from schemas import AnalyzeRequestSchema, UpdateFieldCropSchema, CreateFieldRequestSchema
from services.agent_service import generate_mock_diagnosis
from services.live_data import build_evidence_from_live, get_real_telemetry_history, get_field_polygon_coords, create_polygon_from_coords, set_polygon_override, compute_polygon_centroid, compute_polygon_area_hectares
from services.image_analysis import analyze_crop_image
from services.mock_data import (
    get_all_crops,
    get_crop_by_id,
    generate_rotation_advice,
    generate_field_telemetry_history
)

from datetime import datetime
import uuid

from services.voice_service import generate_farmer_voice_script, generate_sms_payload

router = APIRouter()


@router.post("/api/analyze")
async def analyze_image(request: AnalyzeRequestSchema, db: Session = Depends(get_db)):
    """
    Upload image and analyze for crop anomalies using Gemini Vision only.
    Detects infestation, disease, pest attack, harm, or healthy status.
    Returns: problem detected + recommended solution.
    """
    
    # Validate field exists
    field = db.query(Field).filter(Field.field_id == request.field_id).first()
    if not field:
        return JSONResponse(
            status_code=400,
            content={"error": "invalid_field_id", "message": f"Field {request.field_id} not found"}
        )

    # 1. Create Image record (store truncated URL for base64 data URLs)
    stored_url = request.image_url
    if stored_url.startswith("data:"):
        stored_url = stored_url[:50] + "...(truncated base64)"
    image = Image(
        image_id=str(uuid.uuid4()),
        field_id=request.field_id,
        image_url=stored_url,
        source="user_upload"
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    
    # 2. Gemini Vision: analyze the image for crop health
    vision_result = analyze_crop_image(request.image_url)

    # 3. Build evidence from vision only (no satellite data)
    evidence_data = {
        "image_description": vision_result.get("description", ""),
        "detected_pests": vision_result.get("detected_pests", []),
        "recommended_actions": vision_result.get("recommended_actions", []),
        "severity": vision_result.get("severity", 0.5),
        "confidence": vision_result.get("confidence", 0.7),
        "zone": "uploaded_image",
    }

    # 4. Create Anomaly record — all fields from Gemini's vision output
    anomaly = Anomaly(
        anomaly_id=str(uuid.uuid4()),
        field_id=request.field_id,
        image_id=image.image_id,
        anomaly_type=vision_result["anomaly_type"],
        severity=round(vision_result["severity"], 2),
        confidence=round(vision_result["confidence"], 2),
        zone="uploaded_image",
        detected_lat=field.boundary_lat,
        detected_lng=field.boundary_lng,
    )
    db.add(anomaly)
    db.commit()
    db.refresh(anomaly)

    # 5. Persist Diagnosis + Recommendation
    try:
        generate_mock_diagnosis(
            anomaly.anomaly_id, request.field_id,
            vision_result["anomaly_type"], evidence_data, db,
        )
        db.commit()
    except Exception as e:
        print(f"[endpoints] Failed to persist image analysis diagnosis: {e}")
        db.rollback()

    return get_anomaly_details(anomaly.anomaly_id, db)

@router.get("/api/anomalies/{anomaly_id}")
async def get_anomaly(anomaly_id: str, db: Session = Depends(get_db)):
    """Fetch complete anomaly with diagnosis & recommendation"""
    return get_anomaly_details(anomaly_id, db)

@router.get("/api/anomalies/{anomaly_id}/voice")
async def get_anomaly_voice(anomaly_id: str, db: Session = Depends(get_db)):
    """Serves voice audio guide script and URL for farmers"""
    details = get_anomaly_details(anomaly_id, db)
    if isinstance(details, JSONResponse):
        return details
    
    zone = details["detected_region"]["zone"]
    action = details["recommendation"]["description"] or "Water crop"
    reason = details["diagnosis"]["cause"] or "Dry soil"
    saved = details["impact_metrics"]["crop_loss_saved_usd"]
    
    voice_info = generate_farmer_voice_script("Field B", zone, action, reason, saved)
    return {
        "anomaly_id": anomaly_id,
        "audio_url": voice_info["audio_url"],
        "spoken_script": voice_info["spoken_script"]
    }

@router.get("/api/anomalies/{anomaly_id}/sms")
async def get_anomaly_sms(anomaly_id: str, db: Session = Depends(get_db)):
    """Serves low-bandwidth SMS/WhatsApp payload (<160 chars)"""
    details = get_anomaly_details(anomaly_id, db)
    if isinstance(details, JSONResponse):
        return details
    
    zone = details["detected_region"]["zone"]
    color = details["farmer_decision"]["status_color"]
    what = details["farmer_decision"]["headline_what"]
    saved = details["impact_metrics"]["crop_loss_saved_usd"]
    
    sms_text = generate_sms_payload(zone, color, what, saved)
    return {
        "anomaly_id": anomaly_id,
        "sms_text": sms_text,
        "character_count": len(sms_text)
    }

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
        "polygon": get_field_polygon_coords(field.boundary_lat, field.boundary_lng, field_id),
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

@router.delete("/api/fields/{field_id}")
async def delete_field(field_id: str, db: Session = Depends(get_db)):
    """Delete a field and all its anomalies/images/analysis."""
    field = db.query(Field).filter(Field.field_id == field_id).first()
    if not field:
        return JSONResponse(
            status_code=404,
            content={"error": "field_not_found", "message": f"Field '{field_id}' not found"}
        )
    name = field.name
    db.delete(field)
    db.commit()
    return {"field_id": field_id, "deleted": True, "message": f"Field '{name}' deleted"}

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
                "anomalies": [
                    {
                        "anomaly_id": a.anomaly_id,
                        "anomaly_type": a.anomaly_type,
                        "severity": a.severity,
                        "zone": a.zone,
                        "created_at": a.created_at.isoformat() if a.created_at else None,
                    }
                    for a in f.anomalies
                ],
                "last_analyzed": f.updated_at.isoformat() if f.updated_at else None
            }
            for f in farm.fields
        ]
    }

def get_anomaly_details(anomaly_id: str, db: Session):
    """Helper to fetch complete anomaly with all related data.
    For image-uploaded anomalies (image_id set) the output is simplified to just
    the AI-detected problem + recommended solution — no satellite/soil/temp data.
    """
    anomaly = db.query(Anomaly).filter(Anomaly.anomaly_id == anomaly_id).first()
    if not anomaly:
        return JSONResponse(
            status_code=404,
            content={"error": "anomaly_not_found", "message": f"Anomaly {anomaly_id} not found"}
        )

    diagnosis = db.query(Diagnosis).filter(Diagnosis.anomaly_id == anomaly_id).first()
    evidence = db.query(Evidence).filter(Evidence.anomaly_id == anomaly_id).first()
    recommendation = db.query(Recommendation).filter(Recommendation.anomaly_id == anomaly_id).first()
    
    is_image = anomaly.image_id is not None
    zone = anomaly.zone or "B3"
    saved_usd = 450.0

    # --- Farmer decision / headline (simplified for image uploads) ---
    if is_image:
        anomaly_label = (anomaly.anomaly_type or "unknown").replace("_", " ").title()
        farmer_decision = {
            "status_color": "RED" if anomaly.severity >= 0.7 else "YELLOW",
            "status_emoji": "🚨" if anomaly.severity >= 0.7 else "⚠️",
            "headline_what": f"AI ANALYSIS — {anomaly_label}",
            "headline_why": diagnosis.probable_cause if diagnosis else "See analysis details below.",
            "urgency_hours": 24 if anomaly.severity >= 0.7 else 72
        }
    else:
        soil_pct = evidence.soil_moisture_percent if evidence else 18
        temp_val = evidence.temperature_c if evidence else 34
        farmer_decision = {
            "status_color": "RED" if anomaly.severity >= 0.7 else "YELLOW",
            "status_emoji": "🚨" if anomaly.severity >= 0.7 else "⚠️",
            "headline_what": f"WATER ZONE {zone} TODAY",
            "headline_why": f"Soil moisture is dry ({soil_pct}%) and temperature is hot ({temp_val}°C).",
            "urgency_hours": 24 if anomaly.severity >= 0.7 else 72
        }

    impact_metrics = {
        "crop_loss_saved_usd": saved_usd,
        "water_saved_liters": 3000.0,
        "cost_saved_usd": 120.0
    }
    
    voice_info = generate_farmer_voice_script("Field B", zone, recommendation.action if recommendation else "Water crop", diagnosis.probable_cause if diagnosis else "Dry soil", saved_usd)
    sms_text = generate_sms_payload(zone, farmer_decision["status_color"], farmer_decision["headline_what"], saved_usd)

    # --- Evidence: image anomalies carry AI image description, not satellite data ---
    if is_image:
        image_desc = diagnosis.reasoning if diagnosis else (evidence.soil_moisture_percent if evidence else "")
        evidence_payload = {
            "image_description": evidence.soil_moisture_percent if evidence else None,
            "detected_pests": [],
            "vegetation_ndvi_change": None,
            "temperature_c": None,
            "soil_moisture_percent": None,
        }
        # The Diagnosis reasoning column already contains the full image description.
        # Expose it under a clear key for the frontend.
        if diagnosis:
            evidence_payload["image_description"] = diagnosis.reasoning
    else:
        evidence_payload = {
            "soil_moisture_percent": evidence.soil_moisture_percent if evidence else None,
            "rainfall_7d_mm": evidence.rainfall_7d_mm if evidence else None,
            "temperature_c": evidence.temperature_c if evidence else None,
            "humidity_percent": evidence.humidity_percent if evidence else None,
            "vegetation_ndvi_change": evidence.vegetation_ndvi_change if evidence else None,
        } if evidence else {}

    return {
        "anomaly_id": anomaly.anomaly_id,
        "field_id": anomaly.field_id,
        "anomaly_type": anomaly.anomaly_type,
        "severity": anomaly.severity,
        "confidence": anomaly.confidence,
        "image_id": anomaly.image_id,
        "source": "image" if is_image else "satellite",
        "detected_region": {
            "zone": zone,
            "coordinates": {
                "lat": anomaly.detected_lat,
                "lng": anomaly.detected_lng
            }
        },
        "farmer_decision": farmer_decision,
        "impact_metrics": impact_metrics,
        "voice_audio_url": voice_info["audio_url"],
        "sms_text": sms_text,
        "evidence": evidence_payload,
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


# ============================================================================
# CROP ENCYCLOPEDIA & CROP SELECTION ENDPOINTS
# ============================================================================

@router.get("/api/crops")
async def list_crops():
    """List all crops in the Pakistani Agricultural Encyclopedia"""
    return get_all_crops()

@router.get("/api/crops/{crop_id}")
async def get_crop(crop_id: str):
    """Fetch detailed specifications for a specific crop"""
    crop = get_crop_by_id(crop_id)
    if not crop:
        return JSONResponse(
            status_code=404,
            content={"error": "crop_not_found", "message": f"Crop '{crop_id}' not found in encyclopedia"}
        )
    return crop

@router.put("/api/fields/{field_id}/crop")
async def update_field_crop(field_id: str, request: UpdateFieldCropSchema, db: Session = Depends(get_db)):
    """Update active crop for a field"""
    field = db.query(Field).filter(Field.field_id == field_id).first()
    if not field:
        return JSONResponse(
            status_code=404,
            content={"error": "field_not_found", "message": f"Field '{field_id}' not found"}
        )
    
    # Validate crop exists in catalog
    crop_info = get_crop_by_id(request.crop_type)
    if not crop_info:
        valid_crops = [c["crop_id"] for c in get_all_crops()]
        return JSONResponse(
            status_code=400,
            content={
                "error": "invalid_crop_type",
                "message": f"Crop '{request.crop_type}' is invalid. Allowed starter crops: {valid_crops}"
            }
        )
    
    field.crop_type = crop_info["crop_id"]
    field.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(field)
    
    # Generate dynamic rotation advice after update
    rotation_advice = generate_rotation_advice(field.crop_type)
    
    return {
        "message": f"Field '{field.name}' updated successfully to crop '{crop_info['name']}'",
        "field_id": field.field_id,
        "name": field.name,
        "crop": crop_info,
        "rotation_advice": rotation_advice
    }

@router.get("/api/fields/{field_id}/rotation-advice")
async def get_field_rotation_advice(field_id: str, db: Session = Depends(get_db)):
    """Get smart non-forcing crop rotation suggestions for a field"""
    field = db.query(Field).filter(Field.field_id == field_id).first()
    if not field:
        return JSONResponse(
            status_code=404,
            content={"error": "field_not_found", "message": f"Field '{field_id}' not found"}
        )
    
    return generate_rotation_advice(field.crop_type)


# ============================================================================
# TELEMETRY & FIELD DATA ENDPOINTS
# ============================================================================

@router.get("/api/fields/{field_id}/telemetry")
async def get_field_telemetry(field_id: str, days: int = 45, db: Session = Depends(get_db)):
    """Get historical telemetry timeseries from real satellite/weather data, with mock fallback"""
    field = db.query(Field).filter(Field.field_id == field_id).first()
    if not field:
        return JSONResponse(
            status_code=404,
            content={"error": "field_not_found", "message": f"Field '{field_id}' not found"}
        )

    try:
        result = get_real_telemetry_history(
            field_lat=field.boundary_lat,
            field_lng=field.boundary_lng,
            field_id=field_id,
            days=days,
        )
        if result:
            return result
    except Exception as e:
        print(f"[endpoints] Live telemetry failed, falling back to mock: {e}")

    # Fallback to mock-generated telemetry
    return generate_field_telemetry_history(field_id=field_id, days=days, crop_type=field.crop_type)


# ============================================================================
# USER-DRAWN POLYGON ENDPOINTS
# ============================================================================

@router.post("/api/fields")
async def create_field_from_polygon(request: CreateFieldRequestSchema, db: Session = Depends(get_db)):
    """Create a new field from a user-drawn polygon.
    The polygon is registered on Agromonitoring for soil/NDVI data."""
    farm = db.query(Farm).filter(Farm.farm_id == request.farm_id).first()
    if not farm:
        return JSONResponse(
            status_code=400,
            content={"error": "invalid_farm_id", "message": f"Farm {request.farm_id} not found"}
        )

    # Compute centroid and area
    centroid_lat, centroid_lng = compute_polygon_centroid(request.polygon)
    area_ha = compute_polygon_area_hectares(request.polygon)

    # Create field row first (need field_id for the polygon name)
    field_id = f"field-{str(uuid.uuid4())[:8]}"
    field = Field(
        field_id=field_id,
        farm_id=request.farm_id,
        name=request.name,
        crop_type=request.crop_type,
        boundary_lat=centroid_lat,
        boundary_lng=centroid_lng,
        area_hectares=area_ha,
    )
    db.add(field)
    db.commit()
    db.refresh(field)

    # Create Agromonitoring polygon from drawn coords
    polyid = create_polygon_from_coords(request.name, request.polygon)
    if polyid:
        set_polygon_override(field_id, polyid, request.polygon)
        print(f"[endpoints] Created field '{request.name}' with Agromonitoring polygon {polyid}")
    else:
        print(f"[endpoints] Warning: field '{request.name}' created but Agromonitoring polygon failed")

    # Return field in the same shape as GET /api/fields/{id}
    return {
        "field_id": field.field_id,
        "farm_id": field.farm_id,
        "name": field.name,
        "crop_type": field.crop_type,
        "boundary": {
            "lat": field.boundary_lat,
            "lng": field.boundary_lng
        },
        "polygon": request.polygon,
        "area_hectares": area_ha,
        "anomalies": []
    }


@router.post("/api/fields/{field_id}/analyze-area")
async def analyze_drawn_area(
    field_id: str,
    db: Session = Depends(get_db),
):
    """Analyze a drawn area: fetch live soil/NDVI/weather + anomaly detection.
    Persists Anomaly + Evidence + Diagnosis + Recommendation so the field page
    renders the full evidence section. Returns evidence + telemetry + anomaly summary."""
    field = db.query(Field).filter(Field.field_id == field_id).first()
    if not field:
        return JSONResponse(
            status_code=404,
            content={"error": "field_not_found", "message": f"Field '{field_id}' not found"}
        )

    # Fetch evidence from live sources
    evidence = build_evidence_from_live(
        field_id=field_id,
        field_lat=field.boundary_lat,
        field_lng=field.boundary_lng,
        crop_type=field.crop_type,
        zone="drawn_area",
    )

    # Fetch telemetry timeline
    telemetry = []
    try:
        telemetry = get_real_telemetry_history(
            field_lat=field.boundary_lat,
            field_lng=field.boundary_lng,
            field_id=field_id,
            days=45,
        )
    except Exception as e:
        print(f"[endpoints] Live telemetry failed for drawn area: {e}")
        telemetry = generate_field_telemetry_history(
            field_id=field_id, days=45, crop_type=field.crop_type
        )

    # Anomaly detection against crop optimal range
    crop_info = get_crop_by_id(field.crop_type)
    severity = 0.0
    anomaly_type = "healthy"
    if evidence.get("soil_moisture_percent") is not None and crop_info:
        optimal = crop_info.get("optimal_soil_moisture_percent", {})
        if isinstance(optimal, dict):
            opt_min = optimal.get("min", 20)
            opt_max = optimal.get("max", 40)
        else:
            opt_min, opt_max = 20, 40
        sm = evidence["soil_moisture_percent"]
        if sm < opt_min:
            severity = min(1.0, (opt_min - sm) / opt_min)
            anomaly_type = "water_stress"
        elif sm > opt_max:
            severity = min(1.0, (sm - opt_max) / opt_max)
            anomaly_type = "waterlogging"

    confidence = 0.9 if evidence.get("_live_sources", {}).get("soil_available") else 0.6

    # Persist as a full analyzed field: Anomaly + Evidence + Diagnosis + Recommendation
    persisted_anomaly_id = None
    try:
        anomaly = Anomaly(
            anomaly_id=str(uuid.uuid4()),
            field_id=field_id,
            image_id=None,
            anomaly_type=anomaly_type,
            severity=round(severity, 2),
            confidence=confidence,
            zone="drawn_area",
            detected_lat=field.boundary_lat,
            detected_lng=field.boundary_lng,
        )
        db.add(anomaly)
        db.commit()
        db.refresh(anomaly)
        persisted_anomaly_id = anomaly.anomaly_id

        # generate_mock_diagnosis adds Evidence + Diagnosis + Recommendation rows
        generate_mock_diagnosis(anomaly.anomaly_id, field_id, anomaly_type, evidence, db)
        db.commit()
    except Exception as e:
        print(f"[endpoints] Failed to persist drawn-area analysis: {e}")
        db.rollback()

    return {
        "field_id": field_id,
        "anomaly_id": persisted_anomaly_id,
        "name": field.name,
        "boundary": {
            "lat": field.boundary_lat,
            "lng": field.boundary_lng,
        },
        "polygon": get_field_polygon_coords(
            field.boundary_lat, field.boundary_lng, field_id
        ),
        "evidence": evidence,
        "telemetry": telemetry,
        "anomaly_summary": {
            "anomaly_type": anomaly_type,
            "severity": round(severity, 2),
            "confidence": confidence,
            "zone": "drawn_area",
            "crop_type": field.crop_type,
        },
    }


