import uuid
from app.database import db


async def get_chat_messages(chat_id: str, limit: int = 50, offset: int = 0) -> list:
    messages = db.get_messages(chat_id, limit, offset)
    for msg in messages:
        msg["sender"] = db.get_user_sender_info(msg["sender_id"])
    return messages


async def create_message(
    chat_id: str, sender_id: str, content: str, message_type: str = "text"
) -> dict:
    msg_id = str(uuid.uuid4())
    return db.create_message({
        "id": msg_id,
        "chat_id": chat_id,
        "sender_id": sender_id,
        "content": content,
        "message_type": message_type,
        "is_read": False,
    })


async def mark_messages_read(chat_id: str, user_id: str) -> None:
    db.mark_messages_read(chat_id, user_id)
