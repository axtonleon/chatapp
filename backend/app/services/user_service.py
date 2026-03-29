from fastapi import HTTPException
from app.database import db


async def get_all_users(exclude_id: str) -> list:
    return db.get_all_users(exclude_id)


async def get_user_by_id(user_id: str) -> dict:
    user = db.get_user_public(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def search_users(query: str, exclude_id: str) -> list:
    return db.search_users(query, exclude_id)
