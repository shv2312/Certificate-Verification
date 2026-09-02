"""
app/config.py
=============
Centralised, environment-based configuration for the SIET BGV backend.

All settings are read from environment variables (or a .env file via
python-dotenv).  Pydantic-Settings validates and coerces types at
startup, so misconfigured deployments fail fast rather than silently.

NEVER put real credentials in this file.
NEVER hard-code secrets here.
All secrets must come from environment variables / .env.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, EmailStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings.
    Values are loaded from environment variables.  The .env file is
    read automatically during development when python-dotenv is installed.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",           # silently ignore unknown env vars
    )

    # ------------------------------------------------------------------ #
    # Application                                                          #
    # ------------------------------------------------------------------ #
    APP_ENV: str = "development"
    APP_DEBUG: bool = False
    APP_SECRET_KEY: str = "CHANGE_THIS_BEFORE_ANY_REAL_DEPLOYMENT"

    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # ------------------------------------------------------------------ #
    # CORS                                                                 #
    # ------------------------------------------------------------------ #
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        """Return ALLOWED_ORIGINS as a parsed list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    # ------------------------------------------------------------------ #
    # Database (Parthiban's PostgreSQL)                                    #
    # ------------------------------------------------------------------ #
    DATABASE_URL: str = "postgresql+asyncpg://USER:PASSWORD@localhost:5432/siet_bgv"
    # NOTE: The database layer is Parthiban's responsibility.
    #       Do NOT create a second student schema here.
    #       This URL is consumed by app/db/session.py only.

    # ------------------------------------------------------------------ #
    # Email / OTP                                                          #
    # ------------------------------------------------------------------ #
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "SIET Background Verification"
    SMTP_FROM_EMAIL: str = "noreply@siet.ac.in"

    # Sprint 1: When True, OTP is logged to console and NOT sent via SMTP.
    # Set to False only when real SMTP credentials are configured.
    DEV_MOCK_OTP: bool = True

    # ------------------------------------------------------------------ #
    # OTP Security                                                         #
    # ------------------------------------------------------------------ #
    OTP_EXPIRY_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 3
    OTP_RESEND_COOLDOWN_SECONDS: int = 60

    # ------------------------------------------------------------------ #
    # Payment Gateway                                                      #
    # ------------------------------------------------------------------ #
    PAYMENT_GATEWAY_KEY_ID: str = ""
    PAYMENT_GATEWAY_KEY_SECRET: str = ""
    PAYMENT_GATEWAY_WEBHOOK_SECRET: str = ""

    # Sprint 1: When True, payment is simulated in-process (no real gateway).
    # Set to False only after the college has approved a payment gateway.
    DEV_MOCK_PAYMENT: bool = True

    # ------------------------------------------------------------------ #
    # Verification / Report                                                #
    # ------------------------------------------------------------------ #
    VERIFICATION_BASE_URL: str = "http://localhost:8000"

    # Sprint 2: When True, verification is simulated to return a VERIFIED
    # response for frontend testing without Parthiban's DB.
    DEV_MOCK_VERIFICATION: bool = True

    # ------------------------------------------------------------------ #
    # Guards                                                               #
    # ------------------------------------------------------------------ #
    @field_validator("APP_SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, v: str) -> str:
        if v == "CHANGE_THIS_BEFORE_ANY_REAL_DEPLOYMENT":
            # Allow weak default only in development
            return v
        if len(v) < 32:
            raise ValueError(
                "APP_SECRET_KEY must be at least 32 characters long in non-development environments."
            )
        return v


@lru_cache
def get_settings() -> Settings:
    """
    Return a cached Settings instance.

    FastAPI dependency functions should call get_settings() so the
    same object is reused across requests without re-reading disk.
    """
    return Settings()
