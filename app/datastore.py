from __future__ import annotations

import json
from datetime import datetime, timedelta
from threading import Lock
from typing import Dict, List, Optional

from pydantic import EmailStr

from .config import settings
from .models import (
    Attachment,
    AuditLog,
    Category,
    Complaint,
    ComplaintKind,
    ComplaintStatus,
    Notification,
    Priority,
    Report,
    ReportPeriod,
    Reply,
    Role,
)
from .security import hash_password


class InMemoryDB:
    """Thread-safe in-memory persistence for demo and testing."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._storage_path = settings.data_store_path
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        self._suppress_persist = False
        self._initialize_empty()
        if self._storage_path.exists() and self._storage_path.stat().st_size > 0:
            self._load_state()
        else:
            self._suppress_persist = True
            self._seed_defaults()
            self._suppress_persist = False
            self._persist()

    def _initialize_empty(self) -> None:
        self._counters: Dict[str, int] = {
            "users": 0,
            "complaints": 0,
            "attachments": 0,
            "replies": 0,
            "categories": 0,
            "audit_logs": 0,
            "reports": 0,
            "notifications": 0,
        }
        self.users: Dict[int, dict] = {}
        self.complaints: Dict[int, Complaint] = {}
        self.attachments: Dict[int, Attachment] = {}
        self.replies: Dict[int, Reply] = {}
        self.categories: Dict[int, Category] = {}
        self.audit_logs: Dict[int, AuditLog] = {}
        self.reports: Dict[int, Report] = {}
        self.notifications: Dict[int, 'Notification'] = {}

    def _load_state(self) -> None:
        with self._storage_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)

        counters = payload.get("counters", {})
        for key in self._counters.keys():
            if key in counters:
                self._counters[key] = counters[key]

        for user_data in payload.get("users", []):
            user = self._deserialize_user(user_data)
            self.users[user["id"]] = user

        for complaint_data in payload.get("complaints", []):
            complaint = Complaint(**complaint_data)
            self.complaints[complaint.id] = complaint

        for attachment_data in payload.get("attachments", []):
            attachment = Attachment(**attachment_data)
            self.attachments[attachment.id] = attachment

        for reply_data in payload.get("replies", []):
            reply = Reply(**reply_data)
            self.replies[reply.id] = reply

        for category_data in payload.get("categories", []):
            category = Category(**category_data)
            self.categories[category.id] = category

        for log_data in payload.get("audit_logs", []):
            log = AuditLog(**log_data)
            self.audit_logs[log.id] = log

        for report_data in payload.get("reports", []):
            report = Report(**report_data)
            self.reports[report.id] = report

        for notif_data in payload.get("notifications", []):
            notif = Notification(**notif_data)
            self.notifications[notif.id] = notif

    def _persist(self) -> None:
        if self._suppress_persist:
            return
        with self._lock:
            state = {
                "counters": self._counters,
                "users": [self._serialize_user(user) for user in self.users.values()],
                "complaints": [complaint.model_dump(mode="json") for complaint in self.complaints.values()],
                "attachments": [attachment.model_dump(mode="json") for attachment in self.attachments.values()],
                "replies": [reply.model_dump(mode="json") for reply in self.replies.values()],
                "categories": [category.model_dump(mode="json") for category in self.categories.values()],
                "audit_logs": [log.model_dump(mode="json") for log in self.audit_logs.values()],
                "reports": [report.model_dump(mode="json") for report in self.reports.values()],
                "notifications": [notif.model_dump(mode="json") for notif in self.notifications.values()],
            }
            with self._storage_path.open("w", encoding="utf-8") as handle:
                json.dump(state, handle, indent=2)

    @staticmethod
    def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            cleaned = value.replace("Z", "+00:00") if value.endswith("Z") else value
            return datetime.fromisoformat(cleaned)
        raise ValueError(f"Unsupported datetime value: {value!r}")

    def _serialize_user(self, user: dict) -> dict:
        return {
            **user,
            "created_at": user["created_at"].isoformat() if isinstance(user.get("created_at"), datetime) else user.get("created_at"),
            "updated_at": user["updated_at"].isoformat() if isinstance(user.get("updated_at"), datetime) else user.get("updated_at"),
        }

    def _deserialize_user(self, data: dict) -> dict:
        user = dict(data)
        user["created_at"] = self._parse_datetime(user.get("created_at")) or datetime.utcnow()
        user["updated_at"] = self._parse_datetime(user.get("updated_at")) or datetime.utcnow()
        return user

    def _seed_defaults(self) -> None:
        self.create_user(
            username="superadmin",
            email="super.admin@example.com",
            password="superadmin123",
            role=Role.super_admin,
            department="Executive",
            plant=None,
        )
        admin = self.create_user(
            username="admin",
            email="admin@example.com",
            password="admin123",
            role=Role.admin,
            department="IT",
            plant="P1",
        )
        # Seed functional team leads for auto-assignment rules.
        self.create_user(
            username="it_lead",
            email="it.lead@example.com",
            password="temps3cret",
            role=Role.admin,
            department="IT",
            plant=None,
        )
        self.create_user(
            username="network_specialist",
            email="network.team@example.com",
            password="temps3cret",
            role=Role.admin,
            department="IT",
            plant=None,
        )
        self.create_user(
            username="payroll_lead",
            email="payroll.lead@example.com",
            password="temps3cret",
            role=Role.admin,
            department="Payroll",
            plant="P1",
        )
        self.create_user(
            username="facilities_lead",
            email="facilities.lead@example.com",
            password="temps3cret",
            role=Role.admin,
            department="Facilities",
            plant="P1",
        )
        self.create_user(
            username="service_desk",
            email="service.desk@example.com",
            password="temps3cret",
            role=Role.admin,
            department="Unclassified",
            plant=None,
        )
        self.create_user(
            username="operations_manager",
            email="ops.manager@example.com",
            password="temps3cret",
            role=Role.admin,
            department="Facilities",
            plant=None,
        )
        self.create_user(
            username="facilities_p2",
            email="facilities.p2@example.com",
            password="temps3cret",
            role=Role.admin,
            department="Facilities",
            plant="P2",
        )
        default_categories = [
            ("HR", "Human Resources related complaints"),
            ("Payroll", "Salary and payment issues"),
            ("Facilities", "Office facilities and maintenance"),
            ("IT", "Information Technology and systems"),
            ("Safety", "Workplace safety concerns"),
            ("Unclassified", "Complaints needing manual classification"),
        ]
        for name, desc in default_categories:
            self.create_category(name=name, description=desc)
        self._seed_sample_data(admin_id=admin["id"])

    def _seed_sample_data(self, admin_id: int) -> None:
        """Populate the in-memory db with representative demo records."""
        samples = [
            {
                "emp_id": "EMP1001",
                "email": "linda.ong@example.com",
                "phone": "+60123456781",
                "plant": "P1",
                "complaint_text": "Laptop keyboard intermittently fails and VPN disconnects during calls.",
                "kind": ComplaintKind.complaint,
                "category": "IT",
                "priority": Priority.urgent,
                "status": ComplaintStatus.in_progress,
                "ai_confidence": 0.84,
                "kind_confidence": 0.82,
                "created_hours_ago": 6,
            },
            {
                "emp_id": "EMP2044",
                "email": "rahim.yusof@example.com",
                "phone": "+60123456782",
                "plant": "P2",
                "complaint_text": "Air-conditioning on level 12 is not functioning and meeting rooms are too warm.",
                "kind": ComplaintKind.complaint,
                "category": "Facilities",
                "priority": Priority.normal,
                "status": ComplaintStatus.pending,
                "ai_confidence": 0.76,
                "kind_confidence": 0.74,
                "created_hours_ago": 30,
            },
            {
                "emp_id": "EMP3307",
                "email": "meera.chan@example.com",
                "phone": "+60123456783",
                "plant": "BK",
                "complaint_text": "Salary for September is short by two days and reimbursement is missing.",
                "kind": ComplaintKind.complaint,
                "category": "Payroll",
                "priority": Priority.urgent,
                "status": ComplaintStatus.resolved,
                "ai_confidence": 0.9,
                "kind_confidence": 0.88,
                "created_hours_ago": 12,
            },
            {
                "emp_id": "EMP5521",
                "email": "adrian.lim@example.com",
                "phone": "+60123456784",
                "plant": "P1",
                "complaint_text": "Kudos to the facilities team—new collaboration space looks amazing and boosts team morale.",
                "kind": ComplaintKind.feedback,
                "category": "Facilities",
                "priority": Priority.normal,
                "status": ComplaintStatus.resolved,
                "ai_confidence": 0.78,
                "kind_confidence": 0.86,
                "created_hours_ago": 4,
            },
        ]

        for sample in samples:
            complaint = self.create_complaint(
                emp_id=sample["emp_id"],
                email=sample["email"],
                phone=sample["phone"],
                complaint_text=sample["complaint_text"],
                plant=sample.get("plant"),
                kind=sample["kind"],
                category=sample["category"],
                priority=sample["priority"],
            )
            self.update_complaint(
                complaint.id,
                status=sample["status"],
                ai_confidence=sample["ai_confidence"],
                kind_confidence=sample.get("kind_confidence"),
            )
            hours_ago = sample.get("created_hours_ago")
            if hours_ago is not None:
                created_at = datetime.utcnow() - timedelta(hours=hours_ago)
                existing = self.complaints[complaint.id]
                self.complaints[complaint.id] = existing.model_copy(
                    update={"created_at": created_at, "updated_at": created_at}
                )

        # Add a reply to the payroll case and mark as resolved.
        payroll_complaint = self.filter_complaints(category="Payroll")[0]
        reply = self.create_reply(
            complaint_id=payroll_complaint.id,
            admin_id=admin_id,
            reply_text="Payroll team recalculated your hours and the adjustment will be in the next cycle.",
            email_sent=True,
            email_sent_at=datetime.utcnow(),
        )
        self.update_reply(reply.id, created_at=datetime.utcnow())

        # Provide a sample attachment to the IT complaint, ensure the file exists.
        it_complaint = self.filter_complaints(category="IT")[0]
        placeholder = settings.upload_dir / "sample-error-screenshot.png"
        try:
            placeholder.parent.mkdir(parents=True, exist_ok=True)
            if not placeholder.exists():
                placeholder.write_bytes(b"PNG\r\nplaceholder screenshot bytes")
        except Exception:
            # Best effort only; continue without blocking startup
            pass
        self.create_attachment(
            complaint_id=it_complaint.id,
            file_name="error-screenshot.png",
            file_path=str(placeholder),
            file_type="image/png",
            file_size=placeholder.stat().st_size if placeholder.exists() else 0,
        )

    def _next_id(self, bucket: str) -> int:
        with self._lock:
            self._counters[bucket] += 1
            return self._counters[bucket]

    # Users -----------------------------------------------------------------
    def create_user(
        self,
        username: str,
        email: EmailStr,
        password: str,
        role: Role,
        *,
        department: Optional[str] = None,
        plant: Optional[str] = None,
        manager_id: Optional[int] = None,
        initial_password: Optional[str] = None,
    ) -> dict:
        user_id = self._next_id("users")
        user = {
            "id": user_id,
            "username": username,
            "email": email,
            "password_hash": hash_password(password),
            "role": role,
            "department": department,
            "plant": plant,
            "manager_id": manager_id,
            "initial_password": initial_password or password,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self.users[user_id] = user
        self._persist()
        return user

    def get_user_by_username(self, username: str) -> Optional[dict]:
        return next((u for u in self.users.values() if u["username"] == username), None)

    def get_user(self, user_id: int) -> Optional[dict]:
        return self.users.get(user_id)

    def update_user(self, user_id: int, **updates) -> Optional[dict]:
        user = self.users.get(user_id)
        if not user:
            return None
        user = {**user, **updates, "updated_at": datetime.utcnow()}
        self.users[user_id] = user
        self._persist()
        return user

    def list_users(self, *, role: Optional[Role] = None) -> List[dict]:
        users = list(self.users.values())
        if role:
            return [user for user in users if user["role"] == role]
        return users

    def get_user_by_id(self, user_id: int) -> Optional[dict]:
        return self.users.get(user_id)

    def delete_user(self, user_id: int) -> bool:
        """Delete a user from the system."""
        if user_id in self.users:
            del self.users[user_id]
            self._persist()
            return True
        return False

    def find_admin_for_category(self, category: str, plant: Optional[str]) -> Optional[dict]:
        admins = [
            user
            for user in self.users.values()
            if user["role"] == Role.admin and user.get("department") == category
        ]
        if not admins:
            return None
        if plant:
            plant_specific = [user for user in admins if user.get("plant") == plant]
            if plant_specific:
                return sorted(plant_specific, key=lambda user: user["created_at"])[0]
        global_admins = [user for user in admins if not user.get("plant")]
        if global_admins:
            return sorted(global_admins, key=lambda user: user["created_at"])[0]
        return sorted(admins, key=lambda user: user["created_at"])[0]

    # Complaints ------------------------------------------------------------
    def list_complaints(self) -> List[Complaint]:
        return list(self.complaints.values())

    def filter_complaints(self, **filters) -> List[Complaint]:
        data = self.list_complaints()
        for field, value in filters.items():
            if value is None:
                continue
            data = [c for c in data if getattr(c, field) == value]
        return data

    def get_complaint(self, complaint_id: int) -> Optional[Complaint]:
        return self.complaints.get(complaint_id)

    def create_complaint(
        self,
        emp_id: str,
        email: EmailStr,
        phone: str,
        complaint_text: str,
        plant: Optional[str] = None,
        kind: Optional[ComplaintKind] = None,
        category: Optional[str] = None,
        priority: Optional[Priority] = None,
    ) -> Complaint:
        complaint_id = self._next_id("complaints")
        complaint = Complaint(
            id=complaint_id,
            emp_id=emp_id,
            email=email,
            phone=phone,
            complaint_text=complaint_text,
            plant=plant,
            kind=kind or ComplaintKind.complaint,
            category=category or "Unclassified",
            priority=priority or Priority.normal,
        )
        self.complaints[complaint_id] = complaint
        self._persist()
        return complaint

    def update_complaint(self, complaint_id: int, **updates) -> Optional[Complaint]:
        complaint = self.complaints.get(complaint_id)
        if not complaint:
            return None
        complaint = complaint.model_copy(update={**updates, "updated_at": datetime.utcnow()})
        self.complaints[complaint_id] = complaint
        self._persist()
        return complaint

    def delete_complaint(self, complaint_id: int) -> bool:
        removed = self.complaints.pop(complaint_id, None)
        related_replies = [rid for rid, r in self.replies.items() if r.complaint_id == complaint_id]
        for rid in related_replies:
            self.replies.pop(rid, None)
        related_attachments = [
            aid for aid, a in self.attachments.items() if a.complaint_id == complaint_id
        ]
        for aid in related_attachments:
            self.attachments.pop(aid, None)
        if removed is not None:
            self._persist()
        return removed is not None

    # Attachments -----------------------------------------------------------
    def create_attachment(
        self,
        complaint_id: int,
        file_name: str,
        file_path: str,
        file_type: str,
        file_size: int,
        reply_id: Optional[int] = None,
    ) -> Attachment:
        attachment_id = self._next_id("attachments")
        attachment = Attachment(
            id=attachment_id,
            complaint_id=complaint_id,
            reply_id=reply_id,
            file_name=file_name,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size,
        )
        self.attachments[attachment_id] = attachment
        complaint = self.complaints.get(complaint_id)
        if complaint:
            updated_ids = complaint.attachment_ids + [attachment_id]
            self.complaints[complaint_id] = complaint.model_copy(update={"attachment_ids": updated_ids})
        self._persist()
        return attachment

    def get_attachment(self, attachment_id: int) -> Optional[Attachment]:
        return self.attachments.get(attachment_id)

    def list_attachments_for_reply(self, reply_id: int) -> List[Attachment]:
        return [attachment for attachment in self.attachments.values() if attachment.reply_id == reply_id]

    def delete_attachment(self, attachment_id: int) -> bool:
        attachment = self.attachments.pop(attachment_id, None)
        if attachment:
            complaint = self.complaints.get(attachment.complaint_id)
            if complaint:
                updated_ids = [aid for aid in complaint.attachment_ids if aid != attachment_id]
                self.complaints[complaint.id] = complaint.model_copy(update={"attachment_ids": updated_ids})
        if attachment is not None:
            self._persist()
        return attachment is not None

    # Replies ---------------------------------------------------------------
    def create_reply(
        self,
        complaint_id: int,
        admin_id: int,
        reply_text: str,
        email_sent: bool,
        email_sent_at: Optional[datetime] = None,
    ) -> Reply:
        reply_id = self._next_id("replies")
        reply = Reply(
            id=reply_id,
            complaint_id=complaint_id,
            admin_id=admin_id,
            reply_text=reply_text,
            email_sent=email_sent,
            email_sent_at=email_sent_at,
        )
        self.replies[reply_id] = reply
        # Set first_response_at on the complaint if this is the first reply
        complaint = self.complaints.get(complaint_id)
        if complaint and not getattr(complaint, "first_response_at", None):
            self.complaints[complaint_id] = complaint.model_copy(
                update={"first_response_at": reply.created_at, "updated_at": datetime.utcnow()}
            )
        self._persist()
        return reply

    def list_replies_for_complaint(self, complaint_id: int) -> List[Reply]:
        return [reply for reply in self.replies.values() if reply.complaint_id == complaint_id]

    def get_reply(self, reply_id: int) -> Optional[Reply]:
        return self.replies.get(reply_id)

    def update_reply(self, reply_id: int, **updates) -> Optional[Reply]:
        reply = self.replies.get(reply_id)
        if not reply:
            return None
        reply = reply.model_copy(update=updates)
        self.replies[reply_id] = reply
        self._persist()
        return reply

    def delete_reply(self, reply_id: int) -> bool:
        reply = self.replies.pop(reply_id, None)
        if not reply:
            return False
        attachments = [aid for aid, a in self.attachments.items() if a.reply_id == reply_id]
        for aid in attachments:
            attachment = self.attachments.pop(aid, None)
            if attachment:
                complaint = self.complaints.get(attachment.complaint_id)
                if complaint:
                    updated_ids = [rid for rid in complaint.attachment_ids if rid != attachment.id]
                    self.complaints[complaint.id] = complaint.model_copy(
                        update={"attachment_ids": updated_ids}
                    )
        self._persist()
        return True

    # Categories ------------------------------------------------------------
    def create_category(self, name: str, description: Optional[str]) -> Category:
        category_id = self._next_id("categories")
        category = Category(id=category_id, name=name, description=description)
        self.categories[category_id] = category
        self._persist()
        return category

    def get_categories(self) -> List[Category]:
        return list(self.categories.values())
    
    def delete_category(self, category_id: int) -> bool:
        """Delete a category by ID. Returns True if deleted, False if not found."""
        if category_id in self.categories:
            del self.categories[category_id]
            self._persist()
            return True
        return False
    
    def get_category_by_name(self, name: str) -> Optional[Category]:
        """Get a category by name."""
        for category in self.categories.values():
            if category.name == name:
                return category
        return None

    # Audit Logs ------------------------------------------------------------
    def log_action(
        self,
        *,
        user_id: int,
        action: str,
        entity_type: str,
        entity_id: Optional[int],
        details: Optional[Dict[str, str]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        log_id = self._next_id("audit_logs")
        log = AuditLog(
            id=log_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {},
            ip_address=ip_address,
        )
        self.audit_logs[log_id] = log
        self._persist()
        return log

    # Reports ---------------------------------------------------------------
    def create_report(
        self,
        period: ReportPeriod,
        from_date: datetime,
        to_date: datetime,
        summary: str,
        *,
        html_content: Optional[str] = None,
        recipients: Optional[List[str]] = None,
        download_url: Optional[str] = None,
        metadata: Optional[Dict[str, object]] = None,
    ) -> Report:
        report_id = self._next_id("reports")
        report = Report(
            id=report_id,
            period=period,
            from_date=from_date,
            to_date=to_date,
            summary=summary,
            html_content=html_content,
            recipients=recipients or [],
            download_url=download_url,
            metadata=metadata or {},
        )
        self.reports[report_id] = report
        self._persist()
        return report

    def get_report(self, report_id: int) -> Optional[Report]:
        return self.reports.get(report_id)

    def list_reports(self) -> List[Report]:
        return list(self.reports.values())

    def find_report_by_period(
        self,
        period: ReportPeriod,
        from_date: datetime,
        to_date: datetime,
    ) -> Optional[Report]:
        for report in self.reports.values():
            if (
                report.period == period
                and report.from_date == from_date
                and report.to_date == to_date
            ):
                return report
        return None

    def update_report(self, report_id: int, **updates) -> Optional[Report]:
        report = self.reports.get(report_id)
        if not report:
            return None
        updated = report.model_copy(update=updates)
        self.reports[report_id] = updated
        self._persist()
        return updated

    def delete_report(self, report_id: int) -> bool:
        if report_id in self.reports:
            del self.reports[report_id]
            self._persist()
            return True
        return False

    # ========== Notifications ==========
    def create_notification(
        self,
        user_id: int,
        title: str,
        message: str,
        type: str = "info",
        link: Optional[str] = None,
    ) -> Notification:
        with self._lock:
            self._counters["notifications"] += 1
            notif = Notification(
                id=self._counters["notifications"],
                user_id=user_id,
                title=title,
                message=message,
                type=type,
                link=link,
                is_read=False,
                created_at=datetime.utcnow(),
            )
            self.notifications[notif.id] = notif
            self._persist()
            return notif

    def get_notification(self, notif_id: int) -> Optional[Notification]:
        return self.notifications.get(notif_id)

    def list_notifications(
        self,
        user_id: Optional[int] = None,
        is_read: Optional[bool] = None,
        limit: int = 50
    ) -> List[Notification]:
        notifs = list(self.notifications.values())
        if user_id is not None:
            notifs = [n for n in notifs if n.user_id == user_id]
        if is_read is not None:
            notifs = [n for n in notifs if n.is_read == is_read]
        notifs = sorted(notifs, key=lambda n: n.created_at, reverse=True)
        return notifs[:limit]

    def mark_notification_read(self, notif_id: int) -> Optional[Notification]:
        notif = self.notifications.get(notif_id)
        if not notif:
            return None
        if not notif.is_read:
            updated = notif.model_copy(update={
                "is_read": True,
                "read_at": datetime.utcnow()
            })
            self.notifications[notif_id] = updated
            self._persist()
            return updated
        return notif

    def mark_all_notifications_read(self, user_id: int) -> int:
        count = 0
        for notif in self.notifications.values():
            if notif.user_id == user_id and not notif.is_read:
                updated = notif.model_copy(update={
                    "is_read": True,
                    "read_at": datetime.utcnow()
                })
                self.notifications[notif.id] = updated
                count += 1
        if count > 0:
            self._persist()
        return count

    def delete_notification(self, notif_id: int) -> bool:
        if notif_id in self.notifications:
            del self.notifications[notif_id]
            self._persist()
            return True
        return False


db = InMemoryDB()
