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

export const MOCK_CROPS = [
  {
    crop_id: "wheat",
    name: "Wheat",
    local_name: "Gandum (گندم)",
    season: "Rabi",
    season_months: "Nov - Apr",
    water_requirement_mm: 400,
    water_range: "350 - 500 mm",
    optimal_soil_moisture_percent: { min: 25.0, max: 35.0 },
    soil_ph_range: "6.0 - 7.5",
    growth_duration_days: 140,
    description: "Primary Rabi staple crop in Pakistan.",
    common_diseases: [
      { name: "Leaf Rust", symptoms: "Orange-brown pustules on leaves", risk_factor: "High humidity" },
      { name: "Stripe Rust", symptoms: "Yellow streaks along leaf veins", risk_factor: "Cool moist weather" },
      { name: "Heat & Water Stress", symptoms: "Premature grain shriveling", risk_factor: "Temp >32°C + moisture <20%" },
    ],
    recommended_rotation_crops: ["cotton", "rice", "sugarcane"],
    rotation_benefits: "Balances soil after Kharif heavy feeders like Cotton and Rice.",
  },
  {
    crop_id: "rice",
    name: "Rice / Paddy",
    local_name: "Chawal (چاول / دھان)",
    season: "Kharif",
    season_months: "May - Nov",
    water_requirement_mm: 1400,
    water_range: "1200 - 1600 mm",
    optimal_soil_moisture_percent: { min: 45.0, max: 65.0 },
    soil_ph_range: "5.5 - 7.0",
    growth_duration_days: 120,
    description: "High water requirement Kharif crop cultivated in Punjab and Sindh.",
    common_diseases: [
      { name: "Bacterial Leaf Blight", symptoms: "Water-soaked lesions turning pale yellow", risk_factor: "High rainfall, humidity >80%" },
      { name: "Rice Blast", symptoms: "Spindle-shaped lesions on leaves", risk_factor: "Cool nights, high humidity" },
      { name: "Moisture Deficit", symptoms: "Leaf rolling and root desiccation", risk_factor: "Moisture drops below 35%" },
    ],
    recommended_rotation_crops: ["wheat", "berseem"],
    rotation_benefits: "Rotating paddy with wheat breaks soil compaction.",
  },
  {
    crop_id: "cotton",
    name: "Cotton",
    local_name: "Kapaas (کپاس)",
    season: "Kharif",
    season_months: "May - Nov",
    water_requirement_mm: 850,
    water_range: "700 - 1000 mm",
    optimal_soil_moisture_percent: { min: 20.0, max: 30.0 },
    soil_ph_range: "6.0 - 8.0",
    growth_duration_days: 165,
    description: "Major cash crop in Southern Punjab and Sindh.",
    common_diseases: [
      { name: "Leaf Curl Virus", symptoms: "Leaf margins curling, vein thickening", risk_factor: "Whitefly explosion in hot dry weather" },
      { name: "Pink Bollworm", symptoms: "Damaged bolls with lint staining", risk_factor: "Late season boll formation" },
      { name: "Waterlogging Stress", symptoms: "Wilting from standing water", risk_factor: "Moisture >40% for 48+ hours" },
    ],
    recommended_rotation_crops: ["wheat", "pulses"],
    rotation_benefits: "Deep taproot aerates soil, leaving excellent seedbed for wheat.",
  },
  {
    crop_id: "sugarcane",
    name: "Sugarcane",
    local_name: "Ganna (گنا)",
    season: "Annual",
    season_months: "Feb - Feb (12 Months)",
    water_requirement_mm: 2000,
    water_range: "1500 - 2500 mm",
    optimal_soil_moisture_percent: { min: 40.0, max: 50.0 },
    soil_ph_range: "6.0 - 7.5",
    growth_duration_days: 360,
    description: "High yield annual crop supplying sugar mills.",
    common_diseases: [
      { name: "Red Rot", symptoms: "Reddening of internal stalk tissues", risk_factor: "Monsoon humidity, waterlogged soil" },
      { name: "Whip Smut", symptoms: "Black whip-like structure from shoot apex", risk_factor: "Ratoon crop propagation" },
      { name: "Drought Stress", symptoms: "Stunted cane, dry leaf sheaths", risk_factor: "Moisture below 25% in summer" },
    ],
    recommended_rotation_crops: ["wheat", "pulses", "mustard"],
    rotation_benefits: "Follow with legumes or wheat to restore nitrogen.",
  },
];

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