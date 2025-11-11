from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Query
from pydantic import EmailStr

from ..config import settings
from ..datastore import db
from ..dependencies import (
    admin_scoped_categories,
    admin_scoped_plants,
    ensure_complaint_access,
    get_current_admin,
    get_current_user,
)
from ..models import Attachment, Complaint, ComplaintKind, ComplaintStatus, Priority
from ..schemas import (
    AssistanceResponse,
    CategorySuggestionResponse,
    ClassificationResponse,
    ComplaintCreate,
    ComplaintSummaryResponse,
    ComplaintUpdate,
    ComplaintListResponse,
    PaginationMeta,
)
from ..services import ai, assignment
from ..services.file_validation import sniff_mime, has_dangerous_double_extension, sanitize_filename

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


@router.get("/plants", response_model=List[str], include_in_schema=False)
def list_plants() -> List[str]:
    return settings.supported_plants


@router.post("", response_model=Complaint, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    emp_id: str = Form(...),
    email: EmailStr = Form(...),
    phone: str = Form(...),
    complaint_text: str = Form(...),
    plant: str = Form(...),
    kind: Optional[ComplaintKind] = Form(None),
    category: Optional[str] = Form(None),
    priority: Optional[Priority] = Form(None),
    attachment: Optional[UploadFile] = File(None),
):
    plant = plant.strip()
    payload = ComplaintCreate(
        emp_id=emp_id,
        email=email,
        phone=phone,
        complaint_text=complaint_text,
        plant=plant,
        kind=kind,
        category=category,
        priority=priority,
    )
    if not payload.plant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plant is required")
    if payload.plant not in settings.supported_plants:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plant selected")
    file_bytes: Optional[bytes] = None
    file_name: Optional[str] = None
    content_type: Optional[str] = None
    if attachment:
        file_bytes = await attachment.read()
        if len(file_bytes) > settings.max_file_size:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds size limit")
        file_name = attachment.filename or "attachment"
        if has_dangerous_double_extension(file_name):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dangerous file name detected")
        sniffed = sniff_mime(file_bytes)
        if sniffed not in settings.allowed_file_types:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported or invalid file content")
        content_type = sniffed

    complaint = db.create_complaint(
        emp_id=payload.emp_id,
        email=payload.email,
        phone=payload.phone,
        complaint_text=payload.complaint_text,
        plant=payload.plant,
        kind=payload.kind,
        category=payload.category,
        priority=payload.priority,
    )
    try:
        classification = ai.classify_complaint(payload.complaint_text)
    except Exception as exc:
        # Defensive: never fail ticket creation due to AI issues
        from ..main import get_logger
        get_logger().warning("classification_failed", extra={"error": str(exc)})
        classification = {
            "kind": ComplaintKind.complaint,
            "category": "Unclassified",
            "priority": Priority.normal,
            "confidence": 0.0,
            "kind_confidence": 0.0,
        }
    updated = db.update_complaint(
        complaint.id,
        kind=classification["kind"],
        category=classification["category"],
        priority=classification["priority"],
        ai_confidence=classification["confidence"],
        kind_confidence=classification["kind_confidence"],
    )
    current = assignment.apply_rules(updated or complaint)

    if file_bytes is not None and content_type:
        safe_name = f"{uuid.uuid4()}_{sanitize_filename(file_name)}"
        destination = Path(settings.upload_dir) / safe_name
        with open(destination, "wb") as buffer:
            buffer.write(file_bytes)
        db.create_attachment(
            complaint_id=current.id,
            file_name=file_name,
            file_path=str(destination),
            file_type=content_type,
            file_size=len(file_bytes),
        )
        refreshed = db.get_complaint(current.id)
        if refreshed:
            current = refreshed

    return current


PRIORITY_WEIGHT = {"urgent": 2, "normal": 1}
STATUS_WEIGHT = {"Pending": 3, "In Progress": 2, "Resolved": 1}
ALLOWED_SORT_FIELDS = {"created_at", "priority", "status"}
ALLOWED_ORDER = {"asc", "desc"}


@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    kind: Optional[ComplaintKind] = None,
    category: Optional[str] = Query(None),
    plant: Optional[str] = Query(None),
    priority: Optional[Priority] = Query(None),
    status_filter: Optional[ComplaintStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(
        None,
        min_length=1,
        max_length=100,
        description="Search by ticket ID, employee reference, email, phone, or complaint text",
    ),
    from_date: Optional[datetime] = Query(None, description="ISO timestamp inclusive lower bound"),
    to_date: Optional[datetime] = Query(None, description="ISO timestamp inclusive upper bound"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    sort: str = Query("created_at"),
    order: str = Query("desc"),
    current_user: dict = Depends(get_current_admin),
):
    assignment.refresh_all_complaints()
    complaints = db.list_complaints()
    categories = admin_scoped_categories(current_user)
    if categories:
        complaints = [complaint for complaint in complaints if complaint.category in categories]
    plants = admin_scoped_plants(current_user)
    if plants:
        complaints = [complaint for complaint in complaints if complaint.plant in plants]
    if kind:
        complaints = [complaint for complaint in complaints if complaint.kind == kind]
    if category:
        complaints = [complaint for complaint in complaints if complaint.category == category]
    if plant:
        complaints = [complaint for complaint in complaints if complaint.plant == plant]
    if priority:
        complaints = [complaint for complaint in complaints if complaint.priority == priority]
    if status_filter:
        complaints = [complaint for complaint in complaints if complaint.status == status_filter]
    if search:
        term = search.strip().lower()
        search_id: Optional[int] = None
        stripped = term.lstrip("#")
        if stripped.isdigit():
            try:
                search_id = int(stripped)
            except ValueError:
                search_id = None

        def _matches(complaint: Complaint) -> bool:
            if search_id is not None and complaint.id == search_id:
                return True
            haystacks = [
                complaint.emp_id,
                complaint.email,
                complaint.phone,
                complaint.complaint_text,
                complaint.category,
                complaint.plant or "",
                complaint.status.value,
                complaint.priority.value,
            ]
            for value in haystacks:
                if term in value.lower():
                    return True
            return False

        complaints = [complaint for complaint in complaints if _matches(complaint)]
    if from_date:
        lower_bound = from_date
        if from_date.tzinfo:
            lower_bound = from_date.astimezone(timezone.utc).replace(tzinfo=None)
        complaints = [complaint for complaint in complaints if complaint.created_at >= lower_bound]
    if to_date:
        upper_bound = to_date
        if to_date.tzinfo:
            upper_bound = to_date.astimezone(timezone.utc).replace(tzinfo=None)
        complaints = [complaint for complaint in complaints if complaint.created_at <= upper_bound]

    sort_field = sort if sort in ALLOWED_SORT_FIELDS else "created_at"
    order_value = order.lower()
    if order_value not in ALLOWED_ORDER:
        order_value = "desc"
    reverse = order_value == "desc"

    def sort_key(complaint: Complaint):
        if sort_field == "priority":
            return PRIORITY_WEIGHT.get(complaint.priority.value, 0)
        if sort_field == "status":
            return STATUS_WEIGHT.get(complaint.status.value, 0)
        return complaint.created_at

    complaints.sort(key=sort_key, reverse=reverse)

    total = len(complaints)
    start = (page - 1) * page_size
    end = start + page_size
    items = complaints[start:end]
    total_pages = (total + page_size - 1) // page_size if total else 0

    meta = PaginationMeta(
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )
    return ComplaintListResponse(items=items, meta=meta)


@router.get("/{complaint_id}", response_model=Complaint)
def get_complaint(complaint_id: int, current_user: dict = Depends(get_current_user)):
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    ensure_complaint_access(complaint, current_user)
    return assignment.apply_rules(complaint)


@router.put("/{complaint_id}", response_model=Complaint)
def update_complaint(
    complaint_id: int,
    payload: ComplaintUpdate,
    current_user: dict = Depends(get_current_admin),
):
    existing = db.get_complaint(complaint_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    ensure_complaint_access(existing, current_user)
    complaint = db.update_complaint(complaint_id, **payload.model_dump(exclude_none=True)) or existing
    if payload.assigned_to is not None:
        complaint = db.update_complaint(
            complaint_id,
            assignment_source="manual",
            assignment_notes="Manually reassigned by admin.",
        ) or complaint
    complaint = assignment.apply_rules(complaint)
    return complaint


@router.delete("/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_complaint(complaint_id: int, current_user: dict = Depends(get_current_admin)):
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    ensure_complaint_access(complaint, current_user)
    removed = db.delete_complaint(complaint_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    return None


@router.get("/{complaint_id}/attachments", response_model=List[Attachment])
def list_attachments(complaint_id: int, current_user: dict = Depends(get_current_admin)):
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    ensure_complaint_access(complaint, current_user)
    attachments = [
        attachment for aid in complaint.attachment_ids if (attachment := db.get_attachment(aid))
    ]
    return attachments


@router.get("/category/{category}", response_model=List[Complaint])
def filter_by_category(category: str, current_user: dict = Depends(get_current_admin)):
    assignment.refresh_all_complaints()
    categories = admin_scoped_categories(current_user)
    if categories and category not in categories:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to department data.",
        )
    complaints = db.filter_complaints(category=category)
    plants = admin_scoped_plants(current_user)
    if plants:
        complaints = [complaint for complaint in complaints if complaint.plant in plants]
    return complaints


@router.get("/status/{status}", response_model=List[Complaint])
def filter_by_status(status: ComplaintStatus, current_user: dict = Depends(get_current_admin)):
    assignment.refresh_all_complaints()
    complaints = db.filter_complaints(status=status)
    categories = admin_scoped_categories(current_user)
    if categories:
        complaints = [complaint for complaint in complaints if complaint.category in categories]
    plants = admin_scoped_plants(current_user)
    if plants:
        complaints = [complaint for complaint in complaints if complaint.plant in plants]
    return complaints


@router.post("/{complaint_id}/classify", response_model=ClassificationResponse)
def classify_complaint(complaint_id: int, current_user: dict = Depends(get_current_admin)):
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    ensure_complaint_access(complaint, current_user)
    classification = ai.classify_complaint(complaint.complaint_text)
    updated = db.update_complaint(
        complaint_id,
        kind=classification["kind"],
        category=classification["category"],
        priority=classification["priority"],
        ai_confidence=classification["confidence"],
        kind_confidence=classification["kind_confidence"],
    )
    assignment.apply_rules(updated or complaint)
    return classification


@router.get("/{complaint_id}/assist", response_model=AssistanceResponse)
def assist_reply(complaint_id: int, current_user: dict = Depends(get_current_admin)):
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    ensure_complaint_access(complaint, current_user)
    replies = db.list_replies_for_complaint(complaint_id)
    try:
        assistance = ai.generate_reply_assistance(complaint, replies)
    except ai.AIUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI reply assistance is currently unavailable. Please try again later.",
        )
    return assistance


@router.get("/{complaint_id}/suggestions", response_model=CategorySuggestionResponse)
def category_suggestions(complaint_id: int, current_user: dict = Depends(get_current_admin)):
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    ensure_complaint_access(complaint, current_user)
    suggestions = ai.suggest_categories(complaint.complaint_text)
    return CategorySuggestionResponse(suggestions=suggestions)


@router.get("/{complaint_id}/summary", response_model=ComplaintSummaryResponse)
def complaint_summary(complaint_id: int, current_user: dict = Depends(get_current_admin)):
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    ensure_complaint_access(complaint, current_user)
    try:
        payload = ai.summarize_complaint(complaint)
    except ai.AIUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI summary is currently unavailable. Please try again later.",
        ) from exc
    return ComplaintSummaryResponse(**payload)
