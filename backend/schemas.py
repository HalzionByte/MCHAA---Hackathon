from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime

# ===== Error Response =====
class ErrorResponseSchema(BaseModel):
    error: str
    message: str

# ===== Farmer Decision =====
class FarmerDecisionSchema(BaseModel):
    status_color: str  # RED, YELLOW, GREEN
    status_emoji: str  # 🚨, ⚠️, ✅
    headline_what: str
    headline_why: str
    urgency_hours: int

# ===== Impact Metrics =====
class ImpactMetricsSchema(BaseModel):
    crop_loss_saved_usd: float
    water_saved_liters: float
    cost_saved_usd: float

# ===== Voice Response =====
class VoiceResponseSchema(BaseModel):
    anomaly_id: str
    audio_url: str
    spoken_script: str

# ===== SMS Response =====
class SMSResponseSchema(BaseModel):
    anomaly_id: str
    sms_text: str
    character_count: int

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
    coordinates: dict

# ===== Anomaly (Full Response) =====
class AnomalyResponseSchema(BaseModel):
    anomaly_id: str
    field_id: str
    anomaly_type: str
    severity: float
    confidence: float
    detected_region: DetectedRegionSchema
    farmer_decision: FarmerDecisionSchema
    impact_metrics: ImpactMetricsSchema
    voice_audio_url: str
    sms_text: str
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

    @field_validator('image_url')
    @classmethod
    def validate_image_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("image_url cannot be empty")
        val = v.strip()
        if not (val.startswith('http://') or val.startswith('https://')):
            raise ValueError("image_url must start with http:// or https://")
        return val

    @field_validator('field_id')
    @classmethod
    def validate_field_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("field_id cannot be empty")
        return v.strip()


# ===== Field Response =====
class FieldAnomalySchema(BaseModel):
    anomaly_id: str
    anomaly_type: str
    severity: float
    zone: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class FieldResponseSchema(BaseModel):
    field_id: str
    farm_id: str
    name: str
    crop_type: Optional[str] = None
    boundary: dict
    anomalies: List[FieldAnomalySchema] = []
    
    class Config:
        from_attributes = True

# ===== Farm Field Summary =====
class FarmFieldSchema(BaseModel):
    field_id: str
    name: str
    crop_type: Optional[str] = None
    status: str
    anomaly_count: int
    last_analyzed: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ===== Farm Response =====
class FarmResponseSchema(BaseModel):
    farm_id: str
    name: str
    location: Optional[str] = None
    fields: List[FarmFieldSchema] = []
    
    class Config:
        from_attributes = True

# ===== Update Field Crop Request =====
class UpdateFieldCropSchema(BaseModel):
    crop_type: str

    @field_validator('crop_type')
    @classmethod
    def validate_crop_type(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("crop_type cannot be empty")
        return v.strip().lower()

# ===== Crop Disease Info =====
class CropDiseaseSchema(BaseModel):
    name: str
    symptoms: str
    risk_factor: str

# ===== Crop Optimal Moisture =====
class OptimalMoistureSchema(BaseModel):
    min: float
    max: float

# ===== Crop Schema =====
class CropSchema(BaseModel):
    crop_id: str
    name: str
    local_name: str
    season: str
    season_months: str
    water_requirement_mm: float
    water_range: str
    optimal_soil_moisture_percent: OptimalMoistureSchema
    soil_ph_range: str
    growth_duration_days: int
    description: str
    common_diseases: List[CropDiseaseSchema]
    recommended_rotation_crops: List[str]
    rotation_benefits: str

# ===== Telemetry Timeseries Data Point =====
class TelemetryDataPointSchema(BaseModel):
    date: str
    ndvi: float
    soil_moisture: float
    temperature: float
    rainfall: float
    humidity: float


# ===== Service Marketplace Schemas =====
class ServiceProviderSchema(BaseModel):
    provider_id: str
    name: str
    service_type: str
    district: str
    price_per_acre_pkr: float
    rating: float
    phone: str
    eta_hours: int

    class Config:
        from_attributes = True

class DispatchServiceRequestSchema(BaseModel):
    field_id: str
    provider_id: str
    anomaly_id: Optional[str] = None
    acres: float = 1.0

class DispatchServiceResponseSchema(BaseModel):
    dispatch_id: str
    field_id: str
    provider_name: str
    service_type: str
    status: str
    acres: float
    total_cost_pkr: float
    eta_hours: int
    confirmation_code: str
    created_at: str

class CostSavingsCalculatorSchema(BaseModel):
    acres: float
    anomaly_severity: float
    blanket_spray_cost_pkr: float
    spot_drone_cost_pkr: float
    savings_pkr: float
    savings_percent: float
    water_saved_liters: float
    chemical_reduction_pct: float


# ===== Feature 3: WhatsApp Work Order Schemas =====
class WhatsAppWorkOrderRequestSchema(BaseModel):
    field_id: str
    anomaly_id: Optional[str] = None
    worker_name: str = "Field Worker"
    worker_phone: str = "+923001234567"
    dialect: str = "ur"  # ur, pa, sd, en
    sector: Optional[str] = "Zone B3"
    action: Optional[str] = "Pesticide Spraying"
    dosage: Optional[str] = "250 ml/acre"

class WhatsAppWorkOrderResponseSchema(BaseModel):
    work_order_id: str
    field_id: str
    worker_phone: str
    dialect: str
    spoken_audio_script: str
    audio_url: str
    whatsapp_deep_link: str
    status: str
    created_at: str

class WorkOrderConfirmRequestSchema(BaseModel):
    work_order_id: str
    photo_url: Optional[str] = None
    note: Optional[str] = None


# ===== Feature 6: PakAgri-Vision Dataset Exporter Schemas =====
class RLHFFeedbackRequestSchema(BaseModel):
    anomaly_id: str
    agronomist_label: str          # corrected anomaly type label
    corrected_cause: Optional[str] = None
    notes: Optional[str] = None

class DatasetExportQuerySchema(BaseModel):
    fmt: str = "jsonl"             # jsonl | coco | huggingface
    limit: int = 500





