import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def _token(client: TestClient) -> str:
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "admin123"},
    )
    assert r.status_code == 200
    return r.json()["accessToken"]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_patch_me_updates_profile(client: TestClient) -> None:
    token = _token(client)
    r = client.patch(
        "/api/v1/me",
        json={
            "full_name": "Admin Atualizado",
            "phone": "+55 11 99999-0000",
            "theme_preference": "dark",
            "sidebar_collapsed_default": True,
        },
        headers=_auth(token),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["full_name"] == "Admin Atualizado"
    assert body["phone"] == "+55 11 99999-0000"
    assert body["theme_preference"] == "dark"
    assert body["sidebar_collapsed_default"] is True

    r2 = client.get("/api/v1/me", headers=_auth(token))
    assert r2.json()["phone"] == "+55 11 99999-0000"
