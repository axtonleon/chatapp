from pydantic import BaseModel
from typing import Optional


class ChatCreate(BaseModel):
    participant_id: str


class ChatResponse(BaseModel):
    id: str
    created_at: str
    is_ai_chat: bool = False
    participants: list = []
    last_message: Optional[dict] = None
    unread_count: int = 0
