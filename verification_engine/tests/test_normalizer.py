"""
SIET Academic Background Verification Portal
Test Suite — test_normalizer.py

Tests for verification_engine/normalizer.py

Owner: Parthiban V
Date: 2026-09-02

Run with:
    pytest verification_engine/tests/test_normalizer.py -v
"""

import pytest
import sys
import os

# Allow running tests from the repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from verification_engine.normalizer import (
    normalize_register_number,
    normalize_candidate_name,
    normalize_year_of_passing,
    resolve_branch_alias,
    validate_and_normalize,
    AliasLookupResult,
)


# ---------------------------------------------------------------------------
# Sample alias map used across tests
# ---------------------------------------------------------------------------
SAMPLE_ALIAS_MAP = {
    "CSE": {"branch_id": 1, "canonical_name": "Computer Science and Engineering"},
    "COMPUTER SCIENCE AND ENGINEERING": {"branch_id": 1, "canonical_name": "Computer Science and Engineering"},
    "ECE": {"branch_id": 2, "canonical_name": "Electronics and Communication Engineering"},
    "MECH": {"branch_id": 3, "canonical_name": "Mechanical Engineering"},
    "IT": {"branch_id": 4, "canonical_name": "Information Technology"},
}


# ===========================================================================
# Tests: normalize_register_number
# ===========================================================================

class TestNormalizeRegisterNumber:

    def test_basic_numeric_register_number(self):
        """Standard numeric register number passes through unchanged."""
        result = normalize_register_number("714017104060")
        assert result == "714017104060"

    def test_leading_trailing_whitespace_stripped(self):
        """Whitespace around the register number is removed."""
        result = normalize_register_number("  714017104060  ")
        assert result == "714017104060"

    def test_internal_spaces_removed(self):
        """Internal spaces (HR typing habit) are removed."""
        result = normalize_register_number("7140 1710 4060")
        assert result == "714017104060"

    def test_converted_to_uppercase(self):
        """Alphanumeric register numbers are uppercased."""
        result = normalize_register_number("abc123xyz")
        assert result == "ABC123XYZ"

    def test_near_miss_numbers_do_not_match(self):
        """Critical: 714017104060 must not equal 714017104061."""
        r1 = normalize_register_number("714017104060")
        r2 = normalize_register_number("714017104061")
        assert r1 != r2, "Near-miss register numbers must never match."

    def test_off_by_one_last_digit(self):
        """Off-by-one in last digit must not match."""
        r1 = normalize_register_number("911021104001")
        r2 = normalize_register_number("911021104002")
        assert r1 != r2

    def test_empty_string_raises_error(self):
        """Empty register number raises ValueError."""
        with pytest.raises(ValueError, match="empty"):
            normalize_register_number("")

    def test_whitespace_only_raises_error(self):
        """Whitespace-only string raises ValueError."""
        with pytest.raises(ValueError, match="empty"):
            normalize_register_number("   ")

    def test_too_short_raises_error(self):
        """Register number shorter than 4 characters raises ValueError."""
        with pytest.raises(ValueError, match="too short"):
            normalize_register_number("12")

    def test_too_long_raises_error(self):
        """Register number longer than 30 characters raises ValueError."""
        with pytest.raises(ValueError, match="too long"):
            normalize_register_number("A" * 31)

    def test_non_string_raises_error(self):
        """Non-string input raises ValueError."""
        with pytest.raises(ValueError):
            normalize_register_number(12345)


# ===========================================================================
# Tests: normalize_candidate_name
# ===========================================================================

class TestNormalizeCandidateName:

    def test_basic_name(self):
        """Normal name is uppercased."""
        result = normalize_candidate_name("Parthiban V")
        assert result == "PARTHIBAN V"

    def test_leading_trailing_whitespace_stripped(self):
        """Whitespace around name is removed."""
        result = normalize_candidate_name("  Test Student Alpha  ")
        assert result == "TEST STUDENT ALPHA"

    def test_internal_whitespace_collapsed(self):
        """Multiple spaces between words collapsed to single space."""
        result = normalize_candidate_name("Test   Student   Alpha")
        assert result == "TEST STUDENT ALPHA"

    def test_tab_and_newline_collapsed(self):
        """Tabs and newlines treated as whitespace, collapsed."""
        result = normalize_candidate_name("Test\tStudent\nAlpha")
        assert result == "TEST STUDENT ALPHA"

    def test_already_uppercase(self):
        """Already-uppercased name passes through."""
        result = normalize_candidate_name("TEST STUDENT ALPHA")
        assert result == "TEST STUDENT ALPHA"

    def test_initials_preserved(self):
        """Initials are preserved — no removal of short name components."""
        result = normalize_candidate_name("A B C")
        assert result == "A B C"

    def test_empty_string_raises_error(self):
        """Empty name raises ValueError."""
        with pytest.raises(ValueError, match="empty"):
            normalize_candidate_name("")

    def test_whitespace_only_raises_error(self):
        """Whitespace-only raises ValueError."""
        with pytest.raises(ValueError, match="empty"):
            normalize_candidate_name("   ")

    def test_name_too_long_raises_error(self):
        """Name exceeding 200 chars raises ValueError."""
        with pytest.raises(ValueError, match="maximum"):
            normalize_candidate_name("A" * 201)

    def test_case_insensitive_comparison_works(self):
        """Two names that differ only in case normalize to the same value."""
        n1 = normalize_candidate_name("test student alpha")
        n2 = normalize_candidate_name("TEST STUDENT ALPHA")
        assert n1 == n2

    def test_different_names_do_not_match(self):
        """Different names must not compare equal after normalization."""
        n1 = normalize_candidate_name("Test Student Alpha")
        n2 = normalize_candidate_name("Test Student Beta")
        assert n1 != n2


# ===========================================================================
# Tests: normalize_year_of_passing
# ===========================================================================

class TestNormalizeYearOfPassing:

    def test_valid_integer_year(self):
        assert normalize_year_of_passing(2024) == 2024

    def test_valid_string_year(self):
        assert normalize_year_of_passing("2024") == 2024

    def test_year_1990_boundary(self):
        assert normalize_year_of_passing(1990) == 1990

    def test_year_2100_boundary(self):
        assert normalize_year_of_passing(2100) == 2100

    def test_year_below_range_raises(self):
        with pytest.raises(ValueError, match="range"):
            normalize_year_of_passing(1989)

    def test_year_above_range_raises(self):
        with pytest.raises(ValueError, match="range"):
            normalize_year_of_passing(2101)

    def test_non_numeric_raises(self):
        with pytest.raises(ValueError, match="valid integer"):
            normalize_year_of_passing("twenty-twenty-four")

    def test_float_string_raises(self):
        with pytest.raises(ValueError, match="valid integer"):
            normalize_year_of_passing("2024.5")

    def test_none_raises(self):
        with pytest.raises(ValueError):
            normalize_year_of_passing(None)

    def test_exact_year_match(self):
        """Same year must compare equal."""
        assert normalize_year_of_passing(2024) == normalize_year_of_passing("2024")

    def test_different_year_does_not_match(self):
        """Different years must not compare equal."""
        assert normalize_year_of_passing(2024) != normalize_year_of_passing(2025)


# ===========================================================================
# Tests: resolve_branch_alias
# ===========================================================================

class TestResolveBranchAlias:

    def test_known_alias_resolves(self):
        result = resolve_branch_alias("CSE", SAMPLE_ALIAS_MAP)
        assert result.resolved is True
        assert result.branch_id == 1

    def test_full_name_alias_resolves(self):
        result = resolve_branch_alias(
            "Computer Science and Engineering", SAMPLE_ALIAS_MAP
        )
        assert result.resolved is True
        assert result.branch_id == 1

    def test_case_insensitive_lookup(self):
        """Input casing should not matter — resolution is case-insensitive."""
        result = resolve_branch_alias("cse", SAMPLE_ALIAS_MAP)
        assert result.resolved is True

    def test_whitespace_trimmed_before_lookup(self):
        result = resolve_branch_alias("  CSE  ", SAMPLE_ALIAS_MAP)
        assert result.resolved is True

    def test_unknown_alias_not_resolved(self):
        result = resolve_branch_alias("AEROSPACE", SAMPLE_ALIAS_MAP)
        assert result.resolved is False
        assert result.branch_id is None

    def test_empty_string_not_resolved(self):
        result = resolve_branch_alias("", SAMPLE_ALIAS_MAP)
        assert result.resolved is False

    def test_partial_name_not_resolved(self):
        """'Computer' alone must NOT resolve — no substring matching."""
        result = resolve_branch_alias("Computer", SAMPLE_ALIAS_MAP)
        assert result.resolved is False

    def test_non_string_not_resolved(self):
        result = resolve_branch_alias(None, SAMPLE_ALIAS_MAP)
        assert result.resolved is False

    def test_different_branches_resolve_to_different_ids(self):
        r_cse = resolve_branch_alias("CSE", SAMPLE_ALIAS_MAP)
        r_ece = resolve_branch_alias("ECE", SAMPLE_ALIAS_MAP)
        assert r_cse.branch_id != r_ece.branch_id


# ===========================================================================
# Tests: validate_and_normalize (integration of all normalizers)
# ===========================================================================

class TestValidateAndNormalize:

    def test_all_valid_inputs_succeed(self):
        normalized, errors = validate_and_normalize(
            raw_register_number="911021104001",
            raw_name="Test Student Alpha",
            raw_branch="CSE",
            raw_year_of_passing=2024,
            alias_map=SAMPLE_ALIAS_MAP,
        )
        assert errors is None
        assert normalized is not None
        assert normalized.register_number == "911021104001"
        assert normalized.name_normalized == "TEST STUDENT ALPHA"
        assert normalized.branch_id == 1
        assert normalized.year_of_passing == 2024

    def test_invalid_register_number_returns_error(self):
        normalized, errors = validate_and_normalize(
            raw_register_number="",
            raw_name="Test Student Alpha",
            raw_branch="CSE",
            raw_year_of_passing=2024,
            alias_map=SAMPLE_ALIAS_MAP,
        )
        assert normalized is None
        assert any(e.field == "register_number" for e in errors)

    def test_invalid_year_returns_error(self):
        normalized, errors = validate_and_normalize(
            raw_register_number="911021104001",
            raw_name="Test Student Alpha",
            raw_branch="CSE",
            raw_year_of_passing="not-a-year",
            alias_map=SAMPLE_ALIAS_MAP,
        )
        assert normalized is None
        assert any(e.field == "year_of_passing" for e in errors)

    def test_unknown_branch_returns_error(self):
        normalized, errors = validate_and_normalize(
            raw_register_number="911021104001",
            raw_name="Test Student Alpha",
            raw_branch="UNKNOWN_BRANCH_XYZ",
            raw_year_of_passing=2024,
            alias_map=SAMPLE_ALIAS_MAP,
        )
        assert normalized is None
        assert any(e.field == "branch" for e in errors)

    def test_multiple_invalid_fields_returns_all_errors(self):
        normalized, errors = validate_and_normalize(
            raw_register_number="",
            raw_name="",
            raw_branch="UNKNOWN",
            raw_year_of_passing="bad",
            alias_map=SAMPLE_ALIAS_MAP,
        )
        assert normalized is None
        assert len(errors) >= 3  # register_number, name, year, branch
