-- Crop Health Agent Database Schema (Ultra-Safe MVP)
-- PostgreSQL 12+
-- Purpose: Store farms, fields, anomalies, diagnoses, and recommendations

-- ============================================================================
-- FARMS
-- ============================================================================
CREATE TABLE farms (
  farm_id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  area_hectares DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- FIELDS
-- ============================================================================
CREATE TABLE fields (
  field_id VARCHAR(36) PRIMARY KEY,
  farm_id VARCHAR(36) NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  crop_type VARCHAR(100),
  boundary_lat DECIMAL(10, 8),
  boundary_lng DECIMAL(11, 8),
  area_hectares DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_farm_id (farm_id)
);

-- ============================================================================
-- IMAGES
-- ============================================================================
CREATE TABLE images (
  image_id VARCHAR(36) PRIMARY KEY,
  field_id VARCHAR(36) NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  source VARCHAR(100),
  resolution_width INT,
  resolution_height INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_field_id (field_id)
);

-- ============================================================================
-- ANOMALIES
-- ============================================================================
CREATE TABLE anomalies (
  anomaly_id VARCHAR(36) PRIMARY KEY,
  field_id VARCHAR(36) NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  image_id VARCHAR(36) REFERENCES images(image_id) ON DELETE SET NULL,
  anomaly_type VARCHAR(100) NOT NULL, -- water_stress, fungal_disease, nutrient_deficiency
  severity DECIMAL(3, 2) NOT NULL, -- 0.0 to 1.0
  confidence DECIMAL(3, 2) NOT NULL, -- 0.0 to 1.0
  zone VARCHAR(50), -- e.g., "B3"
  detected_lat DECIMAL(10, 8),
  detected_lng DECIMAL(11, 8),
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_field_id (field_id),
  INDEX idx_anomaly_type (anomaly_type)
);

-- ============================================================================
-- DIAGNOSES
-- ============================================================================
CREATE TABLE diagnoses (
  diagnosis_id VARCHAR(36) PRIMARY KEY,
  anomaly_id VARCHAR(36) NOT NULL UNIQUE REFERENCES anomalies(anomaly_id) ON DELETE CASCADE,
  probable_cause VARCHAR(500) NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL, -- 0.0 to 1.0
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_anomaly_id (anomaly_id)
);

-- ============================================================================
-- EVIDENCE (Stores environmental data tied to each anomaly)
-- ============================================================================
CREATE TABLE evidence (
  evidence_id VARCHAR(36) PRIMARY KEY,
  anomaly_id VARCHAR(36) NOT NULL UNIQUE REFERENCES anomalies(anomaly_id) ON DELETE CASCADE,
  soil_moisture_percent DECIMAL(5, 2),
  rainfall_7d_mm DECIMAL(6, 2),
  temperature_c DECIMAL(5, 2),
  humidity_percent DECIMAL(5, 2),
  vegetation_ndvi_change DECIMAL(4, 2),
  captured_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_anomaly_id (anomaly_id)
);

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================
CREATE TABLE recommendations (
  recommendation_id VARCHAR(36) PRIMARY KEY,
  anomaly_id VARCHAR(36) NOT NULL UNIQUE REFERENCES anomalies(anomaly_id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- prioritize_irrigation, apply_fungicide, fertilize_nitrogen, etc.
  priority INT NOT NULL, -- 1 (urgent), 2 (high), 3 (medium)
  target_zone VARCHAR(50), -- e.g., "B3"
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_anomaly_id (anomaly_id)
);

-- ============================================================================
-- INDEXES (Additional for common queries)
-- ============================================================================
CREATE INDEX idx_anomalies_farm_id ON anomalies(field_id); -- Find all anomalies for a farm
CREATE INDEX idx_images_uploaded_at ON images(uploaded_at); -- Recent uploads
CREATE INDEX idx_fields_farm_created ON fields(farm_id, created_at); -- Field listings

-- ============================================================================
-- SAMPLE DATA (For testing during development)
-- ============================================================================
INSERT INTO farms (farm_id, name, location, area_hectares)
VALUES ('farm-001', 'Sindh Agricultural Farm', 'Karachi, Pakistan', 200.00);

INSERT INTO fields (field_id, farm_id, name, crop_type, boundary_lat, boundary_lng, area_hectares)
VALUES 
  ('field-001', 'farm-001', 'Field B', 'wheat', 31.5204, 74.3587, 50.00),
  ('field-002', 'farm-001', 'Field C', 'rice', 31.5200, 74.3600, 75.00);

INSERT INTO images (image_id, field_id, image_url, source, resolution_width, resolution_height)
VALUES ('img-001', 'field-001', 'https://bucket.s3.amazonaws.com/field-b-2024.jpg', 'drone', 1920, 1080);

INSERT INTO anomalies (anomaly_id, field_id, image_id, anomaly_type, severity, confidence, zone, detected_lat, detected_lng)
VALUES ('anom-001', 'field-001', 'img-001', 'water_stress', 0.85, 0.87, 'B3', 31.5204, 74.3587);

INSERT INTO diagnoses (diagnosis_id, anomaly_id, probable_cause, confidence, reasoning)
VALUES 
  ('diag-001', 'anom-001', 'Likely water stress caused by prolonged low soil moisture and insufficient rainfall.', 0.87, 
   'Low soil moisture (18%) + low rainfall (2mm in 7 days) + high temperature (34°C) + negative vegetation change indicate classic water stress pattern.');

INSERT INTO evidence (evidence_id, anomaly_id, soil_moisture_percent, rainfall_7d_mm, temperature_c, humidity_percent, vegetation_ndvi_change)
VALUES ('evid-001', 'anom-001', 18, 2, 34, 45, -0.14);

INSERT INTO recommendations (recommendation_id, anomaly_id, action, priority, target_zone, description)
VALUES ('rec-001', 'anom-001', 'prioritize_irrigation', 1, 'B3', 'Prioritize irrigation for Zone B3 to restore soil moisture.');

-- ============================================================================
-- VIEW: Anomaly with Diagnosis & Recommendation (for convenient querying)
-- ============================================================================
CREATE VIEW anomalies_full AS
SELECT 
  a.anomaly_id,
  a.field_id,
  a.anomaly_type,
  a.severity,
  a.confidence,
  a.zone,
  a.detected_lat,
  a.detected_lng,
  d.probable_cause,
  d.reasoning,
  d.confidence AS diagnosis_confidence,
  e.soil_moisture_percent,
  e.rainfall_7d_mm,
  e.temperature_c,
  e.humidity_percent,
  e.vegetation_ndvi_change,
  r.action,
  r.priority,
  r.target_zone,
  r.description AS recommendation_description,
  a.created_at
FROM anomalies a
LEFT JOIN diagnoses d ON a.anomaly_id = d.anomaly_id
LEFT JOIN evidence e ON a.anomaly_id = e.anomaly_id
LEFT JOIN recommendations r ON a.anomaly_id = r.anomaly_id;
