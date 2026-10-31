from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    """
    Verify GET /health returns 200 OK and {"status": "ok"}.
    Satisfies PRD Section 7 and Kubernetes liveness/readiness probe requirement.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
