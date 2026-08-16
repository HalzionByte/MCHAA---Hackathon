"""Mock data generators for soil, weather, and crop history services"""

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
