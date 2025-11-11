from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ..config import settings
from ..datastore import db
from ..dependencies import get_current_super_admin
from ..models import Role
from ..schemas import AdminCreateRequest, AdminResponse

router = APIRouter(prefix="/api/admins", tags=["Admin Management"])


@router.get("", response_model=List[AdminResponse])
def list_admins(_: dict = Depends(get_current_super_admin)):
    admins = db.list_users(role=Role.admin)
    return [
        AdminResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            role=user["role"],
            department=user.get("department"),
            plant=user.get("plant"),
            created_at=user["created_at"],
            password=user.get("initial_password"),
        )
        for user in admins
    ]


@router.post("", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
def create_admin(payload: AdminCreateRequest, _: dict = Depends(get_current_super_admin)):
    if db.get_user_by_username(payload.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    if any(user["email"].lower() == payload.email.lower() for user in db.list_users()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
    department = payload.department.strip() if payload.department else None
    plant = payload.plant.strip() if payload.plant else None
    if department:
        valid_departments = {category.name for category in db.get_categories()}
        if department not in valid_departments:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid department selected")
    if plant:
        if plant not in settings.supported_plants:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plant selected")
    user = db.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        role=Role.admin,
        department=department,
        plant=plant,
        initial_password=payload.password,
    )
    return AdminResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        department=user.get("department"),
        plant=user.get("plant"),
        created_at=user["created_at"],
        password=user.get("initial_password"),
    )


@router.get("/departments", response_model=List[str])
def list_departments(_: dict = Depends(get_current_super_admin)):
    departments = sorted({category.name for category in db.get_categories()})
    return departments


@router.get("/plants", response_model=List[str])
def list_plants(_: dict = Depends(get_current_super_admin)):
    return settings.supported_plants
