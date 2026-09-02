"""
app/routes/auth.py
===================
Authentication and session routes.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies import verify_session_token
from app.schemas.common import APIResponse

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

class AuthMeResponse(BaseModel):
    company_name: str
    hr_email: str
    role: str

@router.get(
    "/me",
    response_model=APIResponse[AuthMeResponse],
    summary="Get current user info",
    description="Returns the currently authenticated user's email, company, and role.",
)
async def get_current_user_info(
    session: dict = Depends(verify_session_token),
) -> APIResponse[AuthMeResponse]:
    """
    Requires: Authorization: Bearer <session_token>
    """
    return APIResponse(
        success=True,
        message="User info retrieved.",
        data=AuthMeResponse(
            company_name=session["company_name"],
            hr_email=session["hr_email"],
            role=session["role"],
        ),
    )
