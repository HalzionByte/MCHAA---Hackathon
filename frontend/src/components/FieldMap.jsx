"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { getField } from '../api/api';
import { getSeverityClass, getSeverityColor } from '../lib/severity';
import AnomalyHeatmap from './AnomalyHeatmap';

function AnomalyMarkers({ anomalies, onPulseAnomalyId }) {
  return anomalies?.map((anomaly) => {
    const coords = anomaly.detected_region?.coordinates;
    if (!coords) return null;
    const isPulsing = anomaly.anomaly_id === onPulseAnomalyId;
    const severityColor = getSeverityColor(anomaly.severity);
    return (
      <Marker
        key={anomaly.anomaly_id}
        position={[coords.lat, coords.lng]}
        icon={L.divIcon({
          className: `anomaly-marker ${isPulsing ? 'pulsing' : ''}`,
          html: `<div style="width: 16px; height: 16px; border-radius: 50%; background: ${severityColor}; border: 3px solid var(--bg-main); box-shadow: 0 0 12px ${severityColor};${isPulsing ? ' animation: pulse-marker 1.5s ease-in-out infinite;' : ''}"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })}
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

function MapLegend() {
  const severities = [
    { label: 'Critical', color: 'var(--crimson)', threshold: '> 70%' },
    { label: 'Moderate', color: 'var(--amber)', threshold: '30-70%' },
    { label: 'Low', color: 'var(--emerald)', threshold: '< 30%' }
  ];
  return (
    <div className="absolute bottom-4 right-4 glass p-3 rounded-lg z-10 min-w-[180px]">
      <h4 className="font-medium mb-2">Anomaly Severity</h4>
      <div className="space-y-2">
        {severities.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: s.color }} />
            <span className="text-sm">{s.label} ({s.threshold})</span>
          </div>
        ))}
        <div className="border-t border-[var(--card-border)] pt-2 mt-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
            <span>Heatmap Intensity</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FieldMap({ fieldId }) {
  const [field, setField] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [pulseAnomalyId, setPulseAnomalyId] = useState(null);

  useEffect(() => {
    async function loadField() {
      try {
        const data = await getField(fieldId);
        setField(data);
        // Pulse the most recent anomaly
        if (data?.anomalies?.length) {
          setPulseAnomalyId(data.anomalies[0].anomaly_id);
        }
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

  // Add pulse animation style
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-marker {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.7; }
      }
      .anomaly-marker.pulsing { animation: pulse-marker 1.5s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (!field) return <div className="glass p-8 text-center text-muted">Loading field map...</div>;

  const center = field.boundary ? [field.boundary.lat, field.boundary.lng] : [31.5204, 74.3587];

  // Generate field boundary polygon (approximate from center)
  const generateFieldPolygon = (center, radiusKm = 1.5) => {
    const points = [];
    const numPoints = 32;
    const radiusDeg = radiusKm / 111; // rough conversion
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      points.push([
        center[0] + radiusDeg * Math.cos(angle),
        center[1] + radiusDeg * Math.sin(angle)
      ]);
    }
    return points;
  };

  const fieldPolygon = field.boundary ? generateFieldPolygon(center) : null;

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium">{field.name}</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              className="rounded border-[var(--card-border)] bg-[var(--card-surface)] text-emerald-500 focus:ring-emerald-500"
            />
            Heatmap
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={(e) => setShowMarkers(e.target.checked)}
              className="rounded border-[var(--card-border)] bg-[var(--card-surface)] text-emerald-500 focus:ring-emerald-500"
            />
            Markers
          </label>
        </div>
      </div>
      <div className="relative h-80 w-full rounded-lg overflow-hidden">
        <MapContainer center={center} zoom={14} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {fieldPolygon && (
            <Polygon
              positions={fieldPolygon}
              color="var(--emerald)"
              fillColor="var(--emerald)"
              fillOpacity={0.08}
              weight={2}
              dashArray="5, 5"
            />
          )}
          {showHeatmap && <AnomalyHeatmap anomalies={field.anomalies} />}
          {showMarkers && <AnomalyMarkers anomalies={field.anomalies} onPulseAnomalyId={pulseAnomalyId} />}
          <MapLegend />
        </MapContainer>
      </div>
    </div>
  );
}