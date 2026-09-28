"""
SIET Academic Background Verification Portal
Verification Engine — lookup.py

Owner: Parthiban V
Date: 2026-09-02

PURPOSE:
    Provides the real PostgreSQL lookup implementation for the verification engine.
    This module uses SQLAlchemy `text` queries mapping to the exact Sprint 1 schema.
    It expects a live `sqlalchemy.ext.asyncio.AsyncSession` provided by the backend.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging

from verification_engine.matcher import StudentRecord

logger = logging.getLogger(__name__)


async def load_alias_map(db: AsyncSession) -> dict:
    """
    Load the branch alias map from the PostgreSQL database.
    
    Query joins branch_aliases and branches to resolve aliases to canonical branch info.
    """
    query = text("""
        SELECT ba.alias, ba.branch_id, b.full_name AS branch_full_name
        FROM branch_aliases ba
        JOIN branches b ON b.id = ba.branch_id
        WHERE b.is_active = TRUE;
    """)
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    alias_map = {}
    for row in rows:
        # Use _mapping if row behaves like a tuple in SQLAlchemy 2.0
        row_dict = row._mapping
        alias = row_dict["alias"].strip().upper()
        alias_map[alias] = {
            "branch_id": row_dict["branch_id"],
            "canonical_name": row_dict["branch_full_name"],
        }
        
    logger.info(f"Loaded {len(alias_map)} branch aliases from the database.")
    return alias_map


async def lookup_student_by_register_number(db: AsyncSession, register_number: str) -> Optional[StudentRecord]:
    """
    Look up a student record by their exact register number.
    
    Uses parameterized SQL to prevent injection.
    Only active student records are returned.
    """
    query = text("""
        SELECT 
            id, 
            register_number, 
            full_name_normalized, 
            branch_id, 
            year_of_passing 
        FROM students 
        WHERE register_number = :reg_num AND is_active = TRUE;
    """)
    
    result = await db.execute(query, {"reg_num": register_number})
    row = result.fetchone()
    
    if not row:
        return None
        
    row_dict = row._mapping
    return StudentRecord(
        student_id=row_dict["id"],
        register_number=row_dict["register_number"],
        full_name_normalized=row_dict["full_name_normalized"],
        branch_id=row_dict["branch_id"],
        year_of_passing=row_dict["year_of_passing"]
    )
