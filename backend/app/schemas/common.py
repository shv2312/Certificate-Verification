"""
app/schemas/common.py
=====================
Shared response envelopes and base types used across all API endpoints.

All API responses from SIET BGV backend are wrapped in a consistent
envelope so the frontend can always rely on the same top-level structure.

Envelope shape:
    {
        "success": true | false,
        "message": "Human-readable status message",
        "data": { ... }   // null on error
    }

Error responses additionally carry an "error_code" for programmatic
handling without parsing message strings.
"""

from __future__ import annotations

from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    Standard success response envelope.

    Example:
        APIResponse[EmailSentResponse](
            success=True,
            message="OTP sent to hr@company.com",
            data=EmailSentResponse(...)
        )
    """
    success: bool = True
    message: str
    data: Optional[T] = None


class APIError(BaseModel):
    """
    Standard error response envelope.

    The 'error_code' field lets the frontend branch on specific conditions
    (e.g. "OTP_EXPIRED", "PAYMENT_ALREADY_CONSUMED") without parsing
    human-readable messages.

    IMPORTANT: Never include raw exception messages, SQL, stack traces,
    or internal paths in production error responses.
    """
    success: bool = False
    message: str
    error_code: str = "INTERNAL_ERROR"
    # 'details' is intentionally Optional so it can be omitted in production.
    # Use it only for validation errors (field-level feedback).
    details: Optional[Any] = None


class HealthResponse(BaseModel):
    """Response for GET /api/health."""
    status: str = "ok"
    environment: str
    version: str = "1.0.0-sprint1"
