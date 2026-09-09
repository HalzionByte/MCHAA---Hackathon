"""AI Agent service - orchestrates AI diagnosis using Gemini + tool calling"""

import asyncio
from services.mock_data import get_crop_by_id
from services.live_data import (
    fetch_all_live_data,
    get_live_soil,
    get_live_weather,
    get_live_ndvi_change,
    get_or_create_polygon,
)
from services.image_analysis import diagnose_with_gemini, diagnose_sensors_with_gemini
from models import Diagnosis, Evidence, Recommendation, Anomaly
from sqlalchemy.orm import Session
import uuid
import os
import json

try:
    from anthropic import Anthropic
    client = Anthropic() if os.getenv("CLAUDE_API_KEY") else None
except ImportError:
    client = None

# Module-level field context: populated by run_agent() before the Claude loop
# so execute_tool() can access field coordinates without a DB session.
_field_context: dict = {}

TOOLS = [
    {
        "name": "get_soil_data",
        "description": "Get current soil sensor readings for a field (moisture, NPK, pH, etc.)",
        "input_schema": {
            "type": "object",
            "properties": {
                "field_id": {"type": "string", "description": "The field ID to retrieve soil data for"}
            },
            "required": ["field_id"]
        }
    },
    {
        "name": "get_weather_data",
        "description": "Get current weather readings for a field (temperature, humidity, rainfall, wind)",
        "input_schema": {
            "type": "object",
            "properties": {
                "field_id": {"type": "string", "description": "The field ID to retrieve weather data for"}
            },
            "required": ["field_id"]
        }
    },
    {
        "name": "get_historical_weather",
        "description": "Get historical weather data for the past 30 days",
        "input_schema": {
            "type": "object",
            "properties": {
                "field_id": {"type": "string", "description": "The field ID to retrieve historical weather for"},
                "days": {"type": "integer", "description": "Number of days of history (default 30)"}
            },
            "required": ["field_id"]
        }
    },
    {
        "name": "get_crop_history",
        "description": "Get historical crop data (planting date, previous issues, yield, pest/disease history)",
        "input_schema": {
            "type": "object",
            "properties": {
                "field_id": {"type": "string", "description": "The field ID to retrieve crop history for"}
            },
            "required": ["field_id"]
        }
    }
]


def execute_tool(tool_name: str, tool_input: dict) -> dict:
    """Execute a tool — live data only, None if unavailable."""
    field_id = tool_input.get("field_id", "")
    ctx = _field_context.get(field_id, {})
    lat = ctx.get("lat", 31.5204)
    lng = ctx.get("lng", 74.3587)
    crop_type = ctx.get("crop_type", "wheat")
    polyid = ctx.get("polyid")

    if tool_name == "get_soil_data":
        live = get_live_soil(polyid, lat, lng)
        if live is not None:
            return live
        return None

    elif tool_name == "get_weather_data":
        live = get_live_weather(lat, lng)
        if live is not None:
            return {k: v for k, v in live.items() if not k.startswith("_")}
        return None

    elif tool_name == "get_historical_weather":
        days = tool_input.get("days", 30)
        live = get_live_weather(lat, lng)
        if live and live.get("_historical"):
            hist = live["_historical"]
            return {
                "days": days,
                "avg_temperature_c": hist.get("avg_temperature_c"),
                "avg_humidity_percent": hist.get("avg_humidity_percent"),
                "total_rainfall_mm": hist.get("total_rainfall_mm"),
                "max_temperature_c": hist.get("max_temperature_c"),
                "min_temperature_c": hist.get("min_temperature_c"),
            }
        return None

    elif tool_name == "get_crop_history":
        return None

    return {"error": f"Unknown tool: {tool_name}"}


async def run_agent(anomaly_id: str, field_id: str, anomaly_type: str, evidence_data: dict, db: Session = None):
    """
    Run the AI agent to diagnose an anomaly.
    """
    should_close_db = False
    if db is None:
        from database import SessionLocal
        db = SessionLocal()
        should_close_db = True

    try:
        # Populate field context for execute_tool()
        field = db.query(Anomaly.field_id).filter(Anomaly.anomaly_id == anomaly_id).first() if db else None
        from models import Field
        field_obj = db.query(Field).filter(Field.field_id == field_id).first() if db else None

        if field_obj:
            polyid = get_or_create_polygon(field_obj.boundary_lat, field_obj.boundary_lng, field_id)
            _field_context[field_id] = {
                "lat": field_obj.boundary_lat,
                "lng": field_obj.boundary_lng,
                "crop_type": field_obj.crop_type,
                "polyid": polyid,
            }

        api_key = os.getenv("CLAUDE_API_KEY")
        if not api_key or not client:
            return generate_ai_diagnosis(anomaly_id, field_id, anomaly_type, evidence_data, db)

        system_prompt = """You are an expert agricultural AI system diagnosing crop health anomalies.

Your task:
1. Analyze the detected anomaly using available tools
2. Request soil, weather, and crop history data
3. Correlate the evidence
4. Determine the most likely cause
5. Provide a diagnosis with confidence score
6. Recommend an action

Be concise and evidence-based. Confidence should be 0.0-1.0."""

        user_message = f"""A crop anomaly has been detected:
- Anomaly Type: {anomaly_type}
- Field ID: {field_id}
- Initial Evidence: {json.dumps(evidence_data)}

Please investigate this anomaly by:
1. Retrieving soil data
2. Retrieving current and historical weather
3. Checking crop history
4. Analyzing the evidence
5. Providing a diagnosis with confidence score and reasoning
6. Recommending an action"""

        messages = [{"role": "user", "content": user_message}]

        while True:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                system=system_prompt,
                tools=TOOLS,
                messages=messages
            )

            if response.stop_reason == "tool_use":
                tool_results = []
                for content_block in response.content:
                    if content_block.type == "tool_use":
                        tool_result = execute_tool(content_block.name, content_block.input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": content_block.id,
                            "content": json.dumps(tool_result)
                        })
                messages.append({"role": "assistant", "content": response.content})
                messages.append({"role": "user", "content": tool_results})
            else:
                diagnosis_text = ""
                for content_block in response.content:
                    if hasattr(content_block, "text"):
                        diagnosis_text += content_block.text
                store_diagnosis_and_recommendation(anomaly_id, field_id, diagnosis_text, evidence_data, db)
                break

    except Exception as e:
        print(f"Claude API error: {e}")
        return generate_ai_diagnosis(anomaly_id, field_id, anomaly_type, evidence_data, db)
    finally:
        if should_close_db and db:
            db.close()


def generate_ai_diagnosis(anomaly_id: str, field_id: str, anomaly_type: str, evidence_data: dict, db: Session):
    """Generate AI-written diagnosis + recommendation using Gemini, then persist to DB.

    When evidence_data contains sensor readings (soil_moisture_percent, temperature_c, etc.),
    uses the sensor-aware Gemini prompt that evaluates conditions against crop requirements.
    Otherwise falls back to the image-based diagnosis prompt.
    """
    # Resolve crop_type
    crop_type = evidence_data.get("crop_type")
    if not crop_type:
        try:
            from models import Field
            field_obj = db.query(Field).filter(Field.field_id == field_id).first()
            if field_obj and field_obj.crop_type:
                crop_type = field_obj.crop_type
        except Exception as e:
            print(f"[agent_service] Failed to resolve crop_type: {e}")
    if not crop_type:
        crop_type = "wheat"

    # Check if we have sensor readings — use sensor-aware diagnosis
    has_sensor_data = any(
        evidence_data.get(k) is not None
        for k in ("soil_moisture_percent", "temperature_c", "humidity_percent", "rainfall_7d_mm")
    )

    if has_sensor_data:
        from services.mock_data import get_crop_by_id
        crop_info = get_crop_by_id(crop_type)
        diag = diagnose_sensors_with_gemini(evidence_data, crop_type, crop_info)
        cause = diag["cause"]
        confidence = diag["confidence"]
        reasoning = diag["reasoning"]
        action_key = diag["action_key"]
        action_summary = diag["action_summary"]
        priority = diag["priority"]
    else:
        # Image-based path — build vision_result dict expected by diagnose_with_gemini
        vision_result = {
            "anomaly_type": anomaly_type,
            "severity": evidence_data.get("severity", 0.5),
            "confidence": evidence_data.get("confidence", 0.7),
            "description": evidence_data.get("image_description", evidence_data.get("description", "No description.")),
            "detected_pests": evidence_data.get("detected_pests", []),
            "recommended_actions": evidence_data.get("recommended_actions", []),
        }
        diag = diagnose_with_gemini(vision_result, crop_type)
        cause = diag["cause"]
        confidence = diag["confidence"]
        reasoning = diag["reasoning"]
        action_key = diag["action_key"]
        action_summary = diag["action_summary"]
        priority = diag["priority"]

    store_diagnosis_and_recommendation(
        anomaly_id, field_id, cause, evidence_data, db,
        confidence=confidence, reasoning=reasoning,
        action=action_key, priority=priority,
        action_summary=action_summary,
    )


def store_diagnosis_and_recommendation(anomaly_id, field_id, diagnosis_text, evidence_data,
                                       db, confidence=0.87, reasoning=None,
                                       action="prioritize_irrigation", priority=1,
                                       action_summary=None):
    """Parse diagnosis text and store in database"""
    if not reasoning:
        reasoning = diagnosis_text
    cause = diagnosis_text.split(".")[0] if diagnosis_text else "Unable to determine cause"

    diagnosis = Diagnosis(
        diagnosis_id=str(uuid.uuid4()),
        anomaly_id=anomaly_id,
        probable_cause=cause[:500],
        confidence=confidence,
        reasoning=reasoning
    )
    db.add(diagnosis)

    evidence = Evidence(
        evidence_id=str(uuid.uuid4()),
        anomaly_id=anomaly_id,
        soil_moisture_percent=evidence_data.get("soil_moisture_percent"),
        rainfall_7d_mm=evidence_data.get("rainfall_7d_mm"),
        temperature_c=evidence_data.get("temperature_c"),
        humidity_percent=evidence_data.get("humidity_percent"),
        vegetation_ndvi_change=evidence_data.get("vegetation_ndvi_change")
    )
    db.add(evidence)

    description = action_summary or f"Recommended action: {action.replace('_', ' ').title()}"

    recommendation = Recommendation(
        recommendation_id=str(uuid.uuid4()),
        anomaly_id=anomaly_id,
        action=action,
        priority=priority,
        target_zone=evidence_data.get("zone", "Unknown"),
        description=description
    )
    db.add(recommendation)
    db.commit()
