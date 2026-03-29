import uuid
from fastapi import HTTPException
from app.database import db
from app.config import GEMINI_API_KEY
import google.generativeai as genai


async def chat_with_ai(user_id: str, message: str, chat_id: str | None = None) -> dict:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

    history = []
    if chat_id:
        messages = db.get_messages_for_history(chat_id, limit=20)
        for msg in messages:
            role = "user" if msg["sender_id"] == user_id else "model"
            history.append({"role": role, "parts": [msg["content"]]})

    chat = model.start_chat(history=history)
    response = chat.send_message(message)

    user_msg_id = str(uuid.uuid4())
    db.create_message({
        "id": user_msg_id,
        "chat_id": chat_id,
        "sender_id": user_id,
        "content": message,
        "message_type": "text",
        "is_read": True,
    })

    ai_msg_id = str(uuid.uuid4())
    db.create_message({
        "id": ai_msg_id,
        "chat_id": chat_id,
        "sender_id": "ai-assistant",
        "content": response.text,
        "message_type": "ai",
        "is_read": True,
    })

    return {
        "user_message": {"id": user_msg_id, "content": message, "sender_id": user_id},
        "ai_response": {"id": ai_msg_id, "content": response.text, "sender_id": "ai-assistant"},
    }
