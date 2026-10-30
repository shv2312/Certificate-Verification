"""
app/dependencies.py
===================
Shared FastAPI dependency functions.

These are injected into route handlers via FastAPI's Depends() mechanism.

Current dependencies:
  - verify_session_token: validates the Bearer token issued after OTP
    verification and extracts company/email claims from it.

Sprint 2+ additions:
  - get_current_verification_request: validates ownership of a request
    against the session before database operations.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import time
from typing import List, Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

# FastAPI security scheme for Bearer tokens
_bearer_scheme = HTTPBearer(auto_error=False)

from app.revocation import is_token_revoked

# Session token validity window: 1 hour (3600 seconds)
_SESSION_TTL_SECONDS = 60 * 60


async def verify_session_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> dict:
    """
    Validate the session token issued after OTP verification.

    Returns a dict with:
        company_name: str
        hr_email:     str
        role:         str
        issued_at:    int  (Unix timestamp)
        hr_name:      str
        hr_phone:     str
        jti:          str  (Unique token ID)

    Raises:
        HTTP 401 if no token, invalid signature, expired session, or revoked token.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Email verification required. Please verify your HR email first.",
                "error_code": "EMAIL_VERIFICATION_REQUIRED",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        encoded_payload, provided_sig = token.rsplit(".", 1)
        payload_bytes = base64.urlsafe_b64decode(encoded_payload + "==")
        payload = payload_bytes.decode()
        parts = payload.split("|")
        
        # Handle token versions: 7 parts (with jti), 6 parts, 4 parts, 3 parts
        if len(parts) == 7:
            company_name, hr_email, role, ts_str, hr_name, hr_phone, jti = parts
        elif len(parts) == 6:
            company_name, hr_email, role, ts_str, hr_name, hr_phone = parts
            jti = ""
        elif len(parts) == 4:
            company_name, hr_email, role, ts_str = parts
            hr_name, hr_phone, jti = "", "", ""
        else:
            company_name, hr_email, ts_str = parts
            role = "HR"
            hr_name, hr_phone, jti = "", "", ""
            
        issued_at = int(ts_str)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Invalid session token. Please re-verify your email.",
                "error_code": "INVALID_SESSION_TOKEN",
            },
        )

    # Verify signature
    expected_sig = hmac.new(
        settings.APP_SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_sig, provided_sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Session token signature is invalid.",
                "error_code": "INVALID_SESSION_SIGNATURE",
            },
        )

    # Check expiry
    if time.time() - issued_at > _SESSION_TTL_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Your session has expired. Please re-verify your email.",
                "error_code": "SESSION_EXPIRED",
            },
        )

    # Check revocation registry
    if jti and await is_token_revoked(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "This session token has been revoked. Please log in again.",
                "error_code": "TOKEN_REVOKED",
            },
        )

    return {
        "company_name": company_name,
        "hr_email": hr_email,
        "role": role,
        "issued_at": issued_at,
        "hr_name": hr_name,
        "hr_phone": hr_phone,
        "jti": jti,
        "raw_token": token,
    }


def require_role(allowed_roles: List[str]) -> Callable:
    """
    Factory function for role-based access control.
    Returns a dependency that verifies the user has one of the allowed roles.
    """
    def role_checker(session: dict = Depends(verify_session_token)) -> dict:
        if session.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "message": "You do not have permission to access this resource.",
                    "error_code": "FORBIDDEN",
                },
            )
        return session
    return role_checker
