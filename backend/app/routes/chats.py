from fastapi import APIRouter, Depends
from app.schemas.chat import ChatCreate
from app.security.dependencies import get_current_user
from app.services import chat_service

router = APIRouter()


@router.get("/")
async def get_chats(current_user: dict = Depends(get_current_user)):
    return await chat_service.get_user_chats(current_user["id"])


@router.post("/")
async def create_chat(req: ChatCreate, current_user: dict = Depends(get_current_user)):
    return await chat_service.create_chat(current_user["id"], req.participant_id)


@router.post("/ai")
async def create_ai_chat(current_user: dict = Depends(get_current_user)):
    return await chat_service.create_ai_chat(current_user["id"])


@router.delete("/{chat_id}")
async def delete_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    await chat_service.delete_chat(chat_id, current_user["id"])
    return {"status": "ok"}


@router.get("/{chat_id}")
async def get_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    return await chat_service.get_chat_by_id(chat_id)
