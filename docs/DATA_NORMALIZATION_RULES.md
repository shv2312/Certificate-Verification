# Data Normalization Rules
## SIET Academic Background Verification Portal — Sprint 1

**Owner**: Parthiban V  
**Date**: 2026-09-02

---

## Purpose

This document defines the exact normalization and matching policy for each candidate field submitted by HR users. These rules are implemented in `verification_engine/normalizer.py` and `verification_engine/matcher.py`.

---

## Overall Philosophy

> The official college database is the source of truth.  
> The system must NOT guess academic information.  
> False-positive verification is much more serious than rejecting an incorrectly entered request.

---

## 1. Register Number

### Normalization
| Step | Description |
|---|---|
| Strip whitespace | Remove all leading, trailing, and internal whitespace |
| Uppercase | Convert any alphabetic characters to uppercase |

### Matching
**Strict exact match only.** After normalization, the HR-submitted register number must match the database value character-for-character.

### What is NOT done
- No fuzzy matching
- No phonetic matching
- No partial matching
- No "close enough" comparison

### Why
Register number `714017104060` must NEVER match `714017104061`. Off-by-one errors must be caught, not silently accepted.

---

## 2. Candidate Name

### Normalization
| Step | Description |
|---|---|
| Strip whitespace | Remove leading and trailing whitespace |
| Collapse internal whitespace | Replace sequences of whitespace (spaces, tabs, newlines) with a single space |
| Uppercase | Convert all characters to uppercase |

The normalized form is stored in `students.full_name_normalized` at import time.

### Matching
Case-insensitive, whitespace-normalized comparison. Both the HR input and the official record are normalized to the same form before comparison.

### What is NOT done
- Initials are NOT removed or rearranged
- No phonetic matching (Soundex, Metaphone, etc.)
- No edit-distance / Levenshtein matching
- No automatic spelling correction
- The normalized name is NEVER returned to the HR user — it is used for comparison only

### Why
Aggressive name transformations risk verifying the wrong candidate. The college should import official names exactly as registered. HR should enter names exactly as they appear on official documents.

---

## 3. Branch / Specialization

### Normalization
Uses a controlled alias lookup table (`branch_aliases`). This is the only approved method.

| Step | Description |
|---|---|
| Strip and uppercase | HR input is trimmed and uppercased |
| Alias lookup | Exact lookup in `branch_aliases` table |
| Resolve to `branch_id` | If found, returns the canonical integer branch ID |

### Matching
Exact integer match of the resolved `branch_id` against `students.branch_id`.

### What is NOT done
- No fuzzy text matching
- No substring matching ("CSE" does NOT match "M.E. CSE" unless explicitly aliased)
- No automatic inference of branch from partial text

### Current Approved Aliases (Sprint 1 — Placeholder)
> ⚠️ Official programme and branch list must be confirmed with the SIET college registrar. Current aliases are structural placeholders.

| HR Input (any case) | Resolves To |
|---|---|
| `CSE`, `Computer Science and Engineering`, `BE CSE` | `branches.code = CSE` under `BE-CSE` |
| `ECE`, `Electronics and Communication Engineering`, `BE ECE` | `branches.code = ECE` under `BE-ECE` |
| `EEE`, `Electrical and Electronics Engineering`, `BE EEE` | `branches.code = EEE` under `BE-EEE` |
| `MECH`, `Mechanical Engineering`, `BE MECH` | `branches.code = MECH` under `BE-MECH` |
| `CIVIL`, `Civil Engineering`, `BE CIVIL` | `branches.code = CIVIL` under `BE-CIVIL` |
| `IT`, `Information Technology`, `BE IT` | `branches.code = IT` under `BE-IT` |
| `AUTO`, `Automobile Engineering`, `BE AUTO` | `branches.code = AUTO` under `BE-AUTO` |
| `MBA`, `Master of Business Administration` | `branches.code = MBA` under `MBA` |
| `MCA`, `Master of Computer Applications` | `branches.code = MCA` under `MCA` |

**If the HR-entered branch does not match any alias**: The request is returned as `INVALID_INPUT` with a message asking HR to use a recognized branch name. This prevents reaching the database with an unresolvable branch.

### Adding New Aliases
New aliases may be added to the `branch_aliases` table. Each new alias requires:
1. Confirmation that the alias should unambiguously map to a single branch
2. An INSERT into `branch_aliases` with the alias (stored uppercase) and `branch_id`

---

## 4. Year of Passing

### Normalization
| Step | Description |
|---|---|
| Integer cast | String representation is cast to integer |
| Range check | Must be between 1990 and 2100 (inclusive) |

### Matching
Exact integer equality. `2024 != 2023`.

### What is NOT done
- No approximate year matching
- No "within one year" tolerance
- The range (1990–2100) is wide enough to not break on future batches

---

## 5. Programme / Course

In Sprint 1, the primary lookup field is the register number, and branch_id serves as the programme proxy (since branches belong to programmes). Programme is not directly submitted by HR as a separate field in the current approved HR input set. If programme becomes a separate HR input field in a future sprint, the same alias-table approach used for branches will apply.

---

## Field Matching Summary

| Field | Normalization | Matching Method |
|---|---|---|
| Register Number | Strip whitespace, uppercase | Exact string match |
| Candidate Name | Strip, collapse spaces, uppercase | Exact normalized string match |
| Branch | Strip, uppercase, alias table lookup | Exact branch_id integer match |
| Year of Passing | Integer cast + range check | Exact integer match |

---

## Result Disclosure Policy

**On NOT_VERIFIED**:
- The system returns only: *"Verification unsuccessful. One or more submitted details could not be verified against institutional records."*
- The system does NOT reveal which field failed
- The system does NOT reveal the official database value for any field
- Both "record not found" and "field mismatch" return the identical NOT_VERIFIED response

**Why**: Revealing which field failed (e.g., "year of passing is incorrect") would allow a bad actor to iteratively guess the correct value.
