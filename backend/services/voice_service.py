"""Voice synthesis and Audio Guide generator service for farmers"""

def generate_farmer_voice_script(field_name: str, zone: str, action: str, reason: str, saved_usd: float) -> dict:
    """
    Generate plain spoken script and audio narration response for illiterate / low-reading farmers.
    """
    script = (
        f"Attention Farmer! In {field_name}, {zone} requires urgent action. "
        f"Recommended action: {action}. Reason: {reason}. "
        f"Taking action today will prevent an estimated ${saved_usd:.0f} in crop yield loss."
    )
    
    return {
        "spoken_script": script,
        "audio_url": f"/api/static/audio/guide_{zone.lower()}.mp3"
    }

def generate_sms_payload(zone: str, status_color: str, headline_what: str, saved_usd: float) -> str:
    """
    Generate ultra-compressed SMS/WhatsApp/USSD alert string under 160 characters.
    """
    sms = f"[CROP ALERT] Zone {zone} {status_color}: {headline_what}. Action needed in 24h. Yield saved: ${saved_usd:.0f}."
    return sms[:160]
