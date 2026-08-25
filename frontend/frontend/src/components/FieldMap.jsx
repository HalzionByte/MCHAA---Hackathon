import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { TileLayer, Marker, Circle, Popup } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getField } from '../api/api';

export default function FieldMap({ fieldId }: { fieldId: string }) {
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
    <div className="glass p-6 rounded-lg">
      <h3 className="text-xl font-medium mb-4">{field.name}</h3>
      
      <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4">
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {field.boundary && (
          <Circle
            center={[field.boundary.lat, field.boundary.lng]}
            radius={500}
            color="var(--emerald)"
            fillColor="var(--emerald)"
            fillOpacity={0.1}
            strokeWidth={2}
          />
        )}
        
        {field.anomalies && field.anomalies.map((anomaly) => (
          <Marker
            key={anomaly.anomaly_id}
            position={[anomaly.detected_region.coordinates.lat, anomaly.detected_region.coordinates.lng]}
          >
            <Popup>
              <div className="p-4 glass rounded-md">
                <h4 className="font-medium mb-2">Zone {anomaly.detected_region.zone}</h4>
                <p className="text-sm">
                  Severity: <span className={`severity-${anomaly.severity > 0.7 ? 'high' : anomaly.severity > 0.3 ? 'medium' : 'low'}`}>
                    {((anomaly.severity * 100).toFixed(0))}%
                  </span>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </div>
    </div>
  );
}