"""
tests/test_health.py
=====================
Tests for the health check endpoint.

Sprint 1 checklist:
  [x] Backend starts successfully
  [x] Health endpoint returns HTTP 200
  [x] Response matches expected schema
  [x] No secrets in response
  [x] No stack traces in response
"""

import pytest
from fastapi.testclient import TestClient


def test_health_returns_200(client: TestClient) -> None:
    """Health endpoint must return HTTP 200."""
    response = client.get("/api/health")
    assert response.status_code == 200, (
        f"Expected 200, got {response.status_code}. Body: {response.text}"
    )


def test_health_response_structure(client: TestClient) -> None:
    """Health response must match the standard APIResponse envelope."""
    response = client.get("/api/health")
    body = response.json()

    assert body["success"] is True, "success must be True"
    assert "message" in body, "message field must be present"
    assert "data" in body, "data field must be present"


def test_health_data_fields(client: TestClient) -> None:
    """Health data must contain 'status' and 'environment' fields."""
    response = client.get("/api/health")
    data = response.json()["data"]

    assert "status" in data, "data.status must be present"
    assert data["status"] == "ok", "data.status must be 'ok'"
    assert "environment" in data, "data.environment must be present"
    assert "version" in data, "data.version must be present"


def test_health_no_sensitive_fields(client: TestClient) -> None:
    """Health response must not expose any sensitive configuration."""
    response = client.get("/api/health")
    body_text = response.text.lower()

    sensitive_patterns = [
        "password",
        "secret",
        "database_url",
        "smtp_password",
        "webhook_secret",
        "postgresql://",
        "traceback",
        "exception",
        "stack",
    ]
    for pattern in sensitive_patterns:
        assert pattern not in body_text, (
            f"Health response must not contain '{pattern}'. "
            f"Found in: {response.text[:200]}"
        )


def test_health_content_type_is_json(client: TestClient) -> None:
    """Health response content type must be application/json."""
    response = client.get("/api/health")
    assert "application/json" in response.headers.get("content-type", "")
