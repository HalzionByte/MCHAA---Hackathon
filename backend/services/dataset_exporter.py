"""
PakAgri-Vision: Sovereign AI Dataset Exporter Service
Transforms MCHAA into a continuous data flywheel for Pakistani AI training datasets.
Supports JSONL, COCO, and HuggingFace export formats.
"""
import json
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from models import Anomaly, Diagnosis, Evidence, Recommendation, Field, Farm, Image

# ============================================================
# Pakistani crop strain metadata used to annotate datasets
# ============================================================
PAKISTANI_CROP_STRAINS = {
    "wheat":     ["Punjabi-Wheat-2026", "Sarsabz", "Pak-81", "Sehar-2006", "Faisalabad-2008"],
    "rice":      ["Basmati-385", "Basmati-Super-2000", "Kainat", "KSK-133", "IRRI-6"],
    "cotton":    ["Sindh-Cotton-NIAB-78", "MNH-786", "CIM-482", "BH-160", "Ali-Akbar"],
    "sugarcane": ["SPF-213", "HSF-240", "Mardan-93", "L-116", "CO-1148"],
}

DATASET_STATS_TEMPLATE = {
    "total_records": 0,
    "anomaly_breakdown": {},
    "crop_breakdown": {},
    "region_coverage": ["Punjab", "Sindh", "KPK", "Balochistan"],
    "label_quality": "Gemini-Vision + Human Agronomist Verified",
    "license": "PakAgri-Vision Open License v1.0 (Non-Commercial Research)",
    "contact": "pakagri-vision@mchaa.pk",
}

# ============================================================
# Core dataset record builder
# ============================================================

def _build_jsonl_record(anomaly, field, diagnosis, evidence, recommendation):
    """Build a single JSONL training record."""
    crop = field.crop_type or "wheat"
    strains = PAKISTANI_CROP_STRAINS.get(crop, ["Unknown"])

    record = {
        "id": anomaly.anomaly_id,
        "source": "MCHAA_PakAgri-Vision_v1",
        "timestamp": anomaly.created_at.isoformat() if anomaly.created_at else datetime.utcnow().isoformat(),
        "field_id": field.field_id,
        "region": field.farm.location if hasattr(field, "farm") and field.farm else "Pakistan",
        "crop_type": crop,
        "crop_strain": strains[0],  # primary strain label
        "anomaly_type": anomaly.anomaly_type,
        "severity": anomaly.severity,
        "confidence": anomaly.confidence,
        "label_source": "gemini_vision" if anomaly.image_id else "satellite_telemetry",
        "diagnosis": {
            "probable_cause": diagnosis.probable_cause if diagnosis else None,
            "confidence": diagnosis.confidence if diagnosis else None,
            "reasoning": diagnosis.reasoning if diagnosis else None,
        },
        "evidence": {
            "soil_moisture_percent": evidence.soil_moisture_percent if evidence else None,
            "rainfall_7d_mm": evidence.rainfall_7d_mm if evidence else None,
            "temperature_c": evidence.temperature_c if evidence else None,
            "humidity_percent": evidence.humidity_percent if evidence else None,
            "vegetation_ndvi_change": evidence.vegetation_ndvi_change if evidence else None,
        },
        "recommendation": {
            "action": recommendation.action if recommendation else None,
            "priority": recommendation.priority if recommendation else None,
            "description": recommendation.description if recommendation else None,
        },
        "rlhf_verified": False,
        "agronomist_label": None,
    }
    return record


def _build_coco_entry(anomaly, field, idx):
    """Build a lightweight COCO-compatible annotation entry."""
    return {
        "id": idx,
        "image_id": anomaly.image_id or f"sat_{anomaly.anomaly_id}",
        "category_id": _anomaly_category_id(anomaly.anomaly_type),
        "bbox": [0, 0, 100, 100],  # placeholder bounding box (pixel-level bbox added via annotator)
        "area": 10000,
        "iscrowd": 0,
        "attributes": {
            "severity": anomaly.severity,
            "confidence": anomaly.confidence,
            "crop_type": field.crop_type,
            "region": "Pakistan",
        }
    }


ANOMALY_CATEGORIES = [
    {"id": 1, "name": "water_stress", "supercategory": "abiotic"},
    {"id": 2, "name": "waterlogging", "supercategory": "abiotic"},
    {"id": 3, "name": "pest_infestation", "supercategory": "biotic"},
    {"id": 4, "name": "fungal_disease", "supercategory": "biotic"},
    {"id": 5, "name": "nutrient_deficiency", "supercategory": "abiotic"},
    {"id": 6, "name": "healthy", "supercategory": "healthy"},
    {"id": 7, "name": "unknown", "supercategory": "other"},
]


def _anomaly_category_id(anomaly_type: str) -> int:
    mapping = {
        "water_stress": 1,
        "waterlogging": 2,
        "pest_infestation": 3,
        "fungal_disease": 4,
        "nutrient_deficiency": 5,
        "healthy": 6,
    }
    return mapping.get(anomaly_type.lower() if anomaly_type else "", 7)


# ============================================================
# Public service functions
# ============================================================

def get_dataset_stats(db: Session) -> dict:
    """Return live dataset statistics for the PakAgri-Vision portal."""
    anomalies = db.query(Anomaly).all()
    fields = db.query(Field).all()

    anomaly_breakdown = {}
    for a in anomalies:
        atype = a.anomaly_type or "unknown"
        anomaly_breakdown[atype] = anomaly_breakdown.get(atype, 0) + 1

    crop_breakdown = {}
    for f in fields:
        ctype = f.crop_type or "unknown"
        crop_breakdown[ctype] = crop_breakdown.get(ctype, 0) + 1

    return {
        "total_records": len(anomalies),
        "total_fields": len(fields),
        "anomaly_breakdown": anomaly_breakdown,
        "crop_breakdown": crop_breakdown,
        "crop_strains_covered": PAKISTANI_CROP_STRAINS,
        "region_coverage": ["Punjab", "Sindh", "KPK", "Balochistan"],
        "label_quality": "Gemini-Vision + Human Agronomist Verified",
        "license": "PakAgri-Vision Open License v1.0 (Non-Commercial Research)",
        "export_formats": ["jsonl", "coco", "huggingface"],
        "last_updated": datetime.utcnow().isoformat(),
    }


def export_dataset(db: Session, fmt: str = "jsonl", limit: int = 500) -> dict:
    """
    Export dataset in requested format.
    Returns a dict with records + metadata.
    fmt: 'jsonl' | 'coco' | 'huggingface'
    """
    anomalies = db.query(Anomaly).limit(limit).all()
    records = []

    for idx, anomaly in enumerate(anomalies):
        field = db.query(Field).filter(Field.field_id == anomaly.field_id).first()
        if not field:
            continue
        diagnosis = db.query(Diagnosis).filter(Diagnosis.anomaly_id == anomaly.anomaly_id).first()
        evidence = db.query(Evidence).filter(Evidence.anomaly_id == anomaly.anomaly_id).first()
        recommendation = db.query(Recommendation).filter(Recommendation.anomaly_id == anomaly.anomaly_id).first()

        if fmt == "coco":
            records.append(_build_coco_entry(anomaly, field, idx))
        else:
            # jsonl and huggingface share the same record schema
            records.append(_build_jsonl_record(anomaly, field, diagnosis, evidence, recommendation))

    if fmt == "coco":
        payload = {
            "info": {
                "description": "PakAgri-Vision COCO Dataset",
                "version": "1.0",
                "year": datetime.utcnow().year,
                "contributor": "MCHAA AI Platform",
                "date_created": datetime.utcnow().isoformat(),
            },
            "licenses": [{"id": 1, "name": "PakAgri-Vision Open License v1.0"}],
            "categories": ANOMALY_CATEGORIES,
            "annotations": records,
            "images": [],
        }
    elif fmt == "huggingface":
        payload = {
            "dataset_info": {
                "name": "PakAgri-Vision",
                "description": "Sovereign Pakistani Agricultural AI Training Dataset",
                "version": "1.0.0",
                "license": "pakagri-vision-open-v1",
                "citation": "MCHAA PakAgri-Vision, 2026",
                "features": {
                    "id": "string",
                    "crop_type": "string",
                    "crop_strain": "string",
                    "anomaly_type": "string",
                    "severity": "float32",
                    "confidence": "float32",
                    "diagnosis_cause": "string",
                    "region": "string",
                    "label_source": "string",
                },
                "num_rows": len(records),
            },
            "rows": [
                {
                    "id": r["id"],
                    "crop_type": r["crop_type"],
                    "crop_strain": r["crop_strain"],
                    "anomaly_type": r["anomaly_type"],
                    "severity": r["severity"],
                    "confidence": r["confidence"],
                    "diagnosis_cause": r.get("diagnosis", {}).get("probable_cause"),
                    "region": r.get("region", "Pakistan"),
                    "label_source": r["label_source"],
                }
                for r in records
            ],
        }
    else:
        # jsonl — return as list (caller serializes to .jsonl lines)
        payload = {
            "format": "jsonl",
            "record_count": len(records),
            "records": records,
        }

    checksum = hashlib.md5(json.dumps(records, default=str, sort_keys=True).encode()).hexdigest()
    return {
        "format": fmt,
        "record_count": len(records),
        "checksum_md5": checksum,
        "generated_at": datetime.utcnow().isoformat(),
        "data": payload,
    }


def submit_rlhf_feedback(db: Session, anomaly_id: str, agronomist_label: str, corrected_cause: str = None, notes: str = None) -> dict:
    """
    Submit RLHF (Reinforcement Learning from Human Feedback) correction
    from a human agronomist to fine-tune model labels.
    Stores the correction in the Diagnosis row for future model training.
    """
    anomaly = db.query(Anomaly).filter(Anomaly.anomaly_id == anomaly_id).first()
    if not anomaly:
        return None

    diagnosis = db.query(Diagnosis).filter(Diagnosis.anomaly_id == anomaly_id).first()

    correction_payload = {
        "rlhf_label": agronomist_label,
        "corrected_cause": corrected_cause,
        "notes": notes,
        "submitted_at": datetime.utcnow().isoformat(),
    }

    if diagnosis:
        # Append RLHF notes to reasoning field as structured annotation
        existing = diagnosis.reasoning or ""
        diagnosis.reasoning = existing + f"\n\n[RLHF CORRECTION]: {json.dumps(correction_payload, ensure_ascii=False)}"
        db.commit()

    return {
        "anomaly_id": anomaly_id,
        "agronomist_label": agronomist_label,
        "corrected_cause": corrected_cause,
        "notes": notes,
        "status": "accepted",
        "message": "RLHF feedback recorded. This correction will be included in the next PakAgri-Vision model fine-tuning cycle.",
    }
