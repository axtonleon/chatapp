from fastapi import APIRouter, Depends, Query
from app.security.dependencies import get_current_user
from app.services import user_service

router = APIRouter()


@router.get("/")
async def get_users(current_user: dict = Depends(get_current_user)):
    return await user_service.get_all_users(current_user["id"])


@router.get("/search")
async def search_users(
    q: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user),
):
    return await user_service.search_users(q, current_user["id"])


@router.get("/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    return await user_service.get_user_by_id(user_id)
