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


def test_list_tags_for_lead_empty_then_linked(client: TestClient) -> None:
    token = _token(client)
    r = client.post(
        "/api/v1/leads",
        json={"title": "Lead com tags", "email": "tags-lead@example.com"},
        headers=_auth(token),
    )
    assert r.status_code == 201
    lid = r.json()["id"]

    r = client.get(f"/api/v1/tags/by-entity/lead/{lid}", headers=_auth(token))
    assert r.status_code == 200
    assert r.json() == []

    r = client.post(
        "/api/v1/tags",
        json={"name": "tag-entity-test", "color_hex": "#00bcd4"},
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

    r = client.get(f"/api/v1/tags/by-entity/lead/{lid}", headers=_auth(token))
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["id"] == tid
    assert data[0]["name"] == "tag-entity-test"

    r = client.get("/api/v1/leads?page=1&pageSize=50", headers=_auth(token))
    assert r.status_code == 200
    rows = r.json()["data"]
    lead = next((x for x in rows if x["id"] == lid), None)
    assert lead is not None
    assert "tags" in lead
    assert len(lead["tags"]) == 1
    assert lead["tags"][0]["id"] == tid
