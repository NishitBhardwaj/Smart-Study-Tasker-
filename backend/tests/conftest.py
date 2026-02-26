"""
Shared test fixtures for SmartStudy backend tests.
Uses an in-memory SQLite database so no external DB is required.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# In-memory SQLite for fast, isolated tests
SQLALCHEMY_TEST_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test function."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI test client with overridden DB dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Register a test user and return auth headers with JWT token."""
    # Register
    client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass123",
    })
    # Login
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123",
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
