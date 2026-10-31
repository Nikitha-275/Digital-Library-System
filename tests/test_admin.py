from fastapi.testclient import TestClient

from app.auth import hash_password
from app.models import User


def test_list_users_admin_success(client: TestClient, admin_token, student_user):
    """
    Test GET /admin/users returns list of all registered users.
    """
    response = client.get(
        "/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(u["email"] == student_user.email for u in data)


def test_list_users_forbidden_for_student(client: TestClient, student_token):
    """
    Test GET /admin/users returns 403 Forbidden when accessed by student.
    """
    response = client.get(
        "/admin/users",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "Admin access required"}


def test_delete_user_admin_success(client: TestClient, admin_token, db_session):
    """
    Test DELETE /admin/users/{id} deletes a user account.
    """
    temp_user = User(
        name="User to Delete",
        email="todelete@library.com",
        password_hash=hash_password("Pass123!"),
        role="student",
    )
    db_session.add(temp_user)
    db_session.commit()

    response = client.delete(
        f"/admin/users/{temp_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == {"detail": "User deleted successfully"}


def test_admin_cannot_delete_self(client: TestClient, admin_token, admin_user):
    """
    Test DELETE /admin/users/{id} prevents admin from deleting their own account (PRD Section 8.9).
    """
    response = client.delete(
        f"/admin/users/{admin_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Cannot delete your own account"}


def test_delete_user_forbidden_for_student(client: TestClient, student_token, student_user):
    """
    Test DELETE /admin/users/{id} returns 403 Forbidden for students.
    """
    response = client.delete(
        f"/admin/users/{student_user.id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "Admin access required"}


def test_delete_user_not_found(client: TestClient, admin_token):
    """
    Test DELETE /admin/users/{id} returns 404 for non-existent user.
    """
    response = client.delete(
        "/admin/users/99999",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}
