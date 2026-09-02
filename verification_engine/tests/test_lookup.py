"""
SIET Academic Background Verification Portal
Test Suite — test_lookup.py

Tests for verification_engine/lookup.py

Owner: Parthiban V
Date: 2026-09-02

These tests mock the AsyncSession to verify SQL query behavior without a live DB.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from verification_engine.lookup import load_alias_map, lookup_student_by_register_number


@pytest.mark.asyncio
class TestLookupStudent:
    
    async def test_lookup_student_found(self):
        db_mock = AsyncMock(spec=AsyncSession)
        
        # Mock the result of db.execute().fetchone()
        row_mock = MagicMock()
        row_mock._mapping = {
            "id": 1,
            "register_number": "911021104001",
            "full_name_normalized": "TEST STUDENT ALPHA",
            "branch_id": 1,
            "year_of_passing": 2024
        }
        
        result_mock = MagicMock()
        result_mock.fetchone.return_value = row_mock
        db_mock.execute.return_value = result_mock
        
        student = await lookup_student_by_register_number(db_mock, "911021104001")
        
        assert student is not None
        assert student.student_id == 1
        assert student.register_number == "911021104001"
        assert student.full_name_normalized == "TEST STUDENT ALPHA"
        assert student.branch_id == 1
        assert student.year_of_passing == 2024
        
        # Verify execute was called with correct parameters
        call_args = db_mock.execute.call_args
        assert call_args is not None
        assert call_args[0][1] == {"reg_num": "911021104001"}

    async def test_lookup_student_not_found(self):
        db_mock = AsyncMock(spec=AsyncSession)
        
        result_mock = MagicMock()
        result_mock.fetchone.return_value = None
        db_mock.execute.return_value = result_mock
        
        student = await lookup_student_by_register_number(db_mock, "9999999999")
        
        assert student is None


@pytest.mark.asyncio
class TestLoadAliasMap:
    
    async def test_load_alias_map(self):
        db_mock = AsyncMock(spec=AsyncSession)
        
        row1 = MagicMock()
        row1._mapping = {"alias": "CSE", "branch_id": 1, "branch_full_name": "Computer Science and Engineering"}
        row2 = MagicMock()
        row2._mapping = {"alias": "ece ", "branch_id": 2, "branch_full_name": "Electronics"}
        
        result_mock = MagicMock()
        result_mock.fetchall.return_value = [row1, row2]
        db_mock.execute.return_value = result_mock
        
        alias_map = await load_alias_map(db_mock)
        
        assert len(alias_map) == 2
        assert "CSE" in alias_map
        assert alias_map["CSE"]["branch_id"] == 1
        assert "ECE" in alias_map
        assert alias_map["ECE"]["branch_id"] == 2
