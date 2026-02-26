"""
Tests for authentication endpoints.
"""


class TestRegistration:
    """Test user registration flow."""

    def test_register_success(self, client):
        """New user registration should return 201 with user data."""
        response = client.post("/api/auth/register", json={
            "name": "Alice",
            "email": "alice@example.com",
            "password": "securepass",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "alice@example.com"
        assert data["name"] == "Alice"
        assert "id" in data

    def test_register_duplicate_email(self, client):
        """Duplicate email should return 400."""
        user = {"name": "Bob", "email": "bob@example.com", "password": "pass123"}
        client.post("/api/auth/register", json=user)
        response = client.post("/api/auth/register", json=user)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        """Invalid email format should return 422."""
        response = client.post("/api/auth/register", json={
            "name": "Bad", "email": "not-email", "password": "pass123",
        })
        assert response.status_code == 422

    def test_register_short_password(self, client):
        """Password under 6 chars should return 422."""
        response = client.post("/api/auth/register", json={
            "name": "Short", "email": "short@example.com", "password": "12345",
        })
        assert response.status_code == 422


class TestLogin:
    """Test user login flow."""

    def test_login_success(self, client):
        """Valid credentials should return a JWT token."""
        client.post("/api/auth/register", json={
            "name": "Login User", "email": "login@example.com", "password": "mypass123",
        })
        response = client.post("/api/auth/login", json={
            "email": "login@example.com", "password": "mypass123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        """Wrong password should return 401."""
        client.post("/api/auth/register", json={
            "name": "User", "email": "user@example.com", "password": "correct123",
        })
        response = client.post("/api/auth/login", json={
            "email": "user@example.com", "password": "wrongpass",
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        """Non-existent email should return 401."""
        response = client.post("/api/auth/login", json={
            "email": "ghost@example.com", "password": "passpass",
        })
        assert response.status_code == 401


class TestMe:
    """Test /me endpoint."""

    def test_get_current_user(self, client, auth_headers):
        """Authenticated request to /me should return user profile."""
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["email"] == "test@example.com"

    def test_get_me_unauthenticated(self, client):
        """Request without token should return 401."""
        response = client.get("/api/auth/me")
        assert response.status_code == 401
