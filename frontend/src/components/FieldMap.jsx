"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getField } from '../api/api';
import { getSeverityClass } from '../lib/severity';

function AnomalyMarkers({ anomalies }) {
  return anomalies?.map((anomaly) => {
    const coords = anomaly.detected_region?.coordinates;
    if (!coords) return null;
    return (
      <Marker
        key={anomaly.anomaly_id}
        position={[coords.lat, coords.lng]}
      >
        <Popup>
          <div className="glass p-4 min-w-[200px]">
            <h4 className="font-medium mb-2">Zone {anomaly.detected_region.zone}</h4>
            <p className="text-sm">
              Type: {anomaly.anomaly_type.replace('_', ' ')}<br/>
              Severity: <span className={getSeverityClass(anomaly.severity)}>
                {((anomaly.severity * 100).toFixed(0))}%
              </span>
            </p>
          </div>
        </Popup>
      </Marker>
    );
  });
}

export default function FieldMap({ fieldId }) {
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

  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  if (!field) return <div className="glass p-8 text-center text-muted">Loading field map...</div>;

  const center = field.boundary ? [field.boundary.lat, field.boundary.lng] : [31.5204, 74.3587];

  return (
    <div className="glass p-5">
      <h3 className="text-xl font-medium mb-4">{field.name}</h3>
      <div className="relative h-80 w-full rounded-lg overflow-hidden">
        <MapContainer center={center} zoom={14} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {field.boundary && (
            <Circle
              center={center}
              radius={500}
              color="var(--emerald)"
              fillColor="var(--emerald)"
              fillOpacity={0.1}
              weight={2}
            />
          )}
          <AnomalyMarkers anomalies={field.anomalies} />
        </MapContainer>
      </div>
    </div>
  );
}