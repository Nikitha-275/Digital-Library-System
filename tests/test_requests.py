from fastapi.testclient import TestClient


def test_submit_book_request_success(client: TestClient, student_token, student_user):
    """
    Test POST /requests creates a new book request with pending status.
    """
    response = client.post(
        "/requests",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "book_name": "Kubernetes in Action",
            "author": "Marko Luksa",
            "category": "Computer Science",
            "note": "Required for Cloud Computing class",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["book_name"] == "Kubernetes in Action"
    assert data["author"] == "Marko Luksa"
    assert data["status"] == "pending"
    assert data["user_id"] == student_user.id
    assert "id" in data


def test_list_student_own_requests(client: TestClient, student_token):
    """
    Test GET /requests/mine returns only the current student's requests.
    """
    # Create request
    client.post(
        "/requests",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"book_name": "Rust in Action"},
    )

    response = client.get(
        "/requests/mine",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(r["book_name"] == "Rust in Action" for r in data)


def test_admin_list_requests_with_user_info(client: TestClient, admin_token, student_token, student_user):
    """
    Test GET /admin/requests enriches requests with requester user_name and user_email.
    """
    # Student submits request
    client.post(
        "/requests",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"book_name": "Site Reliability Engineering"},
    )

    # Admin queries requests
    response = client.get(
        "/admin/requests",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    match = next((r for r in data if r["book_name"] == "Site Reliability Engineering"), None)
    assert match is not None
    assert match["user_name"] == student_user.name
    assert match["user_email"] == student_user.email


def test_admin_filter_requests_by_status(client: TestClient, admin_token, student_token):
    """
    Test GET /admin/requests?status=pending filters correctly.
    """
    response = client.get(
        "/admin/requests?status=approved",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert all(r["status"] == "approved" for r in data)


def test_admin_update_request_status(client: TestClient, admin_token, student_token):
    """
    Test PATCH /admin/requests/{id} updates request status to approved/rejected.
    """
    # Create request
    create_res = client.post(
        "/requests",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"book_name": "Database Internals"},
    )
    req_id = create_res.json()["id"]

    # Admin approves
    patch_res = client.patch(
        f"/admin/requests/{req_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "approved"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "approved"


def test_student_blocked_from_admin_requests(client: TestClient, student_token):
    """
    Test student cannot access GET /admin/requests (403 Forbidden).
    """
    response = client.get(
        "/admin/requests",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "Admin access required"}


def test_validation_error_format(client: TestClient, student_token):
    """
    Test request validation returns standard {"detail": "message"} format.
    """
    response = client.post(
        "/requests",
        headers={"Authorization": f"Bearer {student_token}"},
        json={},  # missing required book_name
    )
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert isinstance(data["detail"], str)
