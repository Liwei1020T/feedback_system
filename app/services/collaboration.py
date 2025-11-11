"""Internal notes and team collaboration service."""
from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import List, Optional

from ..models import InternalNote, Complaint, User

logger = logging.getLogger(__name__)


class CollaborationService:
    """Handle internal notes and team collaboration."""
    
    async def create_note(
        self,
        complaint: Complaint,
        author: User,
        content: str,
        attachments: List[int] = None
    ) -> InternalNote:
        """
        Create an internal note on a complaint.
        
        Args:
            complaint: Complaint to add note to
            author: User creating the note
            content: Note text (supports @mentions)
            attachments: List of attachment IDs
            
        Returns:
            Created InternalNote
        """
        try:
            # Extract @mentions from content
            mentions = self._extract_mentions(content)
            
            # Get next note ID
            existing_ids = [n.id for n in complaint.internal_notes] if complaint.internal_notes else []
            next_id = max(existing_ids) + 1 if existing_ids else 1
            
            note = InternalNote(
                id=next_id,
                complaint_id=complaint.id,
                author_id=author.id,
                author_name=author.username,
                content=content,
                mentions=mentions,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                attachments=attachments or []
            )
            
            logger.info(f"Created internal note on complaint {complaint.id} by {author.username}")
            return note
            
        except Exception as e:
            logger.error(f"Failed to create internal note: {e}")
            raise
    
    async def update_note(
        self,
        note: InternalNote,
        content: str,
        author: User
    ) -> InternalNote:
        """Update an existing note (only by original author)."""
        if note.author_id != author.id and author.role.value not in ["admin", "super_admin"]:
            raise PermissionError("Only the author can edit this note")
        
        # Update mentions if content changed
        new_mentions = self._extract_mentions(content)
        
        note.content = content
        note.mentions = new_mentions
        note.updated_at = datetime.utcnow()
        
        return note
    
    async def delete_note(self, note: InternalNote, user: User) -> None:
        """Delete a note (author or admin only)."""
        if note.author_id != user.id and user.role.value not in ["admin", "super_admin"]:
            raise PermissionError("Only the author or admin can delete this note")
        
        logger.info(f"Deleted note {note.id} by {user.username}")
    
    async def pin_note(
        self,
        note: InternalNote,
        pinned: bool,
        user: User
    ) -> InternalNote:
        """Pin/unpin a note (admin only)."""
        if user.role.value not in ["admin", "super_admin"]:
            raise PermissionError("Only admins can pin notes")
        
        note.is_pinned = pinned
        note.updated_at = datetime.utcnow()
        
        return note
    
    async def add_watcher(
        self,
        complaint: Complaint,
        user_id: int
    ) -> None:
        """Add a user to complaint watchers."""
        if user_id not in complaint.watchers:
            complaint.watchers.append(user_id)
            logger.info(f"Added watcher {user_id} to complaint {complaint.id}")
    
    async def remove_watcher(
        self,
        complaint: Complaint,
        user_id: int
    ) -> None:
        """Remove a user from complaint watchers."""
        if user_id in complaint.watchers:
            complaint.watchers.remove(user_id)
            logger.info(f"Removed watcher {user_id} from complaint {complaint.id}")
    
    def _extract_mentions(self, content: str) -> List[str]:
        """Extract @username mentions from text."""
        # Match @username pattern (alphanumeric + underscore)
        pattern = r'@([a-zA-Z0-9_]+)'
        mentions = re.findall(pattern, content)
        return list(set(mentions))  # Remove duplicates


# Singleton instance
collaboration_service = CollaborationService()
