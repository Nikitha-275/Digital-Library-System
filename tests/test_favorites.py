import os

from fastapi.testclient import TestClient


def test_add_and_remove_favorite(client: TestClient, student_token, sample_book):
    """
    Test adding a book to favorites, checking is_favorite flag, then removing it.
    """
    # 1. Initially is_favorite is False
    res_initial = client.get(
        f"/books/{sample_book.id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_initial.status_code == 200
    assert res_initial.json()["is_favorite"] is False

    # 2. Add to favorites
    res_add = client.post(
        f"/favorites/{sample_book.id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_add.status_code == 200
    assert res_add.json() == {"detail": "Book added to favorites"}

    # 3. Verify is_favorite is now True on detail and list
    res_detail = client.get(
        f"/books/{sample_book.id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_detail.status_code == 200
    assert res_detail.json()["is_favorite"] is True

    res_list = client.get(
        "/books",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_list.status_code == 200
    assert res_list.json()["items"][0]["is_favorite"] is True

    # 4. Check /me/favorites
    res_me_fav = client.get(
        "/me/favorites",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_me_fav.status_code == 200
    fav_books = res_me_fav.json()
    assert len(fav_books) == 1
    assert fav_books[0]["id"] == sample_book.id
    assert fav_books[0]["is_favorite"] is True

    # 5. Remove from favorites
    res_del = client.delete(
        f"/favorites/{sample_book.id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_del.status_code == 200
    assert res_del.json() == {"detail": "Book removed from favorites"}

    # 6. Verify is_favorite is False again
    res_after = client.get(
        f"/books/{sample_book.id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_after.status_code == 200
    assert res_after.json()["is_favorite"] is False


def test_remove_nonexistent_favorite(client: TestClient, student_token, sample_book):
    """
    Test DELETE /favorites/{book_id} returns 404 when book is not in user favorites.
    """
    response = client.delete(
        f"/favorites/{sample_book.id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Book not found in favorites"}


def test_add_favorite_nonexistent_book(client: TestClient, student_token):
    """
    Test POST /favorites/{book_id} returns 404 when book does not exist.
    """
    response = client.post(
        "/favorites/99999",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Book not found"}


def test_me_downloads_history(client: TestClient, student_token, student_user, sample_book, db_session):
    """
    Test GET /me/downloads returns user download history.
    """
    # Create temp PDF and download it
    temp_pdf_path = "./uploads/history_test.pdf"
    os.makedirs("./uploads", exist_ok=True)
    with open(temp_pdf_path, "wb") as f:
        f.write(b"%PDF-1.4 Sample PDF Content")

    sample_book.file_path = temp_pdf_path
    db_session.commit()

    try:
        # Perform download
        download_res = client.get(
            f"/books/{sample_book.id}/download",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert download_res.status_code == 200

        # Query download history
        history_res = client.get(
            "/me/downloads",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert history_res.status_code == 200
        history = history_res.json()
        assert len(history) >= 1
        assert history[0]["book"]["id"] == sample_book.id
        assert "downloaded_at" in history[0]
    finally:
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
