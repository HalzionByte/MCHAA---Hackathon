"""
Live data service — fetches real-world data from Open-Meteo + Agromonitoring.
Returns None for any data source that fails.
"""

import os
import time
import math
import requests
from datetime import datetime, timedelta

from services.mock_data import get_crop_by_id

AGRO_KEY = os.getenv("AGROMONITORING_API_KEY", "")
AGRO_BASE = "https://api.agromonitoring.com/agro/1.0"
OPEN_METEO_BASE = "https://api.open-meteo.com/v1"
OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"

# In-memory polygon cache: field_id -> agromonitoring polygon id
_polygon_cache: dict[str, str] = {}

# Override: field_id -> polygon id (set when user draws a custom polygon)
_polygon_override: dict[str, str] = {}

# User-drawn polygon coordinates: field_id -> [[lat, lng], ...]
_polygon_coords: dict[str, list[list[float]]] = {}


def compute_polygon_centroid(coords: list[list[float]]) -> tuple[float, float]:
    """Compute centroid of a polygon. coords = [[lat, lng], ...]."""
    n = len(coords) - 1  # exclude closing point if present
    if n <= 0:
        return 0.0, 0.0
    lat = sum(c[0] for c in coords[:n]) / n
    lng = sum(c[1] for c in coords[:n]) / n
    return round(lat, 6), round(lng, 6)


def compute_polygon_area_hectares(coords: list[list[float]]) -> float:
    """Compute approximate area of a polygon in hectares using the Shoelace formula.
    coords = [[lat, lng], ...]. Uses lat/lng → meters approximation."""
    n = len(coords) - 1
    if n <= 0:
        return 0.0
    R = 6371000  # Earth radius in meters
    area = 0
    for i in range(n):
        lat1 = math.radians(coords[i][0])
        lat2 = math.radians(coords[(i + 1) % n][0])
        dlng = math.radians(coords[(i + 1) % n][1] - coords[i][1])
        area += (lat2 - lat1) * (2 + math.sin(lat1) + math.sin(lat2))
    area = abs(area * R * R / 2)
    return round(area / 10000, 2)  # m² → hectares

# ──────────────────────────────────────────────────────────────────────────────
# Polygon helpers (Agromonitoring requires polygons for all endpoints)
# ──────────────────────────────────────────────────────────────────────────────

def get_field_polygon_coords(field_lat: float, field_lng: float, field_id: str = None, offset_deg: float = 0.0065) -> list[list[float]]:
    """Return the field boundary polygon as [[lat, lng], ...] for Leaflet display.
    If a user-drawn polygon override exists for this field, returns that instead of the synthetic square."""
    if field_id and field_id in _polygon_coords:
        return _polygon_coords[field_id]
    return [
        [field_lat - offset_deg, field_lng - offset_deg],
        [field_lat + offset_deg, field_lng - offset_deg],
        [field_lat + offset_deg, field_lng + offset_deg],
        [field_lat - offset_deg, field_lng + offset_deg],
        [field_lat - offset_deg, field_lng - offset_deg],
    ]


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
    """Return Agromonitoring polygon id for a field, creating one if needed.
    If a user-drawn polygon override exists for this field, returns that instead."""
    if not AGRO_KEY:
        return None

    # User-drawn polygon takes priority
    override = _polygon_override.get(field_id)
    if override:
        return override

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


def create_polygon_from_coords(name: str, coords: list[list[float]]) -> str | None:
    """Create an Agromonitoring polygon from user-drawn coordinates.
    coords = [[lat, lng], ...] (Leaflet format).
    Returns the Agromonitoring polygon id."""
    if not AGRO_KEY:
        return None

    # Convert Leaflet [lat, lng] to GeoJSON [lng, lat] format
    geojson_coords = [[c[1], c[0]] for c in coords]
    # Ensure ring is closed
    if geojson_coords[0] != geojson_coords[-1]:
        geojson_coords.append(geojson_coords[0])

    try:
        resp = requests.post(
            f"{AGRO_BASE}/polygons",
            params={"appid": AGRO_KEY},
            json={
                "name": name,
                "geo_json": {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {"type": "Polygon", "coordinates": [geojson_coords]},
                },
            },
            timeout=15,
        )
        resp.raise_for_status()
        poly_id = resp.json()["id"]
        print(f"[live_data] Created user polygon '{name}' -> {poly_id}")
        return poly_id
    except Exception as e:
        print(f"[live_data] Failed to create user polygon '{name}': {e}")
        return None


def store_polygon_coords(field_id: str, coords: list[list[float]]) -> None:
    """Store user-drawn polygon coordinates so the field page can display them."""
    _polygon_coords[field_id] = coords


def set_polygon_override(field_id: str, polygon_id: str, coords: list[list[float]] = None) -> None:
    """Set a user-drawn polygon as the active polygon for a field.
    This overrides the auto-generated square so all fetch functions use the drawn polygon."""
    _polygon_override[field_id] = polygon_id
    _polygon_cache[field_id] = polygon_id
    if coords:
        _polygon_coords[field_id] = coords


# ──────────────────────────────────────────────────────────────────────────────
# Open-Meteo: current + historical weather
# ──────────────────────────────────────────────────────────────────────────────

def get_live_weather(lat: float, lng: float) -> dict | None:
    """
    Fetch current weather + 30-day historical aggregates from Open-Meteo.
    Returns dict with temperature, humidity, rainfall, wind data.
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
            f"{OPEN_METEO_ARCHIVE}",
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
    Returns dict with soil_moisture_percent and temperature_10cm_c.
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


def get_real_telemetry_history(field_lat: float, field_lng: float, field_id: str, days: int = 45) -> list[dict]:
    """
    Build a 45-day telemetry timeline from real sources:
      - temperature / rainfall / humidity → Open-Meteo archive (daily)
      - soil_moisture → Open-Meteo ERA5-Land soil_moisture_0_to_7cm
      - ndvi → Agromonitoring NDVI history (forward-filled to daily)
    Returns list of {date, ndvi, soil_moisture, temperature, rainfall, humidity}.
    Returns empty list if Open-Meteo fails.
    """
    # --- 1. Open-Meteo archive: weather + soil moisture (45 days) ---
    archive_data = {}
    try:
        end_date = datetime.utcnow().date() - timedelta(days=1)  # yesterday: latest archive data
        start_date = end_date - timedelta(days=days - 1)
        resp = requests.get(
            f"{OPEN_METEO_ARCHIVE}",
            params={
                "latitude": field_lat,
                "longitude": field_lng,
                "start_date": str(start_date),
                "end_date": str(end_date),
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,"
                         "relative_humidity_2m_mean,soil_moisture_0_to_7cm_mean",
                "timezone": "auto",
            },
            timeout=15,
        )
        resp.raise_for_status()
        daily = resp.json().get("daily", {})
        dates = daily.get("time", [])
        temps_max = daily.get("temperature_2m_max", [])
        temps_min = daily.get("temperature_2m_min", [])
        rains = daily.get("precipitation_sum", [])
        humids = daily.get("relative_humidity_2m_mean", [])
        soil_sm = daily.get("soil_moisture_0_to_7cm_mean", [])
        for i, d in enumerate(dates):
            t_max = temps_max[i] if i < len(temps_max) else None
            t_min = temps_min[i] if i < len(temps_min) else None
            archive_data[d] = {
                "temperature": round((t_max + t_min) / 2, 1) if t_max is not None and t_min is not None else None,
                "rainfall": round(rains[i], 1) if i < len(rains) and rains[i] is not None else 0,
                "humidity": round(humids[i], 1) if i < len(humids) and humids[i] is not None else None,
                # soil moisture in m³/m³ → convert to % (×100)
                "soil_moisture": round(soil_sm[i] * 100, 1) if i < len(soil_sm) and soil_sm[i] is not None else None,
            }
    except Exception as e:
        print(f"[live_data] Open-Meteo archive fetch failed: {e}")

    # --- 2. Agromonitoring NDVI history (forward-fill to daily) ---
    ndvi_by_date: dict[str, float] = {}
    polyid = get_or_create_polygon(field_lat, field_lng, field_id)
    if polyid:
        try:
            end_dt = datetime.utcnow() - timedelta(days=1)
            start_dt = end_dt - timedelta(days=days + 5)
            resp = requests.get(
                f"{AGRO_BASE}/ndvi/history",
                params={
                    "polyid": polyid,
                    "start": int(start_dt.timestamp()),
                    "end": int(end_dt.timestamp()),
                    "appid": AGRO_KEY,
                },
                timeout=15,
            )
            resp.raise_for_status()
            records = resp.json()
            if isinstance(records, list):
                # Build date→ndvi map from satellite passes, sorted ascending
                sorted_recs = sorted(
                    [r for r in records if "data" in r and "mean" in r.get("data", {})],
                    key=lambda r: r.get("dt", 0),
                )
                for rec in sorted_recs:
                    dt_obj = datetime.utcfromtimestamp(rec["dt"])
                    date_str = dt_obj.strftime("%Y-%m-%d")
                    ndvi_by_date[date_str] = round(rec["data"]["mean"], 3)
        except Exception as e:
            print(f"[live_data] Agromonitoring NDVI history fetch failed: {e}")

    # --- 3. Merge into daily timeline, forward-fill NDVI ---
    timeline = []
    current_ndvi = 0.6  # sensible default if no satellite data at all
    for i in range(days):
        d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        arch = archive_data.get(d, {})
        if d in ndvi_by_date:
            current_ndvi = ndvi_by_date[d]
        timeline.append({
            "date": d,
            "ndvi": current_ndvi,
            "soil_moisture": arch.get("soil_moisture"),
            "temperature": arch.get("temperature"),
            "rainfall": arch.get("rainfall"),
            "humidity": arch.get("humidity"),
        })

    if not archive_data:
        # If Open-Meteo completely failed, return empty timeline
        return []

    return timeline


def build_evidence_from_live(field_id: str, field_lat: float, field_lng: float, crop_type: str, zone: str) -> dict:
    """
    Build the evidence_data dict from live sources.
    Returns None for any field where live data is unavailable.
    """
    live = fetch_all_live_data(field_id, field_lat, field_lng, crop_type)

    weather = live["weather"] or {}
    hist = weather.get("_historical") or {}
    soil = live["soil"] or {}
    crop = live["crop_info"]

    return {
        "soil_moisture_percent": soil.get("soil_moisture_percent"),
        "rainfall_7d_mm": weather.get("rainfall_7d_mm"),
        "temperature_c": weather.get("temperature_c"),
        "humidity_percent": weather.get("humidity_percent"),
        "vegetation_ndvi_change": live["ndvi_change"],
        "zone": zone,
        "_live_sources": {
            "weather_available": weather is not None,
            "soil_available": soil is not None,
            "ndvi_available": live["ndvi_change"] is not None,
            "crop_optimal_moisture": crop["optimal_soil_moisture_percent"] if crop else None,
        },
    }
