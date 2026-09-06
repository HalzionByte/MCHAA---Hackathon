"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';

export default function DrawControl({ drawingEnabled, onDrawCreated, onDrawDeleted }) {
  const map = useMap();
  const drawHandlerRef = useRef(null);
  const drawnItemsRef = useRef(null);

  // Store callbacks in refs to avoid stale closures
  const onDrawCreatedRef = useRef(onDrawCreated);
  const onDrawDeletedRef = useRef(onDrawDeleted);
  onDrawCreatedRef.current = onDrawCreated;
  onDrawDeletedRef.current = onDrawDeleted;

  // Initialize drawn items layer + event listeners once
  useEffect(() => {
    if (!map) return;

    if (!drawnItemsRef.current) {
      drawnItemsRef.current = new L.FeatureGroup();
      map.addLayer(drawnItemsRef.current);
    }

    function handleCreated(e) {
      const layer = e.layer;
      drawnItemsRef.current.addLayer(layer);

      const latlngs = layer.getLatLngs()[0];
      const coords = latlngs.map((ll) => [ll.lat, ll.lng]);

      if (onDrawCreatedRef.current) {
        onDrawCreatedRef.current(coords);
      }
    }

    function handleDeleted() {
      if (onDrawDeletedRef.current) {
        onDrawDeletedRef.current();
      }
    }

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      if (drawnItemsRef.current) {
        map.removeLayer(drawnItemsRef.current);
        drawnItemsRef.current = null;
      }
    };
  }, [map]);

  // Handle drawing enabled/disabled
  useEffect(() => {
    if (!map) return;

    if (drawingEnabled) {
      // Disable map interactions
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoom.disable();
      map.keyboard.disable();
      if (map.tap) map.tap.disable();

      // Create and start the polygon draw handler
      const handler = new L.Draw.Polygon(map, {
        allowIntersection: false,
        showArea: true,
        shapeOptions: {
          color: '#10B981',
          fillColor: '#10B981',
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '5, 5',
        },
      });
      handler.enable();
      drawHandlerRef.current = handler;
    } else {
      // Disable active draw handler
      if (drawHandlerRef.current) {
        drawHandlerRef.current.disable();
        drawHandlerRef.current = null;
      }

      // Re-enable map interactions
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoom.enable();
      map.keyboard.enable();
      if (map.tap) map.tap.enable();

      // Clear drawn items
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
      }
    }
  }, [map, drawingEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (drawHandlerRef.current) {
        drawHandlerRef.current.disable();
        drawHandlerRef.current = null;
      }
    };
  }, []);

  return null;
}
