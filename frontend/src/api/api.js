import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  try {
    const response = await api.get(`/api/farms/${farmId}`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching farm:', error);
    throw error;
  }
}

export async function getField(fieldId) {
  try {
    const response = await api.get(`/api/fields/${fieldId}`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching field:', error);
    throw error;
  }
}

export async function getAnomaly(anomalyId) {
  try {
    const response = await api.get(`/api/anomalies/${anomalyId}`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching anomaly:', error);
    throw error;
  }
}

export async function analyzeImage(imageUrl, fieldId) {
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
  return [];
}

export async function getAllTelemetryHistory(fieldId) {
  try {
    const response = await api.get(`/api/fields/${fieldId}/telemetry`);
    return normalizeResponse(response.data);
  } catch {
    console.warn('Telemetry endpoint unavailable');
    return [];
  }
}

export async function getAnomalyVoice(anomalyId) {
  try {
    const response = await api.get(`/api/anomalies/${anomalyId}/voice`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching voice data:', error);
    throw error;
  }
}

export async function getAnomalySms(anomalyId) {
  try {
    const response = await api.get(`/api/anomalies/${anomalyId}/sms`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching SMS data:', error);
    throw error;
  }
}

export async function getCrops() {
  try {
    const response = await api.get('/api/crops');
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching crops:', error);
    throw error;
  }
}

export async function getCropById(cropId) {
  try {
    const response = await api.get(`/api/crops/${cropId}`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching crop:', error);
    throw error;
  }
}

export async function updateFieldCrop(fieldId, cropType) {
  try {
    const response = await api.put(`/api/fields/${fieldId}/crop`, { crop_type: cropType });
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error updating field crop:', error);
    throw error;
  }
}

export async function getRotationAdvice(fieldId) {
  try {
    const response = await api.get(`/api/fields/${fieldId}/rotation-advice`);
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching rotation advice:', error);
    throw error;
  }
}

export async function createField({ name, crop_type, polygon, farm_id }) {
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
