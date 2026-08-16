"""Anomaly detection service - handles vision analysis"""

def detect_anomaly(image_url: str, field_id: str) -> dict:
    """
    Detect anomalies in uploaded image.
    
    For MVP: Returns hardcoded water stress anomaly
    In v2: Integrate real vision model (YOLOv8, ViT, etc.)
    
    Returns:
        dict with anomaly_type, severity, confidence, zone, coordinates
    """
    
    # MVP: Hardcoded response (simulates vision model output)
    # In production, would call actual model inference here
    
    return {
        "anomaly_type": "water_stress",
        "severity": 0.85,
        "confidence": 0.87,
        "zone": "B3",
        "lat": 31.5204,
        "lng": 74.3587,
        "affected_area_percent": 12.5
    }

def generate_ndvi_change(image_url: str) -> float:
    """
    Calculate NDVI change (mock for MVP).
    Real implementation would use multispectral imagery.
    """
    return -0.14  # Negative change indicates vegetation stress
