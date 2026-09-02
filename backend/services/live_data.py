"""
Live data service — fetches real-world data from Open-Meteo + Agromonitoring.
All functions fall back to mock on network/API error so the demo never crashes.
"""

import os
import time
import math
import requests
from datetime import datetime, timedelta

from services.mock_data import (
    get_mock_soil_data,
    get_mock_weather_data,
    get_mock_historical_weather,
    get_crop_by_id,
)

AGRO_KEY = os.getenv("AGROMONITORING_API_KEY", "")
AGRO_BASE = "https://api.agromonitoring.com/agro/1.0"
OPEN_METEO_BASE = "https://api.open-meteo.com/v1"

# In-memory polygon cache: field_id -> agromonitoring polygon id
_polygon_cache: dict[str, str] = {}

# ──────────────────────────────────────────────────────────────────────────────
# Polygon helpers (Agromonitoring requires polygons for all endpoints)
# ──────────────────────────────────────────────────────────────────────────────

def _field_to_geojson(field_lat: float, field_lng: float, offset_deg: float = 0.0065):
    """Create a small square GeoJSON polygon around a lat/lng point (~50 ha)."""
    lon, lat = field_lng, field_lat
    coords = [
        [lon - offset_deg, lat - offset_deg],
        [lon + offset_deg, lat - offset_deg],
        [lon + offset_deg, lat + offset_deg],
        [lon - offset_deg, lat + offset_deg],
        [lon - offset_deg, lat - offset_deg],  # close ring
    ]
    return {
        "type": "Feature",
        "properties": {},
        "geometry": {"type": "Polygon", "coordinates": [coords]},
    }


def _find_existing_polygon(name: str) -> str | None:
    """Check if polygon with this name already exists; return its id or None."""
    try:
        resp = requests.get(
            f"{AGRO_BASE}/polygons",
            params={"appid": AGRO_KEY},
            timeout=10,
        )
        resp.raise_for_status()
        for poly in resp.json():
            if poly.get("name") == name:
                return poly["id"]
    except Exception:
        pass
    return None


def get_or_create_polygon(field_lat: float, field_lng: float, field_id: str) -> str | None:
    """Return Agromonitoring polygon id for a field, creating one if needed."""
    if not AGRO_KEY:
        return None

    cached = _polygon_cache.get(field_id)
    if cached:
        return cached

    name = f"Field-{field_id}"
    existing = _find_existing_polygon(name)
    if existing:
        _polygon_cache[field_id] = existing
        return existing

    try:
        resp = requests.post(
            f"{AGRO_BASE}/polygons",
            params={"appid": AGRO_KEY},
            json={
                "name": name,
                "geo_json": _field_to_geojson(field_lat, field_lng),
            },
            timeout=15,
        )
        resp.raise_for_status()
        poly_id = resp.json()["id"]
        _polygon_cache[field_id] = poly_id
        print(f"[live_data] Created Agromonitoring polygon '{name}' -> {poly_id}")
        return poly_id
    except Exception as e:
        print(f"[live_data] Failed to create polygon for {field_id}: {e}")
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Open-Meteo: current + historical weather
# ──────────────────────────────────────────────────────────────────────────────

def get_live_weather(lat: float, lng: float) -> dict | None:
    """
    Fetch current weather + 30-day historical aggregates from Open-Meteo.
    Returns dict matching the shape of get_mock_weather_data().
    """
    try:
        # Current weather
        cur_resp = requests.get(
            f"{OPEN_METEO_BASE}/forecast",
            params={
                "latitude": lat,
                "longitude": lng,
                "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
                "timezone": "auto",
            },
            timeout=10,
        )
        cur_resp.raise_for_status()
        cur = cur_resp.json().get("current", {})

        # 30-day archive for historical aggregates
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=30)
        hist_resp = requests.get(
            f"{OPEN_METEO_BASE}/archive",
            params={
                "latitude": lat,
                "longitude": lng,
                "start_date": str(start_date),
                "end_date": str(end_date),
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean",
                "timezone": "auto",
            },
            timeout=10,
        )
        hist_resp.raise_for_status()
        daily = hist_resp.json().get("daily", {})

        # Compute 30-day aggregates (skip nulls)
        temps_max = [t for t in (daily.get("temperature_2m_max") or []) if t is not None]
        temps_min = [t for t in (daily.get("temperature_2m_min") or []) if t is not None]
        rains = [r for r in (daily.get("precipitation_sum") or []) if r is not None]
        humids = [h for h in (daily.get("relative_humidity_2m_mean") or []) if h is not None]

        return {
            "temperature_c": cur.get("temperature_2m"),
            "humidity_percent": cur.get("relative_humidity_2m"),
            "rainfall_today_mm": cur.get("precipitation", 0),
            "rainfall_7d_mm": round(sum(rains[-7:]), 1) if rains else None,
            "wind_speed_kmh": cur.get("wind_speed_10m"),
            "wind_direction": "N/A",
            "cloud_cover_percent": None,
            "_historical": {
                "avg_temperature_c": round(sum(temps_max) / len(temps_max), 1) if temps_max else None,
                "max_temperature_c": round(max(temps_max), 1) if temps_max else None,
                "min_temperature_c": round(min(temps_min), 1) if temps_min else None,
                "total_rainfall_mm": round(sum(rains), 1) if rains else None,
                "avg_humidity_percent": round(sum(humids) / len(humids), 1) if humids else None,
            },
        }
    except Exception as e:
        print(f"[live_data] Open-Meteo weather fetch failed: {e}")
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Agromonitoring: current soil
# ──────────────────────────────────────────────────────────────────────────────

def get_live_soil(polyid: str) -> dict | None:
    """
    Fetch current soil data from Agromonitoring.
    Returns dict matching the shape of get_mock_soil_data().
    """
    if not AGRO_KEY or not polyid:
        return None
    try:
        resp = requests.get(
            f"{AGRO_BASE}/soil",
            params={"polyid": polyid, "appid": AGRO_KEY},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        moisture_m3 = data.get("moisture", 0)
        t10_k = data.get("t10")
        return {
            "soil_moisture_percent": round(moisture_m3 * 100, 1) if moisture_m3 is not None else None,
            "temperature_10cm_c": round(t10_k - 273.15, 1) if t10_k is not None else None,
        }
    except Exception as e:
        print(f"[live_data] Agromonitoring soil fetch failed: {e}")
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Agromonitoring: NDVI history → vegetation change
# ──────────────────────────────────────────────────────────────────────────────

def get_live_ndvi_change(polyid: str, days: int = 30) -> float | None:
    """
    Compute NDVI change from Agromonitoring satellite history.
    Compares recent 10-day mean vs prior 10-day mean (cloud-filtered).
    Returns float delta, or None if data unavailable.
    """
    if not AGRO_KEY or not polyid:
        return None
    try:
        # Agromonitoring rejects end timestamps at/after "now" — buffer by 1 day
        end = datetime.utcnow() - timedelta(days=1)
        start = end - timedelta(days=days)
        resp = requests.get(
            f"{AGRO_BASE}/ndvi/history",
            params={
                "polyid": polyid,
                "start": int(start.timestamp()),
                "end": int(end.timestamp()),
                "appid": AGRO_KEY,
            },
            timeout=15,
        )
        resp.raise_for_status()
        records = resp.json()
        if not isinstance(records, list) or len(records) < 2:
            return None

        # Sort by date, keep only records with a usable mean
        clean = sorted(
            [r for r in records if "data" in r and "mean" in r.get("data", {})],
            key=lambda r: r.get("dt", 0),
        )
        if len(clean) < 2:
            return None

        # Split into recent vs. baseline. For short histories (freshly-created
        # polygons have only a few days of data) fall back to last-vs-first.
        now_ts = time.time()
        recent_cutoff = now_ts - (10 * 86400)
        baseline_start = now_ts - (20 * 86400)
        baseline_end = now_ts - (10 * 86400)

        recent_vals = [r["data"]["mean"] for r in clean if r["dt"] >= recent_cutoff]
        baseline_vals = [r["data"]["mean"] for r in clean if baseline_start <= r["dt"] <= baseline_end]

        if not recent_vals or not baseline_vals:
            first = clean[0]["data"]["mean"]
            last = clean[-1]["data"]["mean"]
            return round(last - first, 3)

        recent_avg = sum(recent_vals) / len(recent_vals)
        baseline_avg = sum(baseline_vals) / len(baseline_vals)
        return round(recent_avg - baseline_avg, 3)
    except Exception as e:
        print(f"[live_data] Agromonitoring NDVI fetch failed: {e}")
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Public helpers: combined data fetchers for anomaly service + agent
# ──────────────────────────────────────────────────────────────────────────────

def fetch_all_live_data(field_id: str, field_lat: float, field_lng: float, crop_type: str) -> dict:
    """
    Fetch all live data sources for a field. Returns a merged dict with:
      - weather, historical, soil, ndvi_change, crop_info
    Any source that fails is None (consumers must handle None).
    """
    polyid = get_or_create_polygon(field_lat, field_lng, field_id)

    weather = get_live_weather(field_lat, field_lng)
    soil = get_live_soil(polyid) if polyid else None
    ndvi_change = get_live_ndvi_change(polyid) if polyid else None
    crop_info = get_crop_by_id(crop_type)

    return {
        "weather": weather,
        "soil": soil,
        "ndvi_change": ndvi_change,
        "crop_info": crop_info,
    }


def build_evidence_from_live(field_id: str, field_lat: float, field_lng: float, crop_type: str, zone: str) -> dict:
    """
    Build the evidence_data dict (same shape as the old hardcoded dict) from live sources.
    Falls back to mock values for any missing field.
    """
    live = fetch_all_live_data(field_id, field_lat, field_lng, crop_type)

    weather = live["weather"] or {}
    hist = weather.get("_historical") or {}
    soil = live["soil"] or {}
    crop = live["crop_info"]

    return {
        "soil_moisture_percent": soil.get("soil_moisture_percent") or get_mock_soil_data(field_id)["soil_moisture_percent"],
        "rainfall_7d_mm": weather.get("rainfall_7d_mm") if weather.get("rainfall_7d_mm") is not None else get_mock_weather_data(field_id)["rainfall_7d_mm"],
        "temperature_c": weather.get("temperature_c") if weather.get("temperature_c") is not None else get_mock_weather_data(field_id)["temperature_c"],
        "humidity_percent": weather.get("humidity_percent") if weather.get("humidity_percent") is not None else get_mock_weather_data(field_id)["humidity_percent"],
        "vegetation_ndvi_change": live["ndvi_change"] if live["ndvi_change"] is not None else -0.14,
        "zone": zone,
        "_live_sources": {
            "weather_available": weather is not None,
            "soil_available": soil is not None,
            "ndvi_available": live["ndvi_change"] is not None,
            "crop_optimal_moisture": crop["optimal_soil_moisture_percent"] if crop else None,
        },
    }
