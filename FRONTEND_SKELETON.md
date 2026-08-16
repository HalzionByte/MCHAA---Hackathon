# Frontend Skeleton (React/Next.js)

**Purpose:** Complete folder structure + starter code for frontend engineer  
**Time to build:** ~8-10 hours (don't rush)  
**Can start immediately using mock data** while backend is being built

---

## Folder Structure

```
frontend/
├── public/
│   └── farm-icon.png
├── src/
│   ├── components/
│   │   ├── FarmOverview.jsx          # Farm landing page
│   │   ├── FieldMap.jsx              # Field visualization
│   │   ├── AnomalyDetailed.jsx       # Anomaly details card
│   │   ├── EvidenceCard.jsx          # Evidence display
│   │   ├── DiagnosisCard.jsx         # Diagnosis + confidence
│   │   ├── RecommendationCard.jsx    # Action recommendation
│   │   └── ImageUpload.jsx           # Image upload form
│   ├── pages/
│   │   ├── index.jsx                 # Landing (farm list)
│   │   ├── farm/[farm_id].jsx        # Farm detail
│   │   ├── field/[field_id].jsx      # Field detail
│   │   └── anomaly/[anomaly_id].jsx  # Anomaly detail
│   ├── api/
│   │   └── api.js                    # API client (fetch + mock data)
│   ├── mock/
│   │   └── mockData.js               # Mock farm/field/anomaly data
│   ├── styles/
│   │   └── globals.css               # Global styles
│   ├── app.jsx                       # Main App component (if CRA)
│   └── index.jsx                     # Entry point
├── package.json
├── .env.example
└── next.config.js (if Next.js)
```

---

## package.json

```json
{
  "name": "crop-health-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "axios": "^1.6.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1"
  }
}
```

---

## mock/mockData.js

**Frontend can test with this data while backend is being built.**

```javascript
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
```

---

## api/api.js (API Client)

```javascript
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
  if (USE_MOCK_DATA) return MOCK_FARM;
  
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
  if (USE_MOCK_DATA) return MOCK_FIELD;
  
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
  if (USE_MOCK_DATA) return MOCK_ANOMALY;
  
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
  if (USE_MOCK_DATA) return MOCK_ANOMALY;
  
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
```

---

## .env.example

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=true
```

---

## components/FarmOverview.jsx

```jsx
import React, { useState, useEffect } from 'react';
import { getFarm } from '../api/api';
import Link from 'next/link';

export default function FarmOverview({ farmId }) {
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFarm() {
      try {
        const data = await getFarm(farmId);
        setFarm(data);
      } catch (error) {
        console.error('Failed to load farm:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFarm();
  }, [farmId]);

  if (loading) return <div>Loading farm data...</div>;
  if (!farm) return <div>Farm not found</div>;

  return (
    <div className="farm-overview">
      <h1>{farm.name}</h1>
      <p>{farm.location}</p>
      
      <div className="fields-grid">
        {farm.fields.map((field) => (
          <Link key={field.field_id} href={`/field/${field.field_id}`}>
            <div className={`field-card status-${field.status}`}>
              <h3>{field.name}</h3>
              <p>Crop: {field.crop_type}</p>
              <p>Anomalies: {field.anomaly_count}</p>
              <span className={`status-badge ${field.status}`}>
                {field.status === 'alert' ? '⚠️ Alert' : '✓ Healthy'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## components/FieldMap.jsx

```jsx
import React, { useState, useEffect } from 'react';
import { getField } from '../api/api';

export default function FieldMap({ fieldId, anomalies }) {
  const [field, setField] = useState(null);

  useEffect(() => {
    async function loadField() {
      try {
        const data = await getField(fieldId);
        setField(data);
      } catch (error) {
        console.error('Failed to load field:', error);
      }
    }
    loadField();
  }, [fieldId]);

  if (!field) return <div>Loading field map...</div>;

  return (
    <div className="field-map">
      <h3>{field.name}</h3>
      <div className="map-container">
        {/* Simple field visualization (no Leaflet complexity for MVP) */}
        <svg viewBox="0 0 200 200" className="field-svg">
          {/* Draw field boundary */}
          <rect x="10" y="10" width="180" height="180" fill="#e8f5e9" stroke="#4caf50" strokeWidth="2" />
          
          {/* Draw anomaly regions */}
          {anomalies && anomalies.map((anomaly) => (
            <circle
              key={anomaly.anomaly_id}
              cx="100"
              cy="100"
              r="30"
              fill="rgba(255, 87, 34, 0.5)"
              stroke="#ff5722"
              strokeWidth="2"
            />
          ))}
          
          {/* Labels */}
          <text x="100" y="195" textAnchor="middle" fontSize="12">
            Zone B3
          </text>
        </svg>
      </div>
    </div>
  );
}
```

---

## components/AnomalyDetailed.jsx

```jsx
import React, { useState, useEffect } from 'react';
import { getAnomaly } from '../api/api';
import EvidenceCard from './EvidenceCard';
import DiagnosisCard from './DiagnosisCard';
import RecommendationCard from './RecommendationCard';

export default function AnomalyDetailed({ anomalyId }) {
  const [anomaly, setAnomaly] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnomaly() {
      try {
        const data = await getAnomaly(anomalyId);
        setAnomaly(data);
      } catch (error) {
        console.error('Failed to load anomaly:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAnomaly();
  }, [anomalyId]);

  if (loading) return <div>Loading anomaly data...</div>;
  if (!anomaly) return <div>Anomaly not found</div>;

  const severityColor = anomaly.severity > 0.7 ? '#ff5722' : anomaly.severity > 0.3 ? '#ff9800' : '#4caf50';

  return (
    <div className="anomaly-detailed">
      <div className="anomaly-header">
        <h2>Anomaly Analysis</h2>
        <div className="anomaly-summary">
          <p><strong>Type:</strong> {anomaly.anomaly_type}</p>
          <p><strong>Zone:</strong> {anomaly.detected_region.zone}</p>
          <div className="severity-bar">
            <div 
              className="severity-fill" 
              style={{ 
                width: `${anomaly.severity * 100}%`, 
                backgroundColor: severityColor 
              }}
            />
          </div>
          <p>Severity: {(anomaly.severity * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div className="cards-grid">
        <EvidenceCard evidence={anomaly.evidence} />
        <DiagnosisCard diagnosis={anomaly.diagnosis} />
        <RecommendationCard recommendation={anomaly.recommendation} />
      </div>
    </div>
  );
}
```

---

## components/EvidenceCard.jsx

```jsx
export default function EvidenceCard({ evidence }) {
  return (
    <div className="card evidence-card">
      <h3>Environmental Evidence</h3>
      <div className="evidence-list">
        <div className="evidence-item">
          <span className="label">Soil Moisture:</span>
          <span className="value">{evidence.soil_moisture_percent}%</span>
        </div>
        <div className="evidence-item">
          <span className="label">Rainfall (7d):</span>
          <span className="value">{evidence.rainfall_7d_mm}mm</span>
        </div>
        <div className="evidence-item">
          <span className="label">Temperature:</span>
          <span className="value">{evidence.temperature_c}°C</span>
        </div>
        <div className="evidence-item">
          <span className="label">Humidity:</span>
          <span className="value">{evidence.humidity_percent}%</span>
        </div>
        <div className="evidence-item">
          <span className="label">Vegetation Change:</span>
          <span className="value">{evidence.vegetation_ndvi_change}</span>
        </div>
      </div>
    </div>
  );
}
```

---

## components/DiagnosisCard.jsx

```jsx
export default function DiagnosisCard({ diagnosis }) {
  return (
    <div className="card diagnosis-card">
      <h3>Diagnosis</h3>
      <p className="cause">{diagnosis.cause}</p>
      <p className="reasoning">{diagnosis.reasoning}</p>
      <div className="confidence">
        <span>Confidence: {(diagnosis.confidence * 100).toFixed(0)}%</span>
        <div className="confidence-bar">
          <div 
            className="confidence-fill" 
            style={{ width: `${diagnosis.confidence * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## components/RecommendationCard.jsx

```jsx
export default function RecommendationCard({ recommendation }) {
  const priorityLabel = {
    1: "🔴 Urgent",
    2: "🟠 High",
    3: "🟡 Medium"
  };

  return (
    <div className="card recommendation-card">
      <h3>Recommended Action</h3>
      <p className="action-title">{recommendation.action.replace(/_/g, ' ').toUpperCase()}</p>
      <p className="description">{recommendation.description}</p>
      <div className="action-details">
        <span className="priority">{priorityLabel[recommendation.priority]}</span>
        <span className="zone">Zone: {recommendation.target_zone}</span>
      </div>
    </div>
  );
}
```

---

## components/ImageUpload.jsx

```jsx
import React, { useState } from 'react';
import { analyzeImage } from '../api/api';

export default function ImageUpload({ fieldId, onAnalyzeComplete }) {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!imageUrl) {
      setError('Please enter an image URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeImage(imageUrl, fieldId);
      onAnalyzeComplete(result.anomaly_id);
    } catch (err) {
      setError('Failed to analyze image');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-upload">
      <h3>Upload Field Image</h3>
      <form onSubmit={handleAnalyze}>
        <input
          type="text"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

## pages/index.jsx

```jsx
import React from 'react';
import FarmOverview from '../components/FarmOverview';

export default function Home() {
  return (
    <div className="container">
      <header>
        <h1>🚜 Crop Health Agent</h1>
        <p>Multimodal anomaly detection & diagnosis</p>
      </header>
      <FarmOverview farmId="farm-001" />
    </div>
  );
}
```

---

## pages/anomaly/[anomalyId].jsx

```jsx
import React from 'react';
import { useRouter } from 'next/router';
import AnomalyDetailed from '../../components/AnomalyDetailed';

export default function AnomalyPage() {
  const router = useRouter();
  const { anomalyId } = router.query;

  if (!anomalyId) return <div>Loading...</div>;

  return (
    <div className="container">
      <button onClick={() => router.back()}>← Back</button>
      <AnomalyDetailed anomalyId={anomalyId} />
    </div>
  );
}
```

---

## styles/globals.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #fafafa;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: linear-gradient(135deg, #4caf50, #2196f3);
  color: white;
  border-radius: 8px;
}

header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
}

header p {
  font-size: 1.1em;
  opacity: 0.9;
}

/* Farm Overview */
.farm-overview {
  margin-bottom: 40px;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.field-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.field-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.field-card.status-alert {
  border-color: #ff5722;
  background: #fff3e0;
}

.field-card h3 {
  margin-bottom: 10px;
  color: #333;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 600;
}

.status-badge.alert {
  background: #ffebee;
  color: #c62828;
}

.status-badge.healthy {
  background: #e8f5e9;
  color: #2e7d32;
}

/* Anomaly Detailed */
.anomaly-header {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid #ff5722;
}

.anomaly-summary p {
  margin: 8px 0;
  font-size: 1.1em;
}

.severity-bar {
  width: 100%;
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  margin: 10px 0;
}

.severity-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2em;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

/* Evidence Card */
.evidence-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.evidence-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 6px;
}

.evidence-item .label {
  font-weight: 600;
  color: #555;
}

.evidence-item .value {
  font-weight: 700;
  color: #2196f3;
}

/* Diagnosis Card */
.diagnosis-card .cause {
  font-weight: 600;
  color: #d32f2f;
  margin-bottom: 10px;
  font-size: 1.05em;
}

.diagnosis-card .reasoning {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.confidence {
  margin-top: 15px;
}

.confidence-bar {
  width: 100%;
  height: 10px;
  background: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 8px;
}

.confidence-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s ease;
}

/* Recommendation Card */
.recommendation-card .action-title {
  font-size: 1.3em;
  font-weight: 700;
  color: #d32f2f;
  margin: 15px 0;
}

.recommendation-card .description {
  color: #666;
  line-height: 1.6;
  margin: 15px 0;
}

.action-details {
  display: flex;
  gap: 15px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.priority, .zone {
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  background: #f5f5f5;
  font-size: 0.9em;
}

/* Image Upload */
.image-upload {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.image-upload form {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.image-upload input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
}

.image-upload button {
  padding: 10px 20px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.image-upload button:hover:not(:disabled) {
  background: #45a049;
}

.image-upload button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  color: #d32f2f;
  margin-top: 10px;
  font-weight: 600;
}

/* Buttons */
button {
  padding: 10px 20px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

button:hover {
  background: #1976d2;
}

/* Responsive */
@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }

  header h1 {
    font-size: 1.8em;
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## Quick Start (Frontend)

```bash
# 1. Create Next.js project (or use existing)
npx create-next-app@latest frontend --typescript false
cd frontend

# 2. Install dependencies
npm install axios leaflet react-leaflet

# 3. Set up .env
cp .env.example .env.local

# 4. Run with mock data
NEXT_PUBLIC_USE_MOCK=true npm run dev

# 5. Visit http://localhost:3000
# All data is from mockData.js — backend doesn't need to be ready!

# 6. When backend is ready, update .env.local
# NEXT_PUBLIC_USE_MOCK=false
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Key Points for Frontend Engineer

1. **Mock data first** — Build entire UI using MOCK_ANOMALY, test all components
2. **No blocking** — Frontend doesn't wait for backend if using mock mode
3. **API client** — Simple `api.js` handles both mock and real calls
4. **Switch to backend** — Change `.env.local` when backend is ready
5. **Responsive design** — Works on mobile + desktop
6. **Simple map** — Uses SVG instead of Leaflet (no setup complexity)

---

## Component Flow

```
Home Page
  ↓
FarmOverview (displays all fields)
  ↓
[Click Field] → FieldMap + ImageUpload
  ↓
[Analyze Image] → AnomalyDetailed
  ↓
AnomalyDetailed displays:
  - EvidenceCard (soil, weather, vegetation)
  - DiagnosisCard (diagnosis + reasoning)
  - RecommendationCard (action + priority)
```

---

## Next Steps for Frontend Engineer

1. Clone this structure into your React/Next.js project
2. Start with mock data enabled
3. Build and style components
4. Test with mock anomaly data
5. Once backend is ready, flip the switch to USE_MOCK=false
6. Connect to backend endpoints
