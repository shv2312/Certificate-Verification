"""
app/main.py
============
FastAPI application factory for the SIET Academic Background Verification Portal.

This module:
  - Creates the FastAPI application instance
  - Registers all routers
  - Configures CORS
  - Registers global error handlers
  - Provides startup/shutdown lifecycle hooks

Entry point:
    uvicorn app.main:app --reload
"""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.middleware.error_handlers import register_error_handlers
from app.routes import email_verification, health, payment, verification, auth, admin
from app.db.session import engine, Base

# ------------------------------------------------------------------ #
# Logging configuration                                                #
# ------------------------------------------------------------------ #
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

settings = get_settings()


# ------------------------------------------------------------------ #
# Lifespan (startup + shutdown)                                        #
# ------------------------------------------------------------------ #
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler (modern replacement for deprecated on_event).

    Startup:
        - Logs environment and active feature flags.
        - Sprint 2+: Initialize DB pool, verify connectivity.

    Shutdown:
        - Graceful cleanup.
    """
    # ---- startup ----
    logger.info("=" * 60)
    logger.info("SIET Academic Background Verification Portal")
    logger.info("Version    : 1.0.0-sprint1")
    logger.info("Environment: %s", settings.APP_ENV)
    logger.info("Mock OTP   : %s", settings.DEV_MOCK_OTP)
    logger.info("Mock Pay   : %s", settings.DEV_MOCK_PAYMENT)
    logger.info("CORS       : %s", settings.cors_origins)
    logger.info("=" * 60)

    if settings.DEV_MOCK_OTP:
        logger.warning(
            "[DEV] DEV_MOCK_OTP is enabled. "
            "OTPs will be logged to console and returned in API responses. "
            "DISABLE before any production deployment."
        )
    if settings.DEV_MOCK_PAYMENT:
        logger.warning(
            "[DEV] DEV_MOCK_PAYMENT is enabled. "
            "Payment is simulated – no real gateway is called. "
            "DISABLE before any production deployment."
        )

    yield  # application runs here

    # ---- shutdown ----
    logger.info("SIET BGV backend shutting down.")


# ------------------------------------------------------------------ #
# Application factory                                                  #
# ------------------------------------------------------------------ #
def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Using a factory function makes the app easier to test —
    each test session can create a fresh instance.
    """
    app = FastAPI(
        title="SIET Academic Background Verification Portal",
        description=(
            "Official API for Sri Shakthi Institute of Engineering and Technology's "
            "Academic Background Verification service. "
            "Allows HR departments to verify candidate academic credentials "
            "against SIET's authoritative student records."
        ),
        version="1.0.0-sprint1",
        lifespan=lifespan,
        docs_url="/docs" if settings.APP_DEBUG else None,
        redoc_url="/redoc" if settings.APP_DEBUG else None,
        openapi_url="/openapi.json" if settings.APP_DEBUG else None,
        contact={
            "name": "SIET Backend Team",
            "email": "admin@siet.ac.in",
        },
        license_info={
            "name": "Internal use only – Sri Shakthi Institute of Engineering and Technology",
        },
    )

    # -------------------------------------------------------------- #
    # CORS                                                             #
    # -------------------------------------------------------------- #
    # Allows Sanjay's React frontend (Vite dev server) to call this API.
    # In production: restrict to the actual SIET domain.
    # Do NOT use allow_origins=["*"] without explicit justification.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
        expose_headers=["X-Request-Id"],
    )

    # -------------------------------------------------------------- #
    # Error handlers                                                   #
    # -------------------------------------------------------------- #
    register_error_handlers(app)

    # -------------------------------------------------------------- #
    # Routers                                                          #
    # -------------------------------------------------------------- #
    app.include_router(health.router)
    app.include_router(email_verification.router)
    app.include_router(auth.router)
    app.include_router(admin.router)
    app.include_router(payment.router)
    app.include_router(verification.router)

    return app


# ------------------------------------------------------------------ #
# ASGI entry point                                                     #
# ------------------------------------------------------------------ #
app = create_app()
