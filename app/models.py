from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class Role(str, Enum):
    admin = "admin"
    super_admin = "super_admin"
    employee = "employee"  # Employees help admins manage feedback within their department
    user = "user"


class User(BaseModel):
    id: int
    username: str
    email: EmailStr
    password_hash: str
    role: Role = Role.user
    department: Optional[str] = None
    plant: Optional[str] = None
    manager_id: Optional[int] = None  # For employees: ID of their admin/manager
    initial_password: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ComplaintStatus(str, Enum):
    pending = "Pending"
    in_progress = "In Progress"
    resolved = "Resolved"


class Priority(str, Enum):
    normal = "normal"
    urgent = "urgent"


class ComplaintKind(str, Enum):
    complaint = "complaint"
    feedback = "feedback"


class SentimentAnalysis(BaseModel):
    """Sentiment analysis results from AI."""
    sentiment: str = Field(..., description="positive, neutral, or negative")
    emotion: str = Field(..., description="angry, frustrated, disappointed, calm, satisfied")
    urgency_score: int = Field(..., ge=0, le=100, description="0-100 urgency rating")
    confidence: float = Field(..., ge=0, le=1, description="AI confidence level")
    reasoning: str = Field(..., description="Why AI assigned this sentiment")


class SimilarComplaint(BaseModel):
    """Reference to a similar complaint."""
    complaint_id: int
    similarity_score: float = Field(..., ge=0, le=1)
    matched_keywords: List[str]
    resolution_summary: Optional[str] = None


class AIInsights(BaseModel):
    """Extended AI insights for a complaint."""
    sentiment: SentimentAnalysis
    similar_complaints: List[SimilarComplaint] = []
    suggested_category: str
    suggested_priority: str
    suggested_assignee: Optional[int] = None
    resolution_template: Optional[str] = None
    estimated_resolution_time: Optional[int] = None  # in hours
    tags: List[str] = []
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)


class ChannelMetadata(BaseModel):
    """Metadata specific to the source channel."""
    # Email channel
    email_from: Optional[str] = None
    email_subject: Optional[str] = None
    email_message_id: Optional[str] = None
    
    # Social media
    platform: Optional[str] = None  # twitter, facebook, instagram
    post_id: Optional[str] = None
    author_handle: Optional[str] = None
    public_url: Optional[str] = None
    
    # Chat widget
    session_id: Optional[str] = None
    visitor_ip: Optional[str] = None
    browser_info: Optional[str] = None
    
    # API webhook
    webhook_source: Optional[str] = None
    external_id: Optional[str] = None
    api_key_id: Optional[str] = None


class InternalNote(BaseModel):
    """Internal notes for team collaboration (not visible to customers)."""
    id: int
    complaint_id: int
    author_id: int
    author_name: str
    content: str
    mentions: List[str] = []  # User IDs mentioned with @
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_pinned: bool = False  # Pin important notes to top
    attachments: List[int] = Field(default_factory=list)  # Attachment IDs


class Complaint(BaseModel):
    id: int
    emp_id: str
    email: EmailStr
    phone: str
    complaint_text: str
    kind: ComplaintKind = ComplaintKind.complaint
    category: str = "Unclassified"
    plant: Optional[str] = None
    priority: Priority = Priority.normal
    status: ComplaintStatus = ComplaintStatus.pending
    ai_confidence: Optional[float] = None
    kind_confidence: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    assigned_to: Optional[int] = None
    assignment_source: Optional[str] = None
    assignment_notes: Optional[str] = None
    attachment_ids: List[int] = Field(default_factory=list)
    
    # AI enhancements
    ai_insights: Optional[AIInsights] = None
    sentiment_history: List[SentimentAnalysis] = Field(default_factory=list)
    
    # Multi-channel
    source_channel: str = "web"  # web, email, chat, social, api
    source_metadata: ChannelMetadata = Field(default_factory=ChannelMetadata)
    
    # Analytics
    first_response_at: Optional[datetime] = None
    resolution_time_hours: Optional[float] = None
    
    # Internal collaboration
    internal_notes: List[InternalNote] = Field(default_factory=list)
    watchers: List[int] = Field(default_factory=list)  # User IDs watching for updates


class Attachment(BaseModel):
    id: int
    complaint_id: int
    reply_id: Optional[int] = None
    file_name: str
    file_path: str
    file_type: str
    file_size: int
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class Reply(BaseModel):
    id: int
    complaint_id: int
    admin_id: int
    reply_text: str
    email_sent: bool = False
    email_sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Category(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AuditLog(BaseModel):
    id: int
    user_id: int
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Dict[str, str] = Field(default_factory=dict)
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReportPeriod(str, Enum):
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


class Report(BaseModel):
    id: int
    period: ReportPeriod
    from_date: datetime
    to_date: datetime
    summary: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    download_url: Optional[str] = None  # Changed from HttpUrl to str to avoid validation issues
    html_content: Optional[str] = None
    recipients: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TrendData(BaseModel):
    """Time-series trend data point."""
    date: str
    count: int
    avg_resolution_time: Optional[float] = None
    sentiment_score: Optional[float] = None  # -1 to 1


class CategoryMetrics(BaseModel):
    """Metrics for a complaint category."""
    category: str
    count: int
    avg_resolution_time: float
    resolution_rate: float  # percentage resolved
    avg_sentiment_score: float
    trending: str = "stable"  # up, down, stable


class AdminPerformance(BaseModel):
    """Performance metrics for an admin user."""
    admin_id: int
    admin_name: str
    assigned_count: int
    resolved_count: int
    avg_resolution_time: float
    avg_first_response_time: float
    customer_satisfaction: Optional[float] = None
    resolution_rate: float


class DepartmentMetrics(BaseModel):
    """Aggregated metrics for a department/category."""
    department: str
    total: int
    resolved: int
    pending: int
    in_progress: int
    resolution_rate: float
    avg_resolution_time_hours: float
    avg_first_response_hours: float
    sla_breach_rate: float
    reopen_rate: float
    avg_backlog_age_hours: float


class PredictiveInsights(BaseModel):
    """AI-powered predictive analytics."""
    predicted_volume_next_week: int
    high_risk_categories: List[str]  # Categories likely to spike
    recommended_staffing: Dict[int, int]  # admin_id: recommended capacity
    emerging_issues: List[Dict[str, str]]  # New patterns detected


class RootCauseInsight(BaseModel):
    """Aggregated root cause insight produced by AI analysis."""
    issue: str
    complaint_count: int = Field(..., ge=0)
    departments: List[str] = Field(default_factory=list)
    severity: str = Field(default="medium")
    confidence: float = Field(default=0.75, ge=0.0, le=1.0)
    summary: str
    recommended_actions: List[str] = Field(default_factory=list)


class AdvancedAnalytics(BaseModel):
    """Comprehensive analytics dashboard data."""
    overview: Dict[str, float]
    trends: List[TrendData]
    category_metrics: List[CategoryMetrics]
    admin_performance: List[AdminPerformance]
    predictive_insights: Optional[PredictiveInsights] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class Notification(BaseModel):
    """User notification."""
    id: int
    user_id: int
    title: str
    message: str
    type: str = "info"  # info, warning, error, success
    link: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None
