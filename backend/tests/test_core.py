import pytest
from fastapi.testclient import TestClient

from app.core.security import (
    create_access_token,
    decode_token,
    decrypt_api_key,
    encrypt_api_key,
    hash_password,
    verify_password,
)
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_password_hash_roundtrip():
    hashed = hash_password("SuperSecret123!")
    assert verify_password("SuperSecret123!", hashed)
    assert not verify_password("WrongPassword", hashed)


def test_jwt_roundtrip():
    token = create_access_token("user-123")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["type"] == "access"


def test_api_key_encryption_roundtrip():
    raw_key = "sk-ant-demo-key-1234567890"
    encrypted = encrypt_api_key(raw_key)
    assert encrypted != raw_key
    assert decrypt_api_key(encrypted) == raw_key


def test_register_and_login_flow(monkeypatch):
    # Uses the app's real routes; requires a reachable test database to fully pass in CI.
    # Included as a template — wire up a test DB fixture (e.g. a local Postgres instance,
    # or sqlite via aiosqlite) before running in CI.
    pytest.skip("Wire up a test database fixture before enabling this in CI.")
