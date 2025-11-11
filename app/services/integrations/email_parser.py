"""Email complaint parser service."""
from __future__ import annotations

import email
import logging
from datetime import datetime
from email.message import EmailMessage
from typing import Optional

from ...models import Complaint, ChannelMetadata, ComplaintKind, ComplaintStatus, Priority

logger = logging.getLogger(__name__)


class EmailParser:
    """Parse complaints from incoming emails."""
    
    async def parse_email(self, raw_email: str) -> Optional[Complaint]:
        """
        Parse an email message into a Complaint object.
        
        Args:
            raw_email: Raw email content (RFC 822 format)
            
        Returns:
            Complaint object or None if parsing fails
        """
        try:
            msg = email.message_from_string(raw_email)
            
            # Extract basic fields
            subject = msg.get("Subject", "No Subject")
            from_addr = msg.get("From", "unknown@example.com")
            message_id = msg.get("Message-ID", "")
            
            # Extract body (prefer plain text)
            body = self._extract_body(msg)
            
            if not body:
                logger.warning(f"Empty email body from {from_addr}")
                return None
            
            # Use AI to classify (would integrate with existing AI service)
            # For now, use defaults
            
            # Create complaint
            complaint = Complaint(
                id=0,  # Will be set by datastore
                emp_id=from_addr,
                email=from_addr,
                phone="",  # Not available from email
                complaint_text=body,
                kind=ComplaintKind.complaint,
                category="Unclassified",
                priority=Priority.normal,
                status=ComplaintStatus.pending,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                source_channel="email",
                source_metadata=ChannelMetadata(
                    email_from=from_addr,
                    email_subject=subject,
                    email_message_id=message_id
                )
            )
            
            return complaint
            
        except Exception as e:
            logger.error(f"Failed to parse email: {e}")
            return None
    
    def _extract_body(self, msg: EmailMessage) -> str:
        """Extract text body from email message."""
        body = ""
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                if content_type == "text/plain":
                    body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    break
                elif content_type == "text/html" and not body:
                    # Fallback to HTML (would need HTML stripping)
                    body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
        else:
            body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
        
        return body.strip()


email_parser = EmailParser()
