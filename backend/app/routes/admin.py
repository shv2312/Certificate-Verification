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

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
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


class CompanyDistribution(BaseModel):
    company_name: str
    count: int


class AdminStats(BaseModel):
    total: int
    verified: int
    not_verified: int
    pending: int
    in_progress: int
    error: int
    total_hrs: Optional[int] = None
    company_distribution: Optional[List[CompanyDistribution]] = None


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
# GET /api/v1/admin/requests/pending                                 #
# ------------------------------------------------------------------ #

class PendingVerificationRequestItem(BaseModel):
    id: str
    display_request_id: str
    candidate_name: Optional[str] = None
    register_number: Optional[str] = None
    course_name: Optional[str] = None
    year_of_passing: Optional[int] = None
    company_name: str
    hr_email: str
    certificate_url: Optional[str] = None
    status: str
    admin_decision: Optional[str] = None
    created_at: Any


@router.get(
    "/requests/pending",
    response_model=List[PendingVerificationRequestItem],
    summary="[Admin] Get all pending verification requests",
    description="Query all VerificationRequest rows where admin_decision == 'PENDING_REVIEW', ordered by descending creation timestamp.",
)
async def get_pending_requests(
    db: AsyncSession = Depends(get_db),
) -> List[PendingVerificationRequestItem]:
    import json

    stmt = (
        select(VerificationRequest)
        .where(VerificationRequest.admin_decision == "PENDING_REVIEW")
        .order_by(VerificationRequest.created_at.desc())
    )
    result = await db.execute(stmt)
    requests = result.scalars().all()

    data: List[PendingVerificationRequestItem] = []
    for req in requests:
        candidate_name = req.hr_submitted_name
        register_number = req.hr_submitted_register_number
        course_name = req.hr_submitted_programme
        year_of_passing = req.hr_submitted_year_of_passing

        if req.candidate_data:
            try:
                cd = json.loads(req.candidate_data)
                candidate_name = cd.get("candidate_name") or candidate_name
                register_number = cd.get("register_number") or register_number
                course_name = cd.get("course") or cd.get("course_name") or cd.get("programme") or course_name
                year_of_passing = cd.get("year_of_passing") or year_of_passing
            except (json.JSONDecodeError, TypeError):
                pass

        data.append(
            PendingVerificationRequestItem(
                id=req.id,
                display_request_id=req.display_request_id,
                candidate_name=candidate_name,
                register_number=register_number,
                course_name=course_name,
                year_of_passing=year_of_passing,
                company_name=req.company_name,
                hr_email=req.hr_email,
                certificate_url=req.certificate_url,
                status=req.status,
                admin_decision=req.admin_decision,
                created_at=req.created_at,
            )
        )

    return data


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

    total_hrs_q = await db.execute(select(func.count(func.distinct(VerificationRequest.hr_email))))
    total_hrs = total_hrs_q.scalar_one() or 0

    dist_q = await db.execute(
        select(VerificationRequest.company_name, func.count(VerificationRequest.id))
        .group_by(VerificationRequest.company_name)
        .order_by(func.count(VerificationRequest.id).desc())
    )
    dist_rows = dist_q.fetchall()
    company_distribution = [
        CompanyDistribution(company_name=row[0], count=row[1]) for row in dist_rows
    ]

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
            total_hrs=total_hrs,
            company_distribution=company_distribution,
        ),
    )


# ------------------------------------------------------------------ #
# POST /api/v1/admin/requests/{request_id}/approve                   #
# ------------------------------------------------------------------ #

class RejectRequestPayload(BaseModel):
    reason: str


@router.post(
    "/requests/{request_id}/approve",
    summary="[Admin] Approve a verification request",
    description="Updates admin_decision to APPROVED and status to VERIFIED, generates PDF, and emails report.",
)
async def approve_verification_request(
    request_id: str,
    background_tasks: BackgroundTasks,
    session: dict = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    import json
    from app.services.email_service import send_verification_report_email

    vr = await db.get(VerificationRequest, request_id)
    if not vr:
        raise HTTPException(status_code=404, detail="Verification request not found.")

    vr.admin_decision = "APPROVED"
    vr.status = "VERIFIED"
    vr.completed_at = int(time.time())
    await db.commit()
    await db.refresh(vr)

    engine_result = {}
    if vr.verification_result:
        try:
            engine_result = json.loads(vr.verification_result)
        except Exception:
            pass

    report_data = {
        "verification_request_id": vr.id,
        "display_request_id": vr.display_request_id,
        "company_name": vr.company_name,
        "hr_email": vr.hr_email,
        "status": vr.status,
        "candidate_name": engine_result.get("candidate_name") or vr.hr_submitted_name or "N/A",
        "register_number": engine_result.get("register_number") or vr.hr_submitted_register_number or "N/A",
        "course": engine_result.get("course") or vr.hr_submitted_programme or "N/A",
        "branch": engine_result.get("branch") or vr.hr_submitted_branch or "N/A",
        "year_of_passing": engine_result.get("year_of_passing") or vr.hr_submitted_year_of_passing or "N/A",
        "period_of_study": engine_result.get("period_of_study", "N/A"),
        "backlog_status": engine_result.get("backlog_status", "N/A"),
    }

    # Dispatch verification report email to the HR contact
    background_tasks.add_task(
        send_verification_report_email,
        hr_email=vr.hr_email,
        company_name=vr.company_name,
        report=report_data,
    )

    return {
        "status": "APPROVED",
        "message": "Verification approved and certificate issued."
    }


# ------------------------------------------------------------------ #
# POST /api/v1/admin/requests/{request_id}/reject                    #
# ------------------------------------------------------------------ #

@router.post(
    "/requests/{request_id}/reject",
    summary="[Admin] Reject a verification request",
    description="Updates admin_decision to REJECTED, status to NOT_VERIFIED, stores remarks, and emails notification.",
)
async def reject_verification_request(
    request_id: str,
    payload: RejectRequestPayload,
    background_tasks: BackgroundTasks,
    session: dict = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    import json
    from app.services.email_service import send_verification_report_email

    vr = await db.get(VerificationRequest, request_id)
    if not vr:
        raise HTTPException(status_code=404, detail="Verification request not found.")

    vr.admin_decision = "REJECTED"
    vr.status = "NOT_VERIFIED"
    vr.admin_remarks = payload.reason
    vr.completed_at = int(time.time())
    await db.commit()
    await db.refresh(vr)

    engine_result = {}
    if vr.verification_result:
        try:
            engine_result = json.loads(vr.verification_result)
        except Exception:
            pass

    report_data = {
        "verification_request_id": vr.id,
        "display_request_id": vr.display_request_id,
        "company_name": vr.company_name,
        "hr_email": vr.hr_email,
        "status": vr.status,
        "remarks": payload.reason,
        "candidate_name": engine_result.get("candidate_name") or vr.hr_submitted_name or "N/A",
        "register_number": engine_result.get("register_number") or vr.hr_submitted_register_number or "N/A",
        "course": engine_result.get("course") or vr.hr_submitted_programme or "N/A",
        "branch": engine_result.get("branch") or vr.hr_submitted_branch or "N/A",
        "year_of_passing": engine_result.get("year_of_passing") or vr.hr_submitted_year_of_passing or "N/A",
        "period_of_study": engine_result.get("period_of_study", "N/A"),
        "backlog_status": engine_result.get("backlog_status", "N/A"),
    }

    # Dispatch rejection notification to the HR contact
    background_tasks.add_task(
        send_verification_report_email,
        hr_email=vr.hr_email,
        company_name=vr.company_name,
        report=report_data,
    )

    return {
        "status": "REJECTED"
    }


# ------------------------------------------------------------------ #
# GET /api/v1/admin/dashboard/metrics                                #
# ------------------------------------------------------------------ #

class DashboardMetricsResponse(BaseModel):
    total: int
    pending: int
    approved: int
    rejected: int
    approval_rate: str


@router.get(
    "/dashboard/metrics",
    response_model=DashboardMetricsResponse,
    summary="[Admin] Get dashboard metrics",
    description="Returns aggregate metrics grouped by admin_decision including total, pending, approved, rejected, and approval rate.",
)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
) -> DashboardMetricsResponse:
    # Query counts grouped by admin_decision
    total_q = await db.execute(select(func.count()).select_from(VerificationRequest))
    total_count = total_q.scalar_one() or 0

    pending_q = await db.execute(
        select(func.count())
        .select_from(VerificationRequest)
        .where(VerificationRequest.admin_decision == "PENDING_REVIEW")
    )
    pending_count = pending_q.scalar_one() or 0

    approved_q = await db.execute(
        select(func.count())
        .select_from(VerificationRequest)
        .where(VerificationRequest.admin_decision == "APPROVED")
    )
    approved_count = approved_q.scalar_one() or 0

    rejected_q = await db.execute(
        select(func.count())
        .select_from(VerificationRequest)
        .where(VerificationRequest.admin_decision == "REJECTED")
    )
    rejected_count = rejected_q.scalar_one() or 0

    decided = approved_count + rejected_count
    if decided > 0:
        rate = (approved_count / decided) * 100
        approval_rate = f"{rate:.1f}%"
    else:
        approval_rate = "0.0%"

    return DashboardMetricsResponse(
        total=total_count,
        pending=pending_count,
        approved=approved_count,
        rejected=rejected_count,
        approval_rate=approval_rate,
    )


# ------------------------------------------------------------------ #
# GET /api/v1/admin/requests/history                                 #
# ------------------------------------------------------------------ #

class ProcessedVerificationRequestItem(BaseModel):
    id: str
    display_request_id: str
    candidate_name: Optional[str] = None
    register_number: Optional[str] = None
    admin_decision: Optional[str] = None
    reviewed_at: Optional[Any] = None
    admin_remarks: Optional[str] = None


@router.get(
    "/requests/history",
    response_model=List[ProcessedVerificationRequestItem],
    summary="[Admin] Get processed verification requests history",
    description="Query completed requests (admin_decision in APPROVED, REJECTED) with pagination.",
)
async def get_processed_requests_history(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> List[ProcessedVerificationRequestItem]:
    import json

    stmt = (
        select(VerificationRequest)
        .where(VerificationRequest.admin_decision.in_(["APPROVED", "REJECTED"]))
        .order_by(VerificationRequest.completed_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    requests = result.scalars().all()

    data: List[ProcessedVerificationRequestItem] = []
    for req in requests:
        candidate_name = req.hr_submitted_name
        register_number = req.hr_submitted_register_number

        if req.candidate_data:
            try:
                cd = json.loads(req.candidate_data)
                candidate_name = cd.get("candidate_name") or candidate_name
                register_number = cd.get("register_number") or register_number
            except (json.JSONDecodeError, TypeError):
                pass

        data.append(
            ProcessedVerificationRequestItem(
                id=req.id,
                display_request_id=req.display_request_id,
                candidate_name=candidate_name,
                register_number=register_number,
                admin_decision=req.admin_decision,
                reviewed_at=req.completed_at,
                admin_remarks=req.admin_remarks,
            )
        )

    return data


