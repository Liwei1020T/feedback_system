from __future__ import annotations

from fastapi import APIRouter, Depends, Header

from ..dependencies import get_current_user
from ..schemas import LoginRequest, RefreshRequest, TokenResponse, UserResponse
from ..services.auth import auth_service, token_store

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest):
    tokens = auth_service.login(credentials.username, credentials.password)
    return TokenResponse(**tokens)


@router.post("/refresh")
def refresh_token(payload: RefreshRequest):
    return auth_service.refresh(payload.refresh_token)


@router.post("/logout")
def logout(authorization: str = Header(...)):
    scheme, _, token = authorization.partition(" ")
    if not token:
        return {"success": False}
    token_store.revoke(token)
    return {"success": True}


@router.get("/verify")
def verify(user: dict = Depends(get_current_user)):
    return {"user": user}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user's full profile."""
    return UserResponse(**current_user)
