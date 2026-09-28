"""
SIET Academic Background Verification Portal
Test Suite — test_matcher.py

Tests for verification_engine/matcher.py

Owner: Parthiban V
Date: 2026-09-02

Run with:
    pytest verification_engine/tests/test_matcher.py -v
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from verification_engine.matcher import (
    compare_records,
    handle_record_not_found,
    StudentRecord,
    VerificationStatus,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def make_official_record(
    student_id=1,
    register_number="911021104001",
    full_name_normalized="TEST STUDENT ALPHA",
    branch_id=1,
    year_of_passing=2024,
) -> StudentRecord:
    return StudentRecord(
        student_id=student_id,
        register_number=register_number,
        full_name_normalized=full_name_normalized,
        branch_id=branch_id,
        year_of_passing=year_of_passing,
    )


# ===========================================================================
# Tests: compare_records — VERIFIED cases
# ===========================================================================

class TestCompareRecordsVerified:

    def test_all_fields_match_returns_verified(self):
        record = make_official_record()
        result = compare_records(
            normalized_register_number="911021104001",
            normalized_name="TEST STUDENT ALPHA",
            resolved_branch_id=1,
            normalized_year=2024,
            official_record=record,
        )
        assert result.status == VerificationStatus.VERIFIED
        assert result.is_verified is True

    def test_verified_result_includes_student_id(self):
        """VERIFIED result must include student_id for report generation."""
        record = make_official_record(student_id=42)
        result = compare_records(
            normalized_register_number="911021104001",
            normalized_name="TEST STUDENT ALPHA",
            resolved_branch_id=1,
            normalized_year=2024,
            official_record=record,
        )
        assert result.status == VerificationStatus.VERIFIED
        assert result.student_id == 42


# ===========================================================================
# Tests: compare_records — NOT_VERIFIED cases (field mismatches)
# ===========================================================================

class TestCompareRecordsNotVerified:

    def test_register_number_mismatch_not_verified(self):
        """Different register number → NOT_VERIFIED."""
        record = make_official_record(register_number="911021104001")
        result = compare_records(
            normalized_register_number="911021104002",  # different
            normalized_name="TEST STUDENT ALPHA",
            resolved_branch_id=1,
            normalized_year=2024,
            official_record=record,
        )
        assert result.status == VerificationStatus.NOT_VERIFIED
        assert result.student_id is None

    def test_name_mismatch_not_verified(self):
        """Different name → NOT_VERIFIED."""
        record = make_official_record(full_name_normalized="TEST STUDENT ALPHA")
        result = compare_records(
            normalized_register_number="911021104001",
            normalized_name="TEST STUDENT BETA",           # different name
            resolved_branch_id=1,
            normalized_year=2024,
            official_record=record,
        )
        assert result.status == VerificationStatus.NOT_VERIFIED
        assert result.student_id is None

    def test_branch_mismatch_not_verified(self):
        """Different branch_id → NOT_VERIFIED."""
        record = make_official_record(branch_id=1)
        result = compare_records(
            normalized_register_number="911021104001",
            normalized_name="TEST STUDENT ALPHA",
            resolved_branch_id=2,                          # ECE, not CSE
            normalized_year=2024,
            official_record=record,
        )
        assert result.status == VerificationStatus.NOT_VERIFIED

    def test_year_mismatch_not_verified(self):
        """Different year → NOT_VERIFIED."""
        record = make_official_record(year_of_passing=2024)
        result = compare_records(
            normalized_register_number="911021104001",
            normalized_name="TEST STUDENT ALPHA",
            resolved_branch_id=1,
            normalized_year=2023,                          # wrong year
            official_record=record,
        )
        assert result.status == VerificationStatus.NOT_VERIFIED

    def test_off_by_one_year_not_verified(self):
        """Off-by-one year must not verify."""
        record = make_official_record(year_of_passing=2024)
        result_minus = compare_records("911021104001", "TEST STUDENT ALPHA", 1, 2023, record)
        result_plus  = compare_records("911021104001", "TEST STUDENT ALPHA", 1, 2025, record)
        assert result_minus.status == VerificationStatus.NOT_VERIFIED
        assert result_plus.status  == VerificationStatus.NOT_VERIFIED

    def test_near_miss_register_number_not_verified(self):
        """Off-by-one register number must never verify."""
        record = make_official_record(register_number="714017104060")
        result = compare_records(
            normalized_register_number="714017104061",  # one digit off
            normalized_name="TEST STUDENT ALPHA",
            resolved_branch_id=1,
            normalized_year=2024,
            official_record=record,
        )
        assert result.status == VerificationStatus.NOT_VERIFIED

    def test_all_fields_wrong_not_verified(self):
        """All fields wrong → NOT_VERIFIED."""
        record = make_official_record()
        result = compare_records(
            normalized_register_number="000000000000",
            normalized_name="NOBODY HERE",
            resolved_branch_id=99,
            normalized_year=1900,
            official_record=record,
        )
        assert result.status == VerificationStatus.NOT_VERIFIED

    def test_not_verified_result_has_no_student_id(self):
        """NOT_VERIFIED must never expose student_id."""
        record = make_official_record(student_id=99)
        result = compare_records(
            normalized_register_number="911021104001",
            normalized_name="WRONG NAME",
            resolved_branch_id=1,
            normalized_year=2024,
            official_record=record,
        )
        assert result.status == VerificationStatus.NOT_VERIFIED
        assert result.student_id is None


# ===========================================================================
# Tests: handle_record_not_found
# ===========================================================================

class TestHandleRecordNotFound:

    def test_returns_not_verified(self):
        result = handle_record_not_found()
        assert result.status == VerificationStatus.NOT_VERIFIED

    def test_returns_no_student_id(self):
        """Even 'not found' must not expose any student ID."""
        result = handle_record_not_found()
        assert result.student_id is None

    def test_is_not_verified_property(self):
        result = handle_record_not_found()
        assert result.is_verified is False


# ===========================================================================
# Tests: Privacy guarantee — no information leakage
# ===========================================================================

class TestPrivacyGuarantee:

    def test_mismatch_result_does_not_reveal_official_name(self):
        """
        On mismatch, the result object must not contain the official name.
        The MatchResult dataclass has no field for official values by design.
        """
        record = make_official_record(full_name_normalized="SECRET OFFICIAL NAME")
        result = compare_records("911021104001", "WRONG NAME", 1, 2024, record)

        # The result object itself must not carry the official name
        result_dict = result.__dict__
        assert "SECRET OFFICIAL NAME" not in str(result_dict)

    def test_mismatch_result_does_not_reveal_official_year(self):
        """On year mismatch, official year must not appear in result."""
        record = make_official_record(year_of_passing=2099)
        result = compare_records("911021104001", "TEST STUDENT ALPHA", 1, 2024, record)

        assert result.status == VerificationStatus.NOT_VERIFIED
        # 2099 must not appear in the result object
        assert str(2099) not in str(result.__dict__)

    def test_not_found_indistinguishable_from_mismatch(self):
        """
        'Record not found' and 'field mismatch' both return NOT_VERIFIED.
        The HR side cannot tell the difference.
        """
        not_found = handle_record_not_found()
        mismatch = compare_records(
            "911021104001", "WRONG NAME", 1, 2024, make_official_record()
        )
        assert not_found.status == mismatch.status
        assert not_found.student_id == mismatch.student_id
