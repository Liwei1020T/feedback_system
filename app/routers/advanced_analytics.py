"""Advanced analytics API endpoints."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query

from ..datastore import db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import AdvancedAnalyticsResponse
from ..services.advanced_analytics import advanced_analytics_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["advanced-analytics"])


@router.get("/advanced", response_model=AdvancedAnalyticsResponse)
async def get_advanced_analytics(
    include_predictions: bool = Query(True, description="Include AI predictions"),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive analytics with trends, metrics, and predictions.
    
    Returns:
    - Overview statistics
    - 30-day trends
    - Category-wise metrics
    - Admin performance
    - Predictive insights (optional)
    """
    complaints = db.list_complaints()
    
    analytics = await advanced_analytics_service.get_advanced_analytics(
        complaints,
        include_predictions=include_predictions,
    )

    return AdvancedAnalyticsResponse.model_validate(analytics.model_dump())


@router.get("/category/{category}")
async def get_category_deep_dive(
    category: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed analytics for a specific category."""
    from collections import defaultdict
    
    complaints = db.list_complaints()
    category_complaints = [c for c in complaints if c.category == category]
    
    department_metrics = advanced_analytics_service.calculate_department_stats(
        category_complaints,
        departments=[category],
        audit_logs=list(db.audit_logs.values()),
    )
    department_metric = department_metrics[0] if department_metrics else None
    
    trends = advanced_analytics_service.calculate_trends(category_complaints, days=30)
    
    # Extract top tags
    tag_counts = defaultdict(int)
    for c in category_complaints:
        if c.ai_insights and c.ai_insights.tags:
            for tag in c.ai_insights.tags:
                tag_counts[tag] += 1
    
    top_tags = [
        {"tag": tag, "count": count}
        for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    # Sentiment distribution
    sentiment_distribution = {"positive": 0, "neutral": 0, "negative": 0}
    for c in category_complaints:
        if c.ai_insights and c.ai_insights.sentiment:
            sentiment = c.ai_insights.sentiment.sentiment
            sentiment_distribution[sentiment] = sentiment_distribution.get(sentiment, 0) + 1
    
    return {
        "category": category,
        "total_complaints": len(category_complaints),
        "trends": trends,
        "top_tags": top_tags,
        "sentiment_distribution": sentiment_distribution,
        "avg_resolution_time_hours": department_metric.avg_resolution_time_hours if department_metric else None,
        "avg_first_response_hours": department_metric.avg_first_response_hours if department_metric else None,
        "sla_breach_rate": department_metric.sla_breach_rate if department_metric else None,
        "reopen_rate": department_metric.reopen_rate if department_metric else None,
        "avg_backlog_age_hours": department_metric.avg_backlog_age_hours if department_metric else None,
    }
