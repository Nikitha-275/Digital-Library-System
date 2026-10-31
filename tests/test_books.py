import io
import os

from fastapi.testclient import TestClient

from app.models import Book, Download, Favorite


def test_list_books(client: TestClient, student_token, sample_book):
    """
    Test GET /books returns total and items matching schema.
    """
    response = client.get(
        "/books",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 1
    assert data["items"][0]["title"] == "Designing Data-Intensive Applications"
    assert data["items"][0]["category_name"] == "Computer Science"
    assert "is_favorite" in data["items"][0]


def test_list_books_search(client: TestClient, student_token, sample_book):
    """
    Test search query parameter on /books.
    """
    res_match = client.get(
        "/books?search=Kleppmann",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_match.status_code == 200
    assert res_match.json()["total"] == 1

    res_nomatch = client.get(
        "/books?search=NonExistentKeywordXYZ",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_nomatch.status_code == 200
    assert res_nomatch.json()["total"] == 0


def test_list_books_category_filter(client: TestClient, student_token, sample_book, sample_category):
    """
    Test category_id filter on /books.
    """
    response = client.get(
        f"/books?category_id={sample_category.id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200
    assert response.json()["total"] >= 1


def test_list_books_sorting_and_pagination(client: TestClient, student_token, sample_book, db_session):
    """
    Test sort parameter ('newest', 'title', 'popular') and pagination limit/offset.
    """
    book2 = Book(
        title="Algorithms Unlocked",
        author="Thomas H. Cormen",
        description="A gentle intro to algorithms",
        download_count=50,
    )
    db_session.add(book2)
    db_session.commit()

    # Sort by title ASC
    res_title = client.get(
        "/books?sort=title",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_title.status_code == 200
    assert res_title.json()["items"][0]["title"] == "Algorithms Unlocked"

    # Sort by popular DESC
    res_pop = client.get(
        "/books?sort=popular",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_pop.status_code == 200
    assert res_pop.json()["items"][0]["title"] == "Algorithms Unlocked"

    # Pagination
    res_page = client.get(
        "/books?limit=1&offset=1&sort=title",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_page.status_code == 200
    assert len(res_page.json()["items"]) == 1
    assert res_page.json()["items"][0]["title"] == "Designing Data-Intensive Applications"


def test_recent_and_popular_books(client: TestClient, student_token, sample_book, db_session):
    """
    Test GET /books/recent and GET /books/popular return up to 8 books.
    """
    res_recent = client.get(
        "/books/recent",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_recent.status_code == 200
    data_recent = res_recent.json()
    assert isinstance(data_recent, list)
    assert len(data_recent) <= 8

    res_pop = client.get(
        "/books/popular",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res_pop.status_code == 200
    data_pop = res_pop.json()
    assert isinstance(data_pop, list)
    assert len(data_pop) <= 8


def test_get_book_detail_success(client: TestClient, student_token, sample_book):
    """
    Test GET /books/{id} returns full book details.
    """
    response = client.get(
        f"/books/{sample_book.id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_book.id
    assert data["title"] == sample_book.title
    assert data["author"] == sample_book.author
    assert data["category_name"] == "Computer Science"
    assert data["is_favorite"] is False


def test_get_book_detail_not_found(client: TestClient, student_token):
    """
    Test GET /books/{id} returns 404 when book does not exist.
    """
    response = client.get(
        "/books/99999",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Book not found"}


def test_books_unauthorized_without_token(client: TestClient):
    """
    Test /books returns 401 when Authorization header is missing.
    """
    response = client.get("/books")
    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}


def test_create_book_admin_success(client: TestClient, admin_token, sample_category):
    """
    Test POST /books with multipart form data creates a book with an uploaded file.
    """
    fake_pdf = io.BytesIO(b"%PDF-1.4 Fake PDF Content for Unit Testing")
    response = client.post(
        "/books",
        headers={"Authorization": f"Bearer {admin_token}"},
        data={
            "title": "Clean Architecture",
            "author": "Robert C. Martin",
            "description": "A Craftsman's Guide to Software Structure and Design",
            "category_id": sample_category.id,
            "cover_url": "https://example.com/clean-arch.jpg",
        },
        files={"file": ("clean_arch.pdf", fake_pdf, "application/pdf")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Clean Architecture"
    assert data["author"] == "Robert C. Martin"
    assert data["category_name"] == "Computer Science"
    assert "id" in data

    # Clean up created upload file
    for fname in os.listdir("./uploads"):
        if fname.endswith("clean_arch.pdf"):
            try:
                os.remove(os.path.join("./uploads", fname))
            except OSError:
                pass


def test_create_book_forbidden_for_student(client: TestClient, student_token):
    """
    Test POST /books returns 403 Forbidden when called by a student.
    """
    response = client.post(
        "/books",
        headers={"Authorization": f"Bearer {student_token}"},
        data={
            "title": "Forbidden Book",
            "author": "Student Author",
        },
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "Admin access required"}


def test_create_book_invalid_category(client: TestClient, admin_token):
    """
    Test POST /books returns 400 when category_id does not exist.
    """
    response = client.post(
        "/books",
        headers={"Authorization": f"Bearer {admin_token}"},
        data={
            "title": "Bad Category Book",
            "author": "Author",
            "category_id": 99999,
        },
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Category not found"}


def test_delete_book_admin_success(client: TestClient, admin_token, db_session):
    """
    Test DELETE /books/{id} deletes the book.
    """
    book = Book(
        title="Book to Delete",
        author="Temp Author",
    )
    db_session.add(book)
    db_session.commit()

    response = client.delete(
        f"/books/{book.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == {"detail": "Book deleted successfully"}


def test_delete_book_forbidden_for_student(client: TestClient, student_token, sample_book):
    """
    Test DELETE /books/{id} returns 403 Forbidden for students.
    """
    response = client.delete(
        f"/books/{sample_book.id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403
    assert response.json() == {"detail": "Admin access required"}


def test_delete_book_not_found(client: TestClient, admin_token):
    """
    Test DELETE /books/{id} returns 404 for non-existent ID.
    """
    response = client.delete(
        "/books/99999",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Book not found"}


def test_download_book_success(client: TestClient, student_token, db_session):
    """
    Test GET /books/{id}/download streams the file, increments download count, and logs download.
    """
    # Create temp PDF file
    temp_pdf_path = "./uploads/test_download.pdf"
    os.makedirs("./uploads", exist_ok=True)
    with open(temp_pdf_path, "wb") as f:
        f.write(b"%PDF-1.4 Minimal Test PDF Stream")

    book = Book(
        title="Downloadable Book",
        author="Tester",
        file_path=temp_pdf_path,
        download_count=5,
    )
    db_session.add(book)
    db_session.commit()
    db_session.refresh(book)

    try:
        response = client.get(
            f"/books/{book.id}/download",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert b"%PDF-1.4 Minimal Test PDF Stream" in response.content

        # Refresh book and assert count incremented
        db_session.refresh(book)
        assert book.download_count == 6
    finally:
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)


def test_download_book_missing_file(client: TestClient, student_token, db_session):
    """
    Test GET /books/{id}/download returns 404 if file_path is missing or file does not exist.
    """
    book = Book(
        title="Missing File Book",
        author="Tester",
        file_path="./uploads/non_existent_file.pdf",
    )
    db_session.add(book)
    db_session.commit()

    response = client.get(
        f"/books/{book.id}/download",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Book file not available for download"}


def test_delete_book_with_downloads_and_favorites(
    client: TestClient, admin_token, student_user, sample_book, db_session
):
    """
    Test deleting a book that has active downloads and favorites cascades correctly.
    """
    fav = Favorite(user_id=student_user.id, book_id=sample_book.id)
    dl = Download(user_id=student_user.id, book_id=sample_book.id)
    db_session.add_all([fav, dl])
    db_session.commit()

    response = client.delete(
        f"/books/{sample_book.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == {"detail": "Book deleted successfully"}

    assert db_session.query(Book).filter(Book.id == sample_book.id).first() is None
    assert db_session.query(Favorite).filter(Favorite.book_id == sample_book.id).first() is None
    assert db_session.query(Download).filter(Download.book_id == sample_book.id).first() is None
