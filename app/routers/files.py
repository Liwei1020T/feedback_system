from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from ..config import settings
from ..services.file_validation import sniff_mime, has_dangerous_double_extension, sanitize_filename
from ..datastore import db
from ..dependencies import ensure_complaint_access, get_current_admin
from ..models import Attachment

router = APIRouter(prefix="/api", tags=["Files"])


@router.post("/upload", response_model=Attachment, status_code=status.HTTP_201_CREATED)
async def upload_file(
    complaint_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_admin),
):
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    ensure_complaint_access(complaint, current_user)
    contents = await file.read()
    if len(contents) > settings.max_file_size:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds size limit")
    if has_dangerous_double_extension(file.filename):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dangerous file name detected")
    sniffed = sniff_mime(contents)
    if sniffed not in settings.allowed_file_types:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported or invalid file content")
    safe_name = f"{uuid.uuid4()}_{sanitize_filename(file.filename)}"
    destination = Path(settings.upload_dir) / safe_name
    with open(destination, "wb") as buffer:
        buffer.write(contents)
    attachment = db.create_attachment(
        complaint_id=complaint_id,
        file_name=file.filename,
        file_path=str(destination),
        file_type=sniffed or file.content_type or "application/octet-stream",
        file_size=len(contents),
    )
    return attachment


@router.get("/files/{attachment_id}")
def download_file(attachment_id: int, current_user: dict = Depends(get_current_admin)):
    attachment = db.get_attachment(attachment_id)
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    complaint = db.get_complaint(attachment.complaint_id)
    if complaint:
        ensure_complaint_access(complaint, current_user)
    file_path = Path(attachment.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="File is no longer available on the server",
        )
    return FileResponse(
        path=str(file_path),
        filename=attachment.file_name,
        media_type=attachment.file_type,
    )


@router.delete("/files/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(attachment_id: int, current_user: dict = Depends(get_current_admin)):
    attachment = db.get_attachment(attachment_id)
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    complaint = db.get_complaint(attachment.complaint_id)
    if complaint:
        ensure_complaint_access(complaint, current_user)
    db.delete_attachment(attachment_id)
    try:
        Path(attachment.file_path).unlink(missing_ok=True)
    except OSError:
        pass
    return None
