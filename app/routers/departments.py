from __future__ import annotations

from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query

from ..config import settings
from ..datastore import db
from ..dependencies import get_current_super_admin, get_current_admin
from ..models import Role, ComplaintStatus
from ..schemas import (
    DepartmentInfo,
    DepartmentDetailResponse,
    DepartmentCreateRequest,
    AdminResponse,
    EmployeeResponse,
    EmployeeCreateRequest,
    AdminCreateRequest,
)

router = APIRouter(prefix="/api/departments", tags=["Department Management"])


@router.get("", response_model=List[DepartmentInfo])
def list_departments(
    plant: Optional[str] = Query(None, description="Filter departments by plant"),
    current_user: dict = Depends(get_current_admin),
):
    """Get all departments across all plants with summary statistics.
    
    For super_admin: Returns all departments.
    For admin: Returns only their own department.
    """
    departments_map: Dict[tuple[str, str], Dict[str, Any]] = {}
    plant_filter_raw = (plant or "").strip()
    if plant_filter_raw.lower() in {"", "all", "null", "undefined"}:
        plant_filter = ""
    else:
        plant_filter = plant_filter_raw
    
    # Get all users
    all_users = db.list_users()
    
    # Get all complaints
    all_complaints = db.list_complaints()
    
    # For regular admins, filter to only their department
    if current_user.get("role") == Role.admin:
        # If plant is not provided by admin, use their own plant
        if not plant_filter:
            plant_filter = current_user.get("plant") or ""
        admin_dept = current_user.get("department")
        admin_plant = current_user.get("plant") or ""
    
    for user in all_users:
        dept = user.get("department") or "Unassigned"
        user_plant = user.get("plant") or "Unassigned"
        
        # For regular admins, only show their own department
        if current_user.get("role") == Role.admin:
            if dept != admin_dept or user_plant != admin_plant:
                continue
        elif plant_filter and user_plant != plant_filter:
            continue
        
        key = (dept, user_plant)
        
        if key not in departments_map:
            departments_map[key] = {
                "name": dept,
                "plant": user_plant,
                "admin_count": 0,
                "employee_count": 0,
                "total_complaints": 0,
                "pending_complaints": 0,
                "resolved_complaints": 0,
            }
        
        if user["role"] == Role.admin or user["role"] == Role.super_admin:
            departments_map[key]["admin_count"] += 1
        else:
            departments_map[key]["employee_count"] += 1
    
    # Count complaints per department
    for complaint in all_complaints:
        dept = complaint.category or "Unassigned"
        complaint_plant = complaint.plant or "Unassigned"
        if plant_filter and complaint_plant != plant_filter:
            continue
        key = (dept, complaint_plant)
        
        if key not in departments_map:
            departments_map[key] = {
                "name": dept,
                "plant": complaint_plant,
                "admin_count": 0,
                "employee_count": 0,
                "total_complaints": 0,
                "pending_complaints": 0,
                "resolved_complaints": 0,
            }
        
        departments_map[key]["total_complaints"] += 1
        
        if complaint.status == ComplaintStatus.resolved:
            departments_map[key]["resolved_complaints"] += 1
        elif complaint.status == ComplaintStatus.pending:
            departments_map[key]["pending_complaints"] += 1
    
    # Add all categories (departments) for their designated plants
    # This ensures newly created departments appear in the table
    if current_user.get("role") == Role.super_admin:
        all_categories = db.get_categories()
        
        for category in all_categories:
            # Extract plants from description (format: [PLANT:P1] [PLANT:P2])
            description = category.description or ""
            import re
            plant_tags = re.findall(r'\[PLANT:([^\]]+)\]', description)
            
            if plant_tags:
                # Department has specific plants assigned
                for plant in plant_tags:
                    if plant_filter and plant != plant_filter:
                        continue
                        
                    key = (category.name, plant)
                    if key not in departments_map:
                        departments_map[key] = {
                            "name": category.name,
                            "plant": plant,
                            "admin_count": 0,
                            "employee_count": 0,
                            "total_complaints": 0,
                            "pending_complaints": 0,
                            "resolved_complaints": 0,
                        }
    
    return [DepartmentInfo(**data) for data in departments_map.values()]


@router.get("/{department}/{plant}", response_model=DepartmentDetailResponse)
def get_department_details(
    department: str,
    plant: str,
    current_user: dict = Depends(get_current_admin)
):
    """Get detailed information about a specific department in a specific plant.
    
    For super_admin: Can view any department.
    For admin: Can only view their own department.
    """
    # Check authorization: admins can only view their own department
    if current_user.get("role") == Role.admin:
        if (current_user.get("department") != department or 
            current_user.get("plant") != plant):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own department"
            )
    
    all_users = db.list_users()
    
    # Filter users by department and plant
    admins = []
    employees = []
    
    for user in all_users:
        user_dept = user.get("department") or "Unassigned"
        user_plant = user.get("plant") or "Unassigned"
        
        if user_dept == department and user_plant == plant:
            user_response = {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "role": user["role"],
                "department": user.get("department"),
                "plant": user.get("plant"),
                "created_at": user["created_at"],
                "password": user.get("initial_password"),
            }
            
            if user["role"] == Role.admin or user["role"] == Role.super_admin:
                admins.append(AdminResponse(**user_response))
            else:
                employees.append(EmployeeResponse(**user_response))
    
    # Get complaints statistics
    all_complaints = db.list_complaints()
    dept_complaints = [
        c for c in all_complaints
        if (c.category or "Unassigned") == department and (c.plant or "Unassigned") == plant
    ]
    
    stats = {
        "total_complaints": len(dept_complaints),
        "pending": sum(1 for c in dept_complaints if c.status == ComplaintStatus.pending),
        "in_progress": sum(1 for c in dept_complaints if c.status == ComplaintStatus.in_progress),
        "resolved": sum(1 for c in dept_complaints if c.status == ComplaintStatus.resolved),
        "admin_count": len(admins),
        "employee_count": len(employees),
    }
    
    return DepartmentDetailResponse(
        department=department,
        plant=plant,
        admins=admins,
        employees=employees,
        stats=stats,
    )


@router.post("/{department}/{plant}/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def add_employee_to_department(
    department: str,
    plant: str,
    payload: EmployeeCreateRequest,
    current_user: dict = Depends(get_current_admin)
):
    """Add an employee to a department. Admins can only add to their own department/plant."""
    # Check if user is super_admin or admin of this department
    if current_user["role"] != Role.super_admin:
        if current_user.get("department") != department or current_user.get("plant") != plant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only add employees to your own department and plant"
            )
    
    # Check if username or email already exists
    if db.get_user_by_username(payload.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    if any(user["email"].lower() == payload.email.lower() for user in db.list_users()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Validate department exists
    valid_departments = {category.name for category in db.get_categories()}
    if department not in valid_departments and department != "Unassigned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid department"
        )
    
    # Validate plant
    if plant not in settings.supported_plants and plant != "Unassigned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plant"
        )
    
    # Create employee
    user = db.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        role=Role.user,
        department=department if department != "Unassigned" else None,
        plant=plant if plant != "Unassigned" else None,
        initial_password=payload.password,
    )
    
    return EmployeeResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        department=user.get("department"),
        plant=user.get("plant"),
        created_at=user["created_at"],
        password=user.get("initial_password"),
    )


@router.post("/{department}/{plant}/admins", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
def add_admin_to_department(
    department: str,
    plant: str,
    payload: AdminCreateRequest,
    _: dict = Depends(get_current_super_admin)
):
    """Add an admin to a department. Only super_admin can do this."""
    if db.get_user_by_username(payload.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    if any(user["email"].lower() == payload.email.lower() for user in db.list_users()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Validate department
    valid_departments = {category.name for category in db.get_categories()}
    if department not in valid_departments and department != "Unassigned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid department"
        )
    
    # Validate plant
    if plant not in settings.supported_plants and plant != "Unassigned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plant"
        )
    
    # Create admin
    user = db.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        role=Role.admin,
        department=department if department != "Unassigned" else None,
        plant=plant if plant != "Unassigned" else None,
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


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_from_department(
    user_id: int,
    current_user: dict = Depends(get_current_admin)
):
    """Remove a user (employee or admin) from the system."""
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Super admin can delete anyone except themselves
    if current_user["role"] == Role.super_admin:
        if user_id == current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete yourself"
            )
    else:
        # Regular admin can only delete employees in their department/plant
        if user["role"] != Role.user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete employees, not admins"
            )
        
        if user.get("department") != current_user.get("department") or \
           user.get("plant") != current_user.get("plant"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete employees from your own department and plant"
            )
    
    # Delete user
    db.delete_user(user_id)
    return None


@router.get("/plants", response_model=List[str])
def list_plants(_: dict = Depends(get_current_admin)):
    """Get list of all plants."""
    return settings.supported_plants


@router.get("/names", response_model=List[str])
def list_department_names(_: dict = Depends(get_current_admin)):
    """Get list of all department names."""
    return sorted({category.name for category in db.get_categories()})


@router.post("", status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreateRequest,
    plant: str = Query(..., description="Plant where the department will be created"),
    _: dict = Depends(get_current_super_admin)
):
    """Create a new department for a specific plant. Only super_admin can do this."""
    # Check if department already exists
    existing = db.get_category_by_name(payload.name)
    if not existing:
        # Create department (as a category) with plant info in description
        plant_info = f"[PLANT:{plant}]"
        description = f"{plant_info} {payload.description or ''}".strip()
        category = db.create_category(name=payload.name, description=description)
    else:
        # Department exists, add plant to its description if not already there
        plant_tag = f"[PLANT:{plant}]"
        current_desc = existing.description or ""
        if plant_tag not in current_desc:
            # Add the plant tag to the description
            new_desc = f"{current_desc} {plant_tag}".strip()
            # Update category description (we need a method for this)
            existing.description = new_desc
            db._persist()
        category = existing
    
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "plant": plant,
        "message": f"Department created for plant {plant}"
    }


@router.delete("/{department_name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_name: str,
    _: dict = Depends(get_current_super_admin)
):
    """Delete a department. Only super_admin can do this.
    
    NOTE: This will not delete users or complaints associated with the department.
    They will remain in the system but the department will no longer be available for selection.
    """
    # Find department by name
    category = db.get_category_by_name(department_name)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    # Check if department has users
    all_users = db.list_users()
    users_in_dept = [u for u in all_users if u.get("department") == department_name]
    
    if users_in_dept:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete department. {len(users_in_dept)} user(s) are still assigned to this department. Please reassign or remove them first."
        )
    
    # Check if department has complaints
    all_complaints = db.list_complaints()
    complaints_in_dept = [c for c in all_complaints if c.category == department_name]
    
    if complaints_in_dept:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete department. {len(complaints_in_dept)} complaint(s) are still assigned to this department."
        )
    
    # Delete department
    db.delete_category(category.id)
    return None
