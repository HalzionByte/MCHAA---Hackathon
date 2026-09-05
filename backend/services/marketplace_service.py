from sqlalchemy.orm import Session
from models import ServiceProvider, ServiceDispatch, Field
import uuid
from datetime import datetime

SEED_PROVIDERS = [
    {
        "provider_id": "prov-001",
        "name": "PakAgri Aero-Drones Multan",
        "service_type": "drone_spray",
        "district": "Multan",
        "price_per_acre_pkr": 1200.0,
        "rating": 4.9,
        "phone": "+92 300 8472910",
        "eta_hours": 1,
    },
    {
        "provider_id": "prov-002",
        "name": "Indus Precision Drone Fleet",
        "service_type": "drone_spray",
        "district": "Faisalabad",
        "price_per_acre_pkr": 1350.0,
        "rating": 4.8,
        "phone": "+92 312 9988771",
        "eta_hours": 2,
    },
    {
        "provider_id": "prov-003",
        "name": "Kisan Heavy Tractor Sprayers",
        "service_type": "tractor_spray",
        "district": "Multan",
        "price_per_acre_pkr": 950.0,
        "rating": 4.6,
        "phone": "+92 301 7766554",
        "eta_hours": 3,
    },
    {
        "provider_id": "prov-004",
        "name": "Sindh Precision Harvesters",
        "service_type": "harvester",
        "district": "Karachi",
        "price_per_acre_pkr": 2500.0,
        "rating": 4.7,
        "phone": "+92 333 4455667",
        "eta_hours": 4,
    },
    {
        "provider_id": "prov-005",
        "name": "GreenField Robotics & UAV",
        "service_type": "drone_spray",
        "district": "Lahore",
        "price_per_acre_pkr": 1400.0,
        "rating": 4.95,
        "phone": "+92 321 1234567",
        "eta_hours": 1,
    },
]

def seed_service_providers(db: Session):
    """Seed initial service providers if table is empty"""
    try:
        if db.query(ServiceProvider).count() == 0:
            for p in SEED_PROVIDERS:
                provider = ServiceProvider(**p)
                db.add(provider)
            db.commit()
    except Exception as e:
        print(f"[marketplace_service] Seeding error: {e}")
        db.rollback()

def get_service_providers(db: Session, district: str = None, service_type: str = None):
    seed_service_providers(db)
    query = db.query(ServiceProvider)
    if district and district.lower() != "all":
        query = query.filter(ServiceProvider.district.ilike(f"%{district}%"))
    if service_type and service_type.lower() != "all":
        query = query.filter(ServiceProvider.service_type == service_type)
    return query.all()

def calculate_spot_vs_blanket_savings(acres: float = 10.0, anomaly_severity: float = 0.8, price_per_acre_pkr: float = 1200.0):
    """
    Calculates cost efficiency of targeted drone spot-spraying vs. traditional blanket spraying.
    - Traditional blanket spray covers 100% of field acreage.
    - AI-directed spot spray only targets affected zones (proportional to anomaly severity, e.g. 20-30% of field).
    """
    acres = max(1.0, acres)
    affected_coverage_pct = max(0.15, min(0.60, anomaly_severity * 0.5)) # targeted zone %
    spot_acres = round(acres * affected_coverage_pct, 2)

    # Chemical & machinery cost per acre
    chemical_cost_per_acre = 2500.0
    blanket_spray_cost = round((price_per_acre_pkr + chemical_cost_per_acre) * acres, 2)
    spot_drone_cost = round((price_per_acre_pkr + (chemical_cost_per_acre * affected_coverage_pct)) * spot_acres + 500, 2) # small dispatch fee

    savings_pkr = max(0.0, round(blanket_spray_cost - spot_drone_cost, 2))
    savings_percent = round((savings_pkr / blanket_spray_cost) * 100, 1) if blanket_spray_cost > 0 else 0.0
    water_saved_liters = round(acres * (1.0 - affected_coverage_pct) * 250.0, 1) # ~250L water saved per unsprayed acre
    chemical_reduction_pct = round((1.0 - affected_coverage_pct) * 100, 1)

    return {
        "acres": acres,
        "spot_acres": spot_acres,
        "anomaly_severity": anomaly_severity,
        "blanket_spray_cost_pkr": blanket_spray_cost,
        "spot_drone_cost_pkr": spot_drone_cost,
        "savings_pkr": savings_pkr,
        "savings_percent": savings_percent,
        "water_saved_liters": water_saved_liters,
        "chemical_reduction_pct": chemical_reduction_pct,
    }

def create_service_dispatch(db: Session, field_id: str, provider_id: str, anomaly_id: str = None, acres: float = 1.0):
    seed_service_providers(db)
    provider = db.query(ServiceProvider).filter(ServiceProvider.provider_id == provider_id).first()
    if not provider:
        return None

    field = db.query(Field).filter(Field.field_id == field_id).first()
    field_acres = field.area_hectares * 2.47105 if (field and field.area_hectares) else acres

    total_cost = round(provider.price_per_acre_pkr * field_acres, 2)
    dispatch_id = f"disp-{str(uuid.uuid4())[:8]}"

    dispatch = ServiceDispatch(
        dispatch_id=dispatch_id,
        field_id=field_id,
        anomaly_id=anomaly_id,
        provider_id=provider_id,
        status="dispatched",
        acres=field_acres,
        total_cost_pkr=total_cost,
        created_at=datetime.utcnow()
    )
    db.add(dispatch)
    db.commit()
    db.refresh(dispatch)

    conf_code = f"MCHAA-DRONE-{dispatch_id[-4:].upper()}"

    return {
        "dispatch_id": dispatch.dispatch_id,
        "field_id": dispatch.field_id,
        "provider_name": provider.name,
        "service_type": provider.service_type,
        "status": dispatch.status,
        "acres": dispatch.acres,
        "total_cost_pkr": dispatch.total_cost_pkr,
        "eta_hours": provider.eta_hours,
        "confirmation_code": conf_code,
        "created_at": dispatch.created_at.isoformat()
    }
