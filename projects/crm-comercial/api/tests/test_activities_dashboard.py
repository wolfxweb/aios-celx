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


def test_dashboard_summary_shape(client: TestClient) -> None:
    token = _token(client)
    r = client.get("/api/v1/dashboard/summary?days=7", headers=_auth(token))
    assert r.status_code == 200
    data = r.json()
    assert "period" in data
    assert "from" in data["period"] and "to" in data["period"]
    for k in (
        "open_leads",
        "open_opportunities",
        "pending_tasks",
        "activities_in_period",
        "companies",
        "contacts",
    ):
        assert k in data
        assert isinstance(data[k], int)


def test_activity_crud(client: TestClient) -> None:
    token = _token(client)
    r = client.post(
        "/api/v1/activities",
        json={
            "activity_type": "call",
            "title": "Ligação de follow-up",
            "notes": "Cliente interessado",
        },
        headers=_auth(token),
    )
    assert r.status_code == 201
    aid = r.json()["id"]
    assert r.json()["activity_type"] == "call"

    r = client.get(f"/api/v1/activities/{aid}", headers=_auth(token))
    assert r.status_code == 200

    r = client.get("/api/v1/dashboard/summary?days=30", headers=_auth(token))
    assert r.status_code == 200
    assert r.json()["activities_in_period"] >= 1

    r = client.delete(f"/api/v1/activities/{aid}", headers=_auth(token))
    assert r.status_code == 204
