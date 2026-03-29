from fastapi import APIRouter, Depends
from app.schemas.auth import RegisterRequest, LoginRequest, GoogleLoginRequest, AuthResponse
from app.security.dependencies import get_current_user
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    return await auth_service.register_user(req.email, req.password, req.full_name)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    return await auth_service.login_user(req.email, req.password)


@router.post("/google", response_model=AuthResponse)
async def google_login(req: GoogleLoginRequest):
    return await auth_service.google_login(req.token)


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return await auth_service.get_user_profile(current_user["id"])
