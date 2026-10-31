from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import Book, Download, Favorite, User
from app.routers.books import build_book_response, get_user_favorite_book_ids
from app.schemas import BookResponse, DownloadHistoryItem

router = APIRouter()


@router.get(
    "/downloads",
    response_model=list[DownloadHistoryItem],
    summary="Get authenticated user's download history",
)
def get_my_downloads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns list of books downloaded by the logged-in user (PRD Section 7 & 8.6),
    ordered from newest download to oldest.
    """
    downloads = (
        db.query(Download)
        .options(joinedload(Download.book).joinedload(Book.category))
        .filter(Download.user_id == current_user.id)
        .order_by(Download.downloaded_at.desc())
        .all()
    )

    book_ids = [d.book_id for d in downloads if d.book]
    favorite_book_ids = get_user_favorite_book_ids(current_user.id, db, book_ids)

    results = []
    for d in downloads:
        if d.book:
            book_dto = build_book_response(
                d.book,
                is_favorite=(d.book.id in favorite_book_ids),
            )
            results.append(
                DownloadHistoryItem(
                    id=d.id,
                    downloaded_at=d.downloaded_at,
                    book=book_dto,
                )
            )

    return results


@router.get(
    "/favorites",
    response_model=list[BookResponse],
    summary="Get authenticated user's favorite books list",
)
def get_my_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns list of books favorited by the logged-in user (PRD Section 7 & 8.6),
    ordered by when they were added to favorites.
    """
    favorites = (
        db.query(Favorite)
        .options(joinedload(Favorite.book).joinedload(Book.category))
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )

    return [build_book_response(fav.book, is_favorite=True) for fav in favorites if fav.book]
