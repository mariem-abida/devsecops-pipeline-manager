"""
Unit Tests for Sample Python Flask Application
Tests all endpoints required by the DevSecOps pipeline.
"""
import pytest
from app import app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_index_returns_200(client):
    """Test that the index endpoint returns 200."""
    response = client.get("/")
    assert response.status_code == 200


def test_index_returns_message(client):
    """Test that the index endpoint returns the correct message."""
    response = client.get("/")
    data = response.get_json()
    assert "message" in data
    assert "DevSecOps" in data["message"]


def test_health_returns_200(client):
    """Test that the health endpoint returns 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_returns_ok(client):
    """Test that the health endpoint returns ok status."""
    response = client.get("/health")
    data = response.get_json()
    assert data["status"] == "ok"
    assert data["service"] == "sample-python-app"


def test_get_users_returns_200(client):
    """Test that the users endpoint returns 200."""
    response = client.get("/api/users")
    assert response.status_code == 200


def test_get_users_returns_list(client):
    """Test that the users endpoint returns a list of users."""
    response = client.get("/api/users")
    data = response.get_json()
    assert "users" in data
    assert data["count"] == 3
    assert len(data["users"]) == 3


def test_get_users_has_correct_fields(client):
    """Test that users have the required fields."""
    response = client.get("/api/users")
    data = response.get_json()
    user = data["users"][0]
    assert "id" in user
    assert "name" in user
    assert "role" in user


def test_get_status_returns_200(client):
    """Test that the status endpoint returns 200."""
    response = client.get("/api/status")
    assert response.status_code == 200


def test_get_status_returns_operational(client):
    """Test that the status shows operational."""
    response = client.get("/api/status")
    data = response.get_json()
    assert data["status"] == "operational"
    assert data["pipeline"] == "devsecops"
