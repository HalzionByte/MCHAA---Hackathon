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
      confidence: 0.87,
      detected_region: {
        zone: "B3",
        coordinates: {
          lat: 31.5204,
          lng: 74.3587
        }
      },
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
  farmer_decision: {
    status_color: "RED",
    status_emoji: "\u{1F6A8}",
    headline_what: "WATER ZONE B3 TODAY",
    headline_why: "Soil is dry (18% moisture) and heat is high (34\u00B0C).",
    urgency_hours: 24
  },
  impact_metrics: {
    crop_loss_saved_usd: 450,
    water_saved_liters: 3000,
    cost_saved_usd: 120
  },
  voice_audio_url: "/api/anomalies/anom-001/voice",
  sms_text: "[CROP ALERT] Zone B3 RED. Water needed in 24h. Reason: 18% moisture. Crop loss saved: $450.",
  created_at: "2024-12-08T14:30:00Z"
};

export const MOCK_TELEMETRY_HISTORY = {
  "field-001": Array.from({ length: 45 }, (_, i) => {
    const date = new Date(Date.now() - (44 - i) * 86400000);
    return {
      date: date.toISOString().split('T')[0],
      ndvi: Math.max(0.1, Math.min(1, 0.65 + Math.sin(i * 0.3) * 0.08 + (Math.random() - 0.5) * 0.02)),
      soil_moisture: Math.max(5, 22 + Math.sin(i * 0.2) * 8 + (Math.random() - 0.5) * 3),
      temperature: Math.max(10, 28 + Math.sin(i * 0.15) * 6 + (Math.random() - 0.5) * 2),
      rainfall: Math.max(0, Math.sin(i * 0.4) * 5 + (Math.random() - 0.3) * 3),
      humidity: Math.max(20, Math.min(100, 55 + Math.sin(i * 0.1) * 15 + (Math.random() - 0.5) * 5)),
    };
  }),
  "field-002": Array.from({ length: 45 }, (_, i) => {
    const date = new Date(Date.now() - (44 - i) * 86400000);
    return {
      date: date.toISOString().split('T')[0],
      ndvi: Math.max(0.1, Math.min(1, 0.72 + Math.sin(i * 0.25) * 0.05 + (Math.random() - 0.5) * 0.015)),
      soil_moisture: Math.max(10, 35 + Math.sin(i * 0.18) * 10 + (Math.random() - 0.5) * 2),
      temperature: Math.max(10, 26 + Math.sin(i * 0.12) * 4 + (Math.random() - 0.5) * 1.5),
      rainfall: Math.max(0, Math.sin(i * 0.35) * 8 + (Math.random() - 0.2) * 4),
      humidity: Math.max(20, Math.min(100, 62 + Math.sin(i * 0.08) * 12 + (Math.random() - 0.5) * 4)),
    };
  }),
};