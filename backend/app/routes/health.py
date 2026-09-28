"""
app/routes/health.py
=====================
Health check endpoint.

GET /api/health

Purpose:
  - Verify the backend is running
  - Used by load balancers, monitoring tools, and the frontend
    to detect backend availability

Safety rules:
  - Does NOT expose database passwords, connection strings, or secrets
  - Does NOT expose internal filesystem paths
  - Does NOT expose stack traces
  - Returns only safe, non-sensitive status information
"""

from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.schemas.common import APIResponse, HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/api/health",
    response_model=APIResponse[HealthResponse],
    summary="Backend health check",
    description=(
        "Returns the current health status of the SIET BGV backend. "
        "Safe to call without authentication."
    ),
)
async def health_check(settings: Settings = Depends(get_settings)) -> APIResponse[HealthResponse]:
    """
    Lightweight health check.

    Returns HTTP 200 with status='ok' when the backend is running.
    Does not check database connectivity in Sprint 1 (added in Sprint 2
    when Parthiban's DB is integrated).
    """
    return APIResponse(
        success=True,
        message="SIET Academic Background Verification backend is running.",
        data=HealthResponse(
            status="ok",
            environment=settings.APP_ENV,
        ),
    )
