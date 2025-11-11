from __future__ import annotations

from typing import List, Optional, Union

from fastapi import Depends, Header, HTTPException, status

from .services.auth import auth_service
from .models import Complaint, Role


def _extract_token(authorization: str) -> str:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    return token


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")
    token = _extract_token(authorization)
    return auth_service.get_user_from_token(token)


def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in {Role.admin, Role.super_admin, Role.employee}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return user


def get_current_super_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != Role.super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin privileges required")
    return user


def admin_scoped_categories(user: dict) -> Optional[List[str]]:
    # Admins and employees can only see their own department's data
    if user.get("role") in {Role.admin, Role.employee}:
        department = user.get("department")
        if department:
            return [department]
    return None


def admin_scoped_plants(user: dict) -> Optional[List[str]]:
    if user.get("role") == Role.admin:
        plant = user.get("plant")
        if plant:
            return [plant]
    return None


def ensure_complaint_access(complaint: Complaint, user: dict) -> None:
    if user.get("role") == Role.admin:
        department = user.get("department")
        if department and complaint.category != department:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to this complaint is restricted to its department.",
            )
        plant = user.get("plant")
        if plant and complaint.plant != plant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to this complaint is restricted to its plant.",
            )
