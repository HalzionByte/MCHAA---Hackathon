"use client";

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import heatLayer from 'leaflet.heat';

export default function AnomalyHeatmap({ anomalies }) {
  const map = useMap();

  useEffect(() => {
    if (!anomalies?.length) return;

    const heatData = anomalies.map((a) => [
      a.detected_region.coordinates.lat,
      a.detected_region.coordinates.lng,
      a.severity * (a.confidence || 0.8)
    ]);

    const heat = heatLayer(heatData, {
      radius: 35,
      blur: 25,
      maxZoom: 15,
      minOpacity: 0.3,
      gradient: {
        0.0: '#10B981',
        0.4: '#F59E0B',
        0.7: '#EF4444',
        1.0: '#EF4444'
      }
    });

    heat.addTo(map);
    return () => map.removeLayer(heat);
  }, [map, anomalies]);

  return null;
}