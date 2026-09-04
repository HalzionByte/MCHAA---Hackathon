import axios from 'axios';
import { MOCK_FARM, MOCK_FIELD, MOCK_ANOMALY, MOCK_TELEMETRY_HISTORY, MOCK_CROPS } from '../mock/mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

function normalizeResponse(data) {
  return data?.data ?? data;
}

export async function getFarm(farmId) {
  if (USE_MOCK_DATA) return Promise.resolve(MOCK_FARM);
  try {
    const response = await api.get(`/api/farms/${farmId}`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching farm:', error);
    throw error;
  }
}

export async function getField(fieldId) {
  if (USE_MOCK_DATA) return Promise.resolve(MOCK_FIELD);
  try {
    const response = await api.get(`/api/fields/${fieldId}`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching field:', error);
    throw error;
  }
}

export async function getAnomaly(anomalyId) {
  if (USE_MOCK_DATA) return Promise.resolve(MOCK_ANOMALY);
  try {
    const response = await api.get(`/api/anomalies/${anomalyId}`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching anomaly:', error);
    throw error;
  }
}

export async function analyzeImage(imageUrl, fieldId) {
  if (USE_MOCK_DATA) {
    return new Promise(resolve => {
      setTimeout(() => resolve(MOCK_ANOMALY), 1000);
    });
  }
  try {
    const response = await api.post('/api/analyze', {
      image_url: imageUrl,
      field_id: fieldId
    });
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

export async function getTelemetryHistory(fieldId, metric) {
  if (USE_MOCK_DATA) {
    const history = MOCK_TELEMETRY_HISTORY[fieldId] || [];
    return history.map(d => d[metric]);
  }
  return [];
}

export async function getAllTelemetryHistory(fieldId) {
  if (USE_MOCK_DATA) {
    return MOCK_TELEMETRY_HISTORY[fieldId] || generateFallbackTelemetry(fieldId);
  }
  try {
    const response = await api.get(`/api/fields/${fieldId}/telemetry`);
    return normalizeResponse(response.data);
  } catch {
    console.warn('Telemetry endpoint unavailable, using fallback data');
    return generateFallbackTelemetry(fieldId);
  }
}

export async function getAnomalyVoice(anomalyId) {
  if (USE_MOCK_DATA) {
    return {
      anomaly_id: anomalyId,
      audio_url: `/api/static/audio/guide_b3.mp3`,
      spoken_script: `Attention Farmer! In Field B, Zone B3 requires urgent action. Recommended action: Prioritize irrigation. Reason: Low soil moisture and high temperature.`,
    };
  }
  try {
    const response = await api.get(`/api/anomalies/${anomalyId}/voice`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching voice data:', error);
    throw error;
  }
}

export async function getAnomalySms(anomalyId) {
  if (USE_MOCK_DATA) {
    return {
      anomaly_id: anomalyId,
      sms_text: `[CROP ALERT] Zone B3 RED. Water needed in 24h. Reason: 18% moisture. Crop loss saved: $450.`,
      character_count: 94,
    };
  }
  try {
    const response = await api.get(`/api/anomalies/${anomalyId}/sms`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching SMS data:', error);
    throw error;
  }
}

export async function getCrops() {
  if (USE_MOCK_DATA) return Promise.resolve(MOCK_CROPS);
  try {
    const response = await api.get('/api/crops');
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching crops:', error);
    throw error;
  }
}

export async function getCropById(cropId) {
  if (USE_MOCK_DATA) {
    const crop = MOCK_CROPS.find(c => c.crop_id === cropId);
    return Promise.resolve(crop || null);
  }
  try {
    const response = await api.get(`/api/crops/${cropId}`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching crop:', error);
    throw error;
  }
}

export async function updateFieldCrop(fieldId, cropType) {
  if (USE_MOCK_DATA) {
    const crop = MOCK_CROPS.find(c => c.crop_id === cropType);
    const rotationAdvice = {
      current_crop: cropType,
      suggested_crops: MOCK_CROPS.filter(c => c.crop_id !== cropType).slice(0, 2).map(c => ({
        crop_id: c.crop_id,
        name: `${c.name} (${c.local_name})`,
        season: c.season,
        rationale: c.rotation_benefits,
      })),
      rotation_tip: crop?.rotation_benefits || 'Rotate crops to maintain soil health.',
    };
    return Promise.resolve({
      message: `Field updated successfully to crop '${crop?.name || cropType}'`,
      field_id: fieldId,
      crop: crop,
      rotation_advice: rotationAdvice,
    });
  }
  try {
    const response = await api.put(`/api/fields/${fieldId}/crop`, { crop_type: cropType });
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error updating field crop:', error);
    throw error;
  }
}

export async function getRotationAdvice(fieldId) {
  if (USE_MOCK_DATA) {
    return {
      current_crop: 'wheat',
      suggested_crops: [
        { crop_id: 'cotton', name: 'Cotton (کپاس)', season: 'Kharif', rationale: 'Deep taproot aerates soil for next wheat cycle.' },
        { crop_id: 'rice', name: 'Rice (چاول)', season: 'Kharif', rationale: 'Breaks soil compaction with flooded paddy conditions.' },
      ],
      rotation_tip: 'After wheat, plant cotton or rice to restore soil balance.',
    };
  }
  try {
    const response = await api.get(`/api/fields/${fieldId}/rotation-advice`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching rotation advice:', error);
    throw error;
  }
}

function generateFallbackTelemetry(fieldId) {
  const seed = fieldId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = (i, offset = 0) => Math.sin(seed + i + offset) * 0.5 + 0.5;

  return Array.from({ length: 45 }, (_, i) => {
    const date = new Date(Date.now() - (44 - i) * 86400000);
    return {
      date: date.toISOString().split('T')[0],
      ndvi: Math.max(0.1, Math.min(1, 0.65 + Math.sin(i * 0.3) * 0.08 + (rand(i, 1) - 0.5) * 0.02)),
      soil_moisture: Math.max(5, 22 + Math.sin(i * 0.2) * 8 + (rand(i, 2) - 0.5) * 3),
      temperature: Math.max(10, 28 + Math.sin(i * 0.15) * 6 + (rand(i, 3) - 0.5) * 2),
      rainfall: Math.max(0, Math.sin(i * 0.4) * 5 + (rand(i, 4) - 0.3) * 3),
      humidity: Math.max(20, Math.min(100, 55 + Math.sin(i * 0.1) * 15 + (rand(i, 5) - 0.5) * 5)),
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// User-drawn polygon endpoints
// ──────────────────────────────────────────────────────────────────────────────

export async function createField({ name, crop_type, polygon, farm_id }) {
  if (USE_MOCK_DATA) {
    const mockId = `field-${crypto.randomUUID().slice(0, 8)}`;
    return {
      field_id: mockId,
      farm_id: farm_id || 'farm-001',
      name,
      crop_type,
      boundary: { lat: polygon?.[0]?.[0] || 31.52, lng: polygon?.[0]?.[1] || 74.35 },
      polygon: polygon || [],
      area_hectares: 5.0,
      anomalies: [],
    };
  }
  try {
    const response = await api.post('/api/fields', {
      name,
      crop_type,
      polygon,
      farm_id: farm_id || 'farm-001',
    });
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error creating field:', error);
    throw error;
  }
}

export async function analyzeArea(fieldId) {
  if (USE_MOCK_DATA) {
    return {
      field_id: fieldId,
      anomaly_id: MOCK_ANOMALY.anomaly_id,
      name: 'Mock Field',
      evidence: MOCK_ANOMALY.evidence,
      anomaly_summary: {
        anomaly_type: 'water_stress',
        severity: 0.85,
        confidence: 0.87,
        zone: 'drawn_area',
        crop_type: 'wheat',
      },
    };
  }
  try {
    const response = await api.post(`/api/fields/${fieldId}/analyze-area`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error analyzing area:', error);
    throw error;
  }
}

export async function deleteField(fieldId) {
  try {
    const response = await api.delete(`/api/fields/${fieldId}`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error deleting field:', error);
    throw error;
  }
}

export default api;