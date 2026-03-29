from fastapi import APIRouter, Depends
from app.schemas.message import AIMessageRequest
from app.security.dependencies import get_current_user
from app.services import ai_service

router = APIRouter()


@router.post("/chat")
async def ai_chat(req: AIMessageRequest, current_user: dict = Depends(get_current_user)):
    return await ai_service.chat_with_ai(current_user["id"], req.message, req.chat_id)
