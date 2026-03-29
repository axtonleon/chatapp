from pydantic import BaseModel
from typing import Optional


class MessageCreate(BaseModel):
    chat_id: str
    content: str
    message_type: str = "text"


class MessageResponse(BaseModel):
    id: str
    chat_id: str
    sender_id: str
    content: str
    message_type: str
    created_at: str
    is_read: bool = False
    sender: Optional[dict] = None


class AIMessageRequest(BaseModel):
    message: str
    chat_id: Optional[str] = None
