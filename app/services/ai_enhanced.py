"""Enhanced AI service with advanced capabilities."""
from __future__ import annotations

import json
import logging
from collections import Counter
from datetime import datetime
from typing import Dict, List, Optional

try:
    from groq import Groq
except ImportError:
    Groq = None

from ..config import settings
from ..models import Complaint, SentimentAnalysis, SimilarComplaint, AIInsights, RootCauseInsight
from ..datastore import db

logger = logging.getLogger(__name__)


class EnhancedAIService:
    """Enhanced AI service with sentiment analysis and insights."""
    
    def __init__(self):
        if Groq is None:
            logger.warning("Groq not installed, AI features will use fallbacks")
            self.client = None
        else:
            api_key = getattr(settings, 'groq_api_key', None)
            self.client = Groq(api_key=api_key) if api_key else None
        self.model = getattr(settings, 'groq_model', "llama-3.3-70b-versatile")
        self.last_root_cause_source: str = "fallback"
    
    async def analyze_sentiment(self, text: str) -> SentimentAnalysis:
        """
        Analyze sentiment and emotional tone of complaint text.
        
        Args:
            text: Complaint description
            
        Returns:
            SentimentAnalysis with sentiment, emotion, and urgency
        """
        if not self.client:
            return self._fallback_sentiment()
        
        try:
            prompt = f"""Analyze the sentiment and emotional tone of this customer complaint.
Provide your analysis in JSON format with these exact fields:
- sentiment: "positive", "neutral", or "negative"
- emotion: "angry", "frustrated", "disappointed", "calm", or "satisfied"
- urgency_score: integer 0-100 (0=not urgent, 100=critical emergency)
- confidence: float 0-1 (how confident you are)
- reasoning: brief explanation of your assessment

Complaint text:
{text}

Respond ONLY with valid JSON, no other text."""

            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.3,
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return SentimentAnalysis(
                sentiment=result["sentiment"],
                emotion=result["emotion"],
                urgency_score=result["urgency_score"],
                confidence=result["confidence"],
                reasoning=result["reasoning"]
            )
            
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return self._fallback_sentiment()
    
    def _fallback_sentiment(self) -> SentimentAnalysis:
        """Return neutral sentiment as fallback."""
        return SentimentAnalysis(
            sentiment="neutral",
            emotion="calm",
            urgency_score=50,
            confidence=0.0,
            reasoning="AI analysis unavailable, using default values"
        )

    def _fallback_root_causes(self, complaints: List[Complaint]) -> List[RootCauseInsight]:
        """Generate heuristic root cause insights when AI is unavailable."""
        self.last_root_cause_source = "fallback"
        if not complaints:
            return []

        total = len(complaints)
        category_counts = Counter((c.category or "Unclassified") for c in complaints)
        top_categories = category_counts.most_common(3)
        insights: List[RootCauseInsight] = []

        for category, count in top_categories:
            related = [c for c in complaints if (c.category or "Unclassified") == category]
            negative = sum(
                1
                for c in related
                if c.ai_insights
                and c.ai_insights.sentiment
                and c.ai_insights.sentiment.sentiment == "negative"
            )
            ratio = count / total if total else 0.0
            sentiment_ratio = (negative / len(related)) if related else 0.0

            severity = "medium"
            if ratio >= 0.3 or sentiment_ratio >= 0.5:
                severity = "high"
            elif ratio <= 0.15 and sentiment_ratio < 0.3:
                severity = "low"

            departments = sorted({c.plant for c in related if c.plant} or {category})
            summary = (
                f"{count} complaints in {category} over the recent period with "
                f"{negative} showing negative sentiment."
            )
            recommended_actions = [
                f"Review recent {category} complaints to confirm primary failure modes.",
                "Assign an owner to implement corrective actions and communicate updates.",
                "Track weekly progress until complaint volume and sentiment stabilize."
            ]

            insights.append(
                RootCauseInsight(
                    issue=category,
                    complaint_count=count,
                    departments=departments,
                    severity=severity,
                    confidence=0.6 if self.client is None else 0.7,
                    summary=summary,
                    recommended_actions=recommended_actions,
                )
            )

        return insights
    
    async def find_similar_complaints(
        self, 
        complaint: Complaint, 
        all_complaints: List[Complaint],
        top_k: int = 5
    ) -> List[SimilarComplaint]:
        """
        Find similar complaints using AI-powered semantic matching.
        
        Args:
            complaint: Current complaint to match against
            all_complaints: All historical complaints
            top_k: Number of similar complaints to return
            
        Returns:
            List of SimilarComplaint objects
        """
        if not self.client:
            return []
        
        try:
            # Filter out the current complaint and keep only resolved ones
            candidates = [
                c for c in all_complaints 
                if c.id != complaint.id and c.status.value == "Resolved"
            ]
            complaint_map = {c.id: c for c in all_complaints}
            
            if not candidates:
                return []
            
            # Create summary of candidates for AI
            candidates_text = "\n\n".join([
                f"ID: {c.id}\nText: {c.complaint_text[:200]}...\nCategory: {c.category}"
                for c in candidates[:20]  # Limit to avoid token limits
            ])
            
            prompt = f"""Given this new complaint, identify the most similar resolved complaints from the list.
Consider semantic similarity in description, category, and issue type.

NEW COMPLAINT:
Text: {complaint.complaint_text}
Category: {complaint.category}

HISTORICAL COMPLAINTS:
{candidates_text}

Return top {top_k} matches in JSON format:
{{
  "matches": [
    {{
      "complaint_id": ID_from_list,
      "similarity_score": 0.0-1.0,
      "matched_keywords": ["keyword1", "keyword2"],
      "resolution_summary": "brief summary of how it was resolved"
    }}
  ]
}}

Respond ONLY with valid JSON."""

            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.5,
                max_tokens=1000
            )
            
            result = json.loads(response.choices[0].message.content)
            
            matches = []
            for match in result.get("matches", []):
                raw_id = match.get("complaint_id")
                normalized_id: Optional[int] = None
                if isinstance(raw_id, int):
                    normalized_id = raw_id
                elif isinstance(raw_id, str):
                    digits = "".join(ch for ch in raw_id if ch.isdigit())
                    if digits:
                        normalized_id = int(digits)
                if normalized_id is None or normalized_id not in complaint_map:
                    logger.warning("Skipping similar complaint with invalid id: %s", raw_id)
                    continue
                matches.append(
                    SimilarComplaint(
                        complaint_id=normalized_id,
                        similarity_score=float(match.get("similarity_score", 0.0)),
                        matched_keywords=match.get("matched_keywords", []),
                        resolution_summary=match.get("resolution_summary")
                    )
                )
            return matches[:top_k]
            
        except Exception as e:
            logger.error(f"Similar complaints search failed: {e}")
            return []
    
    async def generate_resolution_template(self, complaint: Complaint) -> str:
        """
        Generate a draft response template for admin to customize.
        
        Args:
            complaint: Complaint to generate response for
            
        Returns:
            Draft response text
        """
        if not self.client:
            return self._fallback_template()
        
        try:
            sentiment_text = ""
            if complaint.ai_insights and complaint.ai_insights.sentiment:
                sentiment_text = f"\nCustomer appears {complaint.ai_insights.sentiment.emotion}. Urgency: {complaint.ai_insights.sentiment.urgency_score}/100."
            
            prompt = f"""You are a customer service expert. Write a professional, empathetic response template for this complaint.

Complaint Details:
Text: {complaint.complaint_text}
Category: {complaint.category}
Priority: {complaint.priority.value}{sentiment_text}

Write a response that:
1. Acknowledges the customer's concern
2. Shows empathy
3. Provides next steps or solution
4. Sets expectations for resolution
5. Ends with a professional closing

Keep it concise (3-4 paragraphs). Use [PLACEHOLDER] for specific details the admin needs to fill in.

Response template:"""

            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.7,
                max_tokens=800
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Template generation failed: {e}")
            return self._fallback_template()
    
    def _fallback_template(self) -> str:
        """Return default template."""
        return """Dear Customer,

Thank you for bringing this to our attention. [PLACEHOLDER: Address specific concern]. We are working to resolve this issue. [PLACEHOLDER: Expected timeline].

Best regards,
Customer Support Team"""
    
    async def estimate_resolution_time(self, complaint: Complaint, historical_data: List[Complaint]) -> int:
        """
        Estimate resolution time in hours based on historical data.
        
        Args:
            complaint: Current complaint
            historical_data: Resolved complaints for pattern matching
            
        Returns:
            Estimated hours to resolution
        """
        try:
            # Filter to same category and priority
            similar = [
                c for c in historical_data
                if c.category == complaint.category 
                and c.priority == complaint.priority
                and c.resolution_time_hours is not None
            ]
            
            if not similar:
                # Fallback to priority-based estimates
                priority_estimates = {
                    "urgent": 4,
                    "normal": 48
                }
                return priority_estimates.get(complaint.priority.value, 48)
            
            # Calculate average resolution time
            avg_time = sum(c.resolution_time_hours for c in similar) / len(similar)
            
            return int(avg_time)
            
        except Exception as e:
            logger.error(f"Resolution time estimation failed: {e}")
            return 48  # Default 48 hours
    
    async def extract_tags(self, complaint: Complaint) -> List[str]:
        """
        Extract relevant tags/keywords from complaint text.
        
        Args:
            complaint: Complaint to extract tags from
            
        Returns:
            List of tag strings
        """
        if not self.client:
            return []
        
        try:
            prompt = f"""Extract 3-5 relevant tags/keywords from this complaint. Focus on:
- Product/service names
- Issue type (e.g., defect, delay, billing)
- Customer segment (if identifiable)
- Root cause keywords

Complaint:
{complaint.complaint_text}

Return ONLY a JSON array of strings: ["tag1", "tag2", "tag3"]"""

            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.4,
                max_tokens=200
            )
            
            tags = json.loads(response.choices[0].message.content)
            return tags if isinstance(tags, list) else []
            
        except Exception as e:
            logger.error(f"Tag extraction failed: {e}")
            return []
    
    async def get_full_insights(
        self, 
        complaint: Complaint,
        all_complaints: List[Complaint]
    ) -> AIInsights:
        """
        Generate comprehensive AI insights for a complaint.
        
        Args:
            complaint: Complaint to analyze
            all_complaints: All complaints for similarity matching
            
        Returns:
            Complete AIInsights object
        """
        try:
            # Run analyses
            sentiment = await self.analyze_sentiment(complaint.complaint_text)
            similar = await self.find_similar_complaints(complaint, all_complaints)
            template = await self.generate_resolution_template(complaint)
            estimated_time = await self.estimate_resolution_time(complaint, all_complaints)
            tags = await self.extract_tags(complaint)
            
            return AIInsights(
                sentiment=sentiment,
                similar_complaints=similar,
                suggested_category=complaint.category,
                suggested_priority=complaint.priority.value,
                suggested_assignee=None,
                resolution_template=template,
                estimated_resolution_time=estimated_time,
                tags=tags,
                analyzed_at=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Full insights generation failed: {e}")
            raise

    async def generate_root_cause_insights(self, complaints: List[Complaint]) -> List[RootCauseInsight]:
        """Generate root cause insights for the current complaint dataset."""
        if not complaints:
            self.last_root_cause_source = "fallback"
            return []

        if not self.client:
            logger.warning("AI client not available, using heuristic root cause analysis")
            return self._fallback_root_causes(complaints)

        try:
            category_counts = Counter((c.category or "Unclassified") for c in complaints)
            top_categories = category_counts.most_common(5)

            complaints_by_category: Dict[str, List[Complaint]] = {}
            for complaint in complaints:
                key = complaint.category or "Unclassified"
                complaints_by_category.setdefault(key, []).append(complaint)

            category_context = []
            for category, count in top_categories:
                related = complaints_by_category.get(category, [])
                negative = sum(
                    1
                    for c in related
                    if c.ai_insights
                    and c.ai_insights.sentiment
                    and c.ai_insights.sentiment.sentiment == "negative"
                )
                urgent = sum(
                    1
                    for c in related
                    if getattr(c.priority, "value", c.priority) == "urgent"
                )
                open_items = sum(
                    1
                    for c in related
                    if getattr(c.status, "value", c.status) != "Resolved"
                )
                examples = [
                    (c.source_metadata.email_subject or c.complaint_text)[:280]
                    for c in related[:2]
                    if c.complaint_text
                ]
                category_context.append(
                    {
                        "category": category,
                        "count": count,
                        "negative_sentiment": negative,
                        "urgent_cases": urgent,
                        "open_cases": open_items,
                        "example_snippets": examples,
                    }
                )

            context_payload = {
                "total_complaints": len(complaints),
                "top_categories": category_context,
            }

            prompt = (
                "You are an operations intelligence analyst. Using the dataset summary below, "
                "identify the top systemic root causes impacting customer experience. "
                "Return a JSON array where each item has the fields: "
                "issue (string), complaint_count (integer), departments (array of strings), "
                "severity (one of 'high', 'medium', 'low'), confidence (0-1 float), "
                "summary (short paragraph), and recommended_actions (array of concise action steps). "
                "Focus on actionable insights that leadership can assign to teams. "
                f"\n\nDATA SUMMARY:\n{json.dumps(context_payload, ensure_ascii=False)}\n\n"
                "Respond with JSON only."
            )

            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.4,
                max_tokens=1500,
            )

            raw_content = response.choices[0].message.content
            parsed = json.loads(raw_content)

            if isinstance(parsed, dict):
                items = parsed.get("root_causes") or parsed.get("items")
            else:
                items = parsed

            if not isinstance(items, list):
                logger.warning("AI returned unexpected root cause format: %s", type(parsed))
                return self._fallback_root_causes(complaints)

            insights: List[RootCauseInsight] = []
            for entry in items:
                if not isinstance(entry, dict):
                    continue
                departments_raw = entry.get("departments", [])
                if isinstance(departments_raw, str):
                    departments = [dept.strip() for dept in departments_raw.split(",") if dept.strip()]
                elif isinstance(departments_raw, list):
                    departments = [str(dept) for dept in departments_raw if str(dept).strip()]
                else:
                    departments = []

                recommended = entry.get("recommended_actions", [])
                if isinstance(recommended, str):
                    recommended_actions = [step.strip() for step in recommended.split(".") if step.strip()]
                elif isinstance(recommended, list):
                    recommended_actions = [str(step) for step in recommended if str(step).strip()]
                else:
                    recommended_actions = []

                try:
                    insights.append(
                        RootCauseInsight(
                            issue=entry.get("issue") or entry.get("title") or "Unknown issue",
                            complaint_count=int(entry.get("complaint_count", 0)),
                            departments=departments,
                            severity=str(entry.get("severity", "medium")).lower(),
                            confidence=float(entry.get("confidence", 0.75)),
                            summary=entry.get("summary") or entry.get("description") or "",
                            recommended_actions=recommended_actions,
                        )
                    )
                except Exception as exc:
                    logger.warning("Skipping invalid root cause entry: %s (%s)", entry, exc)

            if insights:
                self.last_root_cause_source = "ai"
                return insights[:5]

            logger.warning("AI returned empty root cause list, using fallback")
            return self._fallback_root_causes(complaints)

        except json.JSONDecodeError as decode_err:
            logger.error("Failed to parse root cause JSON: %s", decode_err)
            return self._fallback_root_causes(complaints)
        except Exception as exc:
            logger.error("Root cause generation failed: %s", exc, exc_info=True)
            return self._fallback_root_causes(complaints)

    async def generate_recommendations(self, complaints: List[Complaint]) -> List[Dict[str, any]]:
        """
        Generate AI-powered recommendations based on complaint patterns.
        
        Args:
            complaints: All complaints to analyze
            
        Returns:
            List of recommendation dictionaries with actionable insights
        """
        if not self.client:
            logger.warning("AI client not available, using fallback recommendations")
            return []
        
        try:
            # Prepare complaint statistics for AI analysis
            total = len(complaints)
            if total == 0:
                return []
            
            # Calculate key metrics
            stats = {
                "total_complaints": total,
                "by_status": {},
                "by_category": {},
                "by_priority": {},
                "avg_resolution_time": 0,
                "negative_sentiment_count": 0,
                "urgent_pending": 0
            }
            
            resolution_times = []
            for c in complaints:
                # Status distribution
                status_key = c.status.value if hasattr(c.status, 'value') else str(c.status)
                stats["by_status"][status_key] = stats["by_status"].get(status_key, 0) + 1
                
                # Category distribution
                cat = c.category or "Unclassified"
                stats["by_category"][cat] = stats["by_category"].get(cat, 0) + 1
                
                # Priority distribution
                priority_key = c.priority.value if hasattr(c.priority, 'value') else str(c.priority)
                stats["by_priority"][priority_key] = stats["by_priority"].get(priority_key, 0) + 1
                
                # Resolution time
                if c.resolution_time_hours:
                    resolution_times.append(c.resolution_time_hours)
                
                # Sentiment analysis
                if c.ai_insights and c.ai_insights.sentiment:
                    if c.ai_insights.sentiment.sentiment == "negative":
                        stats["negative_sentiment_count"] += 1
                
                # Urgent pending
                if priority_key == "urgent" and status_key != "resolved":
                    stats["urgent_pending"] += 1
            
            if resolution_times:
                stats["avg_resolution_time"] = sum(resolution_times) / len(resolution_times)
            
            # Build AI prompt
            prompt = f"""You are an expert business analyst specializing in customer service operations. 
Analyze the following complaint system metrics and provide 4-6 actionable recommendations to improve operations.

METRICS:
- Total Complaints: {stats['total_complaints']}
- Status Distribution: {json.dumps(stats['by_status'])}
- Category Distribution: {json.dumps(stats['by_category'])}
- Priority Distribution: {json.dumps(stats['by_priority'])}
- Average Resolution Time: {stats['avg_resolution_time']:.1f} hours
- Negative Sentiment: {stats['negative_sentiment_count']} ({stats['negative_sentiment_count']/total*100:.1f}%)
- Urgent Cases Pending: {stats['urgent_pending']}

Provide recommendations in JSON format as an array of objects with these fields:
- id: unique identifier (lowercase_with_underscores)
- title: Clear, actionable title (max 60 chars)
- description: Detailed explanation (2-3 sentences)
- priority: "high", "medium", or "low"
- impact: Quantified business impact (e.g., "Could improve X by Y%")
- estimated_effort: Time estimate (e.g., "1-2 weeks")
- category: "process", "resource", "training", "communication", or "analysis"
- confidence: float 0-1 (your confidence level)
- solution_steps: Array of 3-4 specific action items

Focus on:
1. Bottlenecks and inefficiencies
2. Resource allocation improvements
3. Process optimization opportunities
4. Proactive issue prevention
5. Customer satisfaction improvements

Respond ONLY with valid JSON array, no other text."""

            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse AI response
            recommendations = json.loads(response.choices[0].message.content)
            
            # Validate and return
            if isinstance(recommendations, list):
                logger.info(f"Generated {len(recommendations)} AI recommendations")
                return recommendations[:6]  # Limit to top 6
            else:
                logger.warning("AI returned non-list recommendations")
                return []
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI recommendations JSON: {e}")
            return []
        except Exception as e:
            logger.error(f"Recommendation generation failed: {e}")
            return []


# Singleton instance
enhanced_ai_service = EnhancedAIService()
