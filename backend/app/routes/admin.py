"""
app/routes/admin.py
===================
Routes for the admin dashboard.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import VerificationRequest
from app.dependencies import require_role
from app.schemas.common import APIResponse

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

@router.get(
    "/requests",
    response_model=APIResponse[list[dict]],
    summary="[Admin] Get all verification requests",
    description="Returns a list of all verification requests. Requires ADMIN role.",
)
async def get_all_requests(
    session: dict = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
) -> APIResponse[list[dict]]:
    """
    Requires: Authorization: Bearer <session_token> (with ADMIN role)
    """
    stmt = select(VerificationRequest).order_by(VerificationRequest.created_at.desc())
    result = await db.execute(stmt)
    requests = result.scalars().all()
    
    data = []
    for req in requests:
        data.append({
            "verification_request_id": req.id,
            "display_request_id": req.display_request_id,
            "status": req.status,
            "company_name": req.company_name,
            "hr_email": req.hr_email,
            "created_at": req.created_at,
        })
        
    return APIResponse(
        success=True,
        message="Retrieved all requests.",
        data=data,
    )
