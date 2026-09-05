import urllib.parse
from sqlalchemy.orm import Session
from models import WorkOrder, Field
import uuid
from datetime import datetime

LOCALIZED_AUDIO_TEMPLATES = {
    "ur": {
        "title": "اردو آڈیو ورک آرڈر",
        "script": "توجہ فرمائیں! {field_name}، سیکٹر {sector} میں فوراً کام کی ضرورت ہے۔ ہدایت: {action}۔ مقدار: {dosage}۔ برائے مہربانی شام 5 بجے سے پہلے مکمل کر کے تصویر بھیجیں۔",
        "wa_header": "🚨 *MCHAA AI آڈیو ورک آرڈر (Field Worker Dispatch)* 🚨"
    },
    "pa": {
        "title": "پنجابی آڈیو ورک آرڈر",
        "script": "دھیان دیو! {field_name} دے شعبہ {sector} وچ کم دی فضا ہے۔ ہدایت: {action}۔ خوراک: {dosage}۔ شام 5 بجے توں پہلاں کم کر کے فوٹو بھیجو۔",
        "wa_header": "🚨 *MCHAA AI پنجابی ورک آرڈر* 🚨"
    },
    "sd": {
        "title": "سنڌي آڊيو ورڪ آرڊر",
        "script": "ڌيان ڏيو! {field_name}، سيڪٽر {sector} ۾ ترت ڪم جي ضرورت آهي. ھدايت: {action}. مقدار: {dosage}. مهرباني ڪري شام 5 بجي کان اڳ پورو ڪري تصوير موڪليو.",
        "wa_header": "🚨 *MCHAA AI سنڌي ورڪ آرڊر* 🚨"
    },
    "en": {
        "title": "English Audio Work Order",
        "script": "Attention Field Worker! Urgent task required in {field_name}, Sector {sector}. Action: {action}. Dosage: {dosage}. Please complete before 5 PM and send photo confirmation.",
        "wa_header": "🚨 *MCHAA AI Voice Work Order Dispatch* 🚨"
    }
}

def generate_whatsapp_work_order(
    db: Session,
    field_id: str,
    anomaly_id: str = None,
    worker_name: str = "Field Worker",
    worker_phone: str = "+923001234567",
    dialect: str = "ur",
    sector: str = "Zone B3",
    action: str = "Pesticide Spraying",
    dosage: str = "250 ml/acre"
):
    field = db.query(Field).filter(Field.field_id == field_id).first()
    field_name = field.name if field else "Field B"

    dialect_clean = dialect.lower() if dialect.lower() in LOCALIZED_AUDIO_TEMPLATES else "ur"
    tmpl = LOCALIZED_AUDIO_TEMPLATES[dialect_clean]

    spoken_script = tmpl["script"].format(
        field_name=field_name,
        sector=sector or "Zone B3",
        action=action or "Field Treatment",
        dosage=dosage or "Standard"
    )

    wa_text = (
        f"{tmpl['wa_header']}\n\n"
        f"📍 *Field:* {field_name} ({sector})\n"
        f"🛠️ *Action Needed:* {action}\n"
        f"🧪 *Dosage:* {dosage}\n"
        f"⏰ *Urgency:* Complete within 24 Hours\n\n"
        f"🔊 *Voice Instructions ({dialect_clean.upper()}):*\n\"{spoken_script}\"\n\n"
        f"📸 *To Confirm:* Reply to this message with a photo or voice note when complete."
    )

    # Format phone number for WhatsApp deep link
    clean_phone = worker_phone.replace("+", "").replace("-", "").replace(" ", "")
    encoded_text = urllib.parse.quote(wa_text)
    whatsapp_deep_link = f"https://wa.me/{clean_phone}?text={encoded_text}"

    work_order_id = f"wo-{str(uuid.uuid4())[:8]}"
    work_order = WorkOrder(
        work_order_id=work_order_id,
        field_id=field_id,
        anomaly_id=anomaly_id,
        worker_name=worker_name,
        worker_phone=worker_phone,
        dialect=dialect_clean,
        instructions=spoken_script,
        status="dispatched",
        created_at=datetime.utcnow()
    )
    db.add(work_order)
    db.commit()
    db.refresh(work_order)

    audio_url = f"/api/static/audio/work_order_{dialect_clean}.mp3"

    return {
        "work_order_id": work_order.work_order_id,
        "field_id": work_order.field_id,
        "worker_name": worker_name,
        "worker_phone": worker_phone,
        "dialect": dialect_clean,
        "spoken_audio_script": spoken_script,
        "audio_url": audio_url,
        "whatsapp_deep_link": whatsapp_deep_link,
        "status": work_order.status,
        "created_at": work_order.created_at.isoformat()
    }

def confirm_work_order(db: Session, work_order_id: str, photo_url: str = None, note: str = None):
    work_order = db.query(WorkOrder).filter(WorkOrder.work_order_id == work_order_id).first()
    if not work_order:
        return None

    work_order.status = "completed"
    if photo_url:
        work_order.confirmation_photo_url = photo_url
    if note:
        work_order.confirmation_note = note

    db.commit()
    db.refresh(work_order)

    return {
        "work_order_id": work_order.work_order_id,
        "status": work_order.status,
        "confirmation_photo_url": work_order.confirmation_photo_url,
        "confirmation_note": work_order.confirmation_note,
        "message": "Work order confirmed and completed successfully."
    }
