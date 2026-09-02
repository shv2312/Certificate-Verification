"""
SIET Academic Background Verification Portal
Verification Engine Package

Owner: Parthiban V (Database, Verification Engine & Deployment Lead)

This package implements the database-driven verification engine.
No AI, no LLM, no fuzzy matching — strict record comparison only.

Architecture:
    normalizer.py  → Safe input normalization (no guessing)
    matcher.py     → Field-by-field comparison against official record
    engine.py      → Orchestration: validate → normalize → lookup → compare

Integration:
    Shri Hari's FastAPI backend calls engine.run_verification(request_data)
    and receives a VerificationResult with status VERIFIED or NOT_VERIFIED.
    See docs/VERIFICATION_ENGINE_CONTRACT.md for the full API contract.
"""

__version__ = "1.0"
