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


def test_tag_create_link_search(client: TestClient) -> None:
    token = _token(client)
    r = client.post(
        "/api/v1/leads",
        json={"title": "BuscaTeste Alpha", "email": "busca@example.com"},
        headers=_auth(token),
    )
    assert r.status_code == 201
    lid = r.json()["id"]

    r = client.post(
        "/api/v1/tags",
        json={"name": "prioritário", "color_hex": "#1976d2"},
        headers=_auth(token),
    )
    assert r.status_code == 201
    tid = r.json()["id"]

    r = client.post(
        f"/api/v1/tags/{tid}/link",
        json={"entity_type": "lead", "entity_id": lid},
        headers=_auth(token),
    )
    assert r.status_code == 204

    r = client.get("/api/v1/search?q=BuscaTeste", headers=_auth(token))
    assert r.status_code == 200
    data = r.json()
    assert data["query"] == "BuscaTeste"
    types = {h["type"] for h in data["hits"]}
    assert "lead" in types

    r = client.delete(
        f"/api/v1/tags/{tid}/link?entity_type=lead&entity_id={lid}",
        headers=_auth(token),
    )
    assert r.status_code == 204


def test_loss_reason_patch(client: TestClient) -> None:
    token = _token(client)
    r = client.get("/api/v1/loss-reasons", headers=_auth(token))
    assert r.status_code == 200
    reasons = r.json()
    assert len(reasons) >= 1
    rid = reasons[0]["id"]
    r = client.patch(
        f"/api/v1/loss-reasons/{rid}",
        json={"name": reasons[0]["name"]},
        headers=_auth(token),
    )
    assert r.status_code == 200
