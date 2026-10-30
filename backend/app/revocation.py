"""
app/revocation.py
=================
Thread-safe and async-safe server-side session token revocation store.
Maintains revoked unique token IDs (jti) with automatic expiry cleanup.
"""

from __future__ import annotations

import asyncio
import time

# In-memory revocation registry: jti -> expiration_timestamp
_revoked_tokens: dict[str, float] = {}
_lock = asyncio.Lock()


async def revoke_token(jti: str, expires_at: float) -> None:
    """Register a token identifier as revoked until its natural expiry."""
    if not jti:
        return
    async with _lock:
        _cleanup_expired_revocations()
        _revoked_tokens[jti] = expires_at


async def is_token_revoked(jti: str) -> bool:
    """Check if a token identifier has been explicitly revoked."""
    if not jti:
        return False
    async with _lock:
        now = time.time()
        expiry = _revoked_tokens.get(jti)
        if expiry is None:
            return False
        if now > expiry:
            del _revoked_tokens[jti]
            return False
        return True


_MAX_REVOKED_KEYS = 50000


def _cleanup_expired_revocations() -> None:
    """Evict tokens whose expiration timestamp has passed and enforce capacity."""
    now = time.time()
    expired = [k for k, exp in _revoked_tokens.items() if now > exp]
    for k in expired:
        del _revoked_tokens[k]

    if len(_revoked_tokens) > _MAX_REVOKED_KEYS:
        excess = len(_revoked_tokens) - _MAX_REVOKED_KEYS
        for k in list(_revoked_tokens.keys())[:excess]:
            del _revoked_tokens[k]


def reset_revocation_store() -> None:
    """Clear all revocation entries (useful for test suites)."""
    _revoked_tokens.clear()
