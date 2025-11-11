from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from ..datastore import db
from ..models import ComplaintKind, ComplaintStatus
from . import assignment


def dashboard_snapshot(categories: Optional[List[str]] = None) -> Dict[str, object]:
    assignment.refresh_all_complaints()
    complaints = db.list_complaints()
    if categories:
        complaints = [complaint for complaint in complaints if complaint.category in categories]
    total = len(complaints)
    complaint_items = [c for c in complaints if c.kind == ComplaintKind.complaint]
    feedback_items = [c for c in complaints if c.kind == ComplaintKind.feedback]
    total_complaints = len(complaint_items)
    total_feedback = len(feedback_items)
    resolved = len([c for c in complaints if c.status == ComplaintStatus.resolved])
    pending = len([c for c in complaints if c.status == ComplaintStatus.pending])
    in_progress = len([c for c in complaints if c.status == ComplaintStatus.in_progress])
    unclassified = len([c for c in complaints if c.category == "Unclassified"])
    urgent = len([c for c in complaints if c.priority.value == "urgent"])

    category_counter = Counter(c.category for c in complaints)
    return {
        "total": total,
        "total_complaints": total_complaints,
        "total_feedback": total_feedback,
        "resolved": resolved,
        "pending": pending,
        "in_progress": in_progress,
        "unclassified": unclassified,
        "urgent": urgent,
        "by_kind": {
            ComplaintKind.complaint.value: total_complaints,
            ComplaintKind.feedback.value: total_feedback,
        },
        "by_category": dict(category_counter),
    }


def complaint_trends(
    categories: Optional[List[str]] = None,
    days: int = 30,
    granularity: str = "daily",
) -> List[Dict[str, object]]:
    """Return time-series data for complaints.

    - Defaults to last 30 days with daily buckets to power the
      "Ticket Volume Trend (Last 30 Days)" chart in the UI.
    - Each point includes:
        period: ISO date string (midnight UTC) for the bucket
        total: number of tickets created in the bucket
        resolved: number of tickets resolved in the bucket
    """
    assignment.refresh_all_complaints()
    complaints = db.list_complaints()
    if categories:
        complaints = [c for c in complaints if c.category in categories]

    # Normalize window: include today as the last day
    end_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    start_day = end_day - timedelta(days=days - 1)

    # Prepare zero-filled buckets
    buckets: Dict[str, Dict[str, int]] = {}
    if granularity == "daily":
        for i in range(days):
            day = start_day + timedelta(days=i)
            key = day.strftime("%Y-%m-%dT00:00:00Z")
            buckets[key] = {"total": 0, "resolved": 0}
    else:
        # Fallback to month buckets if ever requested
        cursor = start_day.replace(day=1)
        while cursor <= end_day:
            key = cursor.strftime("%Y-%m-01T00:00:00Z")
            buckets[key] = {"total": 0, "resolved": 0}
            # advance to next month
            if cursor.month == 12:
                cursor = cursor.replace(year=cursor.year + 1, month=1)
            else:
                cursor = cursor.replace(month=cursor.month + 1)

    # Tally creations and resolutions into buckets
    for c in complaints:
        created_day = c.created_at.replace(hour=0, minute=0, second=0, microsecond=0)
        if start_day <= created_day <= end_day:
            key = created_day.strftime("%Y-%m-%dT00:00:00Z") if granularity == "daily" else created_day.replace(day=1).strftime("%Y-%m-01T00:00:00Z")
            if key in buckets:
                buckets[key]["total"] += 1

        if c.resolved_at is not None:
            resolved_day = c.resolved_at.replace(hour=0, minute=0, second=0, microsecond=0)
            if start_day <= resolved_day <= end_day:
                key = resolved_day.strftime("%Y-%m-%dT00:00:00Z") if granularity == "daily" else resolved_day.replace(day=1).strftime("%Y-%m-01T00:00:00Z")
                if key in buckets:
                    buckets[key]["resolved"] += 1

    # Emit points chronologically
    trend: List[Dict[str, object]] = [
        {"period": k, "total": v["total"], "resolved": v["resolved"]}
        for k, v in sorted(buckets.items(), key=lambda item: item[0])
    ]
    return trend
