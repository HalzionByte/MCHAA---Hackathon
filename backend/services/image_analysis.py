"""Gemini Vision-based crop image analysis — detects infestation, disease, harm, or healthy."""

import os
import json
import base64
import requests

# Valid anomaly types the model should classify into
ANOMALY_TYPES = {
    "healthy",
    "insect_infestation",
    "pest_attack",
    "disease",
    "nutrient_physical_harm",
}

_SYSTEM_PROMPT = """\
You are an expert agricultural crop health analyzer. Analyze the provided crop image and classify its health status.

Return ONLY valid JSON with this exact schema:
{
  "anomaly_type": "<one of: healthy, insect_infestation, pest_attack, disease, nutrient_physical_harm>",
  "severity": <float 0.0 to 1.0>,
  "confidence": <float 0.0 to 1.0>,
  "description": "<brief description of what you observe>",
  "detected_pests": [<list of specific pests/diseases/borers detected, or empty list if healthy>],
  "recommended_actions": ["<specific action 1>", "<specific action 2>"]
}

Classification rules:
- healthy: crop looks green, vibrant, no visible damage or pests
- insect_infestation: visible insects, larvae, holes, webbing, or aphid clusters on leaves/stems
- pest_attack: borers, caterpillars, locusts, beetles actively damaging the crop
- disease: fungal spots, blight, rust, mildew, bacterial streaks, viral mosaic patterns
- nutrient_physical_harm: yellowing, wilting, sunburn, drought stress, nutrient deficiency, frost damage

Severity guide:
- 0.0 = no issue (healthy)
- 0.1-0.3 = mild (early stage, minor spotting, few pests)
- 0.3-0.6 = moderate (visible damage, multiple affected areas)
- 0.6-0.8 = severe (widespread damage, significant pest presence)
- 0.8-1.0 = critical (crop at risk of total loss)

For "healthy": severity=0.0, detected_pests=[], recommended_actions=["Continue regular monitoring"]
For others: severity=0.4-1.0 depending on extent, list specific pests/diseases, provide actionable recommendations.

Respond ONLY with the JSON object, no additional text."""


def _configure_gemini():
    """Configure and return the Gemini model."""
    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        genai.configure(api_key=api_key)
        return genai.GenerativeModel("gemini-3.6-flash")
    except Exception as e:
        print(f"[image_analysis] Failed to configure Gemini: {e}")
        return None


def _decode_image_url(image_url: str) -> bytes | None:
    """Decode an image from a URL (base64 data URL or http URL) to bytes."""
    if image_url.startswith("data:"):
        # data:image/jpeg;base64,/9j/4AAQ...
        header, b64data = image_url.split(",", 1)
        return base64.b64decode(b64data)
    elif image_url.startswith("http://") or image_url.startswith("https://"):
        resp = requests.get(image_url, timeout=15)
        resp.raise_for_status()
        return resp.content
    return None


def _fallback_analysis() -> dict:
    """Deterministic fallback when Gemini is unavailable."""
    return {
        "anomaly_type": "healthy",
        "severity": 0.0,
        "confidence": 0.5,
        "description": "Image analysis unavailable — could not access vision model. Defaulting to healthy.",
        "detected_pests": [],
        "recommended_actions": ["Continue regular monitoring"],
    }


def analyze_crop_image(image_url: str) -> dict:
    """
    Analyze a crop image using Gemini Vision.

    Args:
        image_url: A base64 data URL or an http(s) URL pointing to the image.

    Returns:
        dict with anomaly_type, severity, confidence, description,
        detected_pests, recommended_actions.
    """
    model = _configure_gemini()
    if not model:
        return _fallback_analysis()

    image_bytes = _decode_image_url(image_url)
    if not image_bytes:
        return _fallback_analysis()

    try:
        # Determine MIME type from data URL header or default to jpeg
        mime_type = "image/jpeg"
        if image_url.startswith("data:"):
            mime_type = image_url.split(";")[0].split(":")[1]

        response = model.generate_content([
            _SYSTEM_PROMPT,
            {"mime_type": mime_type, "data": image_bytes},
        ])

        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        result = json.loads(text)

        # Validate anomaly_type
        if result.get("anomaly_type") not in ANOMALY_TYPES:
            result["anomaly_type"] = "healthy"

        # Clamp severity/confidence
        result["severity"] = max(0.0, min(1.0, float(result.get("severity", 0.0))))
        result["confidence"] = max(0.0, min(1.0, float(result.get("confidence", 0.5))))

        # Ensure required fields
        result.setdefault("description", "")
        result.setdefault("detected_pests", [])
        result.setdefault("recommended_actions", [])

        print(f"[image_analysis] Gemini result: {result['anomaly_type']} "
              f"(severity={result['severity']:.2f}, confidence={result['confidence']:.2f})")
        return result

    except Exception as e:
        print(f"[image_analysis] Gemini analysis failed: {e}")
        return _fallback_analysis()


# ============================================================================
# Gemini Diagnosis Generator — produces AI-written cause, reasoning, action
# ============================================================================

_DIAGNOSIS_PROMPT = """\
You are an expert agricultural diagnostician. Based on the image analysis results below,
provide a farmer-friendly diagnosis and recommended action.

Image analysis result:
- Anomaly type: {anomaly_type}
- Description: {description}
- Detected pests: {detected_pests}
- Suggested actions: {recommended_actions}
- Severity: {severity}
- Crop type: {crop_type}

Return ONLY valid JSON with this exact schema:
{{
  "cause": "<concise farmer-friendly problem statement, 1-3 sentences. State what is wrong with the crop>",
  "reasoning": "<what the image shows and why this diagnosis was made>",
  "confidence": <float 0.0 to 1.0>,
  "action_key": "<one of: prioritize_irrigation, apply_pesticide, harvest_early, scout_monitor>",
  "action_summary": "<specific recommended action sentence for the farmer, e.g. Apply neem-based pesticide to affected leaves and remove severely damaged plants>",
  "priority": <1=urgent within 24h, 2=high within 48h, 3=medium within 1 week>
}}

Rules:
- cause and action_summary must be clear, plain English a farmer can understand.
- action_summary must NOT start with "Recommended action:" — give the actual instruction directly.
- confidence reflects how certain you are given the available evidence.
- priority: 1=urgent, 2=high, 3=medium.

Respond ONLY with the JSON object, no additional text."""

_VALID_ACTION_KEYS = {
    "prioritize_irrigation",
    "apply_pesticide",
    "harvest_early",
    "scout_monitor",
}


def _fallback_diagnosis(vision_result: dict, crop_type: str) -> dict:
    """Fallback diagnosis when Gemini API fails — uses Gemini's own vision description only."""
    description = vision_result.get("description", "Crop health issue detected.")
    detected_pests = vision_result.get("detected_pests", [])
    recommended_actions = vision_result.get("recommended_actions", [])
    severity = vision_result.get("severity", 0.5)

    cause = description
    if detected_pests:
        cause += f" Detected: {', '.join(detected_pests[:3])}."

    action_summary = recommended_actions[0] if recommended_actions else "Consult an agricultural extension officer for further guidance."

    action_key = "scout_monitor"
    action_lower = action_summary.lower()
    if "irrigat" in action_lower or "water" in action_lower:
        action_key = "prioritize_irrigation"
    elif "pesticid" in action_lower or "spray" in action_lower or "fungicide" in action_lower:
        action_key = "apply_pesticide"
    elif "harvest" in action_lower:
        action_key = "harvest_early"

    confidence = vision_result.get("confidence", 0.7)
    priority = 1 if severity >= 0.6 else (2 if severity >= 0.3 else 3)

    return {
        "cause": cause,
        "reasoning": f"Image analysis detected {vision_result.get('anomaly_type', 'an issue')} "
                     f"(severity {severity:.0%}). {description}",
        "confidence": confidence,
        "action_key": action_key,
        "action_summary": action_summary,
        "priority": priority,
    }


def diagnose_with_gemini(vision_result: dict, crop_type: str = "wheat") -> dict:
    """
    Generate a full diagnosis + recommendation using Gemini LLM, based on
    the vision classification already performed.

    Args:
        vision_result: Output from analyze_crop_image (anomaly_type, severity,
                       confidence, description, detected_pests, recommended_actions).
        crop_type: The crop type of the field (wheat, rice, cotton, sugarcane).

    Returns:
        dict with cause, reasoning, confidence, action_key, action_summary, priority.
    """
    model = _configure_gemini()
    if not model:
        return _fallback_diagnosis(vision_result, crop_type)

    try:
        prompt = _DIAGNOSIS_PROMPT.format(
            anomaly_type=vision_result.get("anomaly_type", "unknown"),
            description=vision_result.get("description", "No description available."),
            detected_pests=vision_result.get("detected_pests", []),
            recommended_actions=vision_result.get("recommended_actions", []),
            severity=vision_result.get("severity", 0.5),
            crop_type=crop_type,
        )

        response = model.generate_content([prompt])
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        result = json.loads(text)

        result["action_key"] = result.get("action_key", "scout_monitor")
        if result["action_key"] not in _VALID_ACTION_KEYS:
            result["action_key"] = "scout_monitor"
        result["cause"] = str(result.get("cause", "Unknown issue detected."))
        result["reasoning"] = str(result.get("reasoning", "Insufficient data."))
        result["confidence"] = max(0.0, min(1.0, float(result.get("confidence", 0.7))))
        result["action_summary"] = str(result.get("action_summary", "Monitor the crop."))
        result["priority"] = int(result.get("priority", 2))
        if result["priority"] not in (1, 2, 3):
            result["priority"] = 2

        print(f"[diagnosis] Gemini diagnosis: {result['action_key']} "
              f"(confidence={result['confidence']:.2f}, priority={result['priority']})")
        return result

    except Exception as e:
        print(f"[diagnosis] Gemini diagnosis failed: {e}, using fallback")
        return _fallback_diagnosis(vision_result, crop_type)
