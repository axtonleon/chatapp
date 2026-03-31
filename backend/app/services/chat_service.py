import uuid
from fastapi import HTTPException
from app.database import db


async def get_user_chats(user_id: str) -> list:
    chat_ids = db.get_user_chat_ids(user_id)
    if not chat_ids:
        return []

    chats = []
    for chat_id in chat_ids:
        chat_data = db.get_chat(chat_id)
        if not chat_data:
            continue

        participant_ids = db.get_chat_participant_ids(chat_id)
        participants = []
        for pid in participant_ids:
            u = db.get_user_public(pid)
            if u:
                participants.append(u)

        last_message = db.get_last_message(chat_id)
        unread_count = db.get_unread_count(chat_id, user_id)
        settings = db.get_chat_participant_settings(chat_id, user_id)

        chats.append({
            "id": chat_data["id"],
            "created_at": chat_data["created_at"],
            "is_ai_chat": chat_data.get("is_ai_chat", False),
            "participants": participants,
            "last_message": last_message,
            "unread_count": unread_count,
            "is_archived": settings["is_archived"],
            "is_muted": settings["is_muted"],
        })

    chats.sort(
        key=lambda c: c["last_message"]["created_at"]
        if c.get("last_message")
        else c["created_at"],
        reverse=True,
    )
    return chats


async def create_chat(user_id: str, participant_id: str) -> dict:
    existing = db.find_existing_dm(user_id, participant_id)
    if existing:
        return existing

    chat_id = str(uuid.uuid4())
    chat = db.create_chat(chat_id, is_ai_chat=False)
    db.add_chat_participants(chat_id, [user_id, participant_id])
    return chat


async def create_ai_chat(user_id: str) -> dict:
    # Return existing AI chat if one already exists
    chat_ids = db.get_user_chat_ids(user_id)
    for cid in chat_ids:
        chat = db.get_chat(cid)
        if chat and chat.get("is_ai_chat"):
            return chat

    chat_id = str(uuid.uuid4())
    chat = db.create_chat(chat_id, is_ai_chat=True)
    db.add_chat_participants(chat_id, [user_id])
    return chat


async def delete_chat(chat_id: str, user_id: str) -> None:
    # Verify user is a participant
    participant_ids = db.get_chat_participant_ids(chat_id)
    if user_id not in participant_ids:
        raise HTTPException(status_code=403, detail="Not a participant of this chat")
    db.delete_chat(chat_id)


async def get_chat_by_id(chat_id: str) -> dict:
    chat = db.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat
