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

export default api;