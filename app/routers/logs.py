from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import get_current_admin

router = APIRouter(prefix="/api/logs", tags=["Logs"])

LOG_FILE = Path("logs/app.log")


@router.get("", response_model=dict)
def read_logs(_: dict = Depends(get_current_admin)) -> dict:
    if not LOG_FILE.exists():
        return {"content": ""}
    try:
        lines = LOG_FILE.read_text(encoding="utf-8").splitlines()[-500:]
        return {"content": "\n".join(lines)}
    except Exception as exc:  # pragma: no cover - filesystem errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to read application log.",
        ) from exc
