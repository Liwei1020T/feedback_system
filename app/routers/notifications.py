import asyncio
import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from ..datastore import db
from ..dependencies import get_current_user
from ..schemas import NotificationCreate, NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """List notifications for the current user."""
    notifications = db.list_notifications(
        user_id=current_user["id"],
        is_read=is_read,
        limit=limit
    )
    return notifications


@router.get("/{notif_id}", response_model=NotificationResponse)
def get_notification(
    notif_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific notification."""
    notif = db.get_notification(notif_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification {notif_id} not found"
        )
    
    # Check ownership
    if notif.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this notification"
        )
    
    return notif


@router.patch("/{notif_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notif_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read."""
    notif = db.get_notification(notif_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification {notif_id} not found"
        )
    
    # Check ownership
    if notif.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this notification"
        )
    
    updated = db.mark_notification_read(notif_id)
    return updated


@router.post("/mark-all-read")
def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read for the current user."""
    count = db.mark_all_notifications_read(current_user["id"])
    return {"marked_read": count}


@router.delete("/{notif_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notif_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification."""
    notif = db.get_notification(notif_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification {notif_id} not found"
        )
    
    # Check ownership
    if notif.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this notification"
        )
    
    db.delete_notification(notif_id)
    return None


@router.get("/stream/sse")
async def notification_stream(current_user: dict = Depends(get_current_user)):
    """
    Server-Sent Events (SSE) stream for real-time notifications.
    
    Client usage example:
    ```javascript
    const eventSource = new EventSource('/api/notifications/stream/sse');
    eventSource.addEventListener('notification', (event) => {
        const data = JSON.parse(event.data);
        console.log('New notification:', data);
    });
    ```
    """
    async def event_generator():
        user_id = current_user["id"]
        last_count = len(db.list_notifications(user_id=user_id, limit=1000))
        
        # Send initial ping
        yield f"data: {json.dumps({'type': 'ping', 'timestamp': str(asyncio.get_event_loop().time())})}\n\n"
        
        try:
            while True:
                # Check for new notifications every 2 seconds
                await asyncio.sleep(2)
                
                current_notifs = db.list_notifications(user_id=user_id, limit=1000)
                current_count = len(current_notifs)
                
                if current_count > last_count:
                    # New notifications detected
                    new_notifs = current_notifs[:current_count - last_count]
                    for notif in new_notifs:
                        event_data = {
                            "type": "notification",
                            "data": {
                                "id": notif.id,
                                "title": notif.title,
                                "message": notif.message,
                                "notification_type": notif.type,
                                "link": notif.link,
                                "created_at": notif.created_at.isoformat()
                            }
                        }
                        yield f"data: {json.dumps(event_data)}\n\n"
                    
                    last_count = current_count
                else:
                    # Send keep-alive ping
                    yield f"data: {json.dumps({'type': 'ping', 'timestamp': str(asyncio.get_event_loop().time())})}\n\n"
        
        except asyncio.CancelledError:
            # Client disconnected
            yield f"data: {json.dumps({'type': 'close'})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    payload: NotificationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a notification (for testing or admin use)."""
    # Only admins can create notifications for other users
    if payload.user_id != current_user["id"] and current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create notifications for other users"
        )
    
    notif = db.create_notification(
        user_id=payload.user_id,
        title=payload.title,
        message=payload.message,
        type=payload.type,
        link=payload.link
    )
    return notif
