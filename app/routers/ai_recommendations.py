"""AI recommendations router."""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status

from ..datastore import db
from ..dependencies import get_current_user
from ..models import Priority, ComplaintStatus
from ..schemas import AIRecommendation, RecommendationsResponse, RootCauseResponse
from ..services.ai_enhanced import enhanced_ai_service

router = APIRouter(prefix="/api/ai", tags=["AI Recommendations"])
logger = logging.getLogger(__name__)

# In-memory cache for recommendations (1 hour TTL)
_recommendations_cache: Dict[str, tuple[RecommendationsResponse, datetime]] = {}
_root_cause_cache: Dict[str, tuple[RootCauseResponse, datetime]] = {}


def _get_cache_key(user_id: int) -> str:
    """Generate cache key for user recommendations."""
    return f"recommendations_{user_id}"


def _get_root_cache_key(user_id: int) -> str:
    """Generate cache key for root cause insights."""
    return f"root_causes_{user_id}"


def _is_cache_valid(cached_at: datetime, ttl_minutes: int = 60) -> bool:
    """Check if cached data is still valid."""
    return datetime.utcnow() - cached_at < timedelta(minutes=ttl_minutes)


@router.get("/recommendations", response_model=RecommendationsResponse)
async def get_ai_recommendations(
    current_user: dict = Depends(get_current_user)
):
    """
    Generate AI-powered recommendations based on complaint patterns.
    
    Analyzes:
    - Top issues and recurring patterns
    - Sentiment trends
    - Resolution bottlenecks
    - SLA compliance risks
    - Resource allocation opportunities
    
    Cached for 1 hour to avoid excessive AI API calls.
    """
    user_id = current_user["id"]
    cache_key = _get_cache_key(user_id)
    
    # Check cache first
    if cache_key in _recommendations_cache:
        cached_response, cached_at = _recommendations_cache[cache_key]
        if _is_cache_valid(cached_at):
            logger.info(f"Returning cached recommendations for user {user_id}")
            return cached_response
    
    # Generate fresh recommendations
    try:
        complaints = db.list_complaints()
        logger.info(f"Generating AI recommendations for {len(complaints)} complaints")
        recommendations = await _generate_recommendations(complaints)
        
        if not recommendations:
            logger.warning("No recommendations generated, using static fallback")
            recommendations = _get_fallback_recommendations()
        
        # Cache the result
        response = RecommendationsResponse(recommendations=recommendations)
        _recommendations_cache[cache_key] = (response, datetime.utcnow())
        
        logger.info(f"Returning {len(recommendations)} recommendations (cached for 1 hour)")
        return response
        
    except Exception as e:
        logger.error(f"Recommendation generation failed: {e}", exc_info=True)
        # Return fallback recommendations
        return RecommendationsResponse(
            recommendations=_get_fallback_recommendations()
        )


@router.get("/root-causes", response_model=RootCauseResponse)
async def get_root_cause_insights(
    current_user: dict = Depends(get_current_user)
):
    """Generate AI-assisted root cause analysis for complaint trends."""
    user_id = current_user["id"]
    cache_key = _get_root_cache_key(user_id)

    if cache_key in _root_cause_cache:
        cached_response, cached_at = _root_cause_cache[cache_key]
        if _is_cache_valid(cached_at):
            logger.info("Returning cached root cause insights for user %s", user_id)
            return cached_response

    complaints = db.list_complaints()
    insights = await enhanced_ai_service.generate_root_cause_insights(complaints)

    response = RootCauseResponse(
        root_causes=insights,
        source=enhanced_ai_service.last_root_cause_source,
    )
    _root_cause_cache[cache_key] = (response, datetime.utcnow())

    logger.info(
        "Generated %s root cause insights (source=%s)",
        len(insights),
        response.source,
    )
    return response


@router.post("/recommendations/refresh")
async def refresh_recommendations(
    current_user: dict = Depends(get_current_user)
):
    """
    Clear the recommendations cache and regenerate fresh recommendations.
    
    Useful for testing or when you want to force fresh AI analysis.
    """
    user_id = current_user["id"]
    cache_key = _get_cache_key(user_id)
    
    # Clear cache
    if cache_key in _recommendations_cache:
        del _recommendations_cache[cache_key]
        logger.info(f"Cleared recommendations cache for user {user_id}")
    
    # Generate fresh recommendations
    try:
        complaints = db.list_complaints()
        logger.info(f"Forcing fresh AI recommendations for {len(complaints)} complaints")
        recommendations = await _generate_recommendations(complaints)
        
        if not recommendations:
            recommendations = _get_fallback_recommendations()
        
        # Cache the new result
        response = RecommendationsResponse(recommendations=recommendations)
        _recommendations_cache[cache_key] = (response, datetime.utcnow())
        
        return {
            "message": "Recommendations refreshed successfully",
            "count": len(recommendations),
            "cached_until": (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Recommendation refresh failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh recommendations: {str(e)}"
        )


@router.post("/root-causes/refresh")
async def refresh_root_causes(
    current_user: dict = Depends(get_current_user)
):
    """Clear root cause cache and regenerate fresh insights."""
    user_id = current_user["id"]
    cache_key = _get_root_cache_key(user_id)

    if cache_key in _root_cause_cache:
        del _root_cause_cache[cache_key]
        logger.info("Cleared root-cause cache for user %s", user_id)

    complaints = db.list_complaints()
    insights = await enhanced_ai_service.generate_root_cause_insights(complaints)

    response = RootCauseResponse(
        root_causes=insights,
        source=enhanced_ai_service.last_root_cause_source,
    )
    _root_cause_cache[cache_key] = (response, datetime.utcnow())

    return {
        "message": "Root cause insights refreshed successfully",
        "count": len(insights),
        "cached_until": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
    }

async def _generate_recommendations(complaints: List) -> List[AIRecommendation]:
    """Generate recommendations from complaint data using AI."""
    try:
        # Use AI service to generate recommendations
        logger.info("Calling Groq AI API to generate recommendations...")
        ai_recommendations = await enhanced_ai_service.generate_recommendations(complaints)
        
        # If AI returns recommendations, convert to our schema
        if ai_recommendations:
            logger.info(f"AI generated {len(ai_recommendations)} recommendations successfully")
            recommendations = []
            for rec in ai_recommendations:
                recommendations.append(AIRecommendation(
                    id=rec.get("id", f"ai_rec_{len(recommendations)}"),
                    title=rec.get("title", ""),
                    description=rec.get("description", ""),
                    priority=rec.get("priority", "medium"),
                    impact=rec.get("impact", ""),
                    estimated_effort=rec.get("estimated_effort", ""),
                    category=rec.get("category", "process"),
                    confidence=rec.get("confidence", 0.75),
                    solution_steps=rec.get("solution_steps", [])
                ))
            return recommendations
        
        # If AI fails, fall back to rule-based recommendations
        logger.warning("AI service returned no recommendations, using rule-based fallback")
        return _generate_rule_based_recommendations(complaints)
        
    except Exception as e:
        logger.error(f"AI recommendation generation failed: {e}", exc_info=True)
        logger.info("Falling back to rule-based recommendation engine")
        return _generate_rule_based_recommendations(complaints)


def _generate_rule_based_recommendations(complaints: List) -> List[AIRecommendation]:
    """Generate recommendations using rule-based logic as fallback."""
    recommendations = []
    
    # Analyze complaint patterns
    total = len(complaints)
    if total == 0:
        return _get_fallback_recommendations()
    
    # 1. High-priority complaints backlog
    urgent_pending = [
        c for c in complaints 
        if c.priority == Priority.urgent and c.status != ComplaintStatus.resolved
    ]
    if len(urgent_pending) > 5:
        recommendations.append(AIRecommendation(
            id="urgent_backlog",
            title="High Backlog of Urgent Cases",
            description=f"{len(urgent_pending)} urgent complaints pending resolution. Focus on clearing backlog to improve SLA compliance.",
            priority="high",
            impact=f"Could improve SLA compliance by {min(len(urgent_pending) * 2, 30)}%",
            estimated_effort="2-3 days",
            category="process",
            confidence=0.95,
            solution_steps=[
                "Block 2-hour focus windows each day to clear the urgent queue.",
                "Assign a senior responder to own each pending urgent ticket before end of day.",
                "Push real-time updates to stakeholders so escalations do not re-open."
            ]
        ))
    
    # 2. Category concentration analysis
    category_counts: Dict[str, int] = {}
    for c in complaints:
        cat = c.category or "Unclassified"
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    if category_counts:
        top_category = max(category_counts.items(), key=lambda x: x[1])
        if top_category[1] > total * 0.3:  # >30% concentration
            recommendations.append(AIRecommendation(
                id=f"category_{hashlib.md5(top_category[0].encode()).hexdigest()[:8]}",
                title=f"High Concentration in {top_category[0]}",
                description=f"{top_category[1]} complaints ({top_category[1]/total*100:.1f}%) in {top_category[0]} category. Consider root cause analysis.",
                priority="medium",
            impact="Could reduce future complaints by 15-20%",
            estimated_effort="1-2 weeks",
            category="analysis",
            confidence=0.88,
            solution_steps=[
                f"Review the last 10 {top_category[0]} complaints with the owning department.",
                "Document the top 3 root causes and map responsible owners.",
                "Launch a corrective action plan with milestones and follow-up review."
            ]
        ))
    
    # 3. Resolution rate analysis
    resolved = sum(1 for c in complaints if c.status == ComplaintStatus.resolved)
    resolution_rate = (resolved / total * 100) if total > 0 else 0
    
    if resolution_rate < 70:
        recommendations.append(AIRecommendation(
            id="low_resolution_rate",
            title="Low Resolution Rate Detected",
            description=f"Current resolution rate is {resolution_rate:.1f}%. Industry benchmark is 85%+. Review resolution workflows.",
            priority="high",
            impact="Could improve customer satisfaction by 25%",
            estimated_effort="3-4 weeks",
            category="process",
            confidence=0.92,
            solution_steps=[
                "Map the current resolution workflow and identify wait states or hand-off delays.",
                "Set weekly targets for resolved volume and publish progress in leadership standups.",
                "Introduce a quality checklist or playbook so admins can resolve cases faster."
            ]
        ))
    
    # 4. Response time analysis
    response_times = []
    for c in complaints:
        replies = db.list_replies_for_complaint(c.id)
        if replies:
            first_reply = min(replies, key=lambda r: r.created_at)
            hours = (first_reply.created_at - c.created_at).total_seconds() / 3600
            response_times.append(hours)
    
    if response_times:
        avg_response = sum(response_times) / len(response_times)
        if avg_response > 24:  # >24 hours average
            recommendations.append(AIRecommendation(
                id="slow_response_time",
                title="Slow Average Response Time",
                description=f"Average response time is {avg_response:.1f} hours. Target should be <12 hours for better customer experience.",
                priority="medium",
            impact="Could reduce escalations by 40%",
            estimated_effort="1-2 weeks",
            category="resource",
            confidence=0.85,
            solution_steps=[
                "Establish a rotating on-call schedule to guarantee first responses within 8 hours.",
                "Automate acknowledgement messages so employees know their complaint is being worked.",
                "Add dashboard alerts for tickets approaching the SLA breach threshold."
            ]
        ))
    
    # 5. Sentiment analysis (if available)
    negative_sentiment_count = 0
    for c in complaints:
        if c.ai_insights and c.ai_insights.sentiment:
            if c.ai_insights.sentiment.sentiment == "negative":
                negative_sentiment_count += 1
    
    if negative_sentiment_count > total * 0.4:  # >40% negative
        recommendations.append(AIRecommendation(
            id="high_negative_sentiment",
            title="High Negative Sentiment Trend",
            description=f"{negative_sentiment_count} complaints ({negative_sentiment_count/total*100:.1f}%) show negative sentiment. Proactive communication may help.",
            priority="high",
            impact="Could improve employee satisfaction scores by 20%",
            estimated_effort="2-3 weeks",
            category="communication",
            confidence=0.78,
            solution_steps=[
                "Have case owners send personalized updates to negatively scored complaints within 24 hours.",
                "Share a sentiment playbook that highlights empathetic language and common fixes.",
                "Schedule a sentiment review retro to capture learnings and adjust messaging."
            ]
        ))
    
    # Sort by priority and confidence
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda r: (priority_order[r.priority], -r.confidence))
    
    return recommendations[:6]  # Return top 6 recommendations


def _get_fallback_recommendations() -> List[AIRecommendation]:
    """Fallback recommendations when AI is unavailable or no data."""
    return [
        AIRecommendation(
            id="fallback_1",
            title="Improve Response Time",
            description="Focus on reducing average response time to enhance customer satisfaction",
            priority="medium",
            impact="Could improve customer satisfaction by 15%",
            estimated_effort="2-4 weeks",
            category="process",
            confidence=0.65,
            solution_steps=[
                "Audit first-response timestamps from the last 30 days to spot delays.",
                "Assign daily case captains responsible for clearing new tickets.",
                "Publish a visible SLA timer in the team channel to maintain focus."
            ]
        ),
        AIRecommendation(
            id="fallback_2",
            title="Implement Regular Feedback Loops",
            description="Establish weekly review of top complaint categories to identify patterns early",
            priority="low",
            impact="Could catch issues 50% faster",
            estimated_effort="1-2 weeks",
            category="process",
            confidence=0.60,
            solution_steps=[
                "Host a 30-minute weekly sync to review new complaints by category.",
                "Capture action items with owners in a shared tracker.",
                "Report outcomes back to the wider team to reinforce accountability."
            ]
        ),
        AIRecommendation(
            id="fallback_3",
            title="Enhance AI Classification Accuracy",
            description="Review and improve AI classification rules based on historical data",
            priority="low",
            impact="Could improve auto-classification rate to 95%+",
            estimated_effort="1 week",
            category="training",
            confidence=0.70,
            solution_steps=[
                "Sample misclassified tickets and identify recurring feature gaps.",
                "Update training data with corrected labels and re-train the model.",
                "Roll out refresher training for admins on tagging standards."
            ]
        )
    ]
