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


def test_seed_pipeline_and_stages(client: TestClient) -> None:
    token = _token(client)
    r = client.get("/api/v1/pipelines", headers=_auth(token))
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Vendas padrão"
    assert len(data[0]["stages"]) == 5
    types = {s["stage_type"] for s in data[0]["stages"]}
    assert "open" in types and "won" in types and "lost" in types


def test_company_opportunity_mark_won(client: TestClient) -> None:
    token = _token(client)
    r = client.post(
        "/api/v1/companies",
        json={"name": "Acme Ltda"},
        headers=_auth(token),
    )
    assert r.status_code == 201
    cid = r.json()["id"]

    pl = client.get("/api/v1/pipelines", headers=_auth(token)).json()
    pipe_id = pl[0]["id"]
    open_stage = next(s for s in pl[0]["stages"] if s["stage_type"] == "open")
    won_stage = next(s for s in pl[0]["stages"] if s["stage_type"] == "won")

    r = client.post(
        "/api/v1/opportunities",
        json={
            "title": "Contrato anual",
            "pipeline_id": pipe_id,
            "stage_id": open_stage["id"],
            "company_id": cid,
            "amount_cents": 10000,
        },
        headers=_auth(token),
    )
    assert r.status_code == 201
    oid = r.json()["id"]
    assert r.json()["stage_id"] == open_stage["id"]

    r = client.post(f"/api/v1/opportunities/{oid}/mark-won", headers=_auth(token))
    assert r.status_code == 200
    body = r.json()
    assert body["stage_id"] == won_stage["id"]
    assert body["probability"] == 100


def test_opportunity_patch_stage_moves_between_open_stages(client: TestClient) -> None:
    token = _token(client)
    pl = client.get("/api/v1/pipelines", headers=_auth(token)).json()
    pipe = pl[0]
    pipe_id = pipe["id"]
    open_stages = [s for s in pipe["stages"] if s["stage_type"] == "open"]
    assert len(open_stages) >= 2
    a, b = open_stages[0], open_stages[1]

    r = client.post(
        "/api/v1/opportunities",
        json={
            "title": "Deal pipeline stage",
            "pipeline_id": pipe_id,
            "stage_id": a["id"],
            "amount_cents": 0,
        },
        headers=_auth(token),
    )
    assert r.status_code == 201
    oid = r.json()["id"]

    r = client.patch(
        f"/api/v1/opportunities/{oid}/stage",
        json={"stage_id": b["id"]},
        headers=_auth(token),
    )
    assert r.status_code == 200
    assert r.json()["stage_id"] == b["id"]


def test_paginated_companies_meta(client: TestClient) -> None:
    token = _token(client)
    r = client.get("/api/v1/companies?page=1&pageSize=10", headers=_auth(token))
    assert r.status_code == 200
    body = r.json()
    assert "data" in body and "meta" in body
    assert body["meta"]["pageSize"] == 10
    assert "totalItems" in body["meta"]
