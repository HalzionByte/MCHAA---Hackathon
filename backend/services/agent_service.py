"""AI Agent service - orchestrates Claude API with tool calling for diagnosis"""

import asyncio
from services.mock_data import (
    get_mock_soil_data,
    get_mock_weather_data,
    get_mock_historical_weather,
    get_mock_crop_history
)
from models import Diagnosis, Evidence, Recommendation, Anomaly
from sqlalchemy.orm import Session
from anthropic import Anthropic
import uuid
import os
import json

# Initialize Anthropic client
client = Anthropic()

# Tool definitions for Claude
TOOLS = [
    {
        "name": "get_soil_data",
        "description": "Get current soil sensor readings for a field (moisture, NPK, pH, etc.)",
        "input_schema": {
            "type": "object",
            "properties": {
                "field_id": {
                    "type": "string",
                    "description": "The field ID to retrieve soil data for"
                }
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
                "field_id": {
                    "type": "string",
                    "description": "The field ID to retrieve weather data for"
                }
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
                "field_id": {
                    "type": "string",
                    "description": "The field ID to retrieve historical weather for"
                },
                "days": {
                    "type": "integer",
                    "description": "Number of days of history (default 30)"
                }
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
                "field_id": {
                    "type": "string",
                    "description": "The field ID to retrieve crop history for"
                }
            },
            "required": ["field_id"]
        }
    }
]

def execute_tool(tool_name: str, tool_input: dict) -> dict:
    """Execute mock tools and return results"""
    field_id = tool_input.get("field_id")
    
    if tool_name == "get_soil_data":
        return get_mock_soil_data(field_id)
    elif tool_name == "get_weather_data":
        return get_mock_weather_data(field_id)
    elif tool_name == "get_historical_weather":
        days = tool_input.get("days", 30)
        return get_mock_historical_weather(field_id, days)
    elif tool_name == "get_crop_history":
        return get_mock_crop_history(field_id)
    else:
        return {"error": f"Unknown tool: {tool_name}"}

async def run_agent(anomaly_id: str, field_id: str, anomaly_type: str, evidence_data: dict, db: Session):
    """
    Run the AI agent to diagnose an anomaly.
    
    Process:
    1. Get anomaly context
    2. Call Claude API with tool definitions
    3. Claude decides which tools to call
    4. Execute tools, get results
    5. Send results back to Claude
    6. Claude generates diagnosis
    7. Store diagnosis, evidence, recommendation in DB
    """
    
    api_key = os.getenv("CLAUDE_API_KEY")
    if not api_key:
        # Fallback: use mock diagnosis if API key not set
        return generate_mock_diagnosis(anomaly_id, field_id, anomaly_type, evidence_data, db)
    
    try:
        # Build initial prompt for Claude
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
        
        # Agentic loop - Claude calls tools until it's done
        while True:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                system=system_prompt,
                tools=TOOLS,
                messages=messages
            )
            
            # Check if Claude wants to use tools
            if response.stop_reason == "tool_use":
                # Process tool calls
                tool_results = []
                
                for content_block in response.content:
                    if content_block.type == "tool_use":
                        tool_name = content_block.name
                        tool_input = content_block.input
                        tool_use_id = content_block.id
                        
                        # Execute the tool
                        tool_result = execute_tool(tool_name, tool_input)
                        
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": json.dumps(tool_result)
                        })
                
                # Add assistant response and tool results to messages
                messages.append({"role": "assistant", "content": response.content})
                messages.append({"role": "user", "content": tool_results})
            
            else:
                # Claude is done with tools, extract diagnosis from final response
                diagnosis_text = ""
                for content_block in response.content:
                    if hasattr(content_block, "text"):
                        diagnosis_text += content_block.text
                
                # Store diagnosis, evidence, recommendation in DB
                store_diagnosis_and_recommendation(
                    anomaly_id, 
                    field_id, 
                    diagnosis_text, 
                    evidence_data, 
                    db
                )
                break
    
    except Exception as e:
        print(f"Claude API error: {e}")
        # Fallback to mock diagnosis
        return generate_mock_diagnosis(anomaly_id, field_id, anomaly_type, evidence_data, db)

def generate_mock_diagnosis(anomaly_id: str, field_id: str, anomaly_type: str, evidence_data: dict, db: Session):
    """Generate mock diagnosis for testing (no Claude API needed)"""
    
    if anomaly_type == "water_stress":
        cause = "Likely water stress caused by prolonged low soil moisture and insufficient rainfall."
        confidence = 0.87
        reasoning = "Low soil moisture (18%) + low rainfall (2mm in 7 days) + high temperature (34°C) + negative vegetation change indicate classic water stress pattern."
        action = "prioritize_irrigation"
        priority = 1
    else:
        # Fallback for other types
        cause = f"Anomaly detected: {anomaly_type}"
        confidence = 0.60
        reasoning = "Insufficient data for confident diagnosis."
        action = "investigate"
        priority = 2
    
    store_diagnosis_and_recommendation(
        anomaly_id,
        field_id,
        cause,
        evidence_data,
        db,
        confidence=confidence,
        reasoning=reasoning,
        action=action,
        priority=priority
    )

def store_diagnosis_and_recommendation(
    anomaly_id: str,
    field_id: str,
    diagnosis_text: str,
    evidence_data: dict,
    db: Session,
    confidence: float = 0.87,
    reasoning: str = None,
    action: str = "prioritize_irrigation",
    priority: int = 1
):
    """Parse diagnosis text and store in database"""
    
    # If no reasoning provided, use the diagnosis text
    if not reasoning:
        reasoning = diagnosis_text
    
    # Parse diagnosis text for cause (take first sentence)
    cause = diagnosis_text.split(".")[0] if diagnosis_text else "Unable to determine cause"
    
    # Create and store Diagnosis
    diagnosis = Diagnosis(
        diagnosis_id=str(uuid.uuid4()),
        anomaly_id=anomaly_id,
        probable_cause=cause[:500],  # Limit to 500 chars
        confidence=confidence,
        reasoning=reasoning
    )
    db.add(diagnosis)
    
    # Create and store Evidence
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
    
    # Create and store Recommendation
    recommendation = Recommendation(
        recommendation_id=str(uuid.uuid4()),
        anomaly_id=anomaly_id,
        action=action,
        priority=priority,
        target_zone=evidence_data.get("zone", "Unknown"),
        description=f"Recommended action: {action.replace('_', ' ').title()}"
    )
    db.add(recommendation)
    
    db.commit()
