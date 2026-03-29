from fastapi import APIRouter, Depends
from app.schemas.message import MessageCreate
from app.security.dependencies import get_current_user
from app.services import message_service

router = APIRouter()


@router.get("/{chat_id}")
async def get_messages(
    chat_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
):
    return await message_service.get_chat_messages(chat_id, limit, offset)


@router.post("/")
async def send_message(req: MessageCreate, current_user: dict = Depends(get_current_user)):
    return await message_service.create_message(
        req.chat_id, current_user["id"], req.content, req.message_type
    )


@router.put("/read/{chat_id}")
async def mark_read(chat_id: str, current_user: dict = Depends(get_current_user)):
    await message_service.mark_messages_read(chat_id, current_user["id"])
    return {"status": "ok"}
