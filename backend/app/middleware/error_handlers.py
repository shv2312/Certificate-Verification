"""
app/middleware/error_handlers.py
=================================
Global exception handlers for the SIET BGV FastAPI application.

These handlers ensure that:
  1. All error responses follow the standard APIError envelope.
  2. Raw Python exceptions, SQL errors, stack traces, filesystem
     paths, and secrets are NEVER exposed to the client.
  3. Errors are logged internally with enough detail for debugging.
  4. The frontend always receives a predictable JSON error shape.

Error code categories:
    400 – INVALID_REQUEST      : Malformed input
    401 – AUTHENTICATION_*     : Missing/invalid session token
    403 – FORBIDDEN            : Authenticated but not authorized
    404 – NOT_FOUND            : Resource does not exist
    409 – STATE_CONFLICT       : Business rule violation (e.g. already consumed)
    422 – VALIDATION_ERROR     : Pydantic/FastAPI schema validation failure
    503 – SERVICE_UNAVAILABLE  : Upstream dependency not ready (e.g. DB, engine)
    500 – INTERNAL_ERROR       : Unexpected server error
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------ #
# Registration helper                                                  #
# ------------------------------------------------------------------ #
def register_error_handlers(app: FastAPI) -> None:
    """Attach all global exception handlers to the FastAPI application."""

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        """
        Handle HTTP exceptions raised by FastAPI or route code.

        The 'detail' from an HTTPException can be a string or a dict.
        If it's already in our APIError format, pass it through.
        Otherwise wrap it.
        """
        detail = exc.detail
        if isinstance(detail, dict) and "error_code" in detail:
            # Already formatted by a route/dependency
            body = detail
        else:
            error_code = _status_to_error_code(exc.status_code)
            body = {
                "success": False,
                "message": str(detail) if detail else "An error occurred.",
                "error_code": error_code,
            }
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """
        Handle Pydantic/FastAPI request validation errors (HTTP 422).

        Returns field-level error details so the frontend can highlight
        the invalid field(s).  Only field names and messages are returned,
        NOT internal model names or stack traces.
        """
        field_errors = []
        for error in exc.errors():
            loc = " → ".join(str(x) for x in error["loc"] if x != "body")
            field_errors.append({
                "field": loc or "unknown",
                "message": error["msg"],
            })

        logger.info(
            "Validation error on %s %s: %s",
            request.method,
            request.url.path,
            field_errors,
        )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "message": "The submitted data contains validation errors. Please check the fields.",
                "error_code": "VALIDATION_ERROR",
                "details": field_errors,
            },
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(
        request: Request, exc: ValueError
    ) -> JSONResponse:
        """
        Handle ValueError raised by service functions for business rule
        violations (e.g. OTP expired, state conflict).

        These are 409 Conflict – the request is understood but the
        current state does not allow it.
        """
        logger.info(
            "Business rule violation on %s %s: %s",
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "message": str(exc),
                "error_code": "STATE_CONFLICT",
            },
        )

    @app.exception_handler(PermissionError)
    async def permission_error_handler(
        request: Request, exc: PermissionError
    ) -> JSONResponse:
        """Handle authorization failures raised by services."""
        logger.warning(
            "Unauthorized access attempt on %s %s: %s",
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "success": False,
                "message": str(exc),
                "error_code": "FORBIDDEN",
            },
        )

    @app.exception_handler(NotImplementedError)
    async def not_implemented_handler(
        request: Request, exc: NotImplementedError
    ) -> JSONResponse:
        """
        Handle NotImplementedError raised when a dependency is not yet
        integrated (e.g. verification engine, production payment gateway).
        Returns 503 so the frontend can show a 'service temporarily
        unavailable' message without exposing internal details.
        """
        # Log the full message internally
        logger.error(
            "Service unavailable on %s %s: %s",
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "message": "This service is not yet available. Please try again later.",
                "error_code": "SERVICE_UNAVAILABLE",
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """
        Catch-all handler for unexpected exceptions.

        IMPORTANT: The raw exception is NEVER returned to the client.
        Only a generic message is sent.  The full traceback is logged
        internally for debugging.
        """
        logger.exception(
            "Unexpected error on %s %s",
            request.method,
            request.url.path,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": "An unexpected internal error occurred. Please contact support.",
                "error_code": "INTERNAL_ERROR",
            },
        )


def _status_to_error_code(status_code: int) -> str:
    """Map HTTP status codes to human-readable error codes."""
    mapping = {
        400: "INVALID_REQUEST",
        401: "AUTHENTICATION_REQUIRED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "STATE_CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMIT_EXCEEDED",
        503: "SERVICE_UNAVAILABLE",
        500: "INTERNAL_ERROR",
    }
    return mapping.get(status_code, "INTERNAL_ERROR")
