from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Book, Favorite, User
from app.schemas import DetailResponse

router = APIRouter()


@router.post(
    "/{book_id}",
    response_model=DetailResponse,
    summary="Add a book to user favorites",
)
def add_favorite(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Adds a book to the logged-in user's favorites list (PRD Section 7 & 8.6).
    Idempotent: if already favorited, returns success message.
    """
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    existing = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.book_id == book_id).first()
    if not existing:
        favorite = Favorite(user_id=current_user.id, book_id=book_id)
        db.add(favorite)
        db.commit()

    return {"detail": "Book added to favorites"}


@router.delete(
    "/{book_id}",
    response_model=DetailResponse,
    summary="Remove a book from user favorites",
)
def remove_favorite(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Removes a book from the logged-in user's favorites list (PRD Section 7 & 8.6).
    """
    favorite = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.book_id == book_id).first()
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found in favorites",
        )

    db.delete(favorite)
    db.commit()
    return {"detail": "Book removed from favorites"}
