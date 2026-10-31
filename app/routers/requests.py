from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import BookRequest, User
from app.schemas import BookRequestCreate, BookRequestResponse

router = APIRouter()


@router.post(
    "",
    response_model=BookRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new book request (Student)",
)
def create_book_request(
    payload: BookRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits a new book acquisition request (PRD Section 7 & 8.8).
    Status defaults to 'pending'.
    """
    new_request = BookRequest(
        user_id=current_user.id,
        book_name=payload.book_name.strip(),
        author=payload.author.strip() if payload.author else None,
        category=payload.category.strip() if payload.category else None,
        note=payload.note.strip() if payload.note else None,
        status="pending",
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


@router.get(
    "/mine",
    response_model=list[BookRequestResponse],
    summary="List all book requests submitted by current student",
)
def list_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns list of requests submitted by the logged-in user (PRD Section 7 & 8.8),
    ordered with the newest requests first.
    """
    requests = (
        db.query(BookRequest)
        .filter(BookRequest.user_id == current_user.id)
        .order_by(BookRequest.created_at.desc())
        .all()
    )
    return requests
