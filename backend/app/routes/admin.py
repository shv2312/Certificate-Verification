"""
app/routes/admin.py
===================
Routes for the Admin Portal.

Endpoints:
    POST /api/v1/admin/login
        → Validate username + password, issue a signed HMAC session token
          with role=ADMIN.  No JWT library needed – same token format as
          HR sessions, validated by verify_session_token in dependencies.py.

    GET /api/v1/admin/requests
        → Return all verification requests (paginated). ADMIN role required.

    GET /api/v1/admin/stats
        → Aggregate counts by status.  ADMIN role required.

SECURITY:
    Password is stored as HMAC-SHA256(ADMIN_HMAC_KEY, plaintext_password).
    Comparison uses hmac.compare_digest() to prevent timing attacks.
    Brute-force protection: a fixed 300 ms delay is added to every login
    response (success or failure) so response timing leaks nothing.
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import logging
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.db.models import VerificationRequest
from app.db.session import get_db
from app.dependencies import require_role
from app.schemas.common import APIResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


# ------------------------------------------------------------------ #
# Schemas                                                              #
# ------------------------------------------------------------------ #

class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    session_token: str
    role: str = "ADMIN"


class VerificationRequestSummary(BaseModel):
    verification_request_id: str
    display_request_id: str
    status: str
    company_name: str
    hr_email: str
    hr_name: Optional[str] = None
    candidate_name: Optional[str] = None
    created_at: Any


class AdminStats(BaseModel):
    total: int
    verified: int
    not_verified: int
    pending: int
    in_progress: int
    error: int


# ------------------------------------------------------------------ #
# Internal helpers                                                     #
# ------------------------------------------------------------------ #

def _issue_admin_token(settings: Settings) -> str:
    """
    Issue an HMAC-signed session token for the admin user.

    Token format (matches verify_session_token in dependencies.py):
        base64(payload).HMAC-SHA256(payload)
    where payload = "company_name|hr_email|role|issued_at|hr_name|hr_phone"
    """
    issued_at = int(time.time())
    payload = f"SIET Administration|{settings.ADMIN_USERNAME}@siet.ac.in|ADMIN|{issued_at}||"
    encoded_payload = base64.urlsafe_b64encode(payload.encode()).rstrip(b"=").decode()
    sig = hmac.new(
        settings.APP_SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded_payload}.{sig}"


def _verify_admin_password(plain: str, settings: Settings) -> bool:
    """
    Compute HMAC-SHA256(ADMIN_HMAC_KEY, plain) and compare with stored hash.
    Uses hmac.compare_digest() to prevent timing attacks.
    """
    if not settings.ADMIN_PASSWORD_HASH:
        logger.error("ADMIN_PASSWORD_HASH is not set in .env — admin login disabled.")
        return False
    computed = hmac.new(
        settings.ADMIN_HMAC_KEY.encode(),
        plain.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(computed, settings.ADMIN_PASSWORD_HASH)


# ------------------------------------------------------------------ #
# POST /api/v1/admin/login                                             #
# ------------------------------------------------------------------ #

@router.post(
    "/login",
    response_model=APIResponse[AdminLoginResponse],
    summary="[Admin] Authenticate and receive a session token",
    description=(
        "Validates admin credentials and returns an HMAC-signed session token. "
        "Supply this token as `Authorization: Bearer <token>` for all admin endpoints. "
        "A fixed 300 ms response delay prevents timing-based user enumeration."
    ),
)
async def admin_login(
    body: AdminLoginRequest,
    settings: Settings = Depends(get_settings),
) -> APIResponse[AdminLoginResponse]:
    """
    Rate-limiting / brute-force mitigation:
        A constant 300 ms delay is applied to every login attempt.
        In production, add IP-based rate limiting via a Redis-backed middleware.
    """
    # Constant-time delay regardless of outcome
    await asyncio.sleep(0.3)

    # Validate username
    if not hmac.compare_digest(body.username.lower(), settings.ADMIN_USERNAME.lower()):
        logger.warning("[Admin] Failed login attempt for username: %s", body.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Invalid credentials. Please check your username and password.",
                "error_code": "INVALID_ADMIN_CREDENTIALS",
            },
        )

    # Validate password
    if not _verify_admin_password(body.password, settings):
        logger.warning("[Admin] Failed login attempt for username: %s (wrong password)", body.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Invalid credentials. Please check your username and password.",
                "error_code": "INVALID_ADMIN_CREDENTIALS",
            },
        )

    token = _issue_admin_token(settings)
    logger.info("[Admin] Successful login for admin: %s", body.username)

    return APIResponse(
        success=True,
        message="Admin authentication successful.",
        data=AdminLoginResponse(session_token=token),
    )


# ------------------------------------------------------------------ #
# GET /api/v1/admin/requests                                           #
# ------------------------------------------------------------------ #

@router.get(
    "/requests",
    response_model=APIResponse[List[VerificationRequestSummary]],
    summary="[Admin] Get all verification requests",
    description="Returns all verification requests ordered by creation time. Requires ADMIN role.",
)
async def get_all_requests(
    session: dict = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
) -> APIResponse[List[VerificationRequestSummary]]:
    """
    Requires: Authorization: Bearer <admin_session_token>
    """
    import json

    stmt = (
        select(VerificationRequest)
        .order_by(VerificationRequest.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    requests = result.scalars().all()

    data: List[VerificationRequestSummary] = []
    for req in requests:
        # Extract candidate name from stored JSON candidate_data if available
        candidate_name = None
        if req.candidate_data:
            try:
                cd = json.loads(req.candidate_data)
                candidate_name = cd.get("candidate_name")
            except (json.JSONDecodeError, TypeError):
                pass

        data.append(
            VerificationRequestSummary(
                verification_request_id=req.id,
                display_request_id=req.display_request_id,
                status=req.status,
                company_name=req.company_name,
                hr_email=req.hr_email,
                hr_name=req.hr_name,
                candidate_name=candidate_name,
                created_at=req.created_at,
            )
        )

    return APIResponse(
        success=True,
        message=f"Retrieved {len(data)} verification request(s).",
        data=data,
    )


# ------------------------------------------------------------------ #
# GET /api/v1/admin/stats                                              #
# ------------------------------------------------------------------ #

@router.get(
    "/stats",
    response_model=APIResponse[AdminStats],
    summary="[Admin] Get aggregate verification statistics",
    description="Returns counts of requests grouped by status. Requires ADMIN role.",
)
async def get_admin_stats(
    session: dict = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
) -> APIResponse[AdminStats]:
    """
    Requires: Authorization: Bearer <admin_session_token>
    """
    total_q = await db.execute(select(func.count()).select_from(VerificationRequest))
    total = total_q.scalar_one() or 0

    async def _count(status_val: str) -> int:
        q = await db.execute(
            select(func.count())
            .select_from(VerificationRequest)
            .where(VerificationRequest.status == status_val)
        )
        return q.scalar_one() or 0

    verified     = await _count("VERIFIED")
    not_verified = await _count("NOT_VERIFIED") + await _count("NAME_MISMATCH") + await _count("NOT_FOUND")
    in_progress  = await _count("VERIFICATION_IN_PROGRESS") + await _count("CANDIDATE_BOUND")
    error        = await _count("ERROR")
    pending      = total - verified - not_verified - in_progress - error

    return APIResponse(
        success=True,
        message="Statistics retrieved.",
        data=AdminStats(
            total=total,
            verified=verified,
            not_verified=not_verified,
            pending=pending,
            in_progress=in_progress,
            error=error,
        ),
    )
