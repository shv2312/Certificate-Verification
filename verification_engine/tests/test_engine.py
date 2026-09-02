"""
SIET Academic Background Verification Portal
Test Suite — test_engine.py

End-to-end tests for verification_engine/engine.py

Owner: Parthiban V
Date: 2026-09-02

These tests use in-memory mocks — no live PostgreSQL required.

Run with:
    pytest verification_engine/tests/test_engine.py -v
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from verification_engine.engine import (
    VerificationEngine,
    VerificationRequest,
    VerificationOutcome,
    build_alias_map_from_rows,
)
from verification_engine.matcher import StudentRecord


# ---------------------------------------------------------------------------
# Test fixtures
# ---------------------------------------------------------------------------

ALIAS_MAP = {
    "CSE": {"branch_id": 1, "canonical_name": "Computer Science and Engineering"},
    "ECE": {"branch_id": 2, "canonical_name": "Electronics and Communication Engineering"},
    "MECH": {"branch_id": 3, "canonical_name": "Mechanical Engineering"},
    "IT": {"branch_id": 4, "canonical_name": "Information Technology"},
    "COMPUTER SCIENCE AND ENGINEERING": {"branch_id": 1, "canonical_name": "Computer Science and Engineering"},
}

# Fictional in-memory student database for tests
IN_MEMORY_STUDENTS = {
    "911021104001": StudentRecord(
        student_id=1,
        register_number="911021104001",
        full_name_normalized="TEST STUDENT ALPHA",
        branch_id=1,   # CSE
        year_of_passing=2024,
    ),
    "911021104002": StudentRecord(
        student_id=2,
        register_number="911021104002",
        full_name_normalized="TEST STUDENT BETA",
        branch_id=2,   # ECE
        year_of_passing=2024,
    ),
    "911021104003": StudentRecord(
        student_id=3,
        register_number="911021104003",
        full_name_normalized="TEST STUDENT GAMMA",
        branch_id=3,   # MECH
        year_of_passing=2023,
    ),
}


async def mock_lookup(register_number: str):
    """Mock database lookup — simulates parameterized SELECT by register_number."""
    return IN_MEMORY_STUDENTS.get(register_number)


def make_engine() -> VerificationEngine:
    return VerificationEngine(
        alias_map=ALIAS_MAP,
        student_lookup_fn=mock_lookup,
    )


def make_request(**overrides) -> VerificationRequest:
    defaults = dict(
        request_id="aaaaaaaa-0000-0000-0000-000000000001",
        register_number="911021104001",
        candidate_name="Test Student Alpha",
        branch="CSE",
        year_of_passing=2024,
    )
    defaults.update(overrides)
    return VerificationRequest(**defaults)


# ===========================================================================
# Tests: Successful verification (VERIFIED)
# ===========================================================================

@pytest.mark.asyncio
class TestEngineVerified:

    async def test_all_correct_details_verified(self):
        engine = make_engine()
        outcome = await engine.verify(make_request())
        assert outcome.status == "VERIFIED"
        assert outcome.student_id == 1
        assert outcome.errors == []

    async def test_verified_includes_student_id(self):
        engine = make_engine()
        outcome = await engine.verify(make_request(
            register_number="911021104002",
            candidate_name="Test Student Beta",
            branch="ECE",
            year_of_passing=2024,
        ))
        assert outcome.status == "VERIFIED"
        assert outcome.student_id == 2

    async def test_case_insensitive_name_verified(self):
        """Name submitted in different case should still verify."""
        engine = make_engine()
        outcome = await engine.verify(make_request(candidate_name="test student alpha"))
        assert outcome.status == "VERIFIED"

    async def test_extra_spaces_in_name_verified(self):
        """Extra internal spaces in name normalized correctly."""
        engine = make_engine()
        outcome = await engine.verify(make_request(candidate_name="Test  Student  Alpha"))
        assert outcome.status == "VERIFIED"

    async def test_branch_full_name_alias_verified(self):
        """HR using full branch name resolves correctly."""
        engine = make_engine()
        outcome = await engine.verify(make_request(
            branch="Computer Science and Engineering"
        ))
        assert outcome.status == "VERIFIED"

    async def test_year_as_string_verified(self):
        """Year submitted as string is normalized and verifies correctly."""
        engine = make_engine()
        outcome = await engine.verify(make_request(year_of_passing="2024"))
        assert outcome.status == "VERIFIED"

    async def test_request_id_echoed_in_outcome(self):
        """Outcome must echo back the request_id."""
        engine = make_engine()
        req = make_request(request_id="test-request-abc-123")
        outcome = await engine.verify(req)
        assert outcome.request_id == "test-request-abc-123"


# ===========================================================================
# Tests: Failed verification (NOT_VERIFIED)
# ===========================================================================

@pytest.mark.asyncio
class TestEngineNotVerified:

    async def test_register_not_found_not_verified(self):
        """Register number not in DB → NOT_VERIFIED."""
        engine = make_engine()
        outcome = await engine.verify(make_request(register_number="999999999999"))
        assert outcome.status == "NOT_VERIFIED"
        assert outcome.student_id is None

    async def test_wrong_name_not_verified(self):
        """Correct register, wrong name → NOT_VERIFIED."""
        engine = make_engine()
        outcome = await engine.verify(make_request(candidate_name="Wrong Name Here"))
        assert outcome.status == "NOT_VERIFIED"
        assert outcome.student_id is None

    async def test_wrong_branch_not_verified(self):
        """Correct register, wrong branch → NOT_VERIFIED."""
        engine = make_engine()
        outcome = await engine.verify(make_request(branch="ECE"))  # should be CSE
        assert outcome.status == "NOT_VERIFIED"

    async def test_wrong_year_not_verified(self):
        """Correct register, wrong year → NOT_VERIFIED."""
        engine = make_engine()
        outcome = await engine.verify(make_request(year_of_passing=2023))
        assert outcome.status == "NOT_VERIFIED"

    async def test_off_by_one_register_not_verified(self):
        """Register number off by one digit must NOT verify."""
        engine = make_engine()
        outcome = await engine.verify(make_request(register_number="911021104002"))
        # 911021104002 is TEST STUDENT BETA (ECE, 2024), not ALPHA (CSE, 2024)
        # The engine will find BETA but name/branch won't match ALPHA's request
        outcome2 = await engine.verify(make_request(
            register_number="911021104002",
            candidate_name="Test Student Alpha",
            branch="CSE",
        ))
        assert outcome2.status == "NOT_VERIFIED"

    async def test_not_verified_exposes_no_student_id(self):
        """NOT_VERIFIED result must never include a student_id."""
        engine = make_engine()
        outcome = await engine.verify(make_request(candidate_name="Completely Wrong Name"))
        assert outcome.status == "NOT_VERIFIED"
        assert outcome.student_id is None

    async def test_not_verified_exposes_no_error_details(self):
        """
        NOT_VERIFIED due to field mismatch must NOT expose which field failed.
        errors list must be empty (errors are only for INVALID_INPUT).
        """
        engine = make_engine()
        outcome = await engine.verify(make_request(year_of_passing=9999))
        # 9999 is out of range → INVALID_INPUT, not NOT_VERIFIED
        # Test with a valid-but-wrong year instead:
        outcome2 = await engine.verify(make_request(year_of_passing=2020))
        assert outcome2.status == "NOT_VERIFIED"
        assert outcome2.errors == []  # No field-level detail on mismatch


# ===========================================================================
# Tests: Invalid input (INVALID_INPUT)
# ===========================================================================

@pytest.mark.asyncio
class TestEngineInvalidInput:

    async def test_empty_register_number_invalid_input(self):
        engine = make_engine()
        outcome = await engine.verify(make_request(register_number=""))
        assert outcome.status == "INVALID_INPUT"
        assert len(outcome.errors) > 0

    async def test_invalid_year_invalid_input(self):
        engine = make_engine()
        outcome = await engine.verify(make_request(year_of_passing="not-a-year"))
        assert outcome.status == "INVALID_INPUT"
        assert any(e.field == "year_of_passing" for e in outcome.errors)

    async def test_unknown_branch_invalid_input(self):
        engine = make_engine()
        outcome = await engine.verify(make_request(branch="UNKNOWN_BRANCH_XYZ"))
        assert outcome.status == "INVALID_INPUT"
        assert any(e.field == "branch" for e in outcome.errors)

    async def test_empty_name_invalid_input(self):
        engine = make_engine()
        outcome = await engine.verify(make_request(candidate_name=""))
        assert outcome.status == "INVALID_INPUT"


# ===========================================================================
# Tests: Duplicate data handling
# ===========================================================================

@pytest.mark.asyncio
class TestDuplicateHandling:

    async def test_exact_same_request_twice_returns_same_result(self):
        """Same valid request run twice must return the same outcome."""
        engine = make_engine()
        req = make_request()
        outcome1 = await engine.verify(req)
        outcome2 = await engine.verify(req)
        assert outcome1.status == outcome2.status
        assert outcome1.student_id == outcome2.student_id


# ===========================================================================
# Tests: build_alias_map_from_rows
# ===========================================================================

class TestBuildAliasMap:

    def test_builds_from_dict_rows(self):
        rows = [
            {"alias": "CSE", "branch_id": 1, "branch_full_name": "Computer Science and Engineering"},
            {"alias": "ECE", "branch_id": 2, "branch_full_name": "Electronics and Communication Engineering"},
        ]
        alias_map = build_alias_map_from_rows(rows)
        assert "CSE" in alias_map
        assert alias_map["CSE"]["branch_id"] == 1
        assert "ECE" in alias_map

    def test_builds_from_object_rows(self):
        class FakeRow:
            def __init__(self, alias, branch_id, branch_full_name):
                self.alias = alias
                self.branch_id = branch_id
                self.branch_full_name = branch_full_name

        rows = [FakeRow("MECH", 3, "Mechanical Engineering")]
        alias_map = build_alias_map_from_rows(rows)
        assert "MECH" in alias_map
        assert alias_map["MECH"]["branch_id"] == 3

    def test_alias_uppercased_in_map(self):
        """All keys in built alias_map should be uppercase."""
        rows = [{"alias": "cse", "branch_id": 1, "branch_full_name": "CSE"}]
        alias_map = build_alias_map_from_rows(rows)
        assert "CSE" in alias_map
        assert "cse" not in alias_map

    def test_empty_rows_produces_empty_map(self):
        alias_map = build_alias_map_from_rows([])
        assert alias_map == {}
