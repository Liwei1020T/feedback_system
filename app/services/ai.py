from __future__ import annotations

import json
import logging
import re
from collections import Counter
from datetime import datetime
from typing import Dict, Iterable, List, Optional, Union

try:
    import yaml
except ImportError:  # pragma: no cover - optional dependency
    yaml = None  # type: ignore[assignment]

try:
    from groq import Groq
except ImportError:  # pragma: no cover - fallback when package missing
    Groq = None  # type: ignore[assignment]

from ..config import settings
from ..models import Complaint, ComplaintKind, ComplaintStatus, Priority, ReportPeriod, Reply

logger = logging.getLogger(__name__)

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "HR": ["harass", "manager", "leave", "promotion", "hr", "appraisal", "discipline", "supervisor"],
    "Payroll": ["salary", "payroll", "bonus", "compensation", "paycheck", "overtime", "allowance"],
    "Facilities": [
        "office",
        "aircon",
        "facility",
        "maintenance",
        "clean",
        "restroom",
        "toilet",
        "elevator",
        "lift",
        "lighting",
        "door",
        "lock",
        "cafeteria",
        "pantry",
        "machine",
    ],
    "IT": ["computer", "login", "email", "vpn", "system", "password", "network", "printer", "software"],
    "Safety": [
        "injury",
        "unsafe",
        "accident",
        "danger",
        "safety",
        "emergency",
        "fire",
        "exit",
        "evacuation",
        "alarm",
        "hazard",
        "spill",
        "locked exit",
    ],
}

URGENT_KEYWORDS = [
    "immediately",
    "urgent",
    "asap",
    "critical",
    "danger",
    "threat",
    "emergency",
    "fire",
    "injury",
    "locked",
    "unsafe",
]

FEEDBACK_POSITIVE_KEYWORDS = [
    "thank",
    "thanks",
    "appreciate",
    "grateful",
    "great",
    "excellent",
    "awesome",
    "love",
    "happy",
    "well done",
    "kudos",
    "amazing",
]

FEEDBACK_SUGGESTION_KEYWORDS = [
    "suggest",
    "recommend",
    "could you",
    "would be great",
    "would love",
    "maybe consider",
    "feedback",
    "idea",
    "improve",
    "enhance",
    "appreciated if",
    "nice to have",
]

COMPLAINT_MARKERS = [
    "complain",
    "complaint",
    "issue",
    "problem",
    "not working",
    "broken",
    "delay",
    "missing",
    "escalate",
    "unacceptable",
    "frustrated",
    "angry",
    "breach",
    "fail",
    "failure",
    "defect",
]

ALLOWED_CATEGORIES = list(CATEGORY_KEYWORDS.keys()) + ["Unclassified"]


class AIUnavailableError(Exception):
    """Raised when the external AI provider cannot produce a response."""


_groq_client: Optional["Groq"] = None
if Groq and settings.groq_api_key:
    try:
        _groq_client = Groq(api_key=settings.groq_api_key)
        logger.info("Groq client initialized for model %s", settings.groq_model)
    except Exception as exc:  # pragma: no cover - init error path
        logger.warning("Failed to initialize Groq client: %s", exc)
        _groq_client = None
else:
    if not Groq:
        logger.warning("Groq SDK not installed; AI features disabled.")
    elif not settings.groq_api_key:
        logger.warning("Groq API key not configured; AI features disabled.")


def get_groq_client() -> Optional["Groq"]:
    """Expose the cached Groq client for modules that need raw access."""
    return _groq_client


def _match_keywords(text: str, keywords: Iterable[str]) -> int:
    pattern = "|".join(map(re.escape, keywords))
    return len(re.findall(pattern, text, flags=re.IGNORECASE)) if pattern else 0


def _strip_code_fence(payload: str) -> str:
    value = payload.strip()
    if value.startswith("```"):
        value = re.sub(r"^```(?:json)?", "", value, count=1).strip()
        if value.endswith("```"):
            value = value[:-3].strip()
    return value


def _sanitize_json_candidate(candidate: str) -> str:
    cleaned = _strip_code_fence(candidate)
    cleaned = (
        cleaned.replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2018", "'")
        .replace("\u2019", "'")
    )
    # Remove trailing commas before closing braces/brackets.
    while True:
        updated = re.sub(r",(\s*[}\]])", r"\1", cleaned)
        if updated == cleaned:
            break
        cleaned = updated
    return _escape_unescaped_newlines(cleaned.strip())


def _escape_unescaped_newlines(value: str) -> str:
    result: List[str] = []
    in_string = False
    escape_next = False
    i = 0
    while i < len(value):
        char = value[i]
        if escape_next:
            result.append(char)
            escape_next = False
            i += 1
            continue
        if char == "\\":
            result.append(char)
            escape_next = True
            i += 1
            continue
        if char == '"':
            in_string = not in_string
            result.append(char)
            i += 1
            continue
        if in_string and char in ("\n", "\r"):
            # Collapse Windows line endings to a single escaped newline.
            if char == "\r" and i + 1 < len(value) and value[i + 1] == "\n":
                i += 1
            result.append("\\n")
            i += 1
            continue
        result.append(char)
        i += 1
    return "".join(result)


def _normalise_category(value: object, fallback: str = "Unclassified") -> str:
    if isinstance(value, str):
        candidate = value.strip()
        if candidate:
            lowered = candidate.lower()
            for category in ALLOWED_CATEGORIES:
                if category.lower() == lowered:
                    return category
            for category in ALLOWED_CATEGORIES:
                if category.lower() in lowered:
                    return category
    return fallback


def _parse_json_payload(content: str) -> Optional[Dict[str, object]]:
    candidates: List[str] = []
    primary = _sanitize_json_candidate(content)
    if primary:
        candidates.append(primary)

    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", content, flags=re.DOTALL)
    if fenced:
        candidates.append(_sanitize_json_candidate(fenced.group(1)))

    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidates.append(_sanitize_json_candidate(content[start : end + 1]))

    decoder = json.JSONDecoder()
    for candidate in candidates:
        if not candidate:
            continue
        cleaned = candidate.strip()
        try:
            obj, _ = decoder.raw_decode(cleaned)
            return obj  # type: ignore[return-value]
        except json.JSONDecodeError as exc:
            logger.warning("Groq JSON decode error: %s | preview=%s", exc, candidate[:120])
            try:
                from pathlib import Path

                Path("logs").mkdir(exist_ok=True)
                Path("logs/groq_last_response.json").write_text(candidate, encoding="utf-8")
            except Exception:  # pragma: no cover - best effort debug write
                pass
            if yaml:
                try:
                    loaded = yaml.safe_load(candidate)
                    if isinstance(loaded, dict):
                        return loaded
                except Exception as yaml_exc:  # pragma: no cover - broad because yaml errors vary
                    logger.warning("Groq YAML decode error: %s", yaml_exc)
            continue
    return None


def _invoke_groq(
    prompt: str,
    *,
    expect_json: bool,
    temperature: float,
    max_tokens: int,
    system_prompt: str = "You are a helpful assistant that follows instructions precisely.",
) -> Optional[Union[str, Dict[str, object]]]:
    if not _groq_client:
        return None

    try:
        messages: List[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = _groq_client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if not response.choices:
            return None
        content = (response.choices[0].message.content or "").strip()
        if not content:
            return None
        if expect_json:
            parsed = _parse_json_payload(content)
            if parsed is not None:
                return parsed
            logger.warning("Groq JSON parse failed; content preview: %s", content[:200])
            return None
        return content
    except Exception as exc:
        logger.warning("Groq call failed: %s", exc)
        return None


def _call_groq_json(prompt: str) -> Optional[Dict[str, object]]:
    data = _invoke_groq(prompt, expect_json=True, temperature=0.2, max_tokens=1200)
    return data if isinstance(data, dict) else None


def _call_groq_text(prompt: str) -> Optional[str]:
    result = _invoke_groq(prompt, expect_json=False, temperature=0.4, max_tokens=900)
    if isinstance(result, str):
        return result
    return None


def _classification_prompt(complaint_text: str) -> str:
    return (
        "You are an HR operations assistant. Analyse the complaint below and classify it.\n"
        "Return a JSON object with fields: kind (complaint or feedback), kind_confidence (0.0-1.0), "
        "category (one of HR, Payroll, Facilities, IT, Safety, Unclassified), priority (normal or urgent), "
        "confidence (0.0-1.0), reasoning (short sentence).\n"
        "Always choose the most likely category; only use Unclassified when there is no information at all. "
        "If you are uncertain, select the closest match and reflect that with a lower confidence value.\n"
        f"Complaint: \"\"\"{complaint_text.strip()}\"\"\"\n"
        "JSON:"
    )


def _category_suggestions_prompt(complaint_text: str) -> str:
    allowed = ", ".join(ALLOWED_CATEGORIES)
    return (
        "You are an HR triage assistant helping classify employee complaints.\n"
        "Analyse the text and propose up to five category suggestions ordered by likelihood.\n"
        "Return JSON with key `suggestions` (array) where each item has:\n"
        "- category (one of: " + allowed + ")\n"
        "- probability (0-1 confidence)\n"
        "- reasoning (short justification)\n"
        "Do not include duplicate categories. Choose the closest valid category rather than inventing new ones; if the "
        "text is vague, pick the nearest fit and lower the probability instead of returning 'Unclassified'.\n"
        f"Complaint text: \"\"\"{complaint_text.strip()}\"\"\"\n"
        "JSON:"
    )


def _compute_category_scores(complaint_text: str) -> Dict[str, int]:
    normalized = complaint_text.lower()
    return {
        category: _match_keywords(normalized, keywords)
        for category, keywords in CATEGORY_KEYWORDS.items()
    }


def _normalise_kind(value: Optional[str], fallback: ComplaintKind) -> ComplaintKind:
    if not value:
        return fallback
    cleaned = str(value).strip().lower()
    if cleaned.startswith("feed"):
        return ComplaintKind.feedback
    if cleaned.startswith("complaint") or cleaned == "complain":
        return ComplaintKind.complaint
    try:
        return ComplaintKind(cleaned)
    except ValueError:
        return fallback


def _heuristic_kind(complaint_text: str, category_scores: Dict[str, int]) -> Dict[str, object]:
    normalized = complaint_text.lower()
    positive_hits = _match_keywords(normalized, FEEDBACK_POSITIVE_KEYWORDS)
    suggestion_hits = _match_keywords(normalized, FEEDBACK_SUGGESTION_KEYWORDS)
    feedback_hits = positive_hits + suggestion_hits
    complaint_hits = _match_keywords(normalized, COMPLAINT_MARKERS)
    urgent_hits = _match_keywords(normalized, URGENT_KEYWORDS)
    category_total = sum(category_scores.values())
    negative_strength = complaint_hits + urgent_hits + category_total

    if feedback_hits >= 2 and negative_strength == 0:
        confidence = min(0.9, 0.55 + 0.08 * feedback_hits)
        return {
            "kind": ComplaintKind.feedback,
            "kind_confidence": round(confidence, 2),
            "kind_reason": "Detected positive or appreciation language without issue indicators.",
        }

    if negative_strength > feedback_hits:
        confidence = min(0.95, 0.55 + 0.07 * negative_strength)
        return {
            "kind": ComplaintKind.complaint,
            "kind_confidence": round(confidence, 2),
            "kind_reason": "Detected issue or urgency language consistent with a complaint.",
        }

    if feedback_hits > 0 and complaint_hits == 0 and urgent_hits == 0:
        return {
            "kind": ComplaintKind.feedback,
            "kind_confidence": 0.65,
            "kind_reason": "Positive or suggestion phrasing outweighs issue indicators.",
        }

    return {
        "kind": ComplaintKind.complaint,
        "kind_confidence": 0.6 if negative_strength else 0.5,
        "kind_reason": "Defaulting to complaint due to mixed or limited signals.",
    }


def _heuristic_classification(complaint_text: str) -> Dict[str, object]:
    category_scores = _compute_category_scores(complaint_text)
    category = max(category_scores, key=category_scores.get)
    max_score = category_scores[category]

    if max_score == 0:
        category = "Unclassified"
        confidence = 0.35
        reasoning = "No keyword matches found; defaulting to manual review."
    else:
        confidence = min(0.92, 0.55 + 0.07 * max_score)
        reasoning = f"Detected keywords matching {category} category."

    priority = Priority.urgent if _match_keywords(complaint_text.lower(), URGENT_KEYWORDS) else Priority.normal
    if category == "Unclassified":
        priority = Priority.normal

    kind_info = _heuristic_kind(complaint_text, category_scores)

    return {
        "category": category,
        "priority": priority,
        "confidence": round(confidence, 2),
        "reasoning": reasoning,
        "score": max_score,
        "kind": kind_info["kind"],
        "kind_confidence": kind_info["kind_confidence"],
        "kind_reason": kind_info["kind_reason"],
    }


def classify_complaint(complaint_text: str) -> Dict[str, object]:
    """Run complaint classification through Groq; blend with heuristics when confidence is low."""
    heuristic = _heuristic_classification(complaint_text)
    final_category = heuristic["category"]
    final_priority = heuristic["priority"]
    final_confidence = heuristic["confidence"]
    reason_parts = [heuristic["reasoning"]]
    final_kind: ComplaintKind = heuristic["kind"]
    final_kind_conf = heuristic["kind_confidence"]
    final_kind_reason = heuristic["kind_reason"]

    result = _call_groq_json(_classification_prompt(complaint_text))
    if result:
        try:
            category = str(result.get("category", "Unclassified"))
            priority_value = str(result.get("priority", "normal")).lower()
            ai_priority = Priority.urgent if priority_value == "urgent" else Priority.normal
            confidence = float(result.get("confidence", final_confidence))
            ai_reasoning = str(result.get("reasoning", "AI classification"))
            ai_kind = _normalise_kind(result.get("kind"), final_kind)
            ai_kind_conf = _sanitize_probability(result.get("kind_confidence"), fallback=final_kind_conf)

            final_category = (
                category if category in CATEGORY_KEYWORDS or category == "Unclassified" else "Unclassified"
            )
            final_priority = ai_priority
            final_confidence = round(confidence, 2)
            reason_parts = [ai_reasoning]
            final_kind = ai_kind
            final_kind_conf = max(ai_kind_conf, 0.01)
            final_kind_reason = f"AI classified as {ai_kind.value}."

            if (
                (final_category == "Unclassified" or final_confidence < 0.6)
                and heuristic["category"] != "Unclassified"
            ):
                final_category = heuristic["category"]
                final_priority = heuristic["priority"]
                final_confidence = round(max(final_confidence, heuristic["confidence"], 0.68), 2)
                reason_parts.append(f"Heuristic reinforcement: {heuristic['reasoning']}")

            if heuristic["priority"] == Priority.urgent and final_priority != Priority.urgent:
                final_priority = Priority.urgent
                reason_parts.append("Heuristic override: flagged urgent keywords.")

            if final_kind != heuristic["kind"]:
                if final_kind_conf + 0.05 < heuristic["kind_confidence"]:
                    final_kind = heuristic["kind"]
                    final_kind_conf = heuristic["kind_confidence"]
                    final_kind_reason = f"Heuristic override: {heuristic['kind_reason']}"
                else:
                    final_kind_reason = (
                        f"AI suggested {final_kind.value} ({final_kind_conf:.2f}) "
                        f"vs heuristic {heuristic['kind'].value} ({heuristic['kind_confidence']:.2f})."
                    )
            else:
                final_kind_conf = round(max(final_kind_conf, heuristic["kind_confidence"]), 2)
                final_kind_reason = f"AI and heuristic agree on {final_kind.value}."
        except Exception as exc:
            logger.warning("Failed to parse Groq classification result: %s", exc)

    final_reasoning = " | ".join(part for part in reason_parts if part)
    if final_kind_reason:
        final_reasoning = f"{final_reasoning} | {final_kind_reason}" if final_reasoning else final_kind_reason

    return {
        "kind": final_kind,
        "kind_confidence": round(final_kind_conf, 2),
        "category": final_category,
        "priority": final_priority,
        "confidence": round(final_confidence, 2),
        "reasoning": final_reasoning,
    }


def suggest_categories(complaint_text: str) -> List[Dict[str, object]]:
    heuristic_scores = _compute_category_scores(complaint_text)
    results: List[Dict[str, object]] = []
    seen: set[str] = set()

    ai_payload = _call_groq_json(_category_suggestions_prompt(complaint_text))
    if ai_payload:
        raw_suggestions = ai_payload.get("suggestions") or ai_payload.get("categories")
        if isinstance(raw_suggestions, list):
            for item in raw_suggestions:
                if not isinstance(item, dict):
                    continue
                category = _normalise_category(item.get("category"), fallback="Unclassified")
                if category in seen:
                    continue
                probability = _sanitize_probability(item.get("probability"), fallback=0.4)
                reasoning = str(item.get("reasoning", "AI generated suggestion")).strip()
                results.append(
                    {
                        "category": category,
                        "keyword_hits": heuristic_scores.get(category, 0),
                        "confidence": probability,
                        "reasoning": reasoning or "AI generated suggestion",
                    }
                )
                seen.add(category)

    heuristic_sorted = sorted(heuristic_scores.items(), key=lambda item: item[1], reverse=True)
    for category, score in heuristic_sorted:
        if category in seen:
            continue
        confidence = 0.3 + 0.1 * score if score > 0 else 0.2
        results.append(
            {
                "category": category,
                "keyword_hits": score,
                "confidence": round(min(confidence, 0.95), 2),
                "reasoning": "Matched keywords" if score > 0 else "No direct keyword match",
            }
        )
        seen.add(category)
        if len(results) >= 5:
            break

    results.sort(key=lambda item: item["confidence"], reverse=True)
    return results[:5]


def _summary_prompt(period: ReportPeriod, complaints: List[Complaint], stats: Dict[str, int]) -> str:
    sample = "\n".join(
        f"- #{c.id} [{c.category}] ({c.status}) priority={c.priority}: {c.complaint_text[:140]}..."
        for c in complaints[:5]
    )
    categories = Counter(c.category for c in complaints)
    category_breakdown = ", ".join(f"{k}: {v}" for k, v in categories.items()) or "No complaints logged"
    return (
        "You are an HR analytics and compliance specialist. Provide the following as JSON with keys:\n"
        "- summary (markdown string summarising overall trends)\n"
        "- key_issues (array of objects with fields complaint_id (int), category (best-guess among HR/Payroll/"
        "Facilities/IT/Safety/Unclassified), status (original status text), key_issue (concise sentence outlining the"
        " main issue), probability (0-1 confidence for the chosen category))\n"
        "- prevention_recommendations (array of strings)\n"
        "- focus_areas (array of strings)\n"
        "Always provide a best-guess category even if the original record was unclassified; use a low probability when"
        " confidence is limited.\n"
        f"Period: {period.value}\n"
        f"Total complaints: {stats.get('total', len(complaints))}\n"
        f"Resolved: {stats.get('resolved', 0)} | Pending: {stats.get('pending', 0)} | Urgent: {stats.get('urgent', 0)}\n"
        f"Category breakdown: {category_breakdown}\n"
        f"Recent complaints sample:\n{sample if sample else 'No sample available'}\n"
        "Offer tailored preventative recommendations across relevant teams and highlight up to three focus areas."
    )


def _resolve_status(value: object, fallback: ComplaintStatus) -> ComplaintStatus:
    if isinstance(value, ComplaintStatus):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        for status in ComplaintStatus:
            if status.value.lower() == normalized:
                return status
    return fallback


def _sanitize_probability(value: object, fallback: float = 0.5) -> float:
    try:
        prob = float(value)
    except (TypeError, ValueError):
        prob = fallback
    return round(min(max(prob, 0.0), 1.0), 2)


def _extract_key_issues_from_ai(
    raw_items: object,
    complaints: List[Complaint],
) -> List[Dict[str, object]]:
    complaint_lookup = {complaint.id: complaint for complaint in complaints}
    key_issues: List[Dict[str, object]] = []
    if not isinstance(raw_items, list):
        return key_issues
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        complaint_id = item.get("complaint_id")
        try:
            complaint_id = int(complaint_id)
        except (TypeError, ValueError):
            continue
        complaint = complaint_lookup.get(complaint_id)
        fallback_status = complaint.status if complaint else ComplaintStatus.pending
        status_value = _resolve_status(item.get("status"), fallback_status)
        category = str(item.get("category") or (complaint.category if complaint else "Unclassified")).strip() or "Unclassified"
        key_issue_text = str(item.get("key_issue", "")).strip()
        if not key_issue_text and complaint:
            truncated = complaint.complaint_text.strip()
            key_issue_text = (truncated[:200] + "...") if len(truncated) > 200 else truncated
        probability = _sanitize_probability(item.get("probability"), fallback=complaint.ai_confidence if complaint and complaint.ai_confidence else 0.5)
        key_issues.append(
            {
                "complaint_id": complaint_id,
                "kind": complaint.kind if complaint else ComplaintKind.complaint,
                "category": category,
                "status": status_value,
                "key_issue": key_issue_text,
                "probability": probability,
            }
        )
    return key_issues


def _fallback_key_issues(complaints: List[Complaint]) -> List[Dict[str, object]]:
    issues: List[Dict[str, object]] = []
    for complaint in complaints:
        heuristic = _heuristic_classification(complaint.complaint_text)
        summary_text = complaint.complaint_text.strip()
        if len(summary_text) > 200:
            summary_text = summary_text[:200] + "..."
        issues.append(
            {
                "complaint_id": complaint.id,
                "kind": complaint.kind,
                "category": heuristic["category"],
                "status": complaint.status,
                "key_issue": summary_text or heuristic["reasoning"],
                "probability": _sanitize_probability(heuristic.get("confidence", 0.5)),
            }
        )
    return issues


def _complaint_summary_prompt(complaint: Complaint) -> str:
    return (
        "You are an expert HR analyst. Read the complaint and provide insight.\n"
        "Return JSON with keys:\n"
        "- summary (2-3 sentence plain-language overview of the key issue)\n"
        "- category (best guess among HR, Payroll, Facilities, IT, Safety)\n"
        "- probability (0-1 confidence for that category)\n"
        "If the complaint is vague, choose the closest matching category and lower the probability rather than "
        "responding with Unclassified.\n"
        f"Complaint ID: {complaint.id}\n"
        f"Existing category: {complaint.category}\n"
        f"Status: {complaint.status}\n"
        f"Priority: {complaint.priority}\n"
        f"Text: \"\"\"{complaint.complaint_text.strip()}\"\"\"\n"
        "JSON:"
    )


def summarize_complaint(complaint: Complaint) -> Dict[str, object]:
    data = _call_groq_json(_complaint_summary_prompt(complaint))
    heuristic = _heuristic_classification(complaint.complaint_text)
    heuristic_summary = complaint.complaint_text.strip()
    if len(heuristic_summary) > 400:
        heuristic_summary = heuristic_summary[:400] + "..."
    if data:
        category = str(data.get("category") or complaint.category or heuristic["category"]).strip() or heuristic["category"]
        probability = _sanitize_probability(
            data.get("probability"),
            fallback=complaint.ai_confidence if complaint.ai_confidence else heuristic["confidence"],
        )
        if probability < 0.3 and heuristic["confidence"] > probability:
            category = heuristic["category"]
            probability = heuristic["confidence"]
        summary_text = str(data.get("summary", "")).strip() or heuristic_summary
        return {
            "complaint_id": complaint.id,
            "category": category,
            "probability": probability,
            "summary": summary_text,
        }
    return {
        "complaint_id": complaint.id,
        "category": heuristic["category"],
        "probability": heuristic["confidence"],
        "summary": heuristic_summary or heuristic["reasoning"],
    }


def generate_summary(
    period: ReportPeriod,
    complaints: List[Complaint],
    stats: Dict[str, int],
) -> Dict[str, object]:
    data = _call_groq_json(_summary_prompt(period, complaints, stats))
    if data:
        key_issues = _extract_key_issues_from_ai(data.get("key_issues"), complaints)
        if not key_issues:
            key_issues = _fallback_key_issues(complaints)
        return {
            "summary": str(data.get("summary", "")).strip(),
            "prevention_recommendations": [
                str(item).strip() for item in data.get("prevention_recommendations", [])
            ][:5],
            "focus_areas": [str(item).strip() for item in data.get("focus_areas", [])][:3],
            "key_issues": key_issues,
        }

    total = stats.get("total", len(complaints))
    resolved = stats.get("resolved", 0)
    pending = stats.get("pending", 0)
    urgent = stats.get("urgent", 0)

    categories = Counter(c.category for c in complaints)
    top_category, top_count = ("None", 0)
    if categories:
        top_category, top_count = categories.most_common(1)[0]

    summary_lines = [
        f"Executive summary for {period.value.capitalize()} period ending {datetime.utcnow():%Y-%m-%d}:",
        f"- Processed {total} complaints with {resolved} resolved and {pending} awaiting action.",
        f"- Urgent workload represents {urgent} cases; primary category trend: {top_category} ({top_count}).",
        "- Recommended next actions: prioritise urgent queue, notify department leads, audit AI classifications.",
    ]
    fallback_prevention = [
        "Coordinate a focused remediation plan for the leading complaint category.",
        "Communicate preventative guidance with clear owners and deadlines.",
        "Track improvements via weekly checkpoints and adjust resources accordingly.",
    ]
    fallback_focus = [
        f"{top_category} incidents" if top_category != "None" else "Emerging complaint categories",
        "Urgent ticket turnaround time",
        "Effectiveness of preventative communications",
    ]
    key_issues = _fallback_key_issues(complaints)
    return {
        "summary": "\n".join(summary_lines),
        "prevention_recommendations": fallback_prevention,
        "focus_areas": fallback_focus,
        "key_issues": key_issues,
    }


def _assistance_prompt(complaint: Complaint, replies: List[Reply]) -> str:
    previous = "\n".join(
        f"- Reply #{reply.id} (sent={'yes' if reply.email_sent else 'no'}): {reply.reply_text[:200]}"
        for reply in replies[:5]
    ) or "No previous replies."
    return (
        "You are an experienced HR support specialist helping admins craft responses to employee complaints.\n"
        "Return JSON with keys recommended_actions (array of strings), suggested_reply (plain text), tone (string).\n"
        "Provide concrete actions tailored to the complaint, and keep the suggested reply professional and empathetic.\n"
        f"Complaint text: \"\"\"{complaint.complaint_text}\"\"\"\n"
        f"Category: {complaint.category}\n"
        f"Priority: {complaint.priority}\n"
        f"Status: {complaint.status}\n"
        f"Historical replies:\n{previous}\n"
        "JSON:"
    )


def generate_reply_assistance(complaint: Complaint, replies: List[Reply]) -> Dict[str, object]:
    data = _call_groq_json(_assistance_prompt(complaint, replies))
    if data:
        recommendations = data.get("recommended_actions") or []
        if isinstance(recommendations, str):
            recommendations = [recommendations]
        return {
            "recommended_actions": [str(item).strip() for item in recommendations][:5],
            "suggested_reply": str(data.get("suggested_reply", "")).strip(),
            "tone": str(data.get("tone", "supportive")).strip() or "supportive",
            "source": "groq",
        }
    raise AIUnavailableError("Groq reply assistance failed")
