"""
SIET Academic Background Verification Portal
Verification Engine — normalizer.py

Owner: Parthiban V
Date: 2026-09-02

PURPOSE:
    Safe input normalization functions for HR-submitted candidate data.

POLICY (see docs/DATA_NORMALIZATION_RULES.md for full details):
    - Register number: strip whitespace, uppercase, no other transformation.
    - Candidate name: strip, collapse internal whitespace, uppercase (for
      comparison only — never for display or return to HR).
    - Branch/Programme: alias table lookup via branch_aliases table.
      No fuzzy matching. No phonetic matching.
    - Year of passing: integer cast with range validation.

IMPORTANT:
    These functions normalize HR input for COMPARISON purposes only.
    Normalized forms must NEVER be returned to the HR user as responses.
    The source-of-truth display name always comes from the students table.
"""

import re
from dataclasses import dataclass
from typing import Optional


# ---------------------------------------------------------------------------
# Register Number Normalization
# ---------------------------------------------------------------------------

def normalize_register_number(raw: str) -> str:
    """
    Normalize a register/roll number for strict comparison.

    Policy:
        - Strip leading/trailing whitespace.
        - Remove internal whitespace (some HR entries may have spaces).
        - Convert to uppercase.
        - No other transformation. No fuzzy matching.

    False-positive risk is HIGH for register numbers.
    '714017104060' must NEVER match '714017104061'.

    Args:
        raw: The raw register number string submitted by HR.

    Returns:
        Normalized register number string.

    Raises:
        ValueError: If the result is empty after normalization.
    """
    if not isinstance(raw, str):
        raise ValueError("Register number must be a string.")

    normalized = re.sub(r'\s+', '', raw.strip()).upper()

    if not normalized:
        raise ValueError("Register number cannot be empty.")

    # Sanity: register numbers are typically numeric or alphanumeric,
    # 6–20 characters. Flag suspiciously short or long values.
    if len(normalized) < 4:
        raise ValueError(
            f"Register number '{normalized}' is too short to be valid "
            f"(min 4 characters)."
        )
    if len(normalized) > 30:
        raise ValueError(
            f"Register number is too long (max 30 characters)."
        )

    return normalized


# ---------------------------------------------------------------------------
# Candidate Name Normalization
# ---------------------------------------------------------------------------

def normalize_candidate_name(raw: str) -> str:
    """
    Normalize a candidate name for comparison purposes ONLY.

    Policy:
        - Strip leading/trailing whitespace.
        - Collapse multiple internal spaces to a single space.
        - Convert to uppercase.

    What this does NOT do (by design — false-positive risk):
        - Does NOT remove initials.
        - Does NOT rearrange name components.
        - Does NOT apply phonetic matching.
        - Does NOT apply fuzzy/edit-distance matching.
        - Does NOT auto-correct spelling.

    The normalized form is used only for comparison against
    students.full_name_normalized. It is NEVER returned to the HR user.

    Args:
        raw: The raw name string submitted by HR.

    Returns:
        Normalized name string (uppercase, collapsed whitespace).

    Raises:
        ValueError: If the result is empty after normalization.
    """
    if not isinstance(raw, str):
        raise ValueError("Candidate name must be a string.")

    normalized = re.sub(r'\s+', ' ', raw.strip()).upper()

    if not normalized:
        raise ValueError("Candidate name cannot be empty.")

    if len(normalized) > 200:
        raise ValueError("Candidate name exceeds maximum allowed length (200 characters).")

    return normalized


# ---------------------------------------------------------------------------
# Year of Passing Normalization
# ---------------------------------------------------------------------------

YEAR_MIN = 1990
YEAR_MAX = 2100


def normalize_year_of_passing(raw) -> int:
    """
    Normalize and validate year of passing.

    Policy:
        - Accept integer or string representation of a year.
        - Validate within a reasonable academic range.
        - Strict integer equality comparison in matcher.

    Args:
        raw: Year value (int or string) submitted by HR.

    Returns:
        Validated integer year.

    Raises:
        ValueError: If year is not a valid integer or out of range.
    """
    try:
        year = int(raw)
    except (TypeError, ValueError):
        raise ValueError(f"Year of passing must be a valid integer. Got: '{raw}'.")

    if not (YEAR_MIN <= year <= YEAR_MAX):
        raise ValueError(
            f"Year of passing {year} is out of the accepted range "
            f"({YEAR_MIN}–{YEAR_MAX})."
        )

    return year


# ---------------------------------------------------------------------------
# Branch Alias Resolution
# ---------------------------------------------------------------------------

@dataclass
class AliasLookupResult:
    """Result of a branch alias lookup."""
    resolved: bool
    branch_id: Optional[int] = None
    canonical_name: Optional[str] = None


def resolve_branch_alias(raw_branch: str, alias_map: dict) -> AliasLookupResult:
    """
    Resolve an HR-entered branch string to a canonical branch_id using
    the alias_map (pre-loaded from the branch_aliases database table).

    Policy:
        - Strip and uppercase the HR input.
        - Look up EXACTLY in the alias_map.
        - If found → return branch_id.
        - If not found → resolved=False (verification will fail safely).
        - No fuzzy matching. No substring matching.

    Args:
        raw_branch: Branch string submitted by HR.
        alias_map:  Dict mapping UPPERCASE alias strings → branch record dicts.
                    Expected structure:
                    {
                        "CSE": {"branch_id": 1, "canonical_name": "Computer Science and Engineering"},
                        ...
                    }

    Returns:
        AliasLookupResult with resolved=True/False and branch_id if found.
    """
    if not isinstance(raw_branch, str):
        return AliasLookupResult(resolved=False)

    normalized_input = re.sub(r'\s+', ' ', raw_branch.strip()).upper()

    if normalized_input in alias_map:
        entry = alias_map[normalized_input]
        return AliasLookupResult(
            resolved=True,
            branch_id=entry["branch_id"],
            canonical_name=entry.get("canonical_name"),
        )

    return AliasLookupResult(resolved=False)


# ---------------------------------------------------------------------------
# Input Validation Bundle
# ---------------------------------------------------------------------------

@dataclass
class NormalizedInput:
    """
    Fully normalized and validated HR candidate submission.
    All fields are ready for database lookup and comparison.
    """
    register_number: str
    name_normalized: str
    branch_id: Optional[int]
    year_of_passing: int


@dataclass
class ValidationError:
    """Describes a field-level validation failure."""
    field: str
    message: str


def validate_and_normalize(
    raw_register_number: str,
    raw_name: str,
    raw_branch: str,
    raw_year_of_passing,
    alias_map: dict,
) -> tuple:
    """
    Validate and normalize all HR-submitted candidate fields.

    Returns:
        (NormalizedInput, None) on success.
        (None, list[ValidationError]) on validation failure.

    Does NOT access the database. Pure in-memory normalization.
    """
    errors = []
    register_number = None
    name_normalized = None
    branch_id = None
    year_of_passing = None

    # Register number
    try:
        register_number = normalize_register_number(raw_register_number)
    except ValueError as e:
        errors.append(ValidationError(field="register_number", message=str(e)))

    # Candidate name
    try:
        name_normalized = normalize_candidate_name(raw_name)
    except ValueError as e:
        errors.append(ValidationError(field="name", message=str(e)))

    # Year of passing
    try:
        year_of_passing = normalize_year_of_passing(raw_year_of_passing)
    except ValueError as e:
        errors.append(ValidationError(field="year_of_passing", message=str(e)))

    # Branch alias resolution
    alias_result = resolve_branch_alias(raw_branch, alias_map)
    if alias_result.resolved:
        branch_id = alias_result.branch_id
    else:
        errors.append(ValidationError(
            field="branch",
            message=(
                f"Branch '{raw_branch}' could not be mapped to a recognized "
                f"branch. Please use a standard branch name or abbreviation."
            ),
        ))

    if errors:
        return None, errors

    return NormalizedInput(
        register_number=register_number,
        name_normalized=name_normalized,
        branch_id=branch_id,
        year_of_passing=year_of_passing,
    ), None
