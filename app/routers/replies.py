from __future__ import annotations

from datetime import datetime
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Query

from ..datastore import db
from ..dependencies import ensure_complaint_access, get_current_admin
from ..models import Reply
from ..schemas import ReplyUpdate, ReplyListResponse, PaginationMeta
from ..services.email import EmailPayload, email_service
from ..services.email_templates import render_email
from ..services.file_validation import sniff_mime, has_dangerous_double_extension, sanitize_filename
from ..config import settings

router = APIRouter(prefix="/api/replies", tags=["Replies"])


@router.post("", response_model=Reply, status_code=status.HTTP_201_CREATED)
async def create_reply(
    complaint_id: int = Form(...),
    admin_id: int = Form(...),
    reply_text: str = Form(...),
    send_email: bool = Form(True),
    attachment: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_admin),
):
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    ensure_complaint_access(complaint, current_user)

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

    reply_text = reply_text.strip()
    if not reply_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reply text cannot be empty")

    email_sent = False
    email_sent_at = None
    if send_email:
        email_document = render_email(
            "reply",
            {
                "subject": f"Response to Your Complaint - Ticket #{complaint.id}",
                "employee_name": complaint.emp_id,
                "ticket_id": complaint.id,
                "category": complaint.category,
                "status": complaint.status.value if hasattr(complaint.status, "value") else complaint.status,
                "priority": complaint.priority.value if hasattr(complaint.priority, "value") else complaint.priority,
                "reply_text": reply_text,
                "responder_name": current_user.get("username", "Support Team"),
            },
        )
        message = EmailPayload(
            to=[complaint.email],
            subject=email_document.subject,
            html=email_document.html,
            text=email_document.text,
        )
        email_sent = email_service.send_with_retry(message)
        email_sent_at = datetime.utcnow() if email_sent else None
    author_id = current_user["id"]
    reply = db.create_reply(
        complaint_id=complaint_id,
        admin_id=author_id,
        reply_text=reply_text,
        email_sent=email_sent,
        email_sent_at=email_sent_at,
    )
    if file_bytes is not None and content_type and file_name:
        safe_name = f"{uuid.uuid4()}_{sanitize_filename(file_name)}"
        destination = Path(settings.upload_dir) / safe_name
        with open(destination, "wb") as buffer:
            buffer.write(file_bytes)
        db.create_attachment(
            complaint_id=complaint_id,
            file_name=file_name,
            file_path=str(destination),
            file_type=content_type,
            file_size=len(file_bytes),
            reply_id=reply.id,
        )
    return reply


@router.get("/{complaint_id}", response_model=ReplyListResponse)
def list_replies(
    complaint_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    order: str = Query("asc"),
    current_user: dict = Depends(get_current_admin),
):
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    ensure_complaint_access(complaint, current_user)
    replies = db.list_replies_for_complaint(complaint_id)
    reverse = order.lower() == "desc"
    replies.sort(key=lambda r: r.created_at, reverse=reverse)
    total = len(replies)
    start = (page - 1) * page_size
    end = start + page_size
    items = replies[start:end]
    total_pages = (total + page_size - 1) // page_size if total else 0
    meta = PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages)
    return ReplyListResponse(items=items, meta=meta)


@router.put("/{reply_id}", response_model=Reply)
def update_reply(reply_id: int, payload: ReplyUpdate, current_user: dict = Depends(get_current_admin)):
    existing = db.get_reply(reply_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
    complaint = db.get_complaint(existing.complaint_id)
    if complaint:
        ensure_complaint_access(complaint, current_user)
    reply = db.update_reply(reply_id, **payload.model_dump(exclude_none=True)) or existing
    return reply


@router.delete("/{reply_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reply(reply_id: int, current_user: dict = Depends(get_current_admin)):
    existing = db.get_reply(reply_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
    complaint = db.get_complaint(existing.complaint_id)
    if complaint:
        ensure_complaint_access(complaint, current_user)
    removed = db.delete_reply(reply_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
    return None
