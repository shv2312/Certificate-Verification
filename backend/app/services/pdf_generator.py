"""
backend/app/services/pdf_generator.py
=====================================
Re-export module mapping pdf_generator to pdf_service for ReportLab PDF generation.
"""

from app.services.pdf_service import (
    generate_verification_pdf,
    generate_acknowledgment_slip_pdf,
)

__all__ = [
    "generate_verification_pdf",
    "generate_acknowledgment_slip_pdf",
]
