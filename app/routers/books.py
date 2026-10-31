import os
import shutil
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_admin
from app.config import settings
from app.database import get_db
from app.models import Book, Category, Download, Favorite, User
from app.schemas import BookListResponse, BookResponse, DetailResponse

router = APIRouter()


def build_book_response(book: Book, is_favorite: bool = False) -> BookResponse:
    """
    Helper to transform a SQLAlchemy Book model into the BookResponse schema (PRD Section 7).
    """
    return BookResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        description=book.description,
        category_id=book.category_id,
        category_name=book.category.name if book.category else None,
        cover_url=book.cover_url,
        download_count=book.download_count,
        created_at=book.created_at,
        is_favorite=is_favorite,
    )


def get_user_favorite_book_ids(user_id: int, db: Session, book_ids: list[int] | None = None) -> set[int]:
    """
    Helper to fetch a set of book IDs favorited by the user.
    """
    query = db.query(Favorite.book_id).filter(Favorite.user_id == user_id)
    if book_ids:
        query = query.filter(Favorite.book_id.in_(book_ids))
    return {row[0] for row in query.all()}


# ==============================================================================
# Public / Student / Admin Book Endpoints (PRD Section 7)
# ==============================================================================
@router.get(
    "",
    response_model=BookListResponse,
    summary="List books with search, filter, sort, and pagination",
)
def list_books(
    search: str | None = Query(None, description="Search query against book title or author"),
    category_id: int | None = Query(None, description="Filter by category ID"),
    sort: str | None = Query(
        "newest",
        description="Sort order: 'newest', 'title', or 'popular'",
    ),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Search, filter, and paginate books catalogue (PRD Section 7 & 8.4).
    Includes the `is_favorite` flag for the current authenticated user.
    """
    query = db.query(Book).options(joinedload(Book.category))

    # Apply search filter (title or author)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter((Book.title.ilike(search_pattern)) | (Book.author.ilike(search_pattern)))

    # Apply category filter
    if category_id is not None:
        query = query.filter(Book.category_id == category_id)

    # Apply sorting
    if sort == "popular":
        query = query.order_by(Book.download_count.desc(), Book.id.desc())
    elif sort == "title":
        query = query.order_by(Book.title.asc())
    else:  # default "newest"
        query = query.order_by(Book.created_at.desc(), Book.id.desc())

    total = query.count()
    books = query.offset(offset).limit(limit).all()

    book_ids = [b.id for b in books]
    user_favorites = get_user_favorite_book_ids(current_user.id, db, book_ids)

    items = [build_book_response(b, is_favorite=(b.id in user_favorites)) for b in books]
    return BookListResponse(total=total, items=items)


@router.get(
    "/recent",
    response_model=list[BookResponse],
    summary="Get recently added books (latest 8)",
)
def get_recent_books(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the latest 8 books ordered by creation timestamp (PRD Section 7 & 8.7).
    """
    books = (
        db.query(Book)
        .options(joinedload(Book.category))
        .order_by(Book.created_at.desc(), Book.id.desc())
        .limit(8)
        .all()
    )
    book_ids = [b.id for b in books]
    user_favorites = get_user_favorite_book_ids(current_user.id, db, book_ids)

    return [build_book_response(b, is_favorite=(b.id in user_favorites)) for b in books]


@router.get(
    "/popular",
    response_model=list[BookResponse],
    summary="Get popular books (top 8 by download_count)",
)
def get_popular_books(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns top 8 books ordered by download count (PRD Section 7 & 8.7).
    """
    books = (
        db.query(Book)
        .options(joinedload(Book.category))
        .order_by(Book.download_count.desc(), Book.id.desc())
        .limit(8)
        .all()
    )
    book_ids = [b.id for b in books]
    user_favorites = get_user_favorite_book_ids(current_user.id, db, book_ids)

    return [build_book_response(b, is_favorite=(b.id in user_favorites)) for b in books]


@router.post(
    "",
    response_model=BookResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new book with PDF upload (Admin only)",
)
def create_book(
    title: str = Form(...),
    author: str = Form(...),
    description: str | None = Form(None),
    category_id: int | None = Form(None),
    cover_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Admin book creation with multipart form data (PRD Section 7 & 8.4).
    Saves the uploaded PDF file to UPLOAD_DIR and records book metadata in database.
    """
    # Validate category if provided
    if category_id is not None:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found",
            )

    file_path = None
    if file and file.filename:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        filename_clean = os.path.basename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename_clean}"
        destination = os.path.join(settings.UPLOAD_DIR, unique_filename)

        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_path = destination

    book = Book(
        title=title.strip(),
        author=author.strip(),
        description=description.strip() if description else None,
        category_id=category_id,
        cover_url=cover_url.strip() if cover_url else None,
        file_path=file_path,
        download_count=0,
    )
    db.add(book)
    db.commit()
    db.refresh(book)

    return build_book_response(book, is_favorite=False)


@router.get(
    "/{id}",
    response_model=BookResponse,
    summary="Get single book details by ID",
)
def get_book_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get detailed book information by ID (PRD Section 7 & 8.4).
    """
    book = db.query(Book).options(joinedload(Book.category)).filter(Book.id == id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    is_fav = (
        db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.book_id == book.id).first() is not None
    )

    return build_book_response(book, is_favorite=is_fav)


@router.delete(
    "/{id}",
    response_model=DetailResponse,
    summary="Delete a book and remove uploaded file (Admin only)",
)
def delete_book(
    id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Admin book deletion (PRD Section 7 & 8.4).
    Removes the book row and deletes the PDF file from disk if present.
    """
    book = db.query(Book).filter(Book.id == id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    # Clean up uploaded file on disk
    if book.file_path and os.path.exists(book.file_path):
        try:
            os.remove(book.file_path)
        except OSError:
            pass

    db.delete(book)
    db.commit()
    return {"detail": "Book deleted successfully"}


@router.get(
    "/{id}/download",
    summary="Download book PDF file (records download & increments count)",
)
def download_book(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Streams the book PDF file, logs an entry in `downloads`, and increments `download_count` (PRD Section 7 & 8.5).
    """
    book = db.query(Book).filter(Book.id == id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    if not book.file_path or not os.path.exists(book.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book file not available for download",
        )

    # 1. Increment download counter
    book.download_count += 1

    # 2. Record download history entry
    download_record = Download(user_id=current_user.id, book_id=book.id)
    db.add(download_record)
    db.commit()

    # 3. Stream file as download response
    safe_filename = f"{book.title.replace(' ', '_')}.pdf"
    return FileResponse(
        path=book.file_path,
        media_type="application/pdf",
        filename=safe_filename,
    )
