"use client";

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapRecenter({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);

  return null;
}
