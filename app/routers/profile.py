from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Body

from ..datastore import db
from ..dependencies import get_current_user, get_current_admin
from ..models import Role
from ..schemas import ProfilePreferences, FeedbackPresetCollection, FeedbackPreset, EmployeeCreateByAdminRequest, EmployeeResponse
from ..security import verify_password, hash_password

router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.get("/preferences", response_model=ProfilePreferences)
def get_preferences(current_user: dict = Depends(get_current_user)):
    user = db.get_user(current_user["id"]) or {}
    prefs = user.get("preferences") or {}
    return ProfilePreferences(**{
        "email_notifications": prefs.get("email_notifications", True),
        "browser_notifications": prefs.get("browser_notifications", True),
        "weekly_summary": prefs.get("weekly_summary", False),
    })


@router.put("/preferences", response_model=ProfilePreferences)
def update_preferences(payload: ProfilePreferences, current_user: dict = Depends(get_current_user)):
    user = db.get_user(current_user["id"]) or {}
    db.update_user(user["id"], preferences=payload.model_dump())
    return payload


@router.get("/presets/feedback", response_model=FeedbackPresetCollection)
def get_feedback_presets(current_user: dict = Depends(get_current_user)):
    user = db.get_user(current_user["id"]) or {}
    raw_presets = user.get("feedback_presets") or []
    presets = []
    for raw in raw_presets:
        try:
            presets.append(FeedbackPreset(**raw))
        except Exception:
            continue
    return FeedbackPresetCollection(presets=presets)


@router.put("/presets/feedback", response_model=FeedbackPresetCollection)
def upsert_feedback_presets(
    payload: FeedbackPresetCollection,
    current_user: dict = Depends(get_current_user),
):
    user = db.get_user(current_user["id"]) or {}
    sanitized = [preset.model_dump(mode="json") for preset in payload.presets[:20]]
    db.update_user(user["id"], feedback_presets=sanitized)
    return FeedbackPresetCollection(presets=payload.presets[:20])


@router.post("/change-password")
def change_password(
    current_password: str = Body(...),
    new_password: str = Body(...),
    current_user: dict = Depends(get_current_user),
):
    user = db.get_user(current_user["id"]) or {}
    if not verify_password(current_password, user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    # Basic password policy: min 10 chars
    if len(new_password) < 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 10 characters long")
    db.update_user(user["id"], password_hash=hash_password(new_password))
    return {"success": True}


# Employee Management Endpoints for Admins

@router.get("/my-employees", response_model=List[EmployeeResponse])
def list_my_employees(current_user: dict = Depends(get_current_admin)):
    """List employees for the current admin.

    - super_admin: returns all employees in the system
    - admin: returns employees whose manager_id == current admin's id
    """
    if current_user.get("role") not in {Role.admin, Role.super_admin}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can manage employees")

    results: list[EmployeeResponse] = []
    all_employees = db.list_users(role=Role.employee)

    if current_user.get("role") == Role.super_admin:
        # Return all employees for super admin views
        for user in all_employees:
            results.append(
                EmployeeResponse(
                    id=user["id"],
                    username=user["username"],
                    email=user["email"],
                    role=user["role"],
                    department=user.get("department"),
                    plant=user.get("plant"),
                    manager_id=user.get("manager_id"),
                    created_at=user["created_at"],
                )
            )
        return results

    # Regular admin: only employees assigned to them
    admin_id = current_user["id"]
    for user in all_employees:
        if user.get("manager_id") == admin_id:
            results.append(
                EmployeeResponse(
                    id=user["id"],
                    username=user["username"],
                    email=user["email"],
                    role=user["role"],
                    department=user.get("department"),
                    plant=user.get("plant"),
                    manager_id=user.get("manager_id"),
                    created_at=user["created_at"],
                )
            )
    return results


@router.post("/my-employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def add_employee(
    payload: EmployeeCreateByAdminRequest,
    current_user: dict = Depends(get_current_admin),
):
    """Create a new employee assigned to the current admin."""
    if current_user.get("role") not in {Role.admin, Role.super_admin}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can manage employees")
    
    # Check for existing username/email
    if db.get_user_by_username(payload.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    if any(user["email"].lower() == payload.email.lower() for user in db.list_users()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
    
    # Create employee with admin as manager
    user = db.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        role=Role.employee,
        department=current_user.get("department"),
        plant=current_user.get("plant"),
        manager_id=current_user["id"],
        initial_password=payload.password,
    )
    
    return EmployeeResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        department=user.get("department"),
        plant=user.get("plant"),
        manager_id=user.get("manager_id"),
        created_at=user["created_at"],
    )


@router.delete("/my-employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_employee(
    employee_id: int,
    current_user: dict = Depends(get_current_admin),
):
    """Remove an employee from the current admin's team."""
    if current_user.get("role") not in {Role.admin, Role.super_admin}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can manage employees")
    
    employee = db.get_user(employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    
    # Verify the employee reports to the current admin (unless super_admin)
    if current_user.get("role") == Role.admin:
        if employee.get("manager_id") != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only remove employees assigned to you"
            )
    
    # Remove the employee by setting manager_id to None (soft delete capability)
    db.update_user(employee_id, manager_id=None)
    return None


@router.get("/manager")
def get_manager(current_user: dict = Depends(get_current_user)):
    """Get the manager information for the current employee."""
    manager_id = current_user.get("manager_id")
    if not manager_id:
        return None
    
    manager = db.get_user(manager_id)
    if not manager:
        return None
    
    return {
        "id": manager["id"],
        "username": manager["username"],
        "email": manager["email"],
        "department": manager.get("department"),
        "plant": manager.get("plant"),
        "role": manager.get("role")
    }
