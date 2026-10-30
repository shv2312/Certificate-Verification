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

from app.revocation import revoke_token

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


class LogoutResponse(BaseModel):
    revoked: bool


@router.post(
    "/logout",
    response_model=APIResponse[LogoutResponse],
    summary="Revoke session token",
    description="Invalidates the current session token server-side.",
)
async def logout(
    session: dict = Depends(verify_session_token),
) -> APIResponse[LogoutResponse]:
    """
    Requires: Authorization: Bearer <session_token>
    Revokes the unique token ID (jti) until its natural expiration.
    """
    jti = session.get("jti")
    issued_at = session.get("issued_at", 0)
    # Expiration is issued_at + 3600
    expires_at = issued_at + 3600
    if jti:
        await revoke_token(jti, float(expires_at))

    return APIResponse(
        success=True,
        message="Successfully logged out and session revoked.",
        data=LogoutResponse(revoked=True),
    )
