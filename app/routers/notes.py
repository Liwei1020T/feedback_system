"""Internal notes API endpoints."""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ..datastore import db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import InternalNoteCreate, InternalNoteUpdate, InternalNoteResponse
from ..services.collaboration import collaboration_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/complaints/{complaint_id}/notes", tags=["internal-notes"])


@router.post("", response_model=InternalNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_internal_note(
    complaint_id: int,
    note_data: InternalNoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create an internal note on a complaint.
    Supports @mentions to notify team members.
    """
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    # Get the user object from the dict
    user_data = db.get_user(current_user["id"])
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user = User(**user_data)
    
    try:
        note = await collaboration_service.create_note(
            complaint=complaint,
            author=user,
            content=note_data.content,
            attachments=note_data.attachments
        )
        
        # Add note to complaint and persist
        complaint.internal_notes.append(note)
        db.update_complaint(complaint.id, internal_notes=complaint.internal_notes)
        
        return note
        
    except Exception as e:
        logger.error(f"Failed to create note: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )


@router.get("", response_model=List[InternalNoteResponse])
async def get_internal_notes(
    complaint_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get all internal notes for a complaint."""
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    # Sort: pinned first, then by date descending
    notes = sorted(
        complaint.internal_notes,
        key=lambda n: (not n.is_pinned, n.created_at),
        reverse=True
    )
    
    return notes


@router.put("/{note_id}", response_model=InternalNoteResponse)
async def update_internal_note(
    complaint_id: int,
    note_id: int,
    note_data: InternalNoteUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an internal note (author only)."""
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    # Find the note
    note = next((n for n in complaint.internal_notes if n.id == note_id), None)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Get the user object from the dict
    user_data = db.get_user(current_user["id"])
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user = User(**user_data)

    try:
        updated_note = await collaboration_service.update_note(
            note=note,
            content=note_data.content,
            author=user
        )
        
        # Update in complaint
        for i, n in enumerate(complaint.internal_notes):
            if n.id == note_id:
                complaint.internal_notes[i] = updated_note
                break
        
        db.update_complaint(complaint.id, internal_notes=complaint.internal_notes)
        
        return updated_note
        
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author can edit this note"
        )
    except Exception as e:
        logger.error(f"Failed to update note: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update note"
        )


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_internal_note(
    complaint_id: int,
    note_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete an internal note (author or admin only)."""
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    note = next((n for n in complaint.internal_notes if n.id == note_id), None)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Get the user object from the dict
    user_data = db.get_user(current_user["id"])
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user = User(**user_data)
    
    try:
        await collaboration_service.delete_note(note, user)
        
        # Remove from complaint
        complaint.internal_notes = [n for n in complaint.internal_notes if n.id != note_id]
        db.update_complaint(complaint.id, internal_notes=complaint.internal_notes)
        
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author or admin can delete this note"
        )


@router.post("/{note_id}/pin", response_model=InternalNoteResponse)
async def toggle_pin_note(
    complaint_id: int,
    note_id: int,
    pinned: bool,
    current_user: dict = Depends(get_current_user)
):
    """Pin or unpin a note (admin only)."""
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    note = next((n for n in complaint.internal_notes if n.id == note_id), None)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Get the user object from the dict
    user_data = db.get_user(current_user["id"])
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user = User(**user_data)
    
    try:
        updated_note = await collaboration_service.pin_note(
            note=note,
            pinned=pinned,
            user=user
        )
        
        # Update in complaint
        for i, n in enumerate(complaint.internal_notes):
            if n.id == note_id:
                complaint.internal_notes[i] = updated_note
                break
        
        db.update_complaint(complaint.id, internal_notes=complaint.internal_notes)
        
        return updated_note
        
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can pin notes"
        )


@router.post("/watch", status_code=status.HTTP_204_NO_CONTENT)
async def watch_complaint(
    complaint_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Add yourself as a watcher to receive notifications."""
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    # Add current user as watcher
    await collaboration_service.add_watcher(complaint, current_user["id"])
    db.update_complaint(complaint.id, watchers=complaint.watchers)


@router.delete("/watch", status_code=status.HTTP_204_NO_CONTENT)
async def unwatch_complaint(
    complaint_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Stop watching a complaint."""
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    await collaboration_service.remove_watcher(complaint, current_user["id"])
    db.update_complaint(complaint.id, watchers=complaint.watchers)
