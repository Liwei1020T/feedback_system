from __future__ import annotations

import json
import copy
import logging
import re
import time
from typing import Optional
from logging.config import dictConfig
from pathlib import Path
import uuid

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

from .config import settings
from .routers import (
    admins, analytics, auth, complaints, files, logs, replies, reports,
    notes, ai_insights, advanced_analytics, profile, departments, chatbot,
    ai_recommendations, notifications
)
from .services.weekly_reports import weekly_report_service
from .services.email import email_service
from .security import verify_password, hash_password
from .datastore import db

# ----------------------------------------------------------------------------
# Logging configuration
# ----------------------------------------------------------------------------
LOG_DIR = Path("logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

REDACTED = "***REDACTED***"

_SENSITIVE_KEY_VALUE_RE = re.compile(
    r"(?P<key>password|pass|token|access_token|refresh_token|authorization|api[_-]?key)"
    r"(?P<sep>\"?\s*[:=]\s*)"
    r"(?P<value>[^\"',;\s]+)",
    re.IGNORECASE,
)

_SENSITIVE_BEARER_RE = re.compile(r"(Bearer\s+)([A-Za-z0-9\-._~+/]+=*)", re.IGNORECASE)


def _redact_string(value: str) -> str:
    masked = _SENSITIVE_KEY_VALUE_RE.sub(lambda m: f"{m.group('key')}{m.group('sep')}{REDACTED}", value)
    masked = _SENSITIVE_BEARER_RE.sub(lambda m: f"{m.group(1)}{REDACTED}", masked)
    return masked


def _redact_value(value):
    if isinstance(value, str):
        return _redact_string(value)
    if isinstance(value, (list, tuple)):
        return type(value)(_redact_value(v) for v in value)
    if isinstance(value, dict):
        return {key: _redact_value(val) for key, val in value.items()}
    return value


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:  # type: ignore[override]
        payload = {
            "ts": self.formatTime(record, datefmt="%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": _redact_string(record.getMessage()),
        }
        # merge extra if present
        for key in ("request_id", "user_id", "method", "path", "status", "latency_ms", "remote_ip"):
            if hasattr(record, key):
                payload[key] = _redact_value(getattr(record, key))
        return json.dumps(payload, ensure_ascii=False)


class RedactingTextFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:  # type: ignore[override]
        record_copy = copy.copy(record)
        if isinstance(record_copy.msg, str):
            record_copy.msg = _redact_string(record_copy.msg)
        if record_copy.args:
            record_copy.args = tuple(_redact_value(arg) for arg in record_copy.args)
        for key in ("request_id", "user_id", "method", "path", "status", "latency_ms", "remote_ip"):
            if hasattr(record_copy, key):
                setattr(record_copy, key, _redact_value(getattr(record_copy, key)))
        return super().format(record_copy)


# Global logger variable - will be initialized after app creation
_logger = None

def get_logger():
    """Get or create the logger instance"""
    global _logger
    if _logger is None:
        _logger = logging.getLogger(__name__)
    return _logger

def configure_logging():
    """Configure logging system"""
    _formatter_name = "json" if settings.log_format == "json" else "text"
    
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {
                    "()": JsonFormatter,
                },
                "text": {
                    "()": RedactingTextFormatter,
                    "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                },
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": _formatter_name,
                    "level": "INFO",
                },
                "file": {
                    "class": "logging.FileHandler",
                    "formatter": _formatter_name,
                    "level": "INFO",
                    "filename": str(LOG_DIR / "app.log"),
                    "encoding": "utf-8",
                },
            },
            "root": {
                "handlers": ["console", "file"],
                "level": "INFO",
            },
        }
    )
    
    logger = get_logger()
    logger.info(
        "Logging initialized. Writing to %s",
        LOG_DIR / "app.log",
        extra={
            "log_format": settings.log_format,
            "request_id_header": settings.request_id_header,
        },
    )
    logger.info("CORS allow origins: %s", settings.cors_allow_origins)

app = FastAPI(title=settings.app_name, version="1.0.0")

# Configure logging after app creation
configure_logging()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admins.router)
app.include_router(departments.router)
app.include_router(complaints.router)
app.include_router(replies.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(files.router)
app.include_router(logs.router)
app.include_router(notes.router)
app.include_router(ai_insights.router)
app.include_router(ai_recommendations.router)
app.include_router(advanced_analytics.router)
app.include_router(profile.router)
app.include_router(chatbot.router)
app.include_router(notifications.router)

scheduler: Optional[BackgroundScheduler] = None


def _create_scheduler() -> BackgroundScheduler:
    try:
        return BackgroundScheduler(timezone=settings.report_timezone)
    except Exception:  # pragma: no cover - invalid timezone fallback
        get_logger().warning(
            "Invalid REPORT_TIMEZONE=%s; defaulting scheduler to UTC",
            settings.report_timezone,
        )
        return BackgroundScheduler(timezone="UTC")


def _schedule_weekly_report_job(instance: BackgroundScheduler) -> None:
    instance.remove_all_jobs()
    if settings.report_schedule_cron:
        try:
            trigger = CronTrigger.from_crontab(
                settings.report_schedule_cron,
                timezone=instance.timezone,
            )
        except ValueError as exc:
            get_logger().error(
                "Invalid REPORT_SCHEDULE_CRON=%s (%s). Falling back to day/time configuration.",
                settings.report_schedule_cron,
                exc,
            )
            trigger = None
        else:
            instance.add_job(
                weekly_report_service.generate_and_send_weekly_reports,
                trigger=trigger,
                id="weekly_report_job",
                replace_existing=True,
            )
            get_logger().info(
                "Weekly report job scheduled via cron",
                extra={
                    "cron": settings.report_schedule_cron,
                    "timezone": str(instance.timezone),
                },
            )
            return

    hour, minute = weekly_report_service.get_schedule_time()
    trigger = CronTrigger(
        day_of_week=settings.report_day_of_week,
        hour=hour,
        minute=minute,
        timezone=instance.timezone,
    )
    instance.add_job(
        weekly_report_service.generate_and_send_weekly_reports,
        trigger=trigger,
        id="weekly_report_job",
        replace_existing=True,
    )
    get_logger().info(
        "Weekly report job scheduled",
        extra={
            "day_of_week": settings.report_day_of_week,
            "hour": hour,
            "minute": minute,
            "timezone": str(instance.timezone),
        },
    )


def _ensure_seed_user_passwords() -> None:
    """Dev safety: ensure seeded users' password hashes validate.

    If a user record contains an `initial_password` but the stored hash does not
    verify (e.g., after migrating hash algorithms), re-hash the initial password
    with bcrypt so the account remains usable.
    """
    repaired = 0
    for user in db.list_users():
        initial = user.get("initial_password")
        pwh = user.get("password_hash")
        if not initial or not isinstance(pwh, str):
            continue
        try:
            ok = verify_password(initial, pwh)
        except Exception:
            ok = False
        if not ok:
            try:
                new_hash = hash_password(initial)
                db.update_user(user["id"], password_hash=new_hash)
                repaired += 1
            except Exception:
                pass
    if repaired:
        get_logger().warning("Repaired %s user password hash(es) from initial_password", repaired)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "environment": settings.environment}


@app.on_event("startup")
async def start_background_jobs() -> None:
    global scheduler
    _ensure_seed_user_passwords()
    scheduler = _create_scheduler()
    _schedule_weekly_report_job(scheduler)
    scheduler.start()
    get_logger().info(
        "Background scheduler started",
        extra={
            "timezone": str(scheduler.timezone),
            "jobs": [job.id for job in scheduler.get_jobs()],
        },
    )


@app.on_event("shutdown")
async def stop_background_jobs() -> None:
    global scheduler
    if scheduler:
        scheduler.shutdown(wait=False)
        get_logger().info("Background scheduler stopped.")


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    header_name = settings.request_id_header
    request_id = request.headers.get(header_name) or str(uuid.uuid4())
    request.state.request_id = request_id
    start = time.perf_counter()
    response = await call_next(request)
    latency_ms = int((time.perf_counter() - start) * 1000)
    status_code = getattr(response, "status_code", None)
    get_logger().info(
        "request",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status": status_code,
            "latency_ms": latency_ms,
            "remote_ip": request.client.host if request.client else None,
        },
    )
    response.headers[header_name] = request_id
    return response


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", None) or str(uuid.uuid4())
    # Let FastAPI/Starlette handle HTTPException elsewhere; this is a fallback.
    # Log full stack trace for correlation
    logger = get_logger()
    logger.exception(
        "unhandled_error: %s",
        repr(exc),
        extra={"request_id": request_id, "path": request.url.path},
    )
    content = {"code": "internal_error", "message": "An unexpected error occurred.", "correlation_id": request_id}
    return JSONResponse(
        status_code=500,
        content=content,
        headers={settings.request_id_header: request_id},
    )


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", None) or str(uuid.uuid4())
    get_logger().warning(
        "http_error",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "status": exc.status_code,
        },
    )
    content = {"code": str(exc.status_code), "message": exc.detail or "Request failed", "correlation_id": request_id}
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers={settings.request_id_header: request_id},
    )
