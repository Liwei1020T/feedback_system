from __future__ import annotations

import hashlib
import hmac
from typing import Final
import os
import bcrypt


_DIGEST_SALT: Final = "ai-complaint-system"
_BCRYPT_ROUNDS: Final = int(os.getenv("BCRYPT_ROUNDS", "12"))


def _legacy_hash(password: str) -> str:
    """Legacy deterministic salted SHA-256 hash (for migration only)."""
    salted = f"{_DIGEST_SALT}:{password}".encode("utf-8")
    return hashlib.sha256(salted).hexdigest()


def hash_password(password: str) -> str:
    """Hash password using bcrypt with configured cost."""
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify password supporting bcrypt and legacy hash for migration."""
    if hashed.startswith("$2b$") or hashed.startswith("$2a$"):
        try:
            return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
        except Exception:
            return False
    # Fallback to legacy comparison for non-bcrypt hashes
    candidate = _legacy_hash(password)
    return hmac.compare_digest(candidate, hashed)


def needs_rehash(hashed: str) -> bool:
    """Whether the stored hash should be upgraded to bcrypt."""
    return not (hashed.startswith("$2b$") or hashed.startswith("$2a$"))
