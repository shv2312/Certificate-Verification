"""
app/db/session.py
=================
Database session factory for Parthiban's PostgreSQL database.

This module defines:
  - The async SQLAlchemy engine
  - The async session factory
  - A FastAPI dependency (get_db) that routes/services import

IMPORTANT:
  - The PostgreSQL schema, models, and verification engine are
    Parthiban's responsibility.  Do NOT define Student or verification
    tables in this file.
  - This file only manages the connection.  All table definitions,
    migrations (Alembic), and data access should live in Parthiban's
    database/ directory once integrated.

Sprint 1 status:
  The engine is configured but NOT yet connected to Parthiban's schema.
  Integration will occur once Parthiban provides the database models
  and the DATABASE_URL is filled in .env.
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# ------------------------------------------------------------------ #
# Engine                                                               #
# ------------------------------------------------------------------ #
# pool_pre_ping=True: validates connections before using them, so
# stale connections from the pool don't cause 500 errors.
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.APP_DEBUG,   # SQL logging only in debug mode
    future=True,
)

# ------------------------------------------------------------------ #
# Session factory                                                      #
# ------------------------------------------------------------------ #
AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ------------------------------------------------------------------ #
# Declarative base                                                     #
# ------------------------------------------------------------------ #
# Shared base class for any ORM models Shri Hari defines on the
# backend side (e.g. EmailChallenge, PaymentSession).
# Parthiban's student/verification models should use their own base.
class Base(DeclarativeBase):
    pass


# ------------------------------------------------------------------ #
# FastAPI dependency                                                   #
# ------------------------------------------------------------------ #
async def get_db() -> AsyncSession:
    """
    FastAPI dependency that yields an async database session.

    Usage in a route:
        async def my_route(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
