from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Sequence, Set
from zoneinfo import ZoneInfo

from ..config import settings
from ..datastore import db
from ..models import Complaint, ComplaintStatus, ReportPeriod
from .advanced_analytics import advanced_analytics_service
from .email import EmailPayload, email_service
from .email_templates import render_email

logger = logging.getLogger(__name__)


@dataclass
class WeeklyReportContext:
    period_start: datetime
    period_end: datetime
    metrics: Sequence
    open_count: int
    closed_count: int
    new_count: int


class WeeklyReportService:
    """Generate and deliver weekly operational reports."""

    def __init__(self) -> None:
        try:
            self._timezone = ZoneInfo(settings.report_timezone)
        except Exception:  # pragma: no cover - fallback for misconfigured tz
            logger.warning("Invalid REPORT_TIMEZONE=%s; defaulting to UTC", settings.report_timezone)
            self._timezone = ZoneInfo("UTC")

    def _parse_report_time(self) -> tuple[int, int]:
        hour, minute = 8, 0
        try:
            parts = settings.report_time.split(":")
            hour = int(parts[0])
            minute = int(parts[1]) if len(parts) > 1 else 0
        except (ValueError, IndexError):
            logger.warning("Invalid REPORT_TIME=%s; using 08:00", settings.report_time)
        return hour, minute

    def get_schedule_time(self) -> tuple[int, int]:
        return self._parse_report_time()

    def _period_bounds(self, reference: datetime | None = None) -> tuple[datetime, datetime]:
        ref = reference or datetime.utcnow()
        localized = ref.astimezone(self._timezone).replace(second=0, microsecond=0)
        current_weekday = localized.weekday()  # Monday=0
        current_week_start = localized - timedelta(days=current_weekday)
        current_week_start = current_week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        previous_week_end = current_week_start
        previous_week_start = previous_week_end - timedelta(days=7)
        # Persist datetimes as naive UTC to align with datastore conventions
        start_utc = previous_week_start.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
        end_utc = previous_week_end.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
        return start_utc, end_utc

    def _complaints_in_period(self, start: datetime, end: datetime) -> List[Complaint]:
        complaints = db.list_complaints()
        return [c for c in complaints if start <= c.created_at < end]

    def _context(self, start: datetime, end: datetime) -> WeeklyReportContext:
        complaints = self._complaints_in_period(start, end)
        metrics = advanced_analytics_service.calculate_department_stats(
            complaints,
            departments=None,
            audit_logs=[
                log for log in db.audit_logs.values() if log.created_at and start <= log.created_at < end
            ],
        )
        open_count = len([c for c in complaints if c.status != ComplaintStatus.resolved])
        closed_count = len([c for c in complaints if c.status == ComplaintStatus.resolved])
        new_count = len(complaints)
        return WeeklyReportContext(
            period_start=start,
            period_end=end,
            metrics=metrics,
            open_count=open_count,
            closed_count=closed_count,
            new_count=new_count,
        )

    def _collect_recipients(self, metrics: Sequence) -> List[str]:
        recipients: Set[str] = set(settings.report_recipients_default)
        for metric in metrics:
            override_key = settings.report_recipient_overrides.get(metric.department)
            if override_key:
                recipients.update(override_key)
        return sorted(recipients)

    def _send_email(self, recipients: Sequence[str], subject: str, html_body: str, text_body: str) -> bool:
        if not recipients:
            logger.info("Skipping weekly report email; no recipients configured.")
            return False

        payload = EmailPayload(
            to=recipients,
            subject=subject,
            html=html_body,
            text=text_body,
        )
        success = email_service.send(payload)
        if not success:
            email_service.enqueue_retry(payload, error="Weekly report initial send failed")
        return success

    def generate_and_send_weekly_reports(self, reference: datetime | None = None) -> None:
        hour, minute = self._parse_report_time()
        logger.info(
            "Weekly report job triggered",
            extra={
                "report_day_of_week": settings.report_day_of_week,
                "report_time": f"{hour:02d}:{minute:02d}",
            },
        )
        start, end = self._period_bounds(reference)
        existing = db.find_report_by_period(ReportPeriod.weekly, start, end)
        if existing:
            logger.info(
                "Weekly report already generated for %s → %s (report_id=%s); skipping.",
                start,
                end,
                existing.id,
            )
            return

        context = self._context(start, end)
        email_doc = render_email(
            "weekly_report",
            {
                "subject": f"Weekly Complaint Report ({start:%Y-%m-%d} → {end:%Y-%m-%d})",
                "period_label": f"{start:%Y-%m-%d} → {end:%Y-%m-%d}",
                "metrics": context.metrics,
                "new_count": context.new_count,
                "closed_count": context.closed_count,
                "open_count": context.open_count,
            },
        )
        recipients = self._collect_recipients(context.metrics)
        sent = self._send_email(recipients, email_doc.subject, email_doc.html, email_doc.text)
        report = db.create_report(
            period=ReportPeriod.weekly,
            from_date=start,
            to_date=end,
            summary=email_doc.text,
            html_content=email_doc.html,
            recipients=recipients,
        )
        logger.info(
            "Weekly report generated",
            extra={
                "report_id": report.id,
                "period_start": start.isoformat(),
                "period_end": end.isoformat(),
                "email_sent": sent,
                "recipient_count": len(recipients),
            },
        )


weekly_report_service = WeeklyReportService()
