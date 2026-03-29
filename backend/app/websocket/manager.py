import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.security.jwt import decode_token
from app.database import db

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        db.update_user(user_id, {
            "is_online": True,
            "last_seen": datetime.now(timezone.utc),
        })
        await self.broadcast(
            {"type": "user_status", "user_id": user_id, "is_online": True}
        )

    async def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)
        db.update_user(user_id, {
            "is_online": False,
            "last_seen": datetime.now(timezone.utc),
        })
        await self.broadcast(
            {"type": "user_status", "user_id": user_id, "is_online": False}
        )

    async def send_personal(self, user_id: str, data: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                pass

    async def broadcast(self, data: dict, exclude: str | None = None):
        for uid, ws in list(self.active_connections.items()):
            if uid != exclude:
                try:
                    await ws.send_json(data)
                except Exception:
                    pass


manager = ConnectionManager()


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "message":
                msg_id = str(uuid.uuid4())
                saved_msg = db.create_message({
                    "id": msg_id,
                    "chat_id": message["chat_id"],
                    "sender_id": user_id,
                    "content": message["content"],
                    "message_type": message.get("message_type", "text"),
                    "is_read": False,
                })

                saved_msg["sender"] = db.get_user_sender_info(user_id)

                for pid in db.get_chat_participant_ids(message["chat_id"]):
                    await manager.send_personal(
                        pid, {"type": "new_message", "message": saved_msg}
                    )

            elif message["type"] == "typing":
                for pid in db.get_chat_participant_ids(message["chat_id"]):
                    if pid != user_id:
                        await manager.send_personal(pid, {
                            "type": "typing",
                            "chat_id": message["chat_id"],
                            "user_id": user_id,
                            "is_typing": message.get("is_typing", True),
                        })

            elif message["type"] == "read":
                db.mark_messages_read(message["chat_id"], user_id)
                for pid in db.get_chat_participant_ids(message["chat_id"]):
                    if pid != user_id:
                        await manager.send_personal(pid, {
                            "type": "messages_read",
                            "chat_id": message["chat_id"],
                            "reader_id": user_id,
                        })

    except WebSocketDisconnect:
        await manager.disconnect(user_id)
    except Exception:
        await manager.disconnect(user_id)
