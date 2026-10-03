"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { useRouter } from 'next/navigation';
import LocationSearch from './LocationSearch';
import MapRecenter from './MapRecenter';
import DrawControl from './DrawControl';
import CreateFieldModal from './CreateFieldModal';
import { Pencil, Satellite, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

function MapLegend() {
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

export default function HomeMap() {
  const router = useRouter();
  const { t } = useLanguage();

  const [searchTarget, setSearchTarget] = useState(null);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [drawnCoords, setDrawnCoords] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [satellite, setSatellite] = useState(true);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-container { background: #DCE7E0; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleSearchSelect = useCallback((result) => {
    setSearchTarget([result.lat, result.lng]);
  }, []);

  const handleDrawCreated = useCallback((coords) => {
    setDrawnCoords(coords);
    setShowCreateModal(true);
    setDrawingEnabled(false);
  }, []);

  const handleFieldCreated = useCallback((fieldId, analysis) => {
    setAnalysisResult(analysis);
    setDrawingEnabled(false);
    // Keep drawnCoords so the drawn polygon stays highlighted
    setTimeout(() => {
      router.push(`/field/${fieldId}`);
    }, 1500);
  }, [router]);

  const handleCreateModalClose = useCallback(() => {
    setShowCreateModal(false);
    setDrawnCoords(null);
  }, []);

  const handleDrawCancel = useCallback(() => {
    setDrawingEnabled(false);
    setDrawnCoords(null);
    setShowCreateModal(false);
  }, []);

  return (
    <div className="glass-card p-5">
      <div className="mb-3">
        <LocationSearch onSelect={handleSearchSelect} />
      </div>

      <div className="relative h-96 w-full rounded-lg overflow-hidden">
        <MapContainer center={[31.5204, 74.3587]} zoom={6} maxZoom={20} scrollWheelZoom={!drawingEnabled} className="h-full w-full rounded-lg">
          {satellite ? (
            <TileLayer
              attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {searchTarget && <MapRecenter center={searchTarget} zoom={14} />}

          <DrawControl
            drawingEnabled={drawingEnabled}
            onDrawCreated={handleDrawCreated}
          />

          {/* Highlighted drawn area (analyzed) */}
          {drawnCoords && !drawingEnabled && (
            <Polygon
              positions={drawnCoords}
              color="var(--cyan)"
              fillColor="var(--cyan)"
              fillOpacity={0.18}
              weight={3}
            />
          )}

          <MapLegend />
        </MapContainer>

        {/* Top-right: basemap toggle + Draw button */}
        <div className="absolute top-3 end-3 z-[1000] flex items-center gap-2">
          <button
            onClick={() => setSatellite(v => !v)}
            className={`map-chip ${satellite ? 'map-chip-active' : ''}`}
            title={satellite ? 'Switch to street map' : 'Switch to satellite view'}
          >
            <Satellite className="w-3.5 h-3.5" />
            {satellite ? 'Street' : 'Satellite'}
          </button>
          <button
            onClick={() => drawingEnabled ? handleDrawCancel() : setDrawingEnabled(true)}
            className={`map-chip ${drawingEnabled ? 'map-chip-active' : ''}`}
            title={drawingEnabled ? 'Cancel drawing' : 'Draw field boundary'}
          >
            {drawingEnabled ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {drawingEnabled ? 'Cancel' : 'Draw'}
          </button>
        </div>

        {/* Draw mode indicator */}
        {drawingEnabled && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] glass px-3 py-1.5 text-xs text-[var(--emerald-deep)] font-medium flex items-center gap-2">
            <Pencil className="w-3 h-3" />
            Click to place points · Click first point to finish
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
