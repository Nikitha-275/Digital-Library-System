from fastapi.testclient import TestClient


def test_register_student(client: TestClient):
    """
    Test POST /auth/register creates a student account and returns user object.
    """
    response = client.post(
        "/auth/register",
        json={
            "name": "Jane Doe",
            "email": "jane@library.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane@library.com"
    assert data["role"] == "student"
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email(client: TestClient, student_user):
    """
    Test POST /auth/register rejects already registered email with 400.
    """
    response = client.post(
        "/auth/register",
        json={
            "name": "Duplicate User",
            "email": "student@library.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Email already registered"}


def test_login_success(client: TestClient, student_user):
    """
    Test POST /auth/login returns JWT bearer token and user role.
    """
    response = client.post(
        "/auth/login",
        json={
            "email": "student@library.com",
            "password": "Student@123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "student"
    assert data["name"] == "Student User"


def test_login_wrong_password(client: TestClient, student_user):
    """
    Test POST /auth/login returns 401 when password does not match.
    """
    response = client.post(
        "/auth/login",
        json={
            "email": "student@library.com",
            "password": "WrongPassword",
        },
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}


def test_login_user_not_found(client: TestClient):
    """
    Test POST /auth/login returns 401 when email does not exist.
    """
    response = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@library.com",
            "password": "SomePassword",
        },
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}


def test_auth_me_success(client: TestClient, student_token):
    """
    Test GET /auth/me returns authenticated user's profile.
    """
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "student@library.com"
    assert data["role"] == "student"


def test_auth_me_unauthorized(client: TestClient):
    """
    Test GET /auth/me returns 401 when Authorization header is absent.
    """
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}


def test_auth_me_expired_token(client: TestClient, student_user):
    """
    Test GET /auth/me with an expired JWT returns 401 Token has expired.
    """
    from datetime import timedelta

    from app.auth import create_access_token

    expired_token = create_access_token(
        data={"sub": str(student_user.id), "role": student_user.role},
        expires_delta=timedelta(seconds=-10),
    )
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Token has expired"}


def test_auth_me_invalid_token(client: TestClient):
    """
    Test GET /auth/me with a corrupted token returns 401 Could not validate credentials.
    """
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer malformed.corrupted.jwt"},
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Could not validate credentials"}
