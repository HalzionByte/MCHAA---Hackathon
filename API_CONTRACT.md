# Crop Health Agent API Contract

**Version:** 1.0 (Ultra-Safe MVP)  
**Status:** LOCKED — Do not modify without team agreement  
**Purpose:** Frontend and Backend build against this contract in parallel

---

## Core Endpoints

### 1. POST /api/analyze
**Purpose:** Upload image, trigger anomaly detection and diagnosis

**Request:**
```json
{
  "image_url": "https://bucket.s3.amazonaws.com/field-b-2024.jpg",
  "field_id": "field-001"
}
```

**Response (200 OK):**
```json
{
  "anomaly_id": "anom-001",
  "status": "analyzed",
  "anomaly_type": "water_stress",
  "severity": 0.85,
  "confidence": 0.87,
  "detected_region": {
    "zone": "B3",
    "coordinates": {
      "lat": 31.5204,
      "lng": 74.3587
    }
  },
  "evidence": {
    "soil_moisture_percent": 18,
    "rainfall_7d_mm": 2,
    "temperature_c": 34,
    "vegetation_ndvi_change": -0.14
  },
  "diagnosis": {
    "cause": "Likely water stress caused by prolonged low soil moisture and insufficient rainfall.",
    "confidence": 0.87,
    "reasoning": "Low soil moisture (18%) + low rainfall (2mm in 7 days) + high temperature (34°C) + negative vegetation change indicate classic water stress pattern."
  },
  "recommendation": {
    "action": "prioritize_irrigation",
    "priority": 1,
    "target_zone": "B3",
    "description": "Prioritize irrigation for Zone B3 to restore soil moisture."
  },
  "created_at": "2024-12-08T14:30:00Z"
}
```

**Error (400):**
```json
{
  "error": "invalid_field_id",
  "message": "Field field-001 not found"
}
```

---

### 2. GET /api/anomalies/{anomaly_id}
**Purpose:** Fetch full anomaly details (for dashboard to show analysis results)

**Response (200 OK):**
```json
{
  "anomaly_id": "anom-001",
  "field_id": "field-001",
  "anomaly_type": "water_stress",
  "severity": 0.85,
  "confidence": 0.87,
  "detected_region": {
    "zone": "B3",
    "coordinates": {
      "lat": 31.5204,
      "lng": 74.3587
    }
  },
  "evidence": {
    "soil_moisture_percent": 18,
    "rainfall_7d_mm": 2,
    "temperature_c": 34,
    "vegetation_ndvi_change": -0.14
  },
  "diagnosis": {
    "cause": "Likely water stress caused by prolonged low soil moisture and insufficient rainfall.",
    "confidence": 0.87,
    "reasoning": "Low soil moisture (18%) + low rainfall (2mm in 7 days) + high temperature (34°C) + negative vegetation change indicate classic water stress pattern."
  },
  "recommendation": {
    "action": "prioritize_irrigation",
    "priority": 1,
    "target_zone": "B3",
    "description": "Prioritize irrigation for Zone B3 to restore soil moisture."
  },
  "created_at": "2024-12-08T14:30:00Z"
}
```

---

### 3. GET /api/fields/{field_id}
**Purpose:** Get field metadata and current anomalies

**Response (200 OK):**
```json
{
  "field_id": "field-001",
  "farm_id": "farm-001",
  "name": "Field B",
  "crop_type": "wheat",
  "boundary": {
    "lat": 31.5204,
    "lng": 74.3587,
    "area_hectares": 50
  },
  "anomalies": [
    {
      "anomaly_id": "anom-001",
      "anomaly_type": "water_stress",
      "severity": 0.85,
      "zone": "B3",
      "created_at": "2024-12-08T14:30:00Z"
    }
  ]
}
```

---

### 4. GET /api/farms/{farm_id}
**Purpose:** Get farm overview (for dashboard landing page)

**Response (200 OK):**
```json
{
  "farm_id": "farm-001",
  "name": "Sindh Agricultural Farm",
  "location": "Karachi, Pakistan",
  "fields": [
    {
      "field_id": "field-001",
      "name": "Field B",
      "crop_type": "wheat",
      "status": "healthy",
      "anomaly_count": 1,
      "last_analyzed": "2024-12-08T14:30:00Z"
    },
    {
      "field_id": "field-002",
      "name": "Field C",
      "crop_type": "rice",
      "status": "healthy",
      "anomaly_count": 0,
      "last_analyzed": null
    }
  ]
}
```

---

## Data Structures (Shared Reference)

### Anomaly Types (MVP: Only Water Stress)
```
ANOMALY_TYPE = "water_stress" | "fungal_disease" | "nutrient_deficiency"
```

For MVP: Implement only `water_stress`. Others can be added in v2.

### Severity Scale
- 0.0 - 0.3: Low
- 0.3 - 0.7: Medium
- 0.7 - 1.0: High

### Priority Scale
1 = Urgent (immediate action)
2 = High (within 1-2 days)
3 = Medium (within a week)

---

## Mock Data for Development

### Mock Farm
```json
{
  "farm_id": "farm-001",
  "name": "Sindh Agricultural Farm",
  "location": "Karachi, Pakistan"
}
```

### Mock Fields
```json
{
  "field_id": "field-001",
  "farm_id": "farm-001",
  "name": "Field B",
  "crop_type": "wheat",
  "boundary": { "lat": 31.5204, "lng": 74.3587 }
}
```

### Mock Anomaly (Use This to Test Front-End Before Back-End is Ready)
```json
{
  "anomaly_id": "anom-001",
  "field_id": "field-001",
  "anomaly_type": "water_stress",
  "severity": 0.85,
  "confidence": 0.87,
  "detected_region": {
    "zone": "B3",
    "coordinates": { "lat": 31.5204, "lng": 74.3587 }
  },
  "evidence": {
    "soil_moisture_percent": 18,
    "rainfall_7d_mm": 2,
    "temperature_c": 34,
    "vegetation_ndvi_change": -0.14
  },
  "diagnosis": {
    "cause": "Likely water stress caused by prolonged low soil moisture and insufficient rainfall.",
    "confidence": 0.87,
    "reasoning": "Low soil moisture (18%) + low rainfall (2mm in 7 days) + high temperature (34°C) + negative vegetation change indicate classic water stress pattern."
  },
  "recommendation": {
    "action": "prioritize_irrigation",
    "priority": 1,
    "target_zone": "B3",
    "description": "Prioritize irrigation for Zone B3 to restore soil moisture."
  },
  "created_at": "2024-12-08T14:30:00Z"
}
```

---

## Notes for Team

- **Frontend:** Use mock anomaly data above to build dashboard layout now. Swap real endpoint once backend is ready.
- **Backend:** All responses must match the JSON schema exactly. No deviations.
- **Both:** If something doesn't fit the contract, **do not code around it**—raise it immediately.
