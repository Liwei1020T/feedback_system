from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from .models import (
    Complaint,
    ComplaintKind,
    ComplaintStatus,
    Priority,
    Report,
    ReportPeriod,
    Reply,
    Role,
    TrendData,
    CategoryMetrics,
    AdminPerformance,
    PredictiveInsights,
    RootCauseInsight,
    DepartmentMetrics,
)


class LoginRequest(BaseModel):
    username: str
    password: str


class UserSummary(BaseModel):
    id: int
    username: str
    role: Role
    department: Optional[str] = None
    plant: Optional[str] = None


class UserResponse(BaseModel):
    """Full user profile response including preferences."""
    id: int
    username: str
    email: EmailStr
    role: Role
    department: Optional[str] = None
    plant: Optional[str] = None
    created_at: datetime
    preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 0
    user: UserSummary


class RefreshRequest(BaseModel):
    refresh_token: str


class ComplaintCreate(BaseModel):
    emp_id: str
    email: EmailStr
    phone: str
    complaint_text: str = Field(min_length=1, max_length=5000)
    plant: Optional[str] = None
    kind: Optional[ComplaintKind] = None
    category: Optional[str] = None
    priority: Optional[Priority] = None

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: EmailStr) -> EmailStr:
        # Return a normalized string; Pydantic will validate/cast to EmailStr
        return str(v).strip().lower()  # type: ignore[return-value]

    @field_validator("emp_id", "phone", "complaint_text", "plant")
    @classmethod
    def _trim_text(cls, v: str | None):
        if v is None:
            return v
        return v.strip()


class ComplaintUpdate(BaseModel):
    kind: Optional[ComplaintKind] = None
    category: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None


class ComplaintResponse(Complaint):
    """Response model mirroring Complaint domain model."""

    class Config:
        from_attributes = True


class ReplyCreate(BaseModel):
    complaint_id: int
    admin_id: int
    reply_text: str = Field(min_length=1, max_length=5000)
    send_email: bool = True

    @field_validator("reply_text")
    @classmethod
    def _trim_reply(cls, v: str) -> str:
        return v.strip()


class ReplyUpdate(BaseModel):
    reply_text: Optional[str] = None
    send_email: Optional[bool] = None


class ClassificationResponse(BaseModel):
    kind: ComplaintKind
    kind_confidence: float
    category: str
    priority: Priority
    confidence: float
    reasoning: str


class SummaryRequest(BaseModel):
    period: ReportPeriod = ReportPeriod.weekly


class ComplaintKeyIssue(BaseModel):
    complaint_id: int
    kind: ComplaintKind
    category: str
    status: ComplaintStatus
    key_issue: str
    probability: float = Field(ge=0.0, le=1.0)


class SummaryResponse(BaseModel):
    summary: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, str] = Field(default_factory=dict)
    prevention_recommendations: List[str] = Field(default_factory=list)
    focus_areas: List[str] = Field(default_factory=list)
    key_issues: List[ComplaintKeyIssue] = Field(default_factory=list)


class ComplaintSummaryResponse(BaseModel):
    complaint_id: int
    category: str
    probability: float = Field(ge=0.0, le=1.0)
    summary: str


class DashboardStats(BaseModel):
    total_complaints: int
    total_feedback: int
    resolved: int
    pending: int
    in_progress: int
    unclassified: int
    by_kind: Dict[str, int]
    by_category: Dict[str, int]


class KpisResponse(BaseModel):
    """KPI metrics for SuperAdmin dashboard."""
    total_complaints: int
    resolution_rate: float          # 0-100 percentage
    urgent_cases: int
    avg_response_time_hours: float
    sla_compliance_rate: float      # 0-100 percentage


class SentimentMetrics(BaseModel):
    """Sentiment analysis metrics."""
    overall_score: float            # 0-100
    positive_count: int
    neutral_count: int
    negative_count: int
    trend: List[Dict[str, Any]] = Field(default_factory=list)


class RootCauseInsightResponse(RootCauseInsight):
    """Root cause analysis item."""

    class Config:
        from_attributes = True


class RootCauseResponse(BaseModel):
    """Root cause analysis response."""
    root_causes: List[RootCauseInsightResponse]
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    source: str = "ai"


class AIRecommendation(BaseModel):
    """AI-powered recommendation."""
    id: str
    title: str
    description: str
    priority: str                   # "high" | "medium" | "low"
    impact: str
    estimated_effort: str
    category: str
    confidence: float = Field(ge=0.0, le=1.0)
    solution_steps: List[str] = Field(default_factory=list)


class RecommendationsResponse(BaseModel):
    """AI recommendations response."""
    recommendations: List[AIRecommendation]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class TrendPoint(BaseModel):
    period: str
    total: int
    resolved: int


class TrendResponse(BaseModel):
    points: List[TrendPoint]


class AssistanceResponse(BaseModel):
    recommended_actions: List[str]
    suggested_reply: str
    tone: str
    source: str


class CategorySuggestion(BaseModel):
    category: str
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    keyword_hits: int


class CategorySuggestionResponse(BaseModel):
    suggestions: List[CategorySuggestion]


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Role = Role.user


class AdminCreateRequest(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=10)
    department: Optional[str] = None
    plant: Optional[str] = None

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: EmailStr) -> str:
        return str(v).strip().lower()

    @field_validator("username")
    @classmethod
    def _trim_username(cls, v: str) -> str:
        return v.strip()


class AdminResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: Role
    department: Optional[str] = None
    plant: Optional[str] = None
    created_at: datetime
    password: Optional[str] = None


class EmployeeCreateRequest(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=8)
    department: Optional[str] = None
    plant: Optional[str] = None

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: EmailStr) -> str:
        return str(v).strip().lower()

    @field_validator("username")
    @classmethod
    def _trim_username(cls, v: str) -> str:
        return v.strip()


class EmployeeCreateByAdminRequest(BaseModel):
    """Request to create an employee reporting to an admin."""
    username: str
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: EmailStr) -> str:
        return str(v).strip().lower()

    @field_validator("username")
    @classmethod
    def _trim_username(cls, v: str) -> str:
        return v.strip()


class EmployeeResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: Role
    department: Optional[str] = None
    plant: Optional[str] = None
    manager_id: Optional[int] = None  # The admin/manager they report to
    created_at: datetime
    password: Optional[str] = None


class DepartmentInfo(BaseModel):
    name: str
    plant: str
    admin_count: int
    employee_count: int
    total_complaints: int
    pending_complaints: int
    resolved_complaints: int


class DepartmentCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def _validate_name(cls, v: str) -> str:
        name = v.strip()
        if not name:
            raise ValueError("Department name cannot be empty")
        return name


class DepartmentDetailResponse(BaseModel):
    department: str
    plant: str
    admins: List[AdminResponse]
    employees: List[EmployeeResponse]
    stats: Dict[str, Any]


class ReportResponse(Report):
    pass


# AI Insights Schemas
class AIInsightsResponse(BaseModel):
    """Response for AI insights."""
    sentiment: Dict[str, Any]
    similar_complaints: List[Dict[str, Any]]
    resolution_template: str
    estimated_resolution_time: int
    tags: List[str]
    analyzed_at: datetime


# Advanced Analytics Schemas
class AdvancedAnalyticsResponse(BaseModel):
    """Response for advanced analytics."""
    overview: Dict[str, float]
    trends: List[TrendData]
    category_metrics: List[CategoryMetrics]
    admin_performance: List[AdminPerformance]
    predictive_insights: Optional[PredictiveInsights] = None
    generated_at: datetime
    
    class Config:
        from_attributes = True


class UserStatsResponse(BaseModel):
    """Per-user quick stats for profile page."""
    complaints_handled: int
    resolution_rate: float
    avg_response_time_hours: float


class ProfilePreferences(BaseModel):
    email_notifications: bool = True
    browser_notifications: bool = True
    weekly_summary: bool = False


class FeedbackFilterSettings(BaseModel):
    kind: Optional[ComplaintKind] = None
    status: Optional[ComplaintStatus] = None
    priority: Optional[Priority] = None
    plant: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None


class FeedbackPreset(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    filters: FeedbackFilterSettings


class FeedbackPresetCollection(BaseModel):
    presets: List[FeedbackPreset] = Field(default_factory=list)


class DepartmentStat(DepartmentMetrics):
    class Config:
        from_attributes = True


class DepartmentStatsResponse(BaseModel):
    items: List[DepartmentStat]


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class ComplaintListResponse(BaseModel):
    items: List[Complaint]
    meta: PaginationMeta


class ReplyListResponse(BaseModel):
    items: List[Reply]
    meta: PaginationMeta


# Internal Notes Schemas
class InternalNoteCreate(BaseModel):
    """Request to create an internal note."""
    content: str = Field(..., min_length=1, max_length=5000)
    attachments: Optional[List[int]] = []


class InternalNoteUpdate(BaseModel):
    """Request to update an internal note."""
    content: str = Field(..., min_length=1, max_length=5000)


class InternalNoteResponse(BaseModel):
    """Response for an internal note."""
    id: int
    complaint_id: int
    author_id: int
    author_name: str
    content: str
    mentions: List[str]
    created_at: datetime
    updated_at: datetime
    is_pinned: bool
    attachments: List[int]
    
    class Config:
        from_attributes = True


# Multi-Channel Integration Schemas
class WebhookComplaintCreate(BaseModel):
    """Generic webhook complaint payload."""
    title: str = ""
    description: str
    user_id: str
    source_system: str
    external_id: str


# Notification Schemas
class NotificationCreate(BaseModel):
    """Request to create a notification."""
    user_id: int
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    type: str = "info"  # info, warning, error, success
    link: Optional[str] = None


class NotificationResponse(BaseModel):
    """Response for a notification."""
    id: int
    user_id: int
    title: str
    message: str
    type: str
    link: Optional[str]
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]
    
    class Config:
        from_attributes = True
