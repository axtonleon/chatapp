"""
Database repository layer.
Switches between SQLite (dev) and Supabase (prod) based on DATABASE_MODE.
"""

import uuid
from datetime import datetime, timezone
from app.config import DATABASE_MODE


def _use_sqlite() -> bool:
    return DATABASE_MODE == "sqlite"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _user_to_dict(u) -> dict:
    """Convert a SQLAlchemy User row to a dict."""
    return {
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "password_hash": u.password_hash,
        "avatar_url": u.avatar_url,
        "is_online": u.is_online,
        "last_seen": u.last_seen.isoformat() if u.last_seen else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


def _chat_to_dict(c) -> dict:
    return {
        "id": c.id,
        "is_ai_chat": c.is_ai_chat,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


def _msg_to_dict(m) -> dict:
    return {
        "id": m.id,
        "chat_id": m.chat_id,
        "sender_id": m.sender_id,
        "content": m.content,
        "message_type": m.message_type,
        "is_read": m.is_read,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


def _get_session():
    from app.database.session import SessionLocal
    return SessionLocal()


def _get_supabase():
    from app.database.supabase import supabase
    return supabase


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def find_user_by_email(email: str) -> dict | None:
    if _use_sqlite():
        from app.database.models import User
        db = _get_session()
        try:
            u = db.query(User).filter(User.email == email).first()
            return _user_to_dict(u) if u else None
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("users").select("*").eq("email", email).execute()
        return result.data[0] if result.data else None


def find_user_by_id(user_id: str) -> dict | None:
    if _use_sqlite():
        from app.database.models import User
        db = _get_session()
        try:
            u = db.query(User).filter(User.id == user_id).first()
            return _user_to_dict(u) if u else None
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("users").select("*").eq("id", user_id).execute()
        return result.data[0] if result.data else None


def get_user_public(user_id: str) -> dict | None:
    """Return user without password_hash."""
    u = find_user_by_id(user_id)
    if u:
        u.pop("password_hash", None)
    return u


def get_user_sender_info(user_id: str) -> dict | None:
    """Return minimal sender info (id, full_name, avatar_url)."""
    # Handle non-user senders (e.g. AI assistant)
    if user_id == "ai-assistant":
        return {"id": "ai-assistant", "full_name": "AI Assistant", "avatar_url": None}

    if _use_sqlite():
        from app.database.models import User
        db = _get_session()
        try:
            u = db.query(User).filter(User.id == user_id).first()
            if not u:
                return None
            return {"id": u.id, "full_name": u.full_name, "avatar_url": u.avatar_url}
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("users").select("id, full_name, avatar_url").eq("id", user_id).execute()
        return result.data[0] if result.data else None


def create_user(data: dict) -> dict:
    if _use_sqlite():
        from app.database.models import User
        db = _get_session()
        try:
            u = User(**data)
            db.add(u)
            db.commit()
            db.refresh(u)
            return _user_to_dict(u)
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("users").insert(data).execute()
        return result.data[0] if result.data else data


def update_user(user_id: str, data: dict) -> None:
    if _use_sqlite():
        from app.database.models import User
        db = _get_session()
        try:
            db.query(User).filter(User.id == user_id).update(data)
            db.commit()
        finally:
            db.close()
    else:
        # Supabase needs ISO strings, not datetime objects
        serialized = {}
        for k, v in data.items():
            if isinstance(v, datetime):
                serialized[k] = v.isoformat()
            else:
                serialized[k] = v
        sb = _get_supabase()
        sb.table("users").update(serialized).eq("id", user_id).execute()


def get_all_users(exclude_id: str) -> list[dict]:
    if _use_sqlite():
        from app.database.models import User
        db = _get_session()
        try:
            users = db.query(User).filter(User.id != exclude_id).all()
            result = []
            for u in users:
                d = _user_to_dict(u)
                d.pop("password_hash", None)
                result.append(d)
            return result
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("users").select(
            "id, email, full_name, avatar_url, is_online, last_seen"
        ).neq("id", exclude_id).execute()
        return result.data or []


def search_users(query: str, exclude_id: str) -> list[dict]:
    if _use_sqlite():
        from app.database.models import User
        db = _get_session()
        try:
            users = (
                db.query(User)
                .filter(User.id != exclude_id, User.full_name.ilike(f"%{query}%"))
                .all()
            )
            return [
                {"id": u.id, "email": u.email, "full_name": u.full_name,
                 "avatar_url": u.avatar_url, "is_online": u.is_online}
                for u in users
            ]
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("users").select(
            "id, email, full_name, avatar_url, is_online"
        ).neq("id", exclude_id).ilike("full_name", f"%{query}%").execute()
        return result.data or []


# ---------------------------------------------------------------------------
# Chats
# ---------------------------------------------------------------------------

def get_user_chat_ids(user_id: str) -> list[str]:
    if _use_sqlite():
        from app.database.models import ChatParticipant
        db = _get_session()
        try:
            rows = db.query(ChatParticipant.chat_id).filter(
                ChatParticipant.user_id == user_id
            ).all()
            return [r[0] for r in rows]
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("chat_participants").select("chat_id").eq("user_id", user_id).execute()
        return [p["chat_id"] for p in (result.data or [])]


def get_chat(chat_id: str) -> dict | None:
    if _use_sqlite():
        from app.database.models import Chat
        db = _get_session()
        try:
            c = db.query(Chat).filter(Chat.id == chat_id).first()
            return _chat_to_dict(c) if c else None
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("chats").select("*").eq("id", chat_id).execute()
        return result.data[0] if result.data else None


def get_chat_participant_ids(chat_id: str) -> list[str]:
    if _use_sqlite():
        from app.database.models import ChatParticipant
        db = _get_session()
        try:
            rows = db.query(ChatParticipant.user_id).filter(
                ChatParticipant.chat_id == chat_id
            ).all()
            return [r[0] for r in rows]
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("chat_participants").select("user_id").eq("chat_id", chat_id).execute()
        return [p["user_id"] for p in (result.data or [])]


def get_last_message(chat_id: str) -> dict | None:
    if _use_sqlite():
        from app.database.models import Message
        db = _get_session()
        try:
            m = (
                db.query(Message)
                .filter(Message.chat_id == chat_id)
                .order_by(Message.created_at.desc())
                .first()
            )
            return _msg_to_dict(m) if m else None
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("messages").select("*").eq("chat_id", chat_id).order(
            "created_at", desc=True
        ).limit(1).execute()
        return result.data[0] if result.data else None


def get_unread_count(chat_id: str, user_id: str) -> int:
    if _use_sqlite():
        from app.database.models import Message
        db = _get_session()
        try:
            count = (
                db.query(Message)
                .filter(
                    Message.chat_id == chat_id,
                    Message.is_read == False,
                    Message.sender_id != user_id,
                )
                .count()
            )
            return count
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("messages").select("id", count="exact").eq(
            "chat_id", chat_id
        ).eq("is_read", False).neq("sender_id", user_id).execute()
        return result.count or 0


def find_existing_dm(user_id: str, participant_id: str) -> dict | None:
    """Find an existing 1-on-1 (non-AI) chat between two users."""
    if _use_sqlite():
        from app.database.models import Chat, ChatParticipant
        from sqlalchemy import func
        db = _get_session()
        try:
            # Get chat_ids where both users are participants
            my_chats = db.query(ChatParticipant.chat_id).filter(
                ChatParticipant.user_id == user_id
            ).subquery()
            their_chats = db.query(ChatParticipant.chat_id).filter(
                ChatParticipant.user_id == participant_id
            ).subquery()

            # Find common chat_ids that are not AI chats and have exactly 2 participants
            common = (
                db.query(Chat)
                .filter(
                    Chat.id.in_(db.query(my_chats.c.chat_id)),
                    Chat.id.in_(db.query(their_chats.c.chat_id)),
                    Chat.is_ai_chat == False,
                )
                .all()
            )
            for chat in common:
                count = db.query(ChatParticipant).filter(
                    ChatParticipant.chat_id == chat.id
                ).count()
                if count == 2:
                    return _chat_to_dict(chat)
            return None
        finally:
            db.close()
    else:
        sb = _get_supabase()
        my_chats = sb.table("chat_participants").select("chat_id").eq("user_id", user_id).execute()
        if not my_chats.data:
            return None
        for mc in my_chats.data:
            other = sb.table("chat_participants").select("user_id").eq(
                "chat_id", mc["chat_id"]
            ).eq("user_id", participant_id).execute()
            if other.data:
                chat = sb.table("chats").select("*").eq(
                    "id", mc["chat_id"]
                ).eq("is_ai_chat", False).execute()
                if chat.data:
                    count = sb.table("chat_participants").select(
                        "user_id", count="exact"
                    ).eq("chat_id", mc["chat_id"]).execute()
                    if count.count == 2:
                        return chat.data[0]
        return None


def create_chat(chat_id: str, is_ai_chat: bool = False) -> dict:
    if _use_sqlite():
        from app.database.models import Chat
        db = _get_session()
        try:
            c = Chat(id=chat_id, is_ai_chat=is_ai_chat)
            db.add(c)
            db.commit()
            db.refresh(c)
            return _chat_to_dict(c)
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("chats").insert({"id": chat_id, "is_ai_chat": is_ai_chat}).execute()
        return result.data[0]


def add_chat_participants(chat_id: str, user_ids: list[str]) -> None:
    if _use_sqlite():
        from app.database.models import ChatParticipant
        db = _get_session()
        try:
            for uid in user_ids:
                db.add(ChatParticipant(id=str(uuid.uuid4()), chat_id=chat_id, user_id=uid))
            db.commit()
        finally:
            db.close()
    else:
        sb = _get_supabase()
        rows = [{"chat_id": chat_id, "user_id": uid} for uid in user_ids]
        sb.table("chat_participants").insert(rows).execute()


def delete_chat(chat_id: str) -> None:
    """Delete a chat and all its participants and messages (cascade)."""
    if _use_sqlite():
        from app.database.models import Chat, ChatParticipant, Message
        db = _get_session()
        try:
            db.query(Message).filter(Message.chat_id == chat_id).delete()
            db.query(ChatParticipant).filter(ChatParticipant.chat_id == chat_id).delete()
            db.query(Chat).filter(Chat.id == chat_id).delete()
            db.commit()
        finally:
            db.close()
    else:
        sb = _get_supabase()
        # CASCADE should handle participants and messages, but delete explicitly to be safe
        sb.table("messages").delete().eq("chat_id", chat_id).execute()
        sb.table("chat_participants").delete().eq("chat_id", chat_id).execute()
        sb.table("chats").delete().eq("id", chat_id).execute()


def get_chat_participant_settings(chat_id: str, user_id: str) -> dict:
    """Get per-user settings (is_archived, is_muted) for a chat."""
    if _use_sqlite():
        from app.database.models import ChatParticipant
        db = _get_session()
        try:
            cp = db.query(ChatParticipant).filter(
                ChatParticipant.chat_id == chat_id,
                ChatParticipant.user_id == user_id,
            ).first()
            if cp:
                return {"is_archived": bool(cp.is_archived), "is_muted": bool(cp.is_muted)}
            return {"is_archived": False, "is_muted": False}
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("chat_participants").select("is_archived, is_muted").eq(
            "chat_id", chat_id
        ).eq("user_id", user_id).execute()
        if result.data:
            return {"is_archived": bool(result.data[0].get("is_archived")), "is_muted": bool(result.data[0].get("is_muted"))}
        return {"is_archived": False, "is_muted": False}


def archive_chat(chat_id: str, user_id: str, archived: bool) -> None:
    if _use_sqlite():
        from app.database.models import ChatParticipant
        db = _get_session()
        try:
            db.query(ChatParticipant).filter(
                ChatParticipant.chat_id == chat_id,
                ChatParticipant.user_id == user_id,
            ).update({"is_archived": archived})
            db.commit()
        finally:
            db.close()
    else:
        sb = _get_supabase()
        sb.table("chat_participants").update({"is_archived": archived}).eq(
            "chat_id", chat_id
        ).eq("user_id", user_id).execute()


def mute_chat(chat_id: str, user_id: str, muted: bool) -> None:
    if _use_sqlite():
        from app.database.models import ChatParticipant
        db = _get_session()
        try:
            db.query(ChatParticipant).filter(
                ChatParticipant.chat_id == chat_id,
                ChatParticipant.user_id == user_id,
            ).update({"is_muted": muted})
            db.commit()
        finally:
            db.close()
    else:
        sb = _get_supabase()
        sb.table("chat_participants").update({"is_muted": muted}).eq(
            "chat_id", chat_id
        ).eq("user_id", user_id).execute()


def clear_chat_messages(chat_id: str) -> None:
    if _use_sqlite():
        from app.database.models import Message
        db = _get_session()
        try:
            db.query(Message).filter(Message.chat_id == chat_id).delete()
            db.commit()
        finally:
            db.close()
    else:
        sb = _get_supabase()
        sb.table("messages").delete().eq("chat_id", chat_id).execute()


def mark_chat_unread(chat_id: str, user_id: str) -> None:
    """Mark the last message in the chat as unread for the user."""
    if _use_sqlite():
        from app.database.models import Message
        db = _get_session()
        try:
            last = (
                db.query(Message)
                .filter(Message.chat_id == chat_id, Message.sender_id != user_id)
                .order_by(Message.created_at.desc())
                .first()
            )
            if last:
                last.is_read = False
                db.commit()
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("messages").select("id").eq("chat_id", chat_id).neq(
            "sender_id", user_id
        ).order("created_at", desc=True).limit(1).execute()
        if result.data:
            sb.table("messages").update({"is_read": False}).eq("id", result.data[0]["id"]).execute()


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

def get_messages(chat_id: str, limit: int = 50, offset: int = 0) -> list[dict]:
    if _use_sqlite():
        from app.database.models import Message
        db = _get_session()
        try:
            msgs = (
                db.query(Message)
                .filter(Message.chat_id == chat_id)
                .order_by(Message.created_at.asc())
                .offset(offset)
                .limit(limit)
                .all()
            )
            return [_msg_to_dict(m) for m in msgs]
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("messages").select("*").eq("chat_id", chat_id).order(
            "created_at", desc=False
        ).range(offset, offset + limit - 1).execute()
        return result.data or []


def get_messages_for_history(chat_id: str, limit: int = 20) -> list[dict]:
    """Get recent messages for AI chat history."""
    if _use_sqlite():
        from app.database.models import Message
        db = _get_session()
        try:
            msgs = (
                db.query(Message)
                .filter(Message.chat_id == chat_id)
                .order_by(Message.created_at.asc())
                .limit(limit)
                .all()
            )
            return [_msg_to_dict(m) for m in msgs]
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("messages").select("*").eq("chat_id", chat_id).order(
            "created_at", desc=False
        ).limit(limit).execute()
        return result.data or []


def create_message(data: dict) -> dict:
    if _use_sqlite():
        from app.database.models import Message
        db = _get_session()
        try:
            m = Message(**data)
            db.add(m)
            db.commit()
            db.refresh(m)
            return _msg_to_dict(m)
        finally:
            db.close()
    else:
        sb = _get_supabase()
        result = sb.table("messages").insert(data).execute()
        return result.data[0] if result.data else data


def mark_messages_read(chat_id: str, exclude_sender_id: str) -> None:
    if _use_sqlite():
        from app.database.models import Message
        db = _get_session()
        try:
            db.query(Message).filter(
                Message.chat_id == chat_id,
                Message.sender_id != exclude_sender_id,
                Message.is_read == False,
            ).update({"is_read": True})
            db.commit()
        finally:
            db.close()
    else:
        sb = _get_supabase()
        sb.table("messages").update({"is_read": True}).eq(
            "chat_id", chat_id
        ).neq("sender_id", exclude_sender_id).eq("is_read", False).execute()
