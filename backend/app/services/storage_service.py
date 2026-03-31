"""
File storage service.
Uses Supabase Storage in prod, local filesystem in dev (SQLite mode).
"""

import os
import uuid
from app.config import DATABASE_MODE, SUPABASE_URL, SUPABASE_SERVICE_KEY

BUCKET_NAME = "chat-files"
LOCAL_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


def _ensure_local_dir():
    os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)


def _get_supabase_admin():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


async def upload_file(file_bytes: bytes, original_filename: str, content_type: str) -> dict:
    """Upload a file and return {"url": ..., "filename": ..., "size": ..., "content_type": ...}"""
    ext = os.path.splitext(original_filename)[1] or ""
    stored_name = f"{uuid.uuid4().hex}{ext}"
    size = len(file_bytes)

    if DATABASE_MODE == "sqlite":
        _ensure_local_dir()
        filepath = os.path.join(LOCAL_UPLOAD_DIR, stored_name)
        with open(filepath, "wb") as f:
            f.write(file_bytes)
        url = f"/uploads/{stored_name}"
    else:
        sb = _get_supabase_admin()
        # Ensure bucket exists
        try:
            sb.storage.get_bucket(BUCKET_NAME)
        except Exception:
            sb.storage.create_bucket(BUCKET_NAME, options={"public": True})

        sb.storage.from_(BUCKET_NAME).upload(
            path=stored_name,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
        url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{stored_name}"

    return {
        "url": url,
        "filename": original_filename,
        "stored_name": stored_name,
        "size": size,
        "content_type": content_type,
    }
