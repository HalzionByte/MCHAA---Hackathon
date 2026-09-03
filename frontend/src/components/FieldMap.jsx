"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon } from 'react-leaflet';
import { getField } from '../api/api';
import { getSeverityClass, getSeverityColor } from '../lib/severity';
import AnomalyHeatmap from './AnomalyHeatmap';
import { Flame, Map, Sprout, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ZONE_COORDS = {
  'B3': { lat: 31.5204, lng: 74.3587 },
  'A1': { lat: 31.5210, lng: 74.3580 },
  'A2': { lat: 31.5208, lng: 74.3595 },
  'B1': { lat: 31.5200, lng: 74.3582 },
  'B2': { lat: 31.5202, lng: 74.3590 },
  'C1': { lat: 31.5198, lng: 74.3598 },
  'C2': { lat: 31.5195, lng: 74.3592 },
  'C3': { lat: 31.5192, lng: 74.3585 },
};

const cropNameKeys = {
  wheat: 'crop.wheat',
  rice: 'crop.rice',
  cotton: 'crop.cotton',
  sugarcane: 'crop.sugarcane',
};

function AnomalyMarkers({ anomalies, t }) {
  return anomalies?.map((anomaly) => {
    const coords = anomaly.detected_region?.coordinates || ZONE_COORDS[anomaly.zone];
    if (!coords) return null;
    const severityColor = getSeverityColor(anomaly.severity);
      return (
        <CircleMarker
          key={anomaly.anomaly_id}
          center={[coords.lat, coords.lng]}
          radius={8}
          pathOptions={{
            fillColor: severityColor,
            fillOpacity: 1,
            color: 'var(--bg-main)',
            weight: 3,
          }}
        >
          <Popup>
            <div className="glass p-4 min-w-[200px]">
              <h4 className="font-medium mb-2">{t('map.zone', { zone: anomaly.detected_region?.zone || anomaly.zone })}</h4>
              <p className="text-sm">
                {t('map.type', { type: anomaly.anomaly_type.replace('_', ' ') })}<br/>
                {t('map.severityLabel', { severity: (
                  <span className={getSeverityClass(anomaly.severity)}>
                    {((anomaly.severity * 100).toFixed(0))}%
                  </span>
                ) })}
              </p>
            </div>
          </Popup>
        </CircleMarker>
    );
  });
}

function MapLegend() {
  const { t } = useLanguage();
  const severities = [
    { label: t('map.critical'), color: 'var(--crimson)', threshold: '> 70%' },
    { label: t('map.moderate'), color: 'var(--amber)', threshold: '30-70%' },
    { label: t('map.low'), color: 'var(--emerald)', threshold: '< 30%' }
  ];
  return (
    <div className="absolute bottom-4 end-4 field-overlay z-10 min-w-[180px]">
      <h4 className="font-medium mb-2 text-[var(--text-primary)]">{t('map.severity')}</h4>
      <div className="space-y-2">
        {severities.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
            <span className="text-xs text-[var(--text-muted)]">{s.label} ({s.threshold})</span>
          </div>
        ))}
        <div className="border-t border-[var(--card-border)] pt-2 mt-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
            <span className="text-[var(--text-muted)]">{t('map.heatmapIntensity')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FieldMap({ fieldId }) {
  const { t } = useLanguage();
  const [field, setField] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);

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
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-layer { filter: invert(100%) hue-rotate(180deg) brightness(1.15) contrast(0.85); }
      .leaflet-container { background: #0B0F17; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (!field) {
    return (
      <div className="glass-card p-8 text-center text-[var(--text-muted)]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--cyan)] border-t-transparent rounded-full mx-auto mb-3" />
        {t('map.loading')}
      </div>
    );
  }

  const center = field.boundary ? [field.boundary.lat, field.boundary.lng] : [31.5204, 74.3587];

  const generateFieldPolygon = (center, radiusKm = 1.5) => {
    const points = [];
    const numPoints = 32;
    const radiusDeg = radiusKm / 111;
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
    <div className="glass-card p-5">
      <div className="relative h-96 w-full rounded-lg overflow-hidden">
        {/* Map */}
        <MapContainer center={center} zoom={14} maxZoom={20} scrollWheelZoom={true} className="h-full w-full rounded-lg">
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
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
          {showMarkers && <AnomalyMarkers anomalies={field.anomalies} t={t} />}
          <MapLegend />
        </MapContainer>

        {/* Floating Toggle Chips (top-right) */}
        <div className="absolute top-3 end-3 z-[1000] flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`map-chip ${showHeatmap ? 'map-chip-active' : ''}`}
          >
            <Flame className="w-3.5 h-3.5" />
            {t('map.heatmap')}
          </button>
          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className={`map-chip ${showMarkers ? 'map-chip-active' : ''}`}
          >
            <Map className="w-3.5 h-3.5" />
            {t('map.markers')}
          </button>
        </div>

        {/* Floating Field Info (bottom-left) */}
        <div className="absolute bottom-4 start-4 z-[1000] field-overlay">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[var(--emerald)]" />
            <span className="font-medium text-[var(--text-primary)]">{field.name}</span>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-[var(--text-muted)]">{cropNameKeys[field.crop_type] ? t(cropNameKeys[field.crop_type]) : field.crop_type}</span>
          </div>
          {field.anomalies?.length > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-[var(--crimson)]">
              <AlertTriangle className="w-3 h-3" />
              {t('map.anomalyDetected', { count: field.anomalies.length })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
