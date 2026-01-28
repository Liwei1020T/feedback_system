from __future__ import annotations

import os
from pathlib import Path
from typing import Dict, List, Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load environment variables from a local .env file if present.
load_dotenv()


class Settings(BaseModel):
    """Central configuration using environment variables with sane defaults."""

    app_name: str = Field(
    default="AI Feedback Management System API", description="Human readable service name."
    )
    environment: str = Field(
        default_factory=lambda: os.getenv("NODE_ENV", "development"),
        description="Deployment environment indicator.",
    )
    api_prefix: str = "/api"

    # Security
    jwt_secret: str = Field(
        default_factory=lambda: os.getenv("JWT_SECRET", "dev-secret-key"),
        description="Secret used for token signing.",
    )
    token_exp_minutes: int = Field(
        default_factory=lambda: int(os.getenv("JWT_EXPIRES_IN_MINUTES", "30")),
        description="Access token expiration window.",
    )
    refresh_token_exp_minutes: int = Field(
        default_factory=lambda: int(os.getenv("REFRESH_TOKEN_EXPIRES_IN_MINUTES", "10080")),
        description="Refresh token expiration window.",
    )

    # AI / Email
    groq_api_key: Optional[str] = os.getenv("GROQ_API_KEY")
    groq_model: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    email_from: str = os.getenv("EMAIL_FROM", "noreply@company.com")
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.sendgrid.net")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: Optional[str] = os.getenv("SMTP_USER")
    smtp_pass: Optional[str] = os.getenv("SMTP_PASS")

    # Files
    upload_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("UPLOAD_DIR", "./uploads")).resolve()
    )
    allowed_file_types: List[str] = Field(
        default_factory=lambda: os.getenv(
            "ALLOWED_FILE_TYPES", "image/jpeg,image/png,video/mp4,application/pdf"
        ).split(",")
    )
    max_file_size: int = int(os.getenv("MAX_FILE_SIZE", str(10 * 1024 * 1024)))
    data_store_path: Path = Field(
        default_factory=lambda: Path(os.getenv("DATA_STORE_PATH", "./data/db.json")).resolve()
    )
    supported_plants: List[str] = Field(
        default_factory=lambda: [
            plant.strip() for plant in os.getenv("PLANTS", "P1,P2,BK").split(",") if plant.strip()
        ]
    )
    cors_allow_origins: List[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173").split(",")
            if origin.strip()
        ]
    )
    cors_allow_origin_regex: Optional[str] = Field(
        default_factory=lambda: os.getenv("CORS_ALLOW_ORIGIN_REGEX")
    )
    log_format: str = Field(
        default_factory=lambda: os.getenv("LOG_FORMAT", "json").strip().lower() or "json"
    )
    request_id_header: str = Field(
        default_factory=lambda: os.getenv("REQUEST_ID_HEADER", "X-Request-ID").strip() or "X-Request-ID"
    )
    sla_hours_normal: int = Field(
        default_factory=lambda: int(os.getenv("SLA_HOURS_NORMAL", "72"))
    )
    sla_hours_urgent: int = Field(
        default_factory=lambda: int(os.getenv("SLA_HOURS_URGENT", "24"))
    )
    report_schedule_cron: Optional[str] = Field(
        default_factory=lambda: os.getenv("REPORT_SCHEDULE_CRON")
    )
    report_day_of_week: str = Field(
        default_factory=lambda: os.getenv("REPORT_DAY", "mon").strip().lower()
    )
    report_time: str = Field(
        default_factory=lambda: os.getenv("REPORT_TIME", "08:00").strip()
    )
    report_timezone: str = Field(
        default_factory=lambda: os.getenv("REPORT_TIMEZONE", "UTC").strip()
    )
    report_recipients_default: List[str] = Field(
        default_factory=lambda: [
            email.strip()
            for email in os.getenv("REPORT_RECIPIENTS_DEFAULT", "").split(",")
            if email.strip()
        ]
    )
    report_recipient_overrides: Dict[str, List[str]] = Field(default_factory=dict)

    class Config:
        arbitrary_types_allowed = True

    @classmethod
    def load(cls) -> "Settings":
        settings = cls()
        if settings.log_format not in {"json", "text"}:
            settings.log_format = "json"
        if settings.sla_hours_normal <= 0:
            settings.sla_hours_normal = 72
        if settings.sla_hours_urgent <= 0:
            settings.sla_hours_urgent = 24
        if ":" not in settings.report_time:
            settings.report_time = "08:00"
        overrides: Dict[str, List[str]] = {}
        for key, value in os.environ.items():
            if key.startswith("REPORT_RECIPIENTS_") and key != "REPORT_RECIPIENTS_DEFAULT":
                department = key.replace("REPORT_RECIPIENTS_", "").strip()
                if department:
                    emails = [
                        email.strip()
                        for email in value.split(",")
                        if email.strip()
                    ]
                    if emails:
                        overrides[department] = emails
        settings.report_recipient_overrides = overrides
        settings.upload_dir.mkdir(parents=True, exist_ok=True)
        settings.data_store_path.parent.mkdir(parents=True, exist_ok=True)
        return settings


settings = Settings.load()
