from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.schemas.message import MessageCreate
from app.security.dependencies import get_current_user
from app.services import message_service
from app.services import storage_service

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


@router.post("/upload")
async def upload_file(
    chat_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    file_bytes = await file.read()
    file_info = await storage_service.upload_file(
        file_bytes, file.filename or "file", file.content_type or "application/octet-stream"
    )

    # Determine message type from content type
    content_type = file.content_type or ""
    if content_type.startswith("image/"):
        msg_type = "image"
    else:
        msg_type = "file"

    # Store as a message with file URL as content
    import json
    content = json.dumps({
        "url": file_info["url"],
        "filename": file_info["filename"],
        "size": file_info["size"],
        "content_type": file_info["content_type"],
    })

    msg = await message_service.create_message(
        chat_id, current_user["id"], content, msg_type
    )
    return msg
