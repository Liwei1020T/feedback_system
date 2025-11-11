from __future__ import annotations

import logging
import smtplib
import ssl
from dataclasses import dataclass, field
from email.message import EmailMessage as MIMEEmailMessage
from typing import Dict, Iterable, List, Optional
from datetime import datetime, timedelta

from ..config import settings

logger = logging.getLogger(__name__)


@dataclass
class EmailPayload:
    to: Iterable[str]
    subject: str
    html: Optional[str] = None
    text: Optional[str] = None
    headers: Dict[str, str] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not isinstance(self.to, (list, tuple)):
            self.to = tuple(self.to)
        if not self.html and not self.text:
            raise ValueError("EmailPayload requires at least html or text content.")

    def __repr__(self) -> str:
        recipients = list(self.to)
        return (
            f"EmailPayload(to={recipients!r}, subject={self.subject!r}, "
            f"has_html={bool(self.html)}, has_text={bool(self.text)})"
        )


@dataclass
class QueuedEmail:
    payload: EmailPayload
    attempts: int = 0
    last_error: Optional[str] = None
    next_run: datetime = field(default_factory=datetime.utcnow)


class EmailService:
    """SMTP-backed email service with graceful fallback to logging."""

    def __init__(self) -> None:
        self._host = settings.smtp_host
        self._port = settings.smtp_port
        self._user = settings.smtp_user
        self._password = settings.smtp_pass
        self._from = settings.email_from
        self._enabled = bool(self._host and self._port and self._user and self._password)
        self._queue: List[QueuedEmail] = []

    def send(self, message: EmailPayload) -> bool:
        if not self._enabled:
            logger.info(
                "Email skipped; SMTP credentials missing.",
                extra={"mail_to": list(message.to), "mail_subject": message.subject},
            )
            return False

        mail = MIMEEmailMessage()
        mail["Subject"] = message.subject
        mail["From"] = self._from
        mail["To"] = ", ".join(message.to)
        for key, value in message.headers.items():
            mail[key] = value

        if message.text:
            mail.set_content(message.text)
        else:
            mail.set_content("HTML email requires an HTML capable client.")

        if message.html:
            mail.add_alternative(message.html, subtype="html")

        try:
            if self._port == 465:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(self._host, self._port, context=context) as server:
                    server.login(self._user, self._password)
                    server.send_message(mail)
            else:
                with smtplib.SMTP(self._host, self._port) as server:
                    server.ehlo()
                    try:
                        server.starttls(context=ssl.create_default_context())
                        server.ehlo()
                    except smtplib.SMTPException:
                        logger.debug("SMTP server does not support STARTTLS; continuing without TLS.")
                    server.login(self._user, self._password)
                    server.send_message(mail)
            logger.info(
                "Email sent",
                extra={
                    "mail_host": self._host,
                    "mail_port": self._port,
                    "mail_to": list(message.to),
                    "mail_subject": message.subject,
                },
            )
            return True
        except Exception as exc:  # pragma: no cover - runtime SMTP failure path
            logger.error("SMTP send failed", extra={"error": str(exc)})
            return False

    def send_with_retry(self, message: EmailPayload) -> bool:
        success = self.send(message)
        if not success:
            self.enqueue_retry(message, error="Initial send failed")
        return success

    def enqueue_retry(self, message: EmailPayload, error: Optional[str] = None) -> None:
        queued = QueuedEmail(payload=message, attempts=1, last_error=error)
        queued.next_run = datetime.utcnow() + timedelta(minutes=1)
        self._queue.append(queued)
        logger.warning(
            "Email queued for retry",
            extra={"mail_to": list(message.to), "mail_subject": message.subject, "error": error},
        )

    def process_queue(self) -> None:
        if not self._queue:
            return
        remaining: List[QueuedEmail] = []
        for item in self._queue:
            if datetime.utcnow() < item.next_run:
                remaining.append(item)
                continue
            success = self.send(item.payload)
            if success:
                logger.info(
                    "Email retry succeeded",
                    extra={"mail_to": list(item.payload.to), "attempts": item.attempts + 1},
                )
                continue
            item.attempts += 1
            item.last_error = "Retry failed"
            backoff_minutes = min(2 ** item.attempts, 60)
            item.next_run = datetime.utcnow() + timedelta(minutes=backoff_minutes)
            logger.warning(
                "Email retry scheduled",
                extra={
                    "mail_to": list(item.payload.to),
                    "attempts": item.attempts,
                    "next_run": item.next_run.isoformat(),
                },
            )
            if item.attempts < 5:
                remaining.append(item)
            else:
                logger.error(
                    "Email delivery abandoned after retries",
                    extra={"mail_to": list(item.payload.to), "subject": item.payload.subject},
                )
        self._queue = remaining

    def pending_retry_count(self) -> int:
        return len(self._queue)

    def next_retry_eta(self) -> Optional[datetime]:
        if not self._queue:
            return None
        return min(item.next_run for item in self._queue)


email_service = EmailService()
