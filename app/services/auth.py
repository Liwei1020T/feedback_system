from __future__ import annotations

from datetime import datetime, timedelta
from secrets import token_urlsafe
from typing import Dict, Optional

from fastapi import HTTPException, status

from ..config import settings
from ..datastore import db
from ..security import verify_password, needs_rehash, hash_password


class TokenStore:
    def __init__(self) -> None:
        self.tokens: Dict[str, Dict[str, object]] = {}

    def issue(self, user_id: int, token_type: str, minutes: int) -> str:
        token = token_urlsafe(32)
        self.tokens[token] = {
            "user_id": user_id,
            "type": token_type,
            "expires_at": datetime.utcnow() + timedelta(minutes=minutes),
        }
        return token

    def verify(self, token: str, expected_type: str = "access") -> Optional[int]:
        payload = self.tokens.get(token)
        if not payload:
            return None
        if payload["type"] != expected_type:
            return None
        if payload["expires_at"] < datetime.utcnow():
            self.tokens.pop(token, None)
            return None
        return payload["user_id"]

    def revoke(self, token: str) -> None:
        self.tokens.pop(token, None)


token_store = TokenStore()


class AuthService:
    def __init__(self) -> None:
        self.settings = settings

    @staticmethod
    def _serialize_user(user: dict) -> Dict[str, object]:
        return {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "department": user.get("department"),
            "plant": user.get("plant"),
            "manager_id": user.get("manager_id"),
            "created_at": user["created_at"],
            "updated_at": user["updated_at"],
        }

    def login(self, username: str, password: str) -> Dict[str, object]:
        user = db.get_user_by_username(username)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        if not verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        # Seamless migration: if legacy hash, upgrade to bcrypt after successful login
        if needs_rehash(user["password_hash"]):
            try:
                new_hash = hash_password(password)
                db.update_user(user["id"], password_hash=new_hash)
                user = db.get_user(user["id"]) or user
            except Exception:
                # Do not fail login due to rehash issues; proceed with legacy hash
                pass
        access = token_store.issue(user_id=user["id"], token_type="access", minutes=settings.token_exp_minutes)
        refresh = token_store.issue(
            user_id=user["id"], token_type="refresh", minutes=settings.refresh_token_exp_minutes
        )
        return {
            "access_token": access,
            "refresh_token": refresh,
            "expires_in": settings.token_exp_minutes * 60,
            "user": self._serialize_user(user),
        }

    def refresh(self, refresh_token: str) -> Dict[str, object]:
        user_id = token_store.verify(refresh_token, expected_type="refresh")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        access = token_store.issue(user_id=user_id, token_type="access", minutes=settings.token_exp_minutes)
        return {"access_token": access, "expires_in": settings.token_exp_minutes * 60}

    def logout(self, token: str) -> None:
        token_store.revoke(token)

    def get_user_from_token(self, token: str) -> dict:
        user_id = token_store.verify(token, expected_type="access")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
        user = db.get_user(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return self._serialize_user(user)


auth_service = AuthService()
