import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def _admin_token(client: TestClient) -> str:
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "admin123"},
    )
    assert r.status_code == 200
    return r.json()["accessToken"]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_admin_lists_users(client: TestClient) -> None:
    token = _admin_token(client)
    r = client.get("/api/v1/users?page=1&pageSize=10", headers=_auth(token))
    assert r.status_code == 200
    body = r.json()
    assert "data" in body and "meta" in body
    assert len(body["data"]) >= 1
    assert body["data"][0]["email"] == "admin@example.com"
    assert body["data"][0]["is_admin"] is True


def test_non_admin_forbidden_on_users_list(client: TestClient) -> None:
    admin_t = _admin_token(client)
    r = client.post(
        "/api/v1/users",
        json={
            "email": "plain@example.com",
            "password": "plain1234",
            "full_name": "Utilizador normal",
            "is_admin": False,
        },
        headers=_auth(admin_t),
    )
    assert r.status_code == 201

    r = client.post(
        "/api/v1/auth/login",
        json={"email": "plain@example.com", "password": "plain1234"},
    )
    assert r.status_code == 200
    plain_t = r.json()["accessToken"]

    r = client.get("/api/v1/users", headers=_auth(plain_t))
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "FORBIDDEN"
