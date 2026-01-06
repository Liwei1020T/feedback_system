"""Chat widget integration service."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from ...models import Complaint, ChannelMetadata, ComplaintKind, ComplaintStatus, Priority

logger = logging.getLogger(__name__)


class ChatWidget:
    """Handle complaints from embedded chat widget."""
    
    async def create_from_chat(
        self,
        session_id: str,
        visitor_name: str,
        visitor_email: str,
        message: str,
        visitor_ip: Optional[str] = None,
        browser_info: Optional[str] = None
    ) -> Complaint:
        """
        Create complaint from chat conversation.
        
        Args:
            session_id: Chat session identifier
            visitor_name: Customer name
            visitor_email: Customer email
            message: Chat message/transcript
            visitor_ip: Client IP address
            browser_info: User agent string
            
        Returns:
            Complaint object
        """
        try:
            # Create complaint
            complaint = Complaint(
                id=0,  # Will be set by datastore
                emp_id=visitor_email,
                email=visitor_email,
                phone="",
                complaint_text=message,
                kind=ComplaintKind.complaint,
                category="Unclassified",
                priority=Priority.normal,
                status=ComplaintStatus.pending,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                source_channel="chat",
                source_metadata=ChannelMetadata(
                    session_id=session_id,
                    visitor_ip=visitor_ip,
                    browser_info=browser_info
                )
            )
            
            logger.info(f"Created complaint from chat session {session_id}")
            return complaint
            
        except Exception as e:
            logger.error(f"Failed to create chat complaint: {e}")
            raise


chat_widget = ChatWidget()
