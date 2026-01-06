"""AI insights API endpoints."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from ..datastore import db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import AIInsightsResponse
from ..services.ai_enhanced import enhanced_ai_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/complaints", tags=["ai-insights"])


@router.post("/{complaint_id}/analyze", response_model=AIInsightsResponse)
async def analyze_complaint_deeply(
    complaint_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Generate deep AI insights for a complaint including:
    - Sentiment analysis
    - Similar complaints
    - Resolution template
    - Estimated resolution time
    - Tags
    """
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    all_complaints = db.list_complaints()
    
    try:
        insights = await enhanced_ai_service.get_full_insights(complaint, all_complaints)
        
        # Add logging to debug the response format issue
        logger.info(f"Insights type: {type(insights)}")
        logger.info(f"Sentiment type: {type(insights.sentiment)}")
        logger.info(f"Sentiment value: {insights.sentiment}")
        logger.info(f"Expected response model: AIInsightsResponse")

        history = list(complaint.sentiment_history or [])
        history.append(insights.sentiment)
        db.update_complaint(
            complaint.id,
            ai_insights=insights,
            sentiment_history=history,
        )

        # Convert AIInsights to AIInsightsResponse format
        # Convert SentimentAnalysis object to dictionary for response
        sentiment_dict = insights.sentiment.model_dump() if insights.sentiment else {}
        
        # Convert similar complaints to dictionaries
        similar_complaints_dict = [
            {
                "complaint_id": comp.complaint_id,
                "similarity_score": comp.similarity_score,
                "matched_keywords": comp.matched_keywords,
                "resolution_summary": comp.resolution_summary
            }
            for comp in insights.similar_complaints
        ]

        # Create response matching AIInsightsResponse schema
        response = AIInsightsResponse(
            sentiment=sentiment_dict,
            similar_complaints=similar_complaints_dict,
            resolution_template=insights.resolution_template or "",
            estimated_resolution_time=insights.estimated_resolution_time or 0,
            tags=insights.tags or [],
            analyzed_at=insights.analyzed_at
        )

        return response
        
    except Exception as e:
        logger.error(f"Deep analysis failed for {complaint_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI analysis failed"
        )


@router.post("/{complaint_id}/regenerate-template")
async def regenerate_resolution_template(
    complaint_id: int,
    current_user: User = Depends(get_current_user)
):
    """Regenerate response template for a complaint."""
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    template = await enhanced_ai_service.generate_resolution_template(complaint)
    
    return {"template": template}


@router.post("/analyze-all")
async def analyze_all_complaints(
    current_user: User = Depends(get_current_user)
):
    """Batch analyze all complaints to enrich AI insights.

    Iterates through all complaints and generates insights for those that
    don't have them yet. Returns counts and any IDs that failed.
    """
    complaints = db.list_complaints()
    analyzed = 0
    skipped = 0
    failed: list[int] = []

    for c in complaints:
        if getattr(c, "ai_insights", None):
            skipped += 1
            continue
        try:
            insights = await enhanced_ai_service.get_full_insights(c, complaints)
            history = list(c.sentiment_history or [])
            if insights and insights.sentiment:
                history.append(insights.sentiment)
            db.update_complaint(c.id, ai_insights=insights, sentiment_history=history)
            analyzed += 1
        except Exception as e:  # pragma: no cover - log and continue
            logger.error("Batch analysis failed for %s: %s", c.id, e)
            failed.append(c.id)

    return {"analyzed": analyzed, "skipped": skipped, "failed": failed}
