from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# Auth
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    token: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# Users
class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    is_online: bool = False
    last_seen: Optional[str] = None


# Messages
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


# Chats
class ChatCreate(BaseModel):
    participant_id: str


class ChatResponse(BaseModel):
    id: str
    created_at: str
    participants: list = []
    last_message: Optional[dict] = None
    unread_count: int = 0


# AI
class AIMessageRequest(BaseModel):
    message: str
    chat_id: Optional[str] = None
