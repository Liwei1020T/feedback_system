from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

from jinja2 import Environment, FileSystemLoader, TemplateNotFound, select_autoescape

TEMPLATES_DIR = Path("templates")


@lru_cache(maxsize=1)
def _jinja_env() -> Environment:
    env = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(["html", "xml"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    return env


@dataclass
class EmailContent:
    subject: str
    html: str
    text: str


def _fallback_plaintext(html: str) -> str:
    text = html
    text = re.sub(r"<br\\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</p\\s*>", "\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<head.*?>.*?</head>", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<style.*?>.*?</style>", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("&nbsp;", " ").strip()
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def render_email(template_name: str, context: Dict[str, Any]) -> EmailContent:
    env = _jinja_env()

    subject = context.get("subject", "AI Complaint Notification")

    try:
        html_template = env.get_template(f"email/{template_name}.html")
        html_body = html_template.render(**context)
    except TemplateNotFound:
        base = env.get_template("email/base.html")
        body = context.get("body", "")
        html_body = base.render(heading=context.get("heading"), subject=subject, body=body)

    try:
        text_template = env.get_template(f"email/{template_name}.txt")
        text_body = text_template.render(**context)
    except TemplateNotFound:
        base_text = env.get_template("email/base.txt")
        body_text = context.get("body_text") or _fallback_plaintext(html_body)
        text_body = base_text.render(heading=context.get("heading"), body_text=body_text)

    return EmailContent(subject=subject, html=html_body, text=text_body)
