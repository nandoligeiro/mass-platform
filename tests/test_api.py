from fastapi.testclient import TestClient


def test_health_is_public(client: TestClient) -> None:
    assert client.get("/health/live").json() == {"status": "ok"}


def test_catalog_is_protected(client: TestClient) -> None:
    assert client.get("/v1/generators").status_code == 401
    response = client.get("/v1/generators", headers={"X-API-Key": "test-secret"})
    assert response.status_code == 200
    assert response.json()[0]["name"] == "synthetic-customer"


def test_execute_and_read_back(client: TestClient) -> None:
    auth = {"X-API-Key": "test-secret"}
    response = client.post(
        "/v1/generators/synthetic-customer/executions",
        json={"parameters": {}},
        headers=auth,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "succeeded"
    assert body["result"]["synthetic"] is True
    stored = client.get(f"/v1/executions/{body['id']}", headers=auth)
    assert stored.status_code == 200
    assert stored.json()["result"] == body["result"]


def test_invalid_params_are_recorded_without_leaking_traceback(client: TestClient) -> None:
    auth = {"X-API-Key": "test-secret"}
    response = client.post(
        "/v1/generators/synthetic-customer/executions",
        json={"parameters": {"unexpected": "value"}},
        headers=auth,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "failed"
    assert response.json()["result"] is None


def test_unknown_generator_and_bad_payload(client: TestClient) -> None:
    auth = {"X-API-Key": "test-secret"}
    response = client.post("/v1/generators/missing/executions", json={}, headers=auth)
    assert response.status_code == 404
    response = client.post(
        "/v1/generators/synthetic-customer/executions",
        json={"parameters": {}, "unexpected": True},
        headers=auth,
    )
    assert response.status_code == 422
