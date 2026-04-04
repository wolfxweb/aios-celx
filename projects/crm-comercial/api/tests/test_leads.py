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


def test_lead_stage_and_convert(client: TestClient) -> None:
    token = _token(client)
    r = client.post(
        "/api/v1/leads",
        json={"title": "Prospecto ACME", "company_name": "ACME", "email": "a@acme.com"},
        headers=_auth(token),
    )
    assert r.status_code == 201
    lid = r.json()["id"]
    assert r.json()["qualification_stage"] == "novo"

    r = client.patch(
        f"/api/v1/leads/{lid}/stage",
        json={"qualification_stage": "contato"},
        headers=_auth(token),
    )
    assert r.status_code == 200
    assert r.json()["qualification_stage"] == "contato"

    pl = client.get("/api/v1/pipelines", headers=_auth(token)).json()
    pipe_id = pl[0]["id"]
    open_stage = next(s for s in pl[0]["stages"] if s["stage_type"] == "open")

    r = client.post(
        f"/api/v1/leads/{lid}/convert",
        json={
            "pipeline_id": pipe_id,
            "stage_id": open_stage["id"],
            "create_company_from_lead": True,
            "amount_cents": 500000,
        },
        headers=_auth(token),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "converted"
    assert body["converted_opportunity_id"] is not None

    oid = body["converted_opportunity_id"]
    r = client.get(f"/api/v1/opportunities/{oid}", headers=_auth(token))
    assert r.status_code == 200
    opp = r.json()
    assert opp["title"] == "Prospecto ACME"
    assert opp["amount_cents"] == 500000
    assert opp["company_id"] is not None
