"""
AI Chatbot Router - Conversational interface with system data access
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.datastore import InMemoryDB, db
from app.dependencies import get_current_user
from app.models import ComplaintStatus, Priority
from app.services.ai import get_groq_client

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])
logger = logging.getLogger(__name__)

# Store conversation history (in production, use Redis or database)
conversation_history: Dict[str, List[Dict[str, str]]] = {}


def _status_text(status: Any) -> str:
    """Normalize complaint status to string form."""
    if status is None:
        return ""
    if isinstance(status, ComplaintStatus):
        return status.value
    value = getattr(status, "value", None)
    if isinstance(value, str):
        return value
    if value is not None:
        try:
            return str(value)
        except Exception:  # pragma: no cover - defensive
            pass
    return str(status)


def _priority_text(priority: Any) -> str:
    """Normalize priority to string form."""
    if priority is None:
        return ""
    if isinstance(priority, Priority):
        return priority.value
    value = getattr(priority, "value", None)
    if isinstance(value, str):
        return value
    if value is not None:
        try:
            return str(value)
        except Exception:  # pragma: no cover - defensive
            pass
    return str(priority)


class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    context_used: List[str]
    suggested_actions: Optional[List[str]] = None


def get_system_context(datastore: InMemoryDB) -> str:
    """Build context about the current system state."""

    def _format_top(data: Dict[str, int], *, limit: int = 5) -> str:
        if not data:
            return "None"
        parts = [f"{name}: {count}" for name, count in sorted(data.items(), key=lambda x: x[1], reverse=True)[:limit]]
        return ", ".join(parts)

    try:
        complaints = datastore.list_complaints()
        users = datastore.list_users()

        total_complaints = len(complaints)
        resolved = sum(1 for c in complaints if _status_text(c.status).lower() == ComplaintStatus.resolved.value.lower())
        pending = sum(1 for c in complaints if _status_text(c.status).lower() == ComplaintStatus.pending.value.lower())
        in_progress = sum(
            1 for c in complaints if _status_text(c.status).lower() == ComplaintStatus.in_progress.value.lower()
        )

        category_counts: Dict[str, int] = {}
        department_counts: Dict[str, int] = {}
        priority_counts: Dict[str, int] = {}

        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_complaints = []

        for complaint in complaints:
            category_counts[complaint.category] = category_counts.get(complaint.category, 0) + 1
            department_counts[complaint.category] = department_counts.get(complaint.category, 0) + 1

            priority_name = _priority_text(complaint.priority)
            priority_counts[priority_name] = priority_counts.get(priority_name, 0) + 1

            if complaint.created_at and complaint.created_at >= seven_days_ago:
                recent_complaints.append(complaint)

        admin_count = sum(1 for user in users if user.get("role") in {"admin", "super_admin"})

        context = f"""
SYSTEM STATUS (as of {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC):

Total Complaints: {total_complaints}
- Resolved: {resolved} ({(resolved / total_complaints * 100) if total_complaints else 0:.1f}%)
- In Progress: {in_progress} ({(in_progress / total_complaints * 100) if total_complaints else 0:.1f}%)
- Pending: {pending} ({(pending / total_complaints * 100) if total_complaints else 0:.1f}%)

Recent Activity (Last 7 Days): {len(recent_complaints)} complaints

Categories: {_format_top(category_counts)}

Departments: {_format_top(department_counts)}

Priority Breakdown: {_format_top(priority_counts, limit=len(priority_counts))}

Total Admins: {admin_count}
"""
        return context
    except Exception as exc:  # pragma: no cover - defensive fallback
        logger.error("Error building system context: %s", exc)
        return "System data unavailable"


def query_complaints(
    datastore: InMemoryDB,
    filters: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Query complaints based on natural language intent."""
    try:
        complaints = datastore.list_complaints()
        results: List[Dict[str, Any]] = []

        for complaint in complaints:
            status_name = _status_text(complaint.status).lower()
            priority_name = _priority_text(complaint.priority).lower()
            category_name = complaint.category.lower() if complaint.category else ""

            if "status" in filters and status_name != str(filters["status"]).lower():
                continue
            if "category" in filters and category_name != str(filters["category"]).lower():
                continue
            if "department" in filters and category_name != str(filters["department"]).lower():
                continue
            if "priority" in filters and priority_name != str(filters["priority"]).lower():
                continue

            if "days" in filters:
                try:
                    days = int(filters["days"])
                except (TypeError, ValueError):
                    days = None
                if days is not None and complaint.created_at:
                    cutoff = datetime.utcnow() - timedelta(days=days)
                    if complaint.created_at < cutoff:
                        continue

            text = complaint.complaint_text or ""
            preview = text[:200] + ("..." if len(text) > 200 else "")

            results.append(
                {
                    "id": complaint.id,
                    "title": f"Complaint #{complaint.id}",
                    "category": complaint.category,
                    "department": complaint.category,
                    "plant": complaint.plant,
                    "status": _status_text(complaint.status),
                    "priority": _priority_text(complaint.priority),
                    "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
                    "description": preview,
                }
            )

        return results
    except Exception as exc:  # pragma: no cover - defensive fallback
        logger.error("Error querying complaints: %s", exc)
        return []


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    chat_message: ChatMessage,
    current_user: dict = Depends(get_current_user),
):
    """
    Chat with AI assistant that has access to system data
    """
    try:
        datastore = db
        
        # Generate or retrieve conversation ID
        username = current_user.get("username", "user")
        user_id = current_user.get("id", "anon")
        conversation_id = chat_message.conversation_id or f"conv_{username}_{user_id}"
        
        # Get or initialize conversation history
        if conversation_id not in conversation_history:
            conversation_history[conversation_id] = []
        
        # Add user message to history
        conversation_history[conversation_id].append({
            "role": "user",
            "content": chat_message.message
        })
        
        # Keep only last 10 messages to avoid token limits
        if len(conversation_history[conversation_id]) > 10:
            conversation_history[conversation_id] = conversation_history[conversation_id][-10:]
        
        # Build system context
        system_context = get_system_context(datastore)
        
        # Prepare messages for Groq
        messages = [
            {
                "role": "system",
                "content": f"""You are an intelligent AI assistant for the AI Feedback Management System. You have access to real-time data about feedback, users, and system metrics.

{system_context}

Your role is to:
1. Answer questions about complaints, statistics, and trends
2. Provide insights and recommendations based on the data
3. Help users find specific complaints or information
4. Suggest actions to improve complaint resolution
5. Be conversational, helpful, and proactive

When users ask about specific data:
- Provide accurate numbers from the context above
- Offer additional insights they might not have asked for
- Suggest related actions or queries

If you need to query specific complaints, indicate what filters would be needed (e.g., "I would need to filter by department: IT, status: pending").

Be friendly, professional, and data-driven in your responses."""
            }
        ]
        
        # Add conversation history
        messages.extend(conversation_history[conversation_id])
        
        # Call Groq API
        try:
            client = get_groq_client()
            if client is None:
                raise RuntimeError("Groq client is not initialized")

            completion = client.chat.completions.create(
                model=settings.groq_model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
            )

            choice = completion.choices[0] if completion.choices else None
            ai_response = (choice.message.content if choice and choice.message else "") or ""
            if not ai_response:
                ai_response = "I could not generate a response right now. Please try again shortly."

        except Exception as e:
            logger.error(f"Groq API error: {e}")
            ai_response = "I apologize, but I'm having trouble connecting to my AI service right now. However, I can see that you have access to the AI Feedback Management System. Please try again in a moment."
        
        # Add AI response to history
        conversation_history[conversation_id].append({
            "role": "assistant",
            "content": ai_response
        })
        
        # Extract context used
        context_used = ["System statistics", "Complaint data", "Department metrics"]
        
        # Generate suggested actions based on response
        suggested_actions = []
        lower_message = chat_message.message.lower()
        
        if any(word in lower_message for word in ["pending", "open", "unresolved"]):
            suggested_actions.append("View all pending complaints")
            suggested_actions.append("Filter by high priority")
        
        if any(word in lower_message for word in ["analytics", "stats", "metrics"]):
            suggested_actions.append("View detailed analytics dashboard")
            suggested_actions.append("Generate report")
        
        if any(word in lower_message for word in ["department", "team"]):
            suggested_actions.append("View department performance")
            suggested_actions.append("Check workload distribution")
        
        return ChatResponse(
            response=ai_response,
            conversation_id=conversation_id,
            context_used=context_used,
            suggested_actions=suggested_actions if suggested_actions else None
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )


@router.delete("/chat/{conversation_id}")
async def clear_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Clear conversation history"""
    if conversation_id in conversation_history:
        del conversation_history[conversation_id]
    
    return {"message": "Conversation cleared successfully"}


@router.get("/chat/history/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get conversation history"""
    history = conversation_history.get(conversation_id, [])
    return {"conversation_id": conversation_id, "messages": history}
