"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { getField } from '../api/api';
import LocationSearch from './LocationSearch';
import MapRecenter from './MapRecenter';
import DrawControl from './DrawControl';
import CreateFieldModal from './CreateFieldModal';
import { Sprout, AlertTriangle, Pencil, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const cropNameKeys = {
  wheat: 'crop.wheat',
  rice: 'crop.rice',
  cotton: 'crop.cotton',
  sugarcane: 'crop.sugarcane',
};

function MapLegend() {
  const { t } = useLanguage();
  return (
    <div className="absolute bottom-4 end-4 field-overlay z-10 min-w-[160px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--cyan)', opacity: 0.8 }} />
        <span className="text-xs text-[var(--text-muted)]">Analyzed area</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm" style={{ border: '1.5px dashed var(--emerald)', background: 'transparent' }} />
        <span className="text-xs text-[var(--text-muted)]">Field boundary</span>
      </div>
    </div>
  );
}

export default function FieldMap({ fieldId, onAreaAnalyzed, resetKey }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [field, setField] = useState(null);

  const [searchTarget, setSearchTarget] = useState(null);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [drawnCoords, setDrawnCoords] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [polygonError, setPolygonError] = useState(null);

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

  const handleSearchSelect = useCallback((result) => {
    setSearchTarget([result.lat, result.lng]);
  }, []);

  const handleDrawCreated = useCallback((coords) => {
    if (!coords || coords.length < 4) {
      setPolygonError('Please draw at least 4 points to form a valid area.');
      setTimeout(() => setPolygonError(null), 3500);
      return;
    }
    setPolygonError(null);
    setDrawnCoords(coords);
    setShowCreateModal(true);
    setDrawingEnabled(false);
  }, []);

  const handleFieldCreated = useCallback((newFieldId, analysis) => {
    setAnalysisResult(analysis);
    setDrawingEnabled(false);
    // Keep drawnCoords so the drawn polygon stays highlighted
    getField(newFieldId).then(setField).catch(console.error);
    if (onAreaAnalyzed) onAreaAnalyzed(analysis);
    // Redirect to the new field's page after a brief delay
    setTimeout(() => {
      router.push(`/field/${newFieldId}`);
    }, 1200);
  }, [onAreaAnalyzed, router]);

  const handleCreateModalClose = useCallback(() => {
    setShowCreateModal(false);
    setDrawnCoords(null);
  }, []);

  const handleDrawCancel = useCallback(() => {
    setDrawingEnabled(false);
    setDrawnCoords(null);
    setShowCreateModal(false);
  }, []);

  // Reset drawn state when parent signals reset (resetKey changes)
  useEffect(() => {
    if (resetKey === null) {
      setDrawnCoords(null);
      setAnalysisResult(null);
    }
  }, [resetKey]);

  if (!field) {
    return (
      <div className="glass-card p-8 text-center text-[var(--text-muted)]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--cyan)] border-t-transparent rounded-full mx-auto mb-3" />
        {t('map.loading')}
      </div>
    );
  }

  const center = field.boundary ? [field.boundary.lat, field.boundary.lng] : [31.5204, 74.3587];

  const fieldPolygon = field.polygon || (field.boundary ? (() => {
    const radiusKm = 1.5;
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
  })() : null);

  return (
    <div className="glass-card p-5">
      <div className="mb-3">
        <LocationSearch onSelect={handleSearchSelect} />
      </div>

      <div className="relative h-96 w-full rounded-lg overflow-hidden">
        <MapContainer center={center} zoom={14} maxZoom={20} scrollWheelZoom={!drawingEnabled} className="h-full w-full rounded-lg">
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {searchTarget && <MapRecenter center={searchTarget} zoom={14} />}

          <DrawControl
            drawingEnabled={drawingEnabled}
            onDrawCreated={handleDrawCreated}
          />

          {/* Highlighted drawn area (analyzed) — only this polygon shows */}
          {drawnCoords && !drawingEnabled && (
            <Polygon
              positions={drawnCoords}
              color="var(--cyan)"
              fillColor="var(--cyan)"
              fillOpacity={0.18}
              weight={3}
            />
          )}

          {/* Field polygon — only shown when NO drawn area is active */}
          {fieldPolygon && !drawnCoords && !drawingEnabled && (
            <Polygon
              positions={fieldPolygon}
              color="var(--emerald)"
              fillColor="var(--emerald)"
              fillOpacity={0.08}
              weight={2}
              dashArray="5, 5"
            />
          )}

          <MapLegend />
        </MapContainer>

        {/* Top-right: Draw button only */}
        <div className="absolute top-3 end-3 z-[1000] flex items-center gap-2">
          <button
            onClick={() => drawingEnabled ? handleDrawCancel() : setDrawingEnabled(true)}
            className={`map-chip ${drawingEnabled ? 'map-chip-active' : ''}`}
            title={drawingEnabled ? 'Cancel drawing' : 'Draw field boundary'}
          >
            {drawingEnabled ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {drawingEnabled ? 'Cancel' : 'Draw'}
          </button>
        </div>

        {/* Floating Field Info (bottom-left) */}
        <div className="absolute bottom-4 start-4 z-[1000] field-overlay">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[var(--emerald)]" />
            <span className="font-medium text-[var(--text-primary)]">
              {drawnCoords && analysisResult ? analysisResult.name || 'Drawn Area' : field.name}
            </span>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-[var(--text-muted)]">
              {cropNameKeys[field.crop_type] ? t(cropNameKeys[field.crop_type]) : field.crop_type}
            </span>
          </div>
          {drawnCoords && analysisResult?.evidence && (
            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
              <span>Soil: {analysisResult.evidence.soil_moisture_percent ?? 'N/A'}%</span>
              <span>·</span>
              <span>NDVI Δ: {analysisResult.evidence.vegetation_ndvi_change ?? 'N/A'}</span>
            </div>
          )}
          {!drawnCoords && field.anomalies?.length > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-[var(--crimson)]">
              <AlertTriangle className="w-3 h-3" />
              {t('map.anomalyDetected', { count: field.anomalies.length })}
            </div>
          )}
        </div>

        {/* Draw mode indicator */}
        {drawingEnabled && (
          <div className="absolute top-3 start-1/2 -translate-x-1/2 z-[1000] glass px-3 py-1.5 text-xs text-[var(--cyan)] font-medium flex items-center gap-2">
            <Pencil className="w-3 h-3" />
            Click to place points · Click first point to finish
          </div>
        )}

        {/* Polygon error toast */}
        {polygonError && (
          <div className="absolute top-3 start-1/2 -translate-x-1/2 z-[1000] glass px-3 py-1.5 text-xs text-[var(--crimson)] font-medium">
            {polygonError}
          </div>
        )}
      </div>

      {/* Analysis result banner */}
      {analysisResult && analysisResult.anomaly_summary && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          analysisResult.anomaly_summary.anomaly_type === 'healthy'
            ? 'bg-[var(--emerald)]/10 text-[var(--emerald)]'
            : 'bg-[var(--crimson)]/10 text-[var(--crimson)]'
        }`}>
          <span className="font-medium">{analysisResult.name || 'Drawn Area'}</span> —{' '}
          {analysisResult.anomaly_summary.anomaly_type === 'healthy'
            ? 'Area appears healthy'
            : `${analysisResult.anomaly_summary.anomaly_type.replace('_', ' ')} detected (${(analysisResult.anomaly_summary.severity * 100).toFixed(0)}%)`}
          {' · '}Soil: {analysisResult.evidence?.soil_moisture_percent ?? 'N/A'}%
          {' · '}NDVI change: {analysisResult.evidence?.vegetation_ndvi_change ?? 'N/A'}
        </div>
      )}

      <CreateFieldModal
        isOpen={showCreateModal}
        onClose={handleCreateModalClose}
        polygonCoords={drawnCoords}
        onComplete={handleFieldCreated}
      />
    </div>
  );
}
