from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..datastore import db
from ..dependencies import admin_scoped_categories, get_current_admin, get_current_user
from ..models import ComplaintStatus, Priority, ReportPeriod
from ..schemas import (
    DashboardStats,
    KpisResponse,
    SentimentMetrics,
    SummaryResponse,
    TrendResponse,
    UserStatsResponse,
    DepartmentStatsResponse,
    DepartmentStat,
)
from ..services import ai, analytics
from ..services.advanced_analytics import advanced_analytics_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(current_user: dict = Depends(get_current_admin)):
    categories = admin_scoped_categories(current_user)
    stats = analytics.dashboard_snapshot(categories=categories)
    return DashboardStats(
        total_complaints=stats["total_complaints"],
        total_feedback=stats["total_feedback"],
        resolved=stats["resolved"],
        pending=stats["pending"],
        in_progress=stats["in_progress"],
        unclassified=stats["unclassified"],
        by_kind=stats["by_kind"],
        by_category=stats["by_category"],
    )


@router.get("/kpis", response_model=KpisResponse)
def get_dashboard_kpis(
    from_date: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user)
):
    """Get KPI metrics for SuperAdmin dashboard."""
    # Get all complaints
    complaints = db.list_complaints()
    
    # Apply date filtering if provided
    if from_date or to_date:
        try:
            from_dt = datetime.fromisoformat(from_date) if from_date else None
            to_dt = datetime.fromisoformat(to_date) if to_date else None
            
            if from_dt:
                complaints = [c for c in complaints if c.created_at >= from_dt]
            if to_dt:
                # Include full day
                to_dt = to_dt.replace(hour=23, minute=59, second=59)
                complaints = [c for c in complaints if c.created_at <= to_dt]
        except ValueError:
            pass  # Ignore invalid dates
    else:
        # Default to last 30 days
        cutoff = datetime.utcnow() - timedelta(days=30)
        complaints = [c for c in complaints if c.created_at >= cutoff]
    
    total = len(complaints)
    resolved = sum(1 for c in complaints if c.status == ComplaintStatus.resolved)
    urgent = sum(1 for c in complaints if c.priority == Priority.urgent and c.status != ComplaintStatus.resolved)
    
    # Calculate resolution rate
    resolution_rate = (resolved / total * 100) if total > 0 else 0.0
    
    # Calculate avg response time and SLA compliance
    response_times: list[float] = []
    sla_compliant = 0
    sla_threshold_hours = 48  # Define SLA as 48 hours for first response

    for c in complaints:
        # Prefer explicit first_response_at when available
        response_hours: float | None = None
        if getattr(c, "first_response_at", None):
            response_hours = (c.first_response_at - c.created_at).total_seconds() / 3600  # type: ignore[operator]
        else:
            # Fallback to first reply delta
            replies = db.list_replies_for_complaint(c.id)
            if replies:
                first_reply = min(replies, key=lambda r: r.created_at)
                response_hours = (first_reply.created_at - c.created_at).total_seconds() / 3600

        if response_hours is not None:
            response_times.append(response_hours)
            if response_hours <= sla_threshold_hours:
                sla_compliant += 1
    
    avg_response_time = sum(response_times) / len(response_times) if response_times else 0.0
    
    # SLA compliance: for complaints with no response time, assume SLA not met
    # For complaints with response time available, check if within SLA threshold
    sla_compliance = (sla_compliant / total * 100) if total > 0 else 100.0
    
    return KpisResponse(
        total_complaints=total,
        resolution_rate=round(resolution_rate, 1),
        urgent_cases=urgent,
        avg_response_time_hours=round(avg_response_time, 1),
        sla_compliance_rate=round(sla_compliance, 1)
    )


@router.get("/summary", response_model=SummaryResponse)
def summary(
    current_user: dict = Depends(get_current_admin),
    period: ReportPeriod = Query(default=ReportPeriod.weekly),
):
    categories = admin_scoped_categories(current_user)
    stats = analytics.dashboard_snapshot(categories=categories)
    complaints = db.list_complaints()
    if categories:
        complaints = [complaint for complaint in complaints if complaint.category in categories]
    try:
        payload = ai.generate_summary(period=period, complaints=complaints, stats=stats)
    except ai.AIUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI summary is currently unavailable. Please try again later.",
        )
    return SummaryResponse(
        summary=payload["summary"],
        metadata={"period": period.value},
        prevention_recommendations=payload.get("prevention_recommendations", []),
        focus_areas=payload.get("focus_areas", []),
        key_issues=payload.get("key_issues", []),
    )


@router.get("/trends", response_model=TrendResponse)
def trends(
    current_user: dict = Depends(get_current_admin),
    days: int = Query(default=30, ge=1, le=365),
    granularity: str = Query(default="daily", pattern="^(daily|monthly)$"),
):
    """Return ticket volume trend for charts.

    - Defaults to last 30 days, daily granularity.
    - Honors admin category scope.
    """
    categories = admin_scoped_categories(current_user)
    points = analytics.complaint_trends(categories=categories, days=days, granularity=granularity)
    return TrendResponse(points=points)


@router.get("/top-categories")
def get_top_categories(
    limit: int = Query(default=10, ge=1, le=50, description="Number of top categories to return"),
    current_user: dict = Depends(get_current_user)
):
    """Get top N categories by complaint count."""
    complaints = db.list_complaints()
    
    # Count complaints per category
    category_counts: dict[str, int] = {}
    for c in complaints:
        cat = c.category or "Unclassified"
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    # Sort by count descending and take top N
    top_categories = sorted(
        category_counts.items(),
        key=lambda x: x[1],
        reverse=True
    )[:limit]
    
    return {
        "categories": [
            {"name": name, "count": count}
            for name, count in top_categories
        ]
    }


@router.get("/distribution/status")
def get_status_distribution(current_user: dict = Depends(get_current_user)):
    """Get complaint count distribution by status."""
    complaints = db.list_complaints()
    
    distribution = {
        "Pending": 0,
        "In Progress": 0,
        "Resolved": 0
    }
    
    for c in complaints:
        status_val = c.status.value if hasattr(c.status, 'value') else str(c.status)
        if status_val in distribution:
            distribution[status_val] += 1
    
    return {"distribution": distribution}


@router.get("/user-stats", response_model=UserStatsResponse)
def user_stats(current_user: dict = Depends(get_current_admin)):
    """Return quick stats for the current user used on the profile page."""
    user_id = current_user["id"]
    complaints = db.list_complaints()

    # Complaints the user has handled: assigned to them or replied by them
    handled_ids = set()
    for c in complaints:
        if c.assigned_to == user_id:
            handled_ids.add(c.id)
    # Include any complaint where the user authored at least one reply
    for c in complaints:
        replies = db.list_replies_for_complaint(c.id)
        if any(r.admin_id == user_id for r in replies):
            handled_ids.add(c.id)

    handled = [c for c in complaints if c.id in handled_ids]
    complaints_handled = len(handled)

    resolved = len([c for c in handled if c.status.value == "Resolved"])
    resolution_rate = (resolved / complaints_handled * 100.0) if complaints_handled else 0.0

    # Average response time based on the user's first reply to each handled complaint
    response_hours: list[float] = []
    for c in handled:
        replies = db.list_replies_for_complaint(c.id)
        user_replies = [r for r in replies if r.admin_id == user_id]
        if not user_replies:
            continue
        first_reply = min(user_replies, key=lambda r: r.created_at)
        delta = first_reply.created_at - c.created_at
        response_hours.append(delta.total_seconds() / 3600)

    avg_response_time_hours = sum(response_hours) / len(response_hours) if response_hours else 0.0

    return UserStatsResponse(
        complaints_handled=complaints_handled,
        resolution_rate=round(resolution_rate, 2),
        avg_response_time_hours=round(avg_response_time_hours, 1),
    )


@router.get("/insights-header")
def insights_header(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
):
    """Header metrics for AI Insights page.

    - ai_confidence_percent: average of `ai_confidence` for tickets in the range
    - patterns_detected_count: number of categories trending up (proxy for patterns)
    - auto_resolved_count: resolved tickets with AI insights attached
    """
    from statistics import mean

    cutoff = datetime.utcnow() - timedelta(days=days)
    complaints = [c for c in db.list_complaints() if c.created_at >= cutoff]

    # AI confidence
    confidences = [float(c.ai_confidence) for c in complaints if getattr(c, "ai_confidence", None) is not None]
    ai_confidence_percent = round(mean(confidences) * 100.0, 0) if confidences else 0.0

    # Patterns proxy: categories trending up
    category_metrics = advanced_analytics_service.calculate_category_metrics(complaints)
    patterns_detected_count = sum(1 for m in category_metrics if getattr(m, "trending", "") == "up")

    # Auto-resolved proxy: resolved with AI insights present
    def _status_text(status: Any) -> str:
        if status is None:
            return ""
        if isinstance(status, ComplaintStatus):
            return status.value
        value = getattr(status, "value", None)
        return value if isinstance(value, str) else str(status)

    auto_resolved_count = sum(
        1
        for c in complaints
        if _status_text(c.status) == "Resolved" and getattr(c, "ai_insights", None) is not None
    )

    return {
        "ai_confidence_percent": ai_confidence_percent,
        "patterns_detected_count": int(patterns_detected_count),
        "auto_resolved_count": int(auto_resolved_count),
    }


@router.get("/department-stats", response_model=DepartmentStatsResponse)
def department_stats(current_user: dict = Depends(get_current_admin)):
    """Aggregate metrics by department (category)."""
    categories_scope = admin_scoped_categories(current_user)
    complaints = db.list_complaints()
    departments = sorted(set(categories_scope)) if categories_scope else None
    if categories_scope:
        complaints = [c for c in complaints if c.category in categories_scope]

    metrics = advanced_analytics_service.calculate_department_stats(
        complaints,
        departments=departments,
        audit_logs=list(db.audit_logs.values()),
    )

    items = [DepartmentStat.model_validate(metric.model_dump()) for metric in metrics]
    return DepartmentStatsResponse(items=items)


@router.get("/sentiment", response_model=SentimentMetrics)
def get_sentiment_metrics(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get overall sentiment analysis metrics.
    
    Returns:
    - Overall sentiment score (0-100)
    - Positive/neutral/negative counts
    - Sentiment trend over time
    """
    # Get complaints from last N days
    cutoff = datetime.utcnow() - timedelta(days=days)
    complaints = [c for c in db.list_complaints() if c.created_at >= cutoff]
    
    if not complaints:
        return SentimentMetrics(
            overall_score=50.0,
            positive_count=0,
            neutral_count=0,
            negative_count=0,
            trend=[]
        )
    
    # Count sentiments
    positive_count = 0
    neutral_count = 0
    negative_count = 0
    
    for c in complaints:
        if c.ai_insights and c.ai_insights.sentiment:
            sentiment = c.ai_insights.sentiment.sentiment
            if sentiment == "positive":
                positive_count += 1
            elif sentiment == "negative":
                negative_count += 1
            else:
                neutral_count += 1
        else:
            # Default to neutral if no AI insights
            neutral_count += 1
    
    total = len(complaints)
    
    # Calculate overall score (weighted: positive=100, neutral=50, negative=0)
    if total > 0:
        overall_score = (
            (positive_count * 100 + neutral_count * 50 + negative_count * 0) / total
        )
    else:
        overall_score = 50.0
    
    # Calculate trend (last 7 days)
    trend = []
    for i in range(min(days, 7)):
        day_start = datetime.utcnow() - timedelta(days=i+1)
        day_end = datetime.utcnow() - timedelta(days=i)
        
        day_complaints = [
            c for c in complaints 
            if day_start <= c.created_at < day_end
        ]
        
        if day_complaints:
            day_positive = sum(
                1 for c in day_complaints
                if c.ai_insights and c.ai_insights.sentiment and c.ai_insights.sentiment.sentiment == "positive"
            )
            day_total = len(day_complaints)
            day_score = (day_positive / day_total * 100) if day_total > 0 else 50.0
        else:
            day_score = 50.0
        
        trend.insert(0, {
            "date": day_start.strftime("%Y-%m-%d"),
            "score": round(day_score, 1)
        })
    
    return SentimentMetrics(
        overall_score=round(overall_score, 1),
        positive_count=positive_count,
        neutral_count=neutral_count,
        negative_count=negative_count,
        trend=trend
    )


@router.post("/nl-query")
async def natural_language_query(
    query: str = Query(..., description="Natural language query"),
    current_user: dict = Depends(get_current_admin)
):
    """
    Process natural language analytics queries using AI.
    Examples: 
    - "Show me IT tickets from last week"
    - "Which department has worst resolution rate?"
    - "What are main complaints about facilities?"
    """
    from datetime import datetime, timedelta
    from collections import Counter
    import json
    
    def _status_text(status: Any) -> str:
        """Normalize complaint status to a comparable string."""
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
            except Exception:
                pass
        return str(status)
    
    try:
        # Use AI to interpret the query
        categories_scope = admin_scoped_categories(current_user)
        complaints = db.list_complaints()
        if categories_scope:
            complaints = [c for c in complaints if c.category in categories_scope]
        
        # Simple query interpretation (can be enhanced with Groq)
        query_lower = query.lower()
        filtered_complaints = complaints
        
        # Department/Category filter
        departments = set(c.category for c in complaints if c.category)
        for dept in departments:
            if dept.lower() in query_lower:
                filtered_complaints = [c for c in filtered_complaints if c.category == dept]
                break
        
        # Date filters
        if "last week" in query_lower:
            week_ago = datetime.utcnow() - timedelta(days=7)
            filtered_complaints = [c for c in filtered_complaints if c.created_at >= week_ago]
        elif "last month" in query_lower:
            month_ago = datetime.utcnow() - timedelta(days=30)
            filtered_complaints = [c for c in filtered_complaints if c.created_at >= month_ago]
        elif "today" in query_lower:
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            filtered_complaints = [c for c in filtered_complaints if c.created_at >= today_start]
        
        # Status filter
        if "resolved" in query_lower:
            filtered_complaints = [c for c in filtered_complaints if _status_text(c.status) == "Resolved"]
        elif "pending" in query_lower:
            filtered_complaints = [c for c in filtered_complaints if _status_text(c.status) == "Pending"]
        
        # Calculate metrics
        total = len(filtered_complaints)
        resolved = len([c for c in filtered_complaints if _status_text(c.status) == "Resolved"])
        pending = len([c for c in filtered_complaints if _status_text(c.status) == "Pending"])
        in_progress = len([c for c in filtered_complaints if _status_text(c.status) == "In Progress"])
        resolution_rate = (resolved / total * 100) if total > 0 else 0
        
        # Top categories
        category_counts = Counter(c.category for c in filtered_complaints if c.category)
        top_categories = [{"category": cat, "count": count} for cat, count in category_counts.most_common(5)]
        
        # Generate answer
        if "worst" in query_lower or "lowest" in query_lower:
            dept_metrics = advanced_analytics_service.calculate_department_stats(
                filtered_complaints,
                departments=None,
                audit_logs=list(db.audit_logs.values()),
            )
            worst = min(dept_metrics, key=lambda d: d.resolution_rate) if dept_metrics else None
            answer = f"{worst.department} has the lowest resolution rate at {worst.resolution_rate:.1f}%" if worst else "No data available"
        elif "best" in query_lower or "highest" in query_lower:
            dept_metrics = advanced_analytics_service.calculate_department_stats(
                filtered_complaints,
                departments=None,
                audit_logs=list(db.audit_logs.values()),
            )
            best = max(dept_metrics, key=lambda d: d.resolution_rate) if dept_metrics else None
            answer = f"{best.department} has the highest resolution rate at {best.resolution_rate:.1f}%" if best else "No data available"
        else:
            answer = f"Found {total} tickets with {resolved} resolved ({resolution_rate:.1f}% resolution rate)"
        
        return {
            "query": query,
            "interpretation": f"Analyzing {len(filtered_complaints)} tickets based on your query",
            "results": {
                "total_tickets": total,
                "resolved": resolved,
                "pending": pending,
                "in_progress": in_progress,
                "resolution_rate": round(resolution_rate, 1),
                "top_categories": top_categories
            },
            "answer": answer,
            "chart_data": [
                {"name": "Resolved", "value": resolved, "color": "#10b981"},
                {"name": "Pending", "value": pending, "color": "#f59e0b"},
                {"name": "In Progress", "value": in_progress, "color": "#3b82f6"}
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process query: {str(e)}")


@router.get("/voc")
async def voice_of_customer_analysis(
    category: str = Query(None, description="Filter by category"),
    days: int = Query(30, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_admin)
):
    """
    Analyze customer voice - extract themes, pain points, and sentiment from complaint text.
    """
    from datetime import datetime, timedelta
    from collections import Counter
    import re
    
    try:
        categories_scope = admin_scoped_categories(current_user)
        complaints = db.list_complaints()
        if categories_scope:
            complaints = [c for c in complaints if c.category in categories_scope]
        
        # Apply filters
        if category:
            complaints = [c for c in complaints if c.category == category]
        
        # Date filter
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        complaints = [c for c in complaints if c.created_at >= cutoff_date]
        
        # Extract complaint texts
        texts = [c.complaint_text for c in complaints if hasattr(c, 'complaint_text') and c.complaint_text]
        
        if not texts:
            return {
                "total_analyzed": 0,
                "pain_points": [],
                "positive_feedback": [],
                "common_phrases": [],
                "sentiment_breakdown": {"positive": 0, "neutral": 0, "negative": 0},
                "topics": [],
                "recommendations": []
            }
        
        # Combine all text for analysis
        combined_text = " ".join(texts).lower()
        
        # Extract common phrases (2-3 word patterns)
        words = re.findall(r'\b[a-z]+\b', combined_text)
        word_freq = Counter(words)
        # Remove common stop words
        stop_words = {'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'this', 'that', 'it', 'from', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'not', 'my', 'i', 'me', 'we', 'us', 'you', 'your'}
        meaningful_words = {word: count for word, count in word_freq.items() if word not in stop_words and len(word) > 3 and count >= 3}
        
        common_phrases = [
            {"phrase": phrase, "count": count} 
            for phrase, count in sorted(meaningful_words.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Sentiment breakdown (using AI insights if available)
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
        for c in complaints:
            if hasattr(c, 'ai_insights') and c.ai_insights and hasattr(c.ai_insights, 'sentiment'):
                sentiment = c.ai_insights.sentiment.sentiment if hasattr(c.ai_insights.sentiment, 'sentiment') else 'neutral'
                sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
            else:
                sentiment_counts['neutral'] += 1
        
        # Identify pain points (negative keywords)
        pain_keywords = ['broken', 'not working', 'issue', 'problem', 'error', 'failed', 'down', 'slow', 'damaged', 'defective']
        pain_points = []
        for keyword in pain_keywords:
            count = combined_text.count(keyword)
            if count >= 3:
                pain_points.append({"issue": keyword.title(), "mentions": count, "severity": "high" if count > 10 else "medium"})
        
        pain_points = sorted(pain_points, key=lambda x: x["mentions"], reverse=True)[:5]
        
        # Positive feedback themes
        positive_keywords = ['great', 'excellent', 'good', 'thank', 'appreciate', 'helpful', 'quick', 'fast', 'resolved']
        positive_themes = []
        for keyword in positive_keywords:
            count = combined_text.count(keyword)
            if count >= 2:
                positive_themes.append({"theme": keyword.title(), "mentions": count})
        
        positive_themes = sorted(positive_themes, key=lambda x: x["mentions"], reverse=True)[:5]
        
        # Topics (based on categories)
        category_counts = Counter(c.category for c in complaints if c.category)
        topics = [
            {"name": cat, "ticket_count": count, "percentage": round(count / len(complaints) * 100, 1)}
            for cat, count in category_counts.most_common(5)
        ]
        
        # Generate recommendations
        recommendations = []
        if pain_points:
            top_pain = pain_points[0]
            recommendations.append(f"Address '{top_pain['issue']}' issues - mentioned {top_pain['mentions']} times")
        
        if sentiment_counts['negative'] > sentiment_counts['positive']:
            recommendations.append("Focus on improving customer sentiment - negative feedback exceeds positive")
        
        if topics:
            top_topic = topics[0]
            if top_topic['percentage'] > 30:
                recommendations.append(f"High concentration of {top_topic['name']} complaints ({top_topic['percentage']}%) - consider dedicated resources")
        
        return {
            "total_analyzed": len(complaints),
            "date_range": f"Last {days} days",
            "pain_points": pain_points,
            "positive_feedback": positive_themes,
            "common_phrases": common_phrases,
            "sentiment_breakdown": sentiment_counts,
            "topics": topics,
            "recommendations": recommendations if recommendations else ["Maintain current service levels - metrics are healthy"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze voice of customer: {str(e)}")
