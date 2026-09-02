"""
tests/conftest.py
==================
Shared pytest fixtures for the SIET BGV backend test suite.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture(scope="session")
def app():
    """Create a fresh application instance for the test session."""
    return create_app()


@pytest.fixture(scope="session")
def client(app):
    """Synchronous TestClient for route-level tests."""
    with TestClient(app) as c:
        yield c
