from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Dict, Iterable, Optional

from ..datastore import db
from ..models import Complaint, ComplaintStatus, Priority

logger = logging.getLogger(__name__)


def _resolve_user_id(username: str) -> Optional[int]:
    user = db.get_user_by_username(username)
    if not user:
        logger.warning("Auto-assignment user %s not found in datastore", username)
        return None
    return user["id"]


def _humanise(username: str) -> str:
    return username.replace("_", " ").title()


ASSIGNMENT_RULES: Iterable[Dict[str, object]] = [
    {
        "name": "vpn-network-specialist",
        "keywords": ["vpn", "network", "disconnect", "latency"],
        "assign_to": "network_specialist",
        "note": "Detected network connectivity keywords; routed to Network Specialist.",
    },
    {
        "name": "it-urgent",
        "category": "IT",
        "priority": Priority.urgent,
        "assign_to": "it_lead",
        "note": "Urgent IT ticket automatically routed to IT Lead.",
    },
]

DEFAULT_ASSIGNMENT = {
    "name": "service-desk-default",
    "assign_to": "service_desk",
    "note": "No specific routing rule matched; assigned to Service Desk for triage.",
}


def _build_plant_assignment(complaint: Complaint) -> Optional[Dict[str, object]]:
    if not complaint.category:
        return None
    admin = db.find_admin_for_category(complaint.category, complaint.plant)
    if not admin:
        return None
    plant_suffix = complaint.plant.lower() if complaint.plant else "global"
    note = f"Routed to {complaint.category} admin"
    if complaint.plant:
        note = f"{note} for plant {complaint.plant}"
    note = f"{note}."
    rule = {
        "name": f"plant-routing-{complaint.category.lower()}-{plant_suffix}",
        "assign_to": admin["username"],
        "note": note,
    }
    return _build_assignment_update(complaint, rule)


def _match_keywords(text: str, keywords: Iterable[str]) -> bool:
    lower = text.lower()
    return any(keyword in lower for keyword in keywords)


def _should_auto_assign(complaint: Complaint) -> bool:
    if complaint.assigned_to is None:
        return True
    if not complaint.assignment_source:
        # No source recorded; assume legacy assignment that can be upgraded.
        return True
    return complaint.assignment_source.startswith("auto:")


def _determine_assignment(complaint: Complaint) -> Optional[Dict[str, object]]:
    if not _should_auto_assign(complaint):
        return None

    text = complaint.complaint_text
    for rule in ASSIGNMENT_RULES:
        if "keywords" in rule and not _match_keywords(text, rule["keywords"]):  # type: ignore[arg-type]
            continue
        if "category" in rule and complaint.category != rule["category"]:
            continue
        if "priority" in rule and complaint.priority != rule["priority"]:
            continue
        return _build_assignment_update(complaint, rule)

    plant_assignment = _build_plant_assignment(complaint)
    if plant_assignment:
        return plant_assignment

    return _build_assignment_update(complaint, DEFAULT_ASSIGNMENT)


def _build_assignment_update(complaint: Complaint, rule: Dict[str, object]) -> Optional[Dict[str, object]]:
    username = str(rule["assign_to"])
    assignee_id = _resolve_user_id(username)
    if assignee_id is None:
        return None

    if complaint.assigned_to == assignee_id and complaint.assignment_source == f"auto:{rule['name']}":
        # Already assigned according to this rule.
        note = str(rule["note"])
        if complaint.assignment_notes and note in complaint.assignment_notes:
            return None
        updates: Dict[str, object] = {"assignment_notes": note}
        return updates

    note = str(rule["note"])
    return {
        "assigned_to": assignee_id,
        "assignment_source": f"auto:{rule['name']}",
        "assignment_notes": note,
    }


def apply_rules(complaint: Complaint) -> Complaint:
    """Apply assignment rules to a single complaint."""
    updates: Dict[str, object] = {}

    assignment_updates = _determine_assignment(complaint)
    if assignment_updates:
        updates.update(assignment_updates)

    if updates:
        updated = db.update_complaint(complaint.id, **updates)
        if updated:
            logger.info("Applied assignment updates for complaint %s", complaint.id)
            return updated
    return complaint


def refresh_all_complaints() -> None:
    """Re-evaluate assignment rules for every complaint."""
    complaints = db.list_complaints()
    for complaint in complaints:
        apply_rules(complaint)
