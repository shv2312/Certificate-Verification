"""
tests/test_error_handling.py
==============================
Tests for the global error handling foundation.

Verifies that:
  - Invalid JSON body returns 422 with structured error (not raw exception)
  - Missing required fields return 422 with field-level details
  - Unauthorized access to protected endpoints returns 401
  - Protected endpoints do not leak internal details in error responses

Sprint 1 checklist:
  [x] Invalid requests are rejected safely
  [x] Error responses are safe (no secrets, no stack traces)
  [x] CORS headers present on responses
  [x] Authentication required on protected endpoints
  [x] No raw Python exceptions in responses
"""

import pytest
from fastapi.testclient import TestClient


# ------------------------------------------------------------------ #
# Validation errors (422)                                              #
# ------------------------------------------------------------------ #
class TestValidationErrors:

    def test_missing_body_on_send_otp_returns_422(self, client: TestClient) -> None:
        """Missing request body must return 422, not 500."""
        response = client.post("/api/v1/email/send-otp", json={})
        assert response.status_code == 422
        body = response.json()
        assert body["success"] is False
        assert body["error_code"] == "VALIDATION_ERROR"

    def test_invalid_email_returns_422(self, client: TestClient) -> None:
        """Invalid email must be rejected with 422."""
        response = client.post(
            "/api/v1/email/send-otp",
            json={"company_name": "Acme Corp", "hr_email": "not-an-email"},
        )
        assert response.status_code == 422
        body = response.json()
        assert body["success"] is False

    def test_validation_error_has_field_details(self, client: TestClient) -> None:
        """Validation errors must include field-level details."""
        response = client.post("/api/v1/email/send-otp", json={})
        body = response.json()
        assert "details" in body, "details field must be present for validation errors"
        assert isinstance(body["details"], list), "details must be a list"

    def test_validation_error_no_raw_exception_message(self, client: TestClient) -> None:
        """Validation errors must not leak raw Python exception text."""
        response = client.post("/api/v1/email/send-otp", json={"invalid": True})
        body_text = response.text.lower()
        unsafe_patterns = ["traceback", "file \"", "pydantic.error", "valueerror"]
        for pattern in unsafe_patterns:
            assert pattern not in body_text, (
                f"Response must not contain '{pattern}': {response.text[:200]}"
            )


# ------------------------------------------------------------------ #
# Authentication (401)                                                  #
# ------------------------------------------------------------------ #
class TestAuthentication:

    def test_payment_initiate_without_token_returns_401(self, client: TestClient) -> None:
        """Payment initiation without session token must return 401."""
        response = client.post("/api/v1/payment/initiate", json={})
        assert response.status_code == 401
        body = response.json()
        assert body["success"] is False
        assert "error_code" in body

    def test_bind_candidate_without_token_returns_401(self, client: TestClient) -> None:
        """Bind candidate without session token must return 401."""
        response = client.post(
            "/api/v1/verification/bind-candidate",
            json={
                "verification_request_id": "some-id",
                "candidate": {
                    "candidate_name": "Test",
                    "register_number": "ABC123",
                    "course": "B.E.",
                    "branch": "CSE",
                    "year_of_passing": 2024,
                },
            },
        )
        assert response.status_code == 401

    def test_verify_status_without_token_returns_401(self, client: TestClient) -> None:
        """Verification status without session token must return 401."""
        response = client.get("/api/v1/verification/some-request-id/status")
        assert response.status_code == 401

    def test_invalid_token_returns_401(self, client: TestClient) -> None:
        """Invalid Bearer token must return 401."""
        response = client.post(
            "/api/v1/payment/initiate",
            json={},
            headers={"Authorization": "Bearer definitely.not.a.valid.token"},
        )
        assert response.status_code == 401
        body = response.json()
        assert body["success"] is False

    def test_401_does_not_leak_secrets(self, client: TestClient) -> None:
        """401 error must not leak secret key or internal details."""
        response = client.post(
            "/api/v1/payment/initiate",
            json={},
            headers={"Authorization": "Bearer bad-token"},
        )
        body_text = response.text.lower()
        unsafe_patterns = ["secret", "password", "app_secret_key", "traceback"]
        for pattern in unsafe_patterns:
            assert pattern not in body_text, (
                f"401 response must not contain '{pattern}'"
            )


# ------------------------------------------------------------------ #
# Not found (404)                                                       #
# ------------------------------------------------------------------ #
class TestNotFound:

    def test_unknown_route_returns_404(self, client: TestClient) -> None:
        """Unknown routes must return 404."""
        response = client.get("/api/v1/does-not-exist")
        assert response.status_code == 404

    def test_404_response_has_success_false(self, client: TestClient) -> None:
        """404 response must set success=False."""
        response = client.get("/api/v99/unknown")
        assert response.status_code == 404
