import uuid
import httpx
from fastapi import HTTPException
from app.database import db
from app.security.password import hash_password, verify_password
from app.security.jwt import create_access_token
from app.config import GOOGLE_CLIENT_ID


async def register_user(email: str, password: str, full_name: str) -> dict:
    existing = db.find_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    db.create_user({
        "id": user_id,
        "email": email,
        "full_name": full_name,
        "password_hash": hash_password(password),
        "avatar_url": None,
        "is_online": False,
    })

    token = create_access_token({"sub": user_id, "email": email, "name": full_name})
    user = {"id": user_id, "email": email, "full_name": full_name, "avatar_url": None}
    return {"access_token": token, "token_type": "bearer", "user": user}


async def login_user(email: str, password: str) -> dict:
    user = db.find_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(
        {"sub": user["id"], "email": user["email"], "name": user["full_name"]}
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "avatar_url": user.get("avatar_url"),
        },
    }


async def google_login(google_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={google_token}"
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_data = resp.json()
    email = google_data.get("email")
    name = google_data.get("name", email.split("@")[0])
    picture = google_data.get("picture")

    user = db.find_user_by_email(email)

    if user:
        if picture and user.get("avatar_url") != picture:
            db.update_user(user["id"], {"avatar_url": picture})
            user["avatar_url"] = picture
    else:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": email,
            "full_name": name,
            "avatar_url": picture,
            "password_hash": "",
            "is_online": False,
        }
        db.create_user(user)

    token = create_access_token(
        {"sub": user["id"], "email": user["email"], "name": user["full_name"]}
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "avatar_url": user.get("avatar_url"),
        },
    }


async def get_user_profile(user_id: str) -> dict:
    user = db.get_user_public(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
