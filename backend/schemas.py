from pydantic import BaseModel
from typing import Optional, List
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
    coordinates: dict

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
