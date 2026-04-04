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


def test_task_create_list_complete(client: TestClient) -> None:
    token = _token(client)
    r = client.post(
        "/api/v1/tasks",
        json={"title": "Ligar cliente", "priority": "high"},
        headers=_auth(token),
    )
    assert r.status_code == 201
    tid = r.json()["id"]
    assert r.json()["status"] == "pending"

    r = client.get("/api/v1/tasks?pageSize=10", headers=_auth(token))
    assert r.status_code == 200
    assert r.json()["meta"]["totalItems"] >= 1

    r = client.post(f"/api/v1/tasks/{tid}/complete", headers=_auth(token))
    assert r.status_code == 200
    assert r.json()["status"] == "completed"
    assert r.json()["completed_at"] is not None


def test_task_linked_to_company(client: TestClient) -> None:
    token = _token(client)
    r = client.post(
        "/api/v1/companies",
        json={"name": "Cliente X"},
        headers=_auth(token),
    )
    cid = r.json()["id"]
    r = client.post(
        "/api/v1/tasks",
        json={
            "title": "Reunião",
            "entity_type": "company",
            "entity_id": cid,
        },
        headers=_auth(token),
    )
    assert r.status_code == 201
    assert r.json()["entity_type"] == "company"
    assert r.json()["entity_id"] == cid
