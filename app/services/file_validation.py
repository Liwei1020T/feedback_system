from __future__ import annotations

import re
from typing import Optional


def _starts_with(data: bytes, prefix: bytes) -> bool:
    return len(data) >= len(prefix) and data[: len(prefix)] == prefix


def sniff_mime(data: bytes) -> Optional[str]:
    """Best-effort content-signature (magic number) detection for common types.

    Returns a MIME type string if recognized, otherwise None.
    """
    if not data:
        return None
    # PNG
    if _starts_with(data, b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    # JPEG
    if _starts_with(data, b"\xff\xd8\xff"):
        return "image/jpeg"
    # PDF
    if _starts_with(data, b"%PDF-"):
        return "application/pdf"
    # MP4 (ISO Base Media File) – 'ftyp' at offset 4
    if len(data) >= 12 and data[4:8] == b"ftyp":
        return "video/mp4"
    return None


_DANGEROUS_EXTENSIONS = {
    ".exe",
    ".bat",
    ".cmd",
    ".js",
    ".vbs",
    ".scr",
    ".com",
    ".dll",
    ".msi",
}


def has_dangerous_double_extension(filename: str) -> bool:
    """Detect dangerous double extensions like 'report.pdf.exe'."""
    name = filename.lower()
    # normalize path separators just in case
    name = name.replace("\\", "/").split("/")[-1]
    # if ends with a known dangerous extension and also has another dot earlier
    for ext in _DANGEROUS_EXTENSIONS:
        if name.endswith(ext) and name.count(".") >= 2:
            return True
    return False


_SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


def sanitize_filename(filename: str) -> str:
    """Return a filesystem-safe filename preserving basic characters."""
    base = filename.replace("\\", "/").split("/")[-1]
    base = _SAFE_NAME_RE.sub("_", base).strip("._")
    return base or "file"

