import axios from 'axios';
import { MOCK_FARM, MOCK_FIELD, MOCK_ANOMALY, MOCK_TELEMETRY_HISTORY } from '../mock/mockData';

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

export default api;