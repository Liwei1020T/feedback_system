"""Enhanced analytics service with predictive insights."""
from __future__ import annotations

import logging
import statistics
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, Iterable, List, Optional

from ..config import settings
from ..models import (
    Complaint,
    TrendData,
    CategoryMetrics,
    AdminPerformance,
    PredictiveInsights,
    AdvancedAnalytics,
    DepartmentMetrics,
    AuditLog,
    ComplaintStatus,
    Priority,
)

logger = logging.getLogger(__name__)


class AdvancedAnalyticsService:
    """Enhanced analytics with predictive insights."""

    def _resolution_hours(self, complaint: Complaint) -> Optional[float]:
        if complaint.resolution_time_hours is not None:
            return float(complaint.resolution_time_hours)
        if complaint.resolved_at:
            return float((complaint.resolved_at - complaint.created_at).total_seconds() / 3600)
        return None

    def _sla_threshold(self, priority: Priority) -> Optional[float]:
        mapping = {
            Priority.normal: settings.sla_hours_normal,
            Priority.urgent: settings.sla_hours_urgent,
        }
        try:
            # Ensure priority can be coerced from raw str if needed
            priority_enum = priority if isinstance(priority, Priority) else Priority(priority)
        except Exception:
            priority_enum = Priority.normal
        value = mapping.get(priority_enum)
        return float(value) if value else None

    def _status_text(self, status: ComplaintStatus | str | None) -> str:
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

    @staticmethod
    def _extract_status_transition(details: Dict[str, Any]) -> tuple[Optional[str], Optional[str]]:
        if not details:
            return None, None
        keys = [
            ("from_status", "to_status"),
            ("previous_status", "new_status"),
            ("old_status", "status"),
        ]
        for from_key, to_key in keys:
            from_status = details.get(from_key)
            to_status = details.get(to_key)
            if from_status and to_status:
                return from_status, to_status
        if details.get("field", "").lower() == "status":
            return details.get("from"), details.get("to")
        if isinstance(details.get("status"), dict):
            status_dict = details["status"]
            return status_dict.get("from"), status_dict.get("to")
        return None, None

    def _reopen_counts(self, audit_logs: Optional[Iterable[AuditLog]]) -> Dict[int, int]:
        counts: Dict[int, int] = defaultdict(int)
        if not audit_logs:
            return counts
        for log in audit_logs:
            if log.entity_type != "complaint" or not log.entity_id:
                continue
            details = log.details or {}
            from_status, to_status = self._extract_status_transition(details)
            if not from_status or not to_status:
                continue
            if from_status.lower() == "resolved" and to_status.lower() != "resolved":
                counts[log.entity_id] += 1
        return counts
   
    def calculate_sentiment_score(self, complaint: Complaint) -> float:
        """Convert sentiment to numerical score (-1 to 1)."""
        if not complaint.ai_insights or not complaint.ai_insights.sentiment:
            return 0.0
        
        sentiment_map = {
            "positive": 1.0,
            "neutral": 0.0,
            "negative": -1.0
        }
        return sentiment_map.get(complaint.ai_insights.sentiment.sentiment, 0.0)
    
    def calculate_trends(
        self, 
        complaints: List[Complaint],
        days: int = 30
    ) -> List[TrendData]:
        """Calculate daily trend data for the past N days."""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Group complaints by date
        daily_data = defaultdict(lambda: {"count": 0, "resolution_times": [], "sentiments": []})
        
        for complaint in complaints:
            if complaint.created_at < start_date:
                continue
            
            date_key = complaint.created_at.date().isoformat()
            daily_data[date_key]["count"] += 1
            
            if complaint.resolution_time_hours:
                daily_data[date_key]["resolution_times"].append(complaint.resolution_time_hours)
            
            sentiment_score = self.calculate_sentiment_score(complaint)
            daily_data[date_key]["sentiments"].append(sentiment_score)
        
        # Generate trend data for all days (including zeros)
        trends = []
        current_date = start_date.date()
        while current_date <= end_date.date():
            date_str = current_date.isoformat()
            data = daily_data[date_str]
            
            avg_resolution = (
                statistics.mean(data["resolution_times"]) 
                if data["resolution_times"] else None
            )
            avg_sentiment = (
                statistics.mean(data["sentiments"]) 
                if data["sentiments"] else None
            )
            
            trends.append(TrendData(
                date=date_str,
                count=data["count"],
                avg_resolution_time=avg_resolution,
                sentiment_score=avg_sentiment
            ))
            
            current_date += timedelta(days=1)
        
        return trends
    
    def calculate_category_metrics(
        self, 
        complaints: List[Complaint]
    ) -> List[CategoryMetrics]:
        """Calculate metrics per category."""
        category_data = defaultdict(lambda: {
            "complaints": [],
            "resolved": 0,
            "resolution_times": [],
            "sentiments": []
        })
        
        for complaint in complaints:
            cat = complaint.category
            category_data[cat]["complaints"].append(complaint)
            
            if self._status_text(complaint.status) == "Resolved":
                category_data[cat]["resolved"] += 1
                if complaint.resolution_time_hours:
                    category_data[cat]["resolution_times"].append(complaint.resolution_time_hours)
            
            sentiment_score = self.calculate_sentiment_score(complaint)
            category_data[cat]["sentiments"].append(sentiment_score)
        
        metrics = []
        for category, data in category_data.items():
            count = len(data["complaints"])
            resolved = data["resolved"]
            
            avg_resolution = (
                statistics.mean(data["resolution_times"]) 
                if data["resolution_times"] else 0.0
            )
            resolution_rate = (resolved / count * 100) if count > 0 else 0.0
            avg_sentiment = (
                statistics.mean(data["sentiments"]) 
                if data["sentiments"] else 0.0
            )
            
            # Determine trend (simplified - compare recent vs older complaints)
            recent_count = len([c for c in data["complaints"] if (datetime.utcnow() - c.created_at).days <= 7])
            old_count = len([c for c in data["complaints"] if 7 < (datetime.utcnow() - c.created_at).days <= 14])
            
            trending = "stable"
            if old_count > 0:
                change = (recent_count - old_count) / old_count
                if change > 0.2:
                    trending = "up"
                elif change < -0.2:
                    trending = "down"
            
            metrics.append(CategoryMetrics(
                category=category,
                count=count,
                avg_resolution_time=avg_resolution,
                resolution_rate=resolution_rate,
                avg_sentiment_score=avg_sentiment,
                trending=trending
            ))
        
        return sorted(metrics, key=lambda x: x.count, reverse=True)
    
    def calculate_admin_performance(
        self, 
        complaints: List[Complaint]
    ) -> List[AdminPerformance]:
        """Calculate performance metrics per admin."""
        admin_data = defaultdict(lambda: {
            "assigned": [],
            "resolved": 0,
            "resolution_times": [],
            "first_response_times": []
        })
        
        for complaint in complaints:
            if not complaint.assigned_to:
                continue
            
            admin = complaint.assigned_to
            admin_data[admin]["assigned"].append(complaint)
            
            status_text = self._status_text(complaint.status)
            if status_text == "Resolved":
                admin_data[admin]["resolved"] += 1
                if complaint.resolution_time_hours:
                    admin_data[admin]["resolution_times"].append(complaint.resolution_time_hours)
            
            if complaint.first_response_at and complaint.created_at:
                response_time = (complaint.first_response_at - complaint.created_at).total_seconds() / 3600
                admin_data[admin]["first_response_times"].append(response_time)
        
        performance = []
        for admin_id, data in admin_data.items():
            assigned_count = len(data["assigned"])
            resolved_count = data["resolved"]
            
            avg_resolution = (
                statistics.mean(data["resolution_times"]) 
                if data["resolution_times"] else 0.0
            )
            avg_first_response = (
                statistics.mean(data["first_response_times"]) 
                if data["first_response_times"] else 0.0
            )
            resolution_rate = (resolved_count / assigned_count * 100) if assigned_count > 0 else 0.0
            
            performance.append(AdminPerformance(
                admin_id=admin_id,
                admin_name=f"Admin {admin_id}",  # TODO: Get from user store
                assigned_count=assigned_count,
                resolved_count=resolved_count,
                avg_resolution_time=avg_resolution,
                avg_first_response_time=avg_first_response,
                resolution_rate=resolution_rate
            ))
        
        return sorted(performance, key=lambda x: x.resolved_count, reverse=True)

    def calculate_department_stats(
        self,
        complaints: List[Complaint],
        *,
        departments: Optional[Iterable[str]] = None,
        audit_logs: Optional[Iterable[AuditLog]] = None,
    ) -> List[DepartmentMetrics]:
        """Aggregate metrics per department/category with SLA and reopen insights."""
        complaint_map: Dict[str, List[Complaint]] = defaultdict(list)
        for complaint in complaints:
            complaint_map[complaint.category].append(complaint)

        if departments:
            target_departments = sorted({dept for dept in departments})
        else:
            target_departments = sorted(complaint_map.keys())

        reopen_counts = self._reopen_counts(audit_logs)
        now = datetime.utcnow()
        results: List[DepartmentMetrics] = []

        for dept in target_departments:
            dept_complaints = complaint_map.get(dept, [])
            total = len(dept_complaints)
            resolved_items = [
                c
                for c in dept_complaints
                if getattr(c.status, "value", c.status) in {"Resolved", ComplaintStatus.resolved}
            ]
            pending_items = [
                c
                for c in dept_complaints
                if getattr(c.status, "value", c.status) in {"Pending", ComplaintStatus.pending}
            ]
            in_progress_items = [
                c
                for c in dept_complaints
                if getattr(c.status, "value", c.status) in {"In Progress", ComplaintStatus.in_progress}
            ]

            resolution_rate = (len(resolved_items) / total * 100.0) if total else 0.0

            resolution_times = [self._resolution_hours(c) for c in dept_complaints]
            resolution_times = [rt for rt in resolution_times if rt is not None]
            avg_resolution = statistics.mean(resolution_times) if resolution_times else 0.0

            first_response_times = []
            for complaint in dept_complaints:
                if complaint.first_response_at and complaint.created_at:
                    delta = (complaint.first_response_at - complaint.created_at).total_seconds() / 3600
                    first_response_times.append(delta)
            avg_first_response = statistics.mean(first_response_times) if first_response_times else 0.0

            backlog_ages = [
                (now - complaint.created_at).total_seconds() / 3600
                for complaint in dept_complaints
                if complaint.status in {ComplaintStatus.pending, ComplaintStatus.in_progress}
            ]
            avg_backlog_age = statistics.mean(backlog_ages) if backlog_ages else 0.0

            sla_considered = 0
            sla_breaches = 0
            for complaint in resolved_items:
                threshold = self._sla_threshold(complaint.priority)
                resolved_hours = self._resolution_hours(complaint)
                if threshold is None or resolved_hours is None:
                    continue
                sla_considered += 1
                if resolved_hours > threshold:
                    sla_breaches += 1

            sla_breach_rate = (sla_breaches / sla_considered * 100.0) if sla_considered else 0.0

            ever_resolved_ids = {
                complaint.id
                for complaint in dept_complaints
                if complaint.resolved_at or complaint in resolved_items
            }
            reopened_ids = {cid for cid in ever_resolved_ids if reopen_counts.get(cid, 0) > 0}
            reopen_rate = (len(reopened_ids) / len(ever_resolved_ids) * 100.0) if ever_resolved_ids else 0.0

            results.append(
                DepartmentMetrics(
                    department=dept,
                    total=total,
                    resolved=len(resolved_items),
                    pending=len(pending_items),
                    in_progress=len(in_progress_items),
                    resolution_rate=round(resolution_rate, 1),
                    avg_resolution_time_hours=round(avg_resolution, 1),
                    avg_first_response_hours=round(avg_first_response, 1),
                    sla_breach_rate=round(sla_breach_rate, 1),
                    reopen_rate=round(reopen_rate, 1),
                    avg_backlog_age_hours=round(avg_backlog_age, 1),
                )
            )

        return results
    
    def generate_predictive_insights(
        self, 
        complaints: List[Complaint],
        trends: List[TrendData]
    ) -> PredictiveInsights:
        """Generate AI-powered predictions."""
        try:
            # Predict next week's volume (simple average on trends)
            recent_counts = [t.count for t in trends[-14:]]  # Last 2 weeks
            if len(recent_counts) >= 7:
                avg_daily = statistics.mean(recent_counts[-7:])
                predicted_volume = int(avg_daily * 7)
            else:
                predicted_volume = len([c for c in complaints if (datetime.utcnow() - c.created_at).days <= 7])
            
            # Identify high-risk categories (high volume + negative sentiment)
            category_metrics = self.calculate_category_metrics(complaints)
            high_risk = [
                cm.category for cm in category_metrics
                if cm.count > 10 and cm.avg_sentiment_score < -0.3 and cm.trending == "up"
            ]
            
            # Recommended staffing (simplified)
            admin_performance = self.calculate_admin_performance(complaints)
            avg_workload = statistics.mean([ap.assigned_count for ap in admin_performance]) if admin_performance else 10
            recommended_staffing = {
                ap.admin_id: max(1, int(predicted_volume / len(admin_performance) / avg_workload))
                for ap in admin_performance
            }
            
            # Detect emerging issues (categories with sudden spikes)
            emerging = []
            for cm in category_metrics:
                if cm.trending == "up" and cm.count >= 5:
                    emerging.append({
                        "category": cm.category,
                        "recent_count": str(cm.count),
                        "severity": "high" if cm.avg_sentiment_score < -0.5 else "medium"
                    })
            
            return PredictiveInsights(
                predicted_volume_next_week=predicted_volume,
                high_risk_categories=high_risk[:5],
                recommended_staffing=recommended_staffing,
                emerging_issues=emerging[:5]
            )
            
        except Exception as e:
            logger.error(f"Predictive insights generation failed: {e}")
            return PredictiveInsights(
                predicted_volume_next_week=0,
                high_risk_categories=[],
                recommended_staffing={},
                emerging_issues=[]
            )
    
    async def get_advanced_analytics(
        self,
        complaints: List[Complaint],
        include_predictions: bool = True
    ) -> AdvancedAnalytics:
        """Generate comprehensive analytics dashboard."""
        # Calculate all metrics
        trends = self.calculate_trends(complaints, days=30)
        category_metrics = self.calculate_category_metrics(complaints)
        admin_performance = self.calculate_admin_performance(complaints)
        
        # Overview stats
        total_complaints = len(complaints)
        resolved = len([c for c in complaints if self._status_text(c.status) == "Resolved"])
        pending = len([c for c in complaints if self._status_text(c.status) == "Pending"])
        in_progress = len([c for c in complaints if self._status_text(c.status) == "In Progress"])
        
        resolution_times = [c.resolution_time_hours for c in complaints if c.resolution_time_hours]
        avg_resolution_time = statistics.mean(resolution_times) if resolution_times else 0.0
        
        sentiments = [self.calculate_sentiment_score(c) for c in complaints]
        avg_sentiment = statistics.mean(sentiments) if sentiments else 0.0
        
        overview = {
            "total_complaints": float(total_complaints),
            "resolved": float(resolved),
            "pending": float(pending),
            "in_progress": float(in_progress),
            "resolution_rate": (resolved / total_complaints * 100) if total_complaints > 0 else 0.0,
            "avg_resolution_time_hours": avg_resolution_time,
            "avg_sentiment_score": avg_sentiment
        }
        
        # Predictive insights (optional, can be expensive)
        predictive = None
        if include_predictions:
            predictive = self.generate_predictive_insights(complaints, trends)
        
        return AdvancedAnalytics(
            overview=overview,
            trends=trends,
            category_metrics=category_metrics,
            admin_performance=admin_performance,
            predictive_insights=predictive
        )


# Singleton instance
advanced_analytics_service = AdvancedAnalyticsService()
