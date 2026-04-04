import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_public_contact_success(client: TestClient) -> None:
    r = client.post(
        "/api/v1/public/contact",
        json={
            "name": "João Silva",
            "email": "joao@example.com",
            "message": "Gostaria de uma demonstração.",
            "consent": True,
        },
    )
    assert r.status_code == 201
    assert r.json() == {"ok": True}


def test_public_contact_consent_required(client: TestClient) -> None:
    r = client.post(
        "/api/v1/public/contact",
        json={
            "name": "João Silva",
            "email": "joao@example.com",
            "message": "Sem consentimento.",
            "consent": False,
        },
    )
    assert r.status_code == 422
    body = r.json()
    assert body["error"]["code"] == "CONSENT_REQUIRED"
