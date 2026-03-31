from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(Text, default="")
    avatar_url = Column(Text, nullable=True)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Chat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True)
    is_ai_chat = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    participants = relationship("ChatParticipant", back_populates="chat")


class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    id = Column(String, primary_key=True)
    chat_id = Column(String, ForeignKey("chats.id", ondelete="CASCADE"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_archived = Column(Boolean, default=False)
    is_muted = Column(Boolean, default=False)

    chat = relationship("Chat", back_populates="participants")

    __table_args__ = (UniqueConstraint("chat_id", "user_id"),)


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    chat_id = Column(String, ForeignKey("chats.id", ondelete="CASCADE"))
    sender_id = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(50), default="text")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
