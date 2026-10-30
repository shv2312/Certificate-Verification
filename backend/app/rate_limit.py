"""
app/rate_limit.py
=================
Thread-safe and async-safe in-memory sliding-window rate limiter.
Does not require external infrastructure (Redis/Memcached).
Supports bypassing during test execution via bypass_rate_limiting flag.
"""

from __future__ import annotations

import asyncio
import time
from collections import defaultdict
from typing import Callable
from fastapi import HTTPException, Request, status

# In-memory storage: key -> list of float timestamps (monotonic)
_request_records: dict[str, list[float]] = defaultdict(list)
_lock = asyncio.Lock()

# Global flag to bypass rate limiting during automated test suites
_bypass_rate_limiting: bool = False

# Maximum unique keys stored in memory before enforcing immediate cleanup
_MAX_STORED_KEYS = 10000


def set_bypass_rate_limiting(bypass: bool) -> None:
    """Enable or disable rate limiting globally (e.g. for pytest suites)."""
    global _bypass_rate_limiting
    _bypass_rate_limiting = bypass


def reset_rate_limiter() -> None:
    """Clear all recorded rate limit hits."""
    _request_records.clear()


def _prune_expired_records(current_time: float, window_seconds: int) -> None:
    """Remove expired records and maintain memory bounds."""
    cutoff = current_time - window_seconds
    expired_keys = [
        k for k, timestamps in _request_records.items()
        if not timestamps or timestamps[-1] <= cutoff
    ]
    for k in expired_keys:
        del _request_records[k]

    # If still above capacity, evict oldest entries
    if len(_request_records) > _MAX_STORED_KEYS:
        excess = len(_request_records) - _MAX_STORED_KEYS
        # Evict excess keys
        keys_to_remove = list(_request_records.keys())[:excess]
        for k in keys_to_remove:
            del _request_records[k]


def RateLimiter(max_requests: int, window_seconds: int) -> Callable:
    """
    Factory creating a FastAPI dependency that enforces IP-based rate limiting.

    Args:
        max_requests: Maximum requests allowed in the time window.
        window_seconds: Window duration in seconds.

    Raises:
        HTTPException 429 when client exceeds limit, including Retry-After header.
    """
    async def dependency(request: Request) -> None:
        if _bypass_rate_limiting:
            return

        from app.config import get_settings
        settings = get_settings()

        # Determine client IP address securely
        client_ip = None
        if getattr(settings, "TRUST_PROXY_HEADERS", False):
            forwarded_for = request.headers.get("X-Forwarded-For")
            if forwarded_for:
                # In trusted proxy configurations, the rightmost IP before trusted proxies
                # or the primary client IP is inspected. Extract the immediate client IP.
                ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()]
                if ips:
                    client_ip = ips[0]

        if not client_ip and request.client:
            client_ip = request.client.host

        key = f"{request.url.path}:{client_ip or 'unknown'}"
        now = time.monotonic()

        async with _lock:
            # Enforce periodic memory pruning if tracking map grows large
            if len(_request_records) > _MAX_STORED_KEYS:
                _prune_expired_records(now, window_seconds)

            # Clean expired timestamps outside the sliding window
            cutoff = now - window_seconds
            timestamps = [ts for ts in _request_records[key] if ts > cutoff]

            if len(timestamps) >= max_requests:
                earliest = timestamps[0]
                retry_after = max(1, int(window_seconds - (now - earliest)))
                _request_records[key] = timestamps
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "success": False,
                        "message": "Rate limit exceeded. Try again later.",
                        "error_code": "RATE_LIMIT_EXCEEDED",
                    },
                    headers={"Retry-After": str(retry_after)},
                )

            timestamps.append(now)
            _request_records[key] = timestamps

    return dependency
