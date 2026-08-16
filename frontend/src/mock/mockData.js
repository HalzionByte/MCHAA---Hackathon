export const MOCK_FARM = {
  farm_id: "farm-001",
  name: "Sindh Agricultural Farm",
  location: "Karachi, Pakistan",
  fields: [
    {
      field_id: "field-001",
      name: "Field B",
      crop_type: "wheat",
      status: "alert",
      anomaly_count: 1,
      last_analyzed: "2024-12-08T14:30:00Z",
      boundary: {
        lat: 31.5204,
        lng: 74.3587
      }
    },
    {
      field_id: "field-002",
      name: "Field C",
      crop_type: "rice",
      status: "healthy",
      anomaly_count: 0,
      last_analyzed: null,
      boundary: {
        lat: 31.5200,
        lng: 74.3600
      }
    }
  ]
};

export const MOCK_FIELD = {
  field_id: "field-001",
  farm_id: "farm-001",
  name: "Field B",
  crop_type: "wheat",
  boundary: {
    lat: 31.5204,
    lng: 74.3587
  },
  anomalies: [
    {
      anomaly_id: "anom-001",
      anomaly_type: "water_stress",
      severity: 0.85,
      zone: "B3",
      created_at: "2024-12-08T14:30:00Z"
    }
  ]
};

export const MOCK_ANOMALY = {
  anomaly_id: "anom-001",
  field_id: "field-001",
  anomaly_type: "water_stress",
  severity: 0.85,
  confidence: 0.87,
  detected_region: {
    zone: "B3",
    coordinates: {
      lat: 31.5204,
      lng: 74.3587
    }
  },
  evidence: {
    soil_moisture_percent: 18,
    rainfall_7d_mm: 2,
    temperature_c: 34,
    humidity_percent: 45,
    vegetation_ndvi_change: -0.14
  },
  diagnosis: {
    cause: "Likely water stress caused by prolonged low soil moisture and insufficient rainfall.",
    confidence: 0.87,
    reasoning: "Low soil moisture (18%) + low rainfall (2mm in 7 days) + high temperature (34°C) + negative vegetation change indicate classic water stress pattern."
  },
  recommendation: {
    action: "prioritize_irrigation",
    priority: 1,
    target_zone: "B3",
    description: "Prioritize irrigation for Zone B3 to restore soil moisture."
  },
  created_at: "2024-12-08T14:30:00Z"
};
