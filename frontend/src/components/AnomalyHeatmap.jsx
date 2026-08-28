"use client";

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

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

export default function AnomalyHeatmap({ anomalies }) {
  const map = useMap();

  useEffect(() => {
    if (!anomalies?.length) return;

    const heatData = anomalies
      .map((a) => {
        const coords = a.detected_region?.coordinates || ZONE_COORDS[a.zone];
        if (!coords) return null;
        return [coords.lat, coords.lng, a.severity * (a.confidence || 0.8)];
      })
      .filter(Boolean);

    if (!heatData.length) return;

    const heat = L.heatLayer(heatData, {
      radius: 35,
      blur: 25,
      maxZoom: 15,
      minOpacity: 0.3,
      gradient: {
        0.0: '#F59E0B',
        0.4: '#F59E0B',
        0.7: '#EF4444',
        1.0: '#DC2626'
      }
    });

    heat.addTo(map);
    return () => map.removeLayer(heat);
  }, [map, anomalies]);

  return null;
}
