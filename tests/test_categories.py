from fastapi.testclient import TestClient


def test_list_categories(client: TestClient, student_token, sample_category):
    """
    Test GET /categories returns category list for authenticated users.
    """
    response = client.get(
        "/categories",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(c["name"] == "Computer Science" for c in data)


def test_create_category_admin_success(client: TestClient, admin_token):
    """
    Test POST /categories creates a new category when called by an admin.
    """
    response = client.post(
        "/categories",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Mathematics"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Mathematics"
    assert "id" in data


def test_create_category_forbidden_for_student(client: TestClient, student_token):
    """
    Test POST /categories returns 403 Forbidden when called by a student.
    """
    response = client.post(
        "/categories",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"name": "Forbidden Category"},
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "Admin access required"}


def test_create_duplicate_category(client: TestClient, admin_token, sample_category):
    """
    Test POST /categories returns 400 when category name already exists.
    """
    response = client.post(
        "/categories",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Computer Science"},
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Category already exists"}


def test_delete_category_admin_success(client: TestClient, admin_token, sample_category):
    """
    Test DELETE /categories/{id} deletes the category.
    """
    response = client.delete(
        f"/categories/{sample_category.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == {"detail": "Category deleted successfully"}


def test_delete_category_forbidden_for_student(client: TestClient, student_token, sample_category):
    """
    Test DELETE /categories/{id} returns 403 Forbidden for students.
    """
    response = client.delete(
        f"/categories/{sample_category.id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "Admin access required"}


def test_delete_category_not_found(client: TestClient, admin_token):
    """
    Test DELETE /categories/{id} returns 404 when ID does not exist.
    """
    response = client.delete(
        "/categories/99999",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Category not found"}


def test_delete_category_with_books_sets_null(
    client: TestClient, admin_token, sample_category, sample_book, db_session
):
    """
    Test deleting a category that has books dissociates the books (sets category_id to NULL).
    """
    assert sample_book.category_id == sample_category.id

    response = client.delete(
        f"/categories/{sample_category.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200

    db_session.refresh(sample_book)
    assert sample_book.category_id is None
