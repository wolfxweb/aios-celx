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


def test_reports_catalog(client: TestClient) -> None:
    token = _token(client)
    r = client.get("/api/v1/reports", headers=_auth(token))
    assert r.status_code == 200
    data = r.json()
    ids = {x["id"] for x in data}
    assert {"leads-by-stage", "opportunities-by-stage", "activities-by-type"} <= ids


def test_reports_unauthorized(client: TestClient) -> None:
    r = client.get("/api/v1/reports")
    assert r.status_code == 401


def test_run_unknown_report(client: TestClient) -> None:
    token = _token(client)
    r = client.post(
        "/api/v1/reports/unknown-id/run",
        json={},
        headers=_auth(token),
    )
    assert r.status_code == 404


def test_run_leads_by_stage(client: TestClient) -> None:
    token = _token(client)
    r = client.post(
        "/api/v1/reports/leads-by-stage/run",
        json={},
        headers=_auth(token),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["report_id"] == "leads-by-stage"
    assert body["columns"] == ["Etapa", "Total"]
    assert isinstance(body["rows"], list)
