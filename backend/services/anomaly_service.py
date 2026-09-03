"""Anomaly detection service — uses live satellite/soil data when available."""

import os
from services.live_data import (
    fetch_all_live_data,
    get_live_ndvi_change,
    get_or_create_polygon,
)
from services.mock_data import get_mock_soil_data, get_crop_by_id

ANOMALY_MODE = os.getenv("ANOMALY_MODE", "auto")  # "auto" or "force"


def detect_anomaly(image_url: str, field_id: str, field_lat: float = 31.5204,
                   field_lng: float = 74.3587, crop_type: str = "wheat") -> dict:
    """
    Detect anomalies for an uploaded image.

    auto mode  — uses live soil moisture + NDVI change vs. crop optimal range
    force mode — always returns a water_stress anomaly (for guaranteed demos)
    fallback   — if all APIs fail, returns mock water_stress
    """
    if ANOMALY_MODE == "force":
        return _make_anomaly("water_stress", 0.85, 0.87, "B3", field_lat, field_lng)

    # ── Live data path ────────────────────────────────────────────────────
    live = fetch_all_live_data(field_id, field_lat, field_lng, crop_type)
    soil = live["soil"] or {}
    weather = live["weather"] or {}
    ndvi_change = live["ndvi_change"]
    crop = live["crop_info"]

    soil_moisture = soil.get("soil_moisture_percent")
    rainfall_7d = weather.get("rainfall_7d_mm")

    # Determine if water stress exists
    moisture_stress = False
    ndvi_stress = False
    rain_stress = False

    if soil_moisture is not None and crop:
        opt_min = crop["optimal_soil_moisture_percent"]["min"]
        if soil_moisture < opt_min:
            moisture_stress = True

    if ndvi_change is not None and ndvi_change < -0.08:
        ndvi_stress = True

    if rainfall_7d is not None and rainfall_7d < 5:
        rain_stress = True

    # If we got live data and all sources agree it's healthy → no anomaly
    has_live_data = any(v is not None for v in [soil_moisture, ndvi_change, rainfall_7d])

    if has_live_data and not moisture_stress and not ndvi_stress:
        # Healthy — return a low-severity "none" anomaly
        return {
            "anomaly_type": "none",
            "severity": 0.0,
            "confidence": 0.95,
            "zone": "B3",
            "lat": field_lat,
            "lng": field_lng,
        }

    # Water stress detected — compute severity
    if moisture_stress and crop:
        opt_min = crop["optimal_soil_moisture_percent"]["min"]
        deficit = (opt_min - soil_moisture) / opt_min if opt_min > 0 else 0
        severity = min(1.0, round(0.5 + deficit * 0.5, 2))
    elif moisture_stress:
        severity = 0.75
    elif ndvi_stress:
        severity = min(1.0, round(0.6 + abs(ndvi_change) * 2, 2))
    else:
        severity = 0.70

    confidence = 0.90 if (moisture_stress and ndvi_stress) else 0.80 if (moisture_stress or ndvi_stress) else 0.70

    return _make_anomaly("water_stress", severity, confidence, "B3", field_lat, field_lng)


def _make_anomaly(anomaly_type, severity, confidence, zone, lat, lng):
    return {
        "anomaly_type": anomaly_type,
        "severity": severity,
        "confidence": confidence,
        "zone": zone,
        "lat": lat,
        "lng": lng,
    }


def generate_ndvi_change(field_id: str, field_lat: float, field_lng: float, crop_type: str) -> float:
    """Calculate real NDVI change from satellite history. Falls back to mock."""
    polyid = get_or_create_polygon(field_lat, field_lng, field_id)
    if polyid:
        change = get_live_ndvi_change(polyid)
        if change is not None:
            return change
    return -0.14  # mock fallback
