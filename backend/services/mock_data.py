"""Mock data generators for soil, weather, crop history, and crop catalog services"""

PAKISTANI_CROPS_CATALOG = [
    {
        "crop_id": "wheat",
        "name": "Wheat",
        "local_name": "Gandum (گندم)",
        "season": "Rabi",
        "season_months": "Nov - Apr",
        "water_requirement_mm": 400,
        "water_range": "350 - 500 mm",
        "optimal_soil_moisture_percent": {"min": 25.0, "max": 35.0},
        "soil_ph_range": "6.0 - 7.5",
        "growth_duration_days": 140,
        "description": "Primary Rabi staple crop in Pakistan. Requires critical irrigation during crown root initiation and grain filling stages.",
        "common_diseases": [
            {
                "name": "Leaf Rust (Puccinia triticina)",
                "symptoms": "Small, round orange-brown pustules on leaves",
                "risk_factor": "High humidity & warm temperatures"
            },
            {
                "name": "Stripe Rust (Yellow Rust)",
                "symptoms": "Yellow streaks along leaf veins",
                "risk_factor": "Cool, moist weather during early spring"
            },
            {
                "name": "Terminal Heat & Water Stress",
                "symptoms": "Premature shriveling of grains during March/April maturity",
                "risk_factor": "High ambient temperatures (>32°C) combined with soil moisture < 20%"
            }
        ],
        "recommended_rotation_crops": ["cotton", "rice", "sugarcane"],
        "rotation_benefits": "Balances soil organic matter after Kharif heavy feeders like Cotton and Rice."
    },
    {
        "crop_id": "rice",
        "name": "Rice / Paddy",
        "local_name": "Chawal (چاول / دھان)",
        "season": "Kharif",
        "season_months": "May - Nov",
        "water_requirement_mm": 1400,
        "water_range": "1200 - 1600 mm",
        "optimal_soil_moisture_percent": {"min": 45.0, "max": 65.0},
        "soil_ph_range": "5.5 - 7.0",
        "growth_duration_days": 120,
        "description": "High water requirement Kharif crop widely cultivated in Punjab (Basmati) and Sindh (IRRI). Requires puddle flooded conditions.",
        "common_diseases": [
            {
                "name": "Bacterial Leaf Blight (Xanthomonas oryzae)",
                "symptoms": "Water-soaked lesions on leaf margins turning pale yellow to white",
                "risk_factor": "High rainfall, humidity >80%, over-fertilization of Nitrogen"
            },
            {
                "name": "Rice Blast (Magnaporthe oryzae)",
                "symptoms": "Spindle-shaped lesions with grayish centers on leaves and collar",
                "risk_factor": "Cool nights, high relative humidity, excessive Nitrogen"
            },
            {
                "name": "Moisture Deficit Anomaly",
                "symptoms": "Leaf rolling and root desiccation due to water shortage",
                "risk_factor": "Soil moisture drops below 35% during tillering or flowering"
            }
        ],
        "recommended_rotation_crops": ["wheat", "berseem"],
        "rotation_benefits": "Rotating flooded paddy with winter Wheat helps break soil compaction and anaerobic bacterial cycles."
    },
    {
        "crop_id": "cotton",
        "name": "Cotton",
        "local_name": "Kapaas (کپاس)",
        "season": "Kharif",
        "season_months": "May - Nov",
        "water_requirement_mm": 850,
        "water_range": "700 - 1000 mm",
        "optimal_soil_moisture_percent": {"min": 20.0, "max": 30.0},
        "soil_ph_range": "6.0 - 8.0",
        "growth_duration_days": 165,
        "description": "Major cash crop in Southern Punjab and Sindh. Extremely sensitive to waterlogging and leaf curl virus outbreaks.",
        "common_diseases": [
            {
                "name": "Cotton Leaf Curl Virus (CLCv)",
                "symptoms": "Upward or downward curling of leaf margins, vein thickening, enation",
                "risk_factor": "Whitefly pest vector explosion in hot dry weather"
            },
            {
                "name": "Pink Bollworm Infestation",
                "symptoms": "Rosetted flowers, damaged bolls with lint staining",
                "risk_factor": "Late season boll formation"
            },
            {
                "name": "Waterlogging / Over-irrigation Stress",
                "symptoms": "Wilting and root asphyxiation due to standing water",
                "risk_factor": "Soil moisture exceeding 40% for >48 hours"
            }
        ],
        "recommended_rotation_crops": ["wheat", "pulses"],
        "rotation_benefits": "Deep taproot system of Cotton aerates lower soil profile, leaving excellent seedbed structure for Rabi Wheat."
    },
    {
        "crop_id": "sugarcane",
        "name": "Sugarcane",
        "local_name": "Ganna (گنا)",
        "season": "Annual",
        "season_months": "Feb - Feb (12 Months)",
        "water_requirement_mm": 2000,
        "water_range": "1500 - 2500 mm",
        "optimal_soil_moisture_percent": {"min": 40.0, "max": 50.0},
        "soil_ph_range": "6.0 - 7.5",
        "growth_duration_days": 360,
        "description": "High yield annual crop supplying sugar mills. Requires continuous moderate moisture and heavy nutrient uptake.",
        "common_diseases": [
            {
                "name": "Red Rot (Colletotrichum falcatum)",
                "symptoms": "Reddening of internal stalk tissues with white transverse bands, sour odor",
                "risk_factor": "Excess monsoon humidity and waterlogged soil conditions"
            },
            {
                "name": "Whip Smut",
                "symptoms": "Black whip-like structure emerging from growing shoot apex",
                "risk_factor": "Ratoon crop propagation and infected seed cane"
            },
            {
                "name": "Drought / Canopy Desiccation",
                "symptoms": "Stunted cane elongation and dry leaf sheaths",
                "risk_factor": "Soil moisture dropping below 25% during summer formative stage"
            }
        ],
        "recommended_rotation_crops": ["wheat", "pulses", "mustard"],
        "rotation_benefits": "Followed by leguminous pulses or Wheat to restore nitrogen depleted by long sugarcane harvest cycles."
    }
]

def get_all_crops() -> list:
    """Return all crops from catalog"""
    return PAKISTANI_CROPS_CATALOG

def get_crop_by_id(crop_id: str) -> dict:
    """Return a single crop by ID (or None if not found)"""
    if not crop_id:
        return None
    crop_id_clean = crop_id.lower().strip()
    for crop in PAKISTANI_CROPS_CATALOG:
        if crop["crop_id"] == crop_id_clean:
            return crop
    return None

def generate_rotation_advice(current_crop_type: str) -> dict:
    """
    Generate dynamic crop rotation suggestions based on current active crop.
    This provides smart guidance for farmers without forcing decisions.
    """
    current_clean = (current_crop_type or "").lower().strip()
    current_crop = get_crop_by_id(current_clean)
    
    if not current_crop:
        return {
            "current_crop": current_crop_type or "Unspecified",
            "suggested_crops": [
                {
                    "crop_id": "wheat",
                    "name": "Wheat (Gandum)",
                    "season": "Rabi",
                    "rationale": "Ideal winter staple crop across Punjab & Sindh."
                },
                {
                    "crop_id": "cotton",
                    "name": "Cotton (Kapaas)",
                    "season": "Kharif",
                    "rationale": "Ideal summer cash crop with deep root soil aeration."
                }
            ],
            "rotation_tip": "Select a primary crop to receive customized seasonal rotation guidance."
        }
    
    suggestions = []
    for rec_id in current_crop.get("recommended_rotation_crops", []):
        rec_crop = get_crop_by_id(rec_id)
        if rec_crop:
            suggestions.append({
                "crop_id": rec_crop["crop_id"],
                "name": f"{rec_crop['name']} ({rec_crop['local_name']})",
                "season": rec_crop["season"],
                "season_months": rec_crop["season_months"],
                "water_requirement_mm": rec_crop["water_requirement_mm"],
                "rationale": f"Ideal target after {current_crop['name']} harvest. {rec_crop['rotation_benefits']}"
            })
            
    return {
        "current_crop": {
            "crop_id": current_crop["crop_id"],
            "name": current_crop["name"],
            "local_name": current_crop["local_name"],
            "season": current_crop["season"]
        },
        "suggested_crops": suggestions,
        "rotation_tip": f"💡 After harvesting {current_crop['name']} ({current_crop['season']} season), planting one of the recommended crops above restores soil structure and suppresses persistent pest cycles."
    }

def get_mock_soil_data(field_id: str) -> dict:
    """Return simulated soil sensor readings"""
    return {
        "soil_moisture_percent": 18,
        "nitrogen_ppm": 25,
        "phosphorus_ppm": 10,
        "potassium_ppm": 150,
        "ph": 6.8,
        "organic_matter_percent": 2.5
    }

def get_mock_weather_data(field_id: str) -> dict:
    """Return simulated current weather data"""
    return {
        "temperature_c": 34,
        "humidity_percent": 45,
        "rainfall_today_mm": 0,
        "rainfall_7d_mm": 2,
        "wind_speed_kmh": 12,
        "wind_direction": "NW",
        "cloud_cover_percent": 20
    }

def get_mock_historical_weather(field_id: str, days: int = 30) -> dict:
    """Return simulated historical weather data"""
    return {
        "days": days,
        "avg_temperature_c": 32,
        "avg_humidity_percent": 50,
        "total_rainfall_mm": 45,
        "max_temperature_c": 38,
        "min_temperature_c": 28
    }

def get_mock_crop_history(field_id: str) -> dict:
    """Return simulated historical crop data"""
    return {
        "crop_type": "wheat",
        "planting_date": "2024-10-15",
        "expected_harvest": "2025-04-30",
        "prev_stress_events": ["water_stress_2023", "heat_stress_2022"],
        "avg_yield_kg_hectare": 4500,
        "pest_history": ["armyworm_2023"],
        "disease_history": []
    }

import math
from datetime import datetime, timedelta

def generate_field_telemetry_history(field_id: str, days: int = 45, crop_type: str = "wheat") -> list:
    """
    Generate realistic historical telemetry timeseries data (NDVI, soil moisture, temp, rainfall, humidity)
    tailored to the field's active crop type.
    """
    crop_clean = (crop_type or "wheat").lower().strip()
    crop_info = get_crop_by_id(crop_clean)
    
    if crop_info:
        target_moisture_min = crop_info["optimal_soil_moisture_percent"]["min"]
        target_moisture_max = crop_info["optimal_soil_moisture_percent"]["max"]
        base_moisture = (target_moisture_min + target_moisture_max) / 2.0
    else:
        base_moisture = 28.0

    today = datetime.utcnow()
    history = []
    
    for i in range(days):
        day_offset = (days - 1) - i
        point_date = (today - timedelta(days=day_offset)).strftime("%Y-%m-%d")
        
        # Simulated sinusoidal curves with slight variation
        ndvi_val = round(max(0.1, min(1.0, 0.68 + math.sin(i * 0.25) * 0.08 + ((i % 5) - 2) * 0.01)), 2)
        
        # Soil moisture drops towards the recent days for field-001 to reflect alert state
        moisture_drop = (i / days) * 8.0 if field_id == "field-001" and i > (days - 10) else 0.0
        moisture_val = round(max(5.0, base_moisture + math.sin(i * 0.2) * 4.0 - moisture_drop), 1)
        
        temp_val = round(max(15.0, 31.0 + math.sin(i * 0.15) * 4.0 + ((i % 3) - 1) * 0.5), 1)
        rain_val = round(max(0.0, math.sin(i * 0.4) * 4.0 + ((i % 7 == 0) * 8.0) - 2.0), 1)
        humidity_val = round(max(20.0, min(100.0, 52.0 + math.sin(i * 0.1) * 12.0)), 1)
        
        history.append({
            "date": point_date,
            "ndvi": ndvi_val,
            "soil_moisture": moisture_val,
            "temperature": temp_val,
            "rainfall": rain_val,
            "humidity": humidity_val
        })
        
    return history

