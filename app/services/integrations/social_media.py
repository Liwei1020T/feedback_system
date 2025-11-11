"""Social media monitoring service."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any

from ...models import Complaint, ChannelMetadata, ComplaintKind, ComplaintStatus, Priority

logger = logging.getLogger(__name__)


class SocialMediaMonitor:
    """Monitor social media mentions and convert to complaints."""
    
    async def process_mention(
        self,
        platform: str,
        post_id: str,
        author_handle: str,
        content: str,
        public_url: str,
        metadata: Dict[str, Any] = None
    ) -> Optional[Complaint]:
        """
        Process a social media mention into a complaint.
        
        Args:
            platform: Social platform (twitter, facebook, instagram)
            post_id: Unique post/tweet ID
            author_handle: @username of author
            content: Post/tweet text
            public_url: Link to original post
            metadata: Additional platform-specific data
            
        Returns:
            Complaint object
        """
        try:
            # Use AI to determine if it's a complaint
            is_complaint = await self._is_complaint(content)
            
            if not is_complaint:
                logger.info(f"Not a complaint: {post_id}")
                return None
            
            # Create complaint
            complaint = Complaint(
                id=0,  # Will be set by datastore
                emp_id=f"{platform}:{author_handle}",
                email=f"{author_handle}@{platform}.social",  # Placeholder
                phone="",
                complaint_text=content,
                kind=ComplaintKind.complaint,
                category="Unclassified",
                priority=Priority.normal,
                status=ComplaintStatus.pending,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                source_channel="social",
                source_metadata=ChannelMetadata(
                    platform=platform,
                    post_id=post_id,
                    author_handle=author_handle,
                    public_url=public_url
                )
            )
            
            logger.info(f"Created complaint from {platform} post {post_id}")
            return complaint
            
        except Exception as e:
            logger.error(f"Failed to process {platform} mention: {e}")
            return None
    
    async def _is_complaint(self, text: str) -> bool:
        """Use AI to determine if text is a complaint."""
        # Simple keyword matching fallback
        complaint_keywords = ["problem", "issue", "broken", "not working", "disappointed", "angry", "unhappy"]
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in complaint_keywords)


social_monitor = SocialMediaMonitor()
