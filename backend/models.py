from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
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
    updated_at = Column(DateTime, default=datetime.utcnow)
    
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
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    farm = relationship("Farm", back_populates="fields")
    anomalies = relationship("Anomaly", back_populates="field", cascade="all, delete-orphan")
    images = relationship("Image", back_populates="field", cascade="all, delete-orphan")

class Image(Base):
    __tablename__ = "images"
    
    image_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    field_id = Column(String(36), ForeignKey("fields.field_id"), nullable=False)
    image_url = Column(Text, nullable=False)
    source = Column(String(100))
    resolution_width = Column(Integer)
    resolution_height = Column(Integer)
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
    priority = Column(Integer, nullable=False)
    target_zone = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    anomaly = relationship("Anomaly", back_populates="recommendation")


class ServiceProvider(Base):
    __tablename__ = "service_providers"

    provider_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    service_type = Column(String(50), nullable=False)  # drone_spray, tractor_spray, harvester
    district = Column(String(100), nullable=False, default="Multan")
    price_per_acre_pkr = Column(Float, nullable=False)
    rating = Column(Float, default=4.8)
    phone = Column(String(50), nullable=False)
    eta_hours = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.utcnow)

class ServiceDispatch(Base):
    __tablename__ = "service_dispatches"

    dispatch_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    field_id = Column(String(36), ForeignKey("fields.field_id"), nullable=False)
    anomaly_id = Column(String(36), ForeignKey("anomalies.anomaly_id"), nullable=True)
    provider_id = Column(String(36), ForeignKey("service_providers.provider_id"), nullable=False)
    status = Column(String(50), default="requested")  # requested, dispatched, in_transit, completed
    acres = Column(Float, default=1.0)
    total_cost_pkr = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkOrder(Base):
    __tablename__ = "work_orders"

    work_order_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    field_id = Column(String(36), ForeignKey("fields.field_id"), nullable=False)
    anomaly_id = Column(String(36), ForeignKey("anomalies.anomaly_id"), nullable=True)
    worker_name = Column(String(100), default="Field Worker")
    worker_phone = Column(String(50), nullable=False)
    dialect = Column(String(20), default="ur")  # ur, pa, sd, en
    instructions = Column(Text, nullable=False)
    status = Column(String(50), default="dispatched")  # dispatched, confirmed, completed
    confirmation_photo_url = Column(Text, nullable=True)
    confirmation_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)



