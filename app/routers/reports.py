from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta
from html import escape
from typing import List, Dict, Any
import re
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse, PlainTextResponse

from ..datastore import db
from ..dependencies import get_current_admin
from ..models import ComplaintStatus, Report, ReportPeriod
from ..schemas import SummaryRequest
from ..services import ai, analytics
from ..services.weekly_reports import weekly_report_service

router = APIRouter(prefix="/api/reports", tags=["Reports"])
logger = logging.getLogger(__name__)


def _period_range(period: ReportPeriod) -> tuple[datetime, datetime]:
    now = datetime.utcnow()
    if period == ReportPeriod.weekly:
        return now - timedelta(days=7), now
    if period == ReportPeriod.monthly:
        return now - timedelta(days=30), now
    return now - timedelta(days=365), now


def _strip_markdown(value: str) -> str:
    if not value:
        return ""
    # Remove basic markdown characters
    cleaned = re.sub(r"[*_`#>]+", "", value)
    # Collapse multiple spaces/newlines
    return re.sub(r"\s+", " ", cleaned).strip()


def _format_html_paragraphs(value: str) -> str:
    stripped_lines = [line.strip() for line in value.splitlines() if line.strip()]
    if not stripped_lines:
        return "<p>No summary available.</p>"
    paragraphs: List[str] = []
    index = 0
    total = len(stripped_lines)
    while index < total:
        line = stripped_lines[index]
        if line.startswith("- "):
            bullets: List[str] = []
            while index < total and stripped_lines[index].startswith("- "):
                bullets.append(escape(stripped_lines[index][2:].strip()))
                index += 1
            items = "".join(f"<li>{item}</li>" for item in bullets)
            paragraphs.append(f"<ul class=\"list-disc pl-6 space-y-1 text-slate-700\">{items}</ul>")
            continue
        paragraphs.append(f"<p class=\"text-slate-700 leading-relaxed\">{escape(line)}</p>")
        index += 1
    return "".join(paragraphs)


def _build_ai_report_html(
    *,
    period_label: str,
    summary_markdown: str,
    stats: Dict[str, int],
    category_breakdown: List[tuple[str, int]],
    key_issues: List[Dict[str, Any]],
    prevention: List[str],
    focus_areas: List[str],
) -> str:
    summary_section = _format_html_paragraphs(summary_markdown)
    prevention_items = "".join(f"<li>{escape(item)}</li>" for item in prevention) or "<li>No preventative actions suggested.</li>"
    focus_items = "".join(f"<li>{escape(item)}</li>" for item in focus_areas) or "<li>No focus areas identified.</li>"
    category_items = "".join(
        f"<li class=\"flex items-center justify-between\"><span>{escape(category)}</span><span class=\"font-semibold\">{count}</span></li>"
        for category, count in category_breakdown
    ) or "<li>No complaints recorded.</li>"
    key_issue_rows = "".join(
        "<tr>"
        f"<td>#{issue['complaint_id']}</td>"
        f"<td>{escape(issue['category'])}</td>"
        f"<td>{escape(issue['status'])}</td>"
        f"<td>{escape(issue['key_issue'])}</td>"
        f"<td>{round(issue['probability'] * 100)}%</td>"
        "</tr>"
        for issue in key_issues[:8]
    ) or "<tr><td colspan=\"5\" class=\"text-center text-slate-500\">No priority issues identified.</td></tr>"

    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>AI Weekly Report</title>
    <style>
      body {{ font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 32px; }}
      .card {{ background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08); margin-bottom: 24px; }}
      .muted {{ color: #64748b; }}
      .badge {{ display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }}
      .badge-primary {{ background: rgba(59,130,246,0.12); color: #1d4ed8; }}
      .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; margin-top: 20px; }}
      table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
      th, td {{ border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 13px; }}
      th {{ background-color: #f1f5f9; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; }}
      ul {{ margin: 0; padding-left: 18px; }}
      h2 {{ margin: 0 0 8px; font-size: 20px; }}
      h3 {{ margin: 24px 0 12px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }}
    </style>
  </head>
  <body>
    <div class="card">
      <span class="badge badge-primary">AI Generated</span>
      <h2>Complaint Insight Report</h2>
      <p class="muted">Period: {escape(period_label)}</p>
      {summary_section}
      <div class="grid">
        <div>
          <strong>Total Tickets</strong>
          <p style="font-size: 28px; margin: 4px 0;">{stats.get('total', 0)}</p>
          <p class="muted">Resolved: {stats.get('resolved', 0)} · Pending: {stats.get('pending', 0)}</p>
        </div>
        <div>
          <strong>Urgent</strong>
          <p style="font-size: 28px; margin: 4px 0;">{stats.get('urgent', 0)}</p>
          <p class="muted">Urgent share driven by {escape(category_breakdown[0][0] if category_breakdown else 'N/A')}.</p>
        </div>
        <div>
          <strong>Top Categories</strong>
          <ul>{category_items}</ul>
        </div>
      </div>
      <h3>Key Issues To Watch</h3>
      <table>
        <thead>
          <tr><th>ID</th><th>Category</th><th>Status</th><th>Main Issue</th><th>Confidence</th></tr>
        </thead>
        <tbody>{key_issue_rows}</tbody>
      </table>
      <h3>Preventative Actions</h3>
      <ul>{prevention_items}</ul>
      <h3>Focus Areas Next Cycle</h3>
      <ul>{focus_items}</ul>
    </div>
  </body>
</html>"""


@router.post("/generate", response_model=Report, status_code=status.HTTP_201_CREATED)
def generate_report(payload: SummaryRequest, _: dict = Depends(get_current_admin)):
    stats = analytics.dashboard_snapshot()
    complaints = db.list_complaints()
    summary_payload = ai.generate_summary(payload.period, complaints, stats)

    start, end = _period_range(payload.period)
    period_label = f"{start:%b %d, %Y} → {end:%b %d, %Y}"

    category_counts = Counter(complaint.category for complaint in complaints)
    top_categories = category_counts.most_common(5)
    serialized_categories = [
        {"category": name, "count": count} for name, count in top_categories
    ]

    key_issues_data = summary_payload.get("key_issues", []) or []
    key_issues: List[Dict[str, Any]] = []
    for item in key_issues_data:
        if not isinstance(item, dict):
            continue
        status_value = item.get("status")
        if isinstance(status_value, ComplaintStatus):
            status_value = status_value.value
        probability_raw = item.get("probability", 0.0)
        try:
            probability = float(probability_raw)
        except (TypeError, ValueError):
            probability = 0.0
        key_issues.append(
            {
                "complaint_id": int(item.get("complaint_id", 0)),
                "category": str(item.get("category", "Unclassified")).strip() or "Unclassified",
                "status": str(status_value or "Pending"),
                "key_issue": str(item.get("key_issue", "")).strip(),
                "probability": max(0.0, min(1.0, probability)),
            }
        )

    summary_markdown = str(summary_payload.get("summary", "")).strip()
    summary_text = _strip_markdown(summary_markdown) or "AI summary unavailable."
    prevention = [str(item).strip() for item in summary_payload.get("prevention_recommendations", []) if str(item).strip()]
    focus_areas = [str(item).strip() for item in summary_payload.get("focus_areas", []) if str(item).strip()]

    html_content = _build_ai_report_html(
        period_label=period_label,
        summary_markdown=summary_markdown or summary_text,
        stats=stats,
        category_breakdown=top_categories,
        key_issues=key_issues,
        prevention=prevention,
        focus_areas=focus_areas,
    )

    metadata: Dict[str, Any] = {
        "generated_at": datetime.utcnow().isoformat(),
        "period": payload.period.value,
        "period_label": period_label,
        "stats": stats,
        "summary_markdown": summary_markdown,
        "summary_plain": summary_text,
        "prevention_recommendations": prevention,
        "focus_areas": focus_areas,
        "key_issues": key_issues,
        "top_categories": serialized_categories,
    }

    report = db.create_report(
        period=payload.period,
        from_date=start,
        to_date=end,
        summary=summary_text,
        html_content=html_content,
        metadata=metadata,
    )
    return report


@router.get("/weekly", response_model=List[Report])
def list_weekly_reports(_: dict = Depends(get_current_admin)):
    reports = [report for report in db.list_reports() if report.period == ReportPeriod.weekly]
    reports.sort(key=lambda r: r.from_date, reverse=True)
    return reports


@router.get("/weekly/{report_id}")
def download_weekly_report(
    report_id: int,
    format: str = Query("html", pattern="^(html|text)$"),
    _: dict = Depends(get_current_admin),
):
    report = db.get_report(report_id)
    if not report or report.period != ReportPeriod.weekly:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if format == "text" or not report.html_content:
        return PlainTextResponse(
            report.summary,
            media_type="text/plain; charset=utf-8",
        )
    return HTMLResponse(
        content=report.html_content,
        media_type="text/html; charset=utf-8",
    )


@router.post("/weekly/generate-now", response_model=Report, status_code=status.HTTP_201_CREATED)
def generate_weekly_now(_: dict = Depends(get_current_admin)):
    """Generate last week's report immediately using the scheduler's logic.

    This path avoids AI dependencies and uses the templated weekly report gen
    implemented in weekly_report_service.
    """
    weekly_report_service.generate_and_send_weekly_reports()
    weekly_reports = [r for r in db.list_reports() if r.period == ReportPeriod.weekly]
    if not weekly_reports:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate weekly report")
    weekly_reports.sort(key=lambda r: r.from_date, reverse=True)
    return weekly_reports[0]


@router.get("/{report_id}", response_model=Report)
def get_report(report_id: int, _: dict = Depends(get_current_admin)):
    report = db.get_report(report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(report_id: int, _: dict = Depends(get_current_admin)):
    report = db.get_report(report_id)
    if not report:
        logger.warning(
            "delete_report_fallback_missing",
            extra={
                "report_id": report_id,
            },
        )
        # Treat as success so UI can recover gracefully (idempotent delete)
        return None
    db.delete_report(report_id)
    return None


@router.post("/{report_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_report_fallback(report_id: int, _: dict = Depends(get_current_admin)):
    logger = logging.getLogger(__name__)
    logger.info(
        "delete_report_fallback",
        extra={
            "report_id": report_id,
            "existing_ids": list(db.reports.keys()),
        },
    )
    report = db.get_report(report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    db.delete_report(report_id)
    return None
