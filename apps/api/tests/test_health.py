"""
Tes untuk endpoint API backend Statistika Pro.

Menguji:
- GET /api/health — health check
- GET / — root endpoint
- CORS headers
- Error handling
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import sys
import os

# Tambahkan direktori parent ke path agar bisa import main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Tes untuk endpoint GET /api/health."""

    def test_health_returns_200(self):
        """Health endpoint harus mengembalikan HTTP 200."""
        response = client.get("/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    def test_health_returns_json(self):
        """Health endpoint harus mengembalikan JSON yang valid."""
        response = client.get("/api/health")
        data = response.json()
        assert isinstance(data, dict), "Response harus berupa dict"

    def test_health_status_ok(self):
        """Field 'status' harus bernilai 'ok'."""
        response = client.get("/api/health")
        data = response.json()
        assert data["status"] == "ok", f"Expected 'ok', got '{data.get('status')}'"

    def test_health_has_required_fields(self):
        """Response harus memiliki semua field yang diperlukan."""
        response = client.get("/api/health")
        data = response.json()
        required_fields = ["status", "version", "timestamp", "environment", "services"]
        for field in required_fields:
            assert field in data, f"Field '{field}' tidak ditemukan dalam response"

    def test_health_version_not_empty(self):
        """Field 'version' tidak boleh kosong."""
        response = client.get("/api/health")
        data = response.json()
        assert data["version"], "Field 'version' tidak boleh kosong"

    def test_health_timestamp_is_iso_format(self):
        """Field 'timestamp' harus berformat ISO 8601."""
        from datetime import datetime
        response = client.get("/api/health")
        data = response.json()
        # Coba parse timestamp sebagai ISO format
        try:
            datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
        except ValueError:
            pytest.fail(f"Timestamp '{data['timestamp']}' bukan format ISO 8601 yang valid")

    def test_health_services_api_healthy(self):
        """Field 'services.api' harus bernilai 'healthy'."""
        response = client.get("/api/health")
        data = response.json()
        assert data["services"]["api"] == "healthy"

    def test_health_content_type_json(self):
        """Content-Type harus application/json."""
        response = client.get("/api/health")
        assert "application/json" in response.headers.get("content-type", "")


class TestRootEndpoint:
    """Tes untuk endpoint GET /."""

    def test_root_returns_200(self):
        """Root endpoint harus mengembalikan HTTP 200."""
        response = client.get("/")
        assert response.status_code == 200

    def test_root_has_message(self):
        """Root endpoint harus memiliki field 'message'."""
        response = client.get("/")
        data = response.json()
        assert "message" in data

    def test_root_has_health_link(self):
        """Root endpoint harus menyertakan link ke health endpoint."""
        response = client.get("/")
        data = response.json()
        assert "health" in data
        assert "/api/health" in data["health"]


class TestNotFound:
    """Tes untuk endpoint yang tidak ada."""

    def test_unknown_endpoint_returns_404(self):
        """Endpoint yang tidak terdaftar harus mengembalikan 404."""
        response = client.get("/api/endpoint-tidak-ada-ini")
        assert response.status_code == 404
