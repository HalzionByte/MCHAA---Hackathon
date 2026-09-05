import axios from 'axios';
import { MOCK_FARM, MOCK_FIELD, MOCK_ANOMALY } from '../mock/mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Fetch farm by ID
export async function getFarm(farmId) {
  if (USE_MOCK_DATA) {
    return Promise.resolve(MOCK_FARM);
  }
  
  try {
    const response = await api.get(`/api/farms/${farmId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching farm:', error);
    throw error;
  }
}

// Fetch field by ID
export async function getField(fieldId) {
  if (USE_MOCK_DATA) {
    return Promise.resolve(MOCK_FIELD);
  }
  
  try {
    const response = await api.get(`/api/fields/${fieldId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching field:', error);
    throw error;
  }
}

// Fetch anomaly by ID
export async function getAnomaly(anomalyId) {
  if (USE_MOCK_DATA) {
    return Promise.resolve(MOCK_ANOMALY);
  }
  
  try {
    const response = await api.get(`/api/anomalies/${anomalyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching anomaly:', error);
    throw error;
  }
}

// Upload image and analyze
export async function analyzeImage(imageUrl, fieldId) {
  if (USE_MOCK_DATA) {
    // Simulate delay for realism
    return new Promise(resolve => {
      setTimeout(() => resolve(MOCK_ANOMALY), 1000);
    });
  }
  
  try {
    const response = await api.post('/api/analyze', {
      image_url: imageUrl,
      field_id: fieldId
    });
    return response.data;
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

// ===== FEATURE 2: SERVICE MARKETPLACE API =====
export async function getServiceProviders(district = 'Multan', serviceType = 'all') {
  try {
    const response = await api.get('/api/services/providers', {
      params: { district, service_type: serviceType }
    });
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching service providers:', error);
    throw error;
  }
}

export async function dispatchService({ fieldId, providerId, anomalyId, acres }) {
  try {
    const response = await api.post('/api/services/dispatch', {
      field_id: fieldId,
      provider_id: providerId,
      anomaly_id: anomalyId,
      acres: acres || 1.0
    });
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error dispatching service:', error);
    throw error;
  }
}

export async function calculateServiceSavings(acres = 10, severity = 0.8, pricePerAcre = 1200) {
  try {
    const response = await api.get('/api/services/calculator', {
      params: { acres, severity, price_per_acre_pkr: pricePerAcre }
    });
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error calculating savings:', error);
    throw error;
  }
}

// ===== FEATURE 3: WHATSAPP WORK ORDER API =====
export async function createWhatsAppWorkOrder({ fieldId, anomalyId, workerName, workerPhone, dialect, sector, action, dosage }) {
  try {
    const response = await api.post('/api/work-orders/whatsapp-voice', {
      field_id: fieldId,
      anomaly_id: anomalyId,
      worker_name: workerName || 'Field Worker',
      worker_phone: workerPhone || '+923001234567',
      dialect: dialect || 'ur',
      sector: sector || 'Zone B3',
      action: action || 'Chemical Spraying',
      dosage: dosage || '250 ml/acre'
    });
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error generating WhatsApp work order:', error);
    throw error;
  }
}

export async function confirmWorkOrder({ workOrderId, photoUrl, note }) {
  try {
    const response = await api.post('/api/work-orders/confirm', {
      work_order_id: workOrderId,
      photo_url: photoUrl,
      note: note
    });
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error confirming work order:', error);
    throw error;
  }
}

// ===== FEATURE 6: PAKAGRI-VISION DATASET EXPORTER API =====
export async function getPakAgriDatasetStats() {
  try {
    const response = await api.get('/api/pakagri-vision/datasets');
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error fetching PakAgri-Vision stats:', error);
    throw error;
  }
}

export async function exportPakAgriDataset(fmt = 'jsonl', limit = 500) {
  try {
    const response = await api.get('/api/pakagri-vision/export', {
      params: { fmt, limit }
    });
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error exporting PakAgri-Vision dataset:', error);
    throw error;
  }
}

export async function submitRLHFFeedback({ anomalyId, agronomistLabel, correctedCause, notes }) {
  try {
    const response = await api.post('/api/pakagri-vision/rlhf-feedback', {
      anomaly_id: anomalyId,
      agronomist_label: agronomistLabel,
      corrected_cause: correctedCause,
      notes: notes
    });
    return normalizeResponse(response.data);
  } catch (error) {
    console.error('Error submitting RLHF feedback:', error);
    throw error;
  }
}

export default api;



