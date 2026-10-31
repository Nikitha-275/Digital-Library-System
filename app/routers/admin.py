from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.auth import require_admin
from app.database import get_db
from app.models import BookRequest, User
from app.schemas import (
    AdminBookRequestResponse,
    BookRequestResponse,
    BookRequestStatusUpdate,
    DetailResponse,
    UserResponse,
)

router = APIRouter()


# ==============================================================================
# Admin Book Request Management (PRD Section 7 & 8.8)
# ==============================================================================
@router.get(
    "/requests",
    response_model=list[AdminBookRequestResponse],
    summary="List all student book requests (Admin only)",
)
def list_admin_requests(
    status: str | None = Query(None, description="Optional status filter ('pending', 'approved', 'rejected')"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Returns all student book requests enriched with requester's user_name and user_email (PRD Section 7 & 8.8).
    Supports optional status filtering.
    """
    query = db.query(BookRequest).options(joinedload(BookRequest.user)).order_by(BookRequest.created_at.desc())

    if status:
        query = query.filter(BookRequest.status == status.lower().strip())

    requests = query.all()

    return [
        AdminBookRequestResponse(
            id=r.id,
            user_id=r.user_id,
            book_name=r.book_name,
            author=r.author,
            category=r.category,
            note=r.note,
            status=r.status,
            created_at=r.created_at,
            user_name=r.user.name if r.user else "Unknown",
            user_email=r.user.email if r.user else "Unknown",
        )
        for r in requests
    ]


@router.patch(
    "/requests/{id}",
    response_model=BookRequestResponse,
    summary="Update status of a book request (Admin only)",
)
def update_book_request_status(
    id: int,
    payload: BookRequestStatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Updates status of a book request to 'approved' or 'rejected' (PRD Section 7 & 8.8).
    """
    request_obj = db.query(BookRequest).filter(BookRequest.id == id).first()
    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    request_obj.status = payload.status
    db.commit()
    db.refresh(request_obj)
    return request_obj


# ==============================================================================
# Admin User Management (PRD Section 7 & 8.9)
# ==============================================================================
@router.get(
    "/users",
    response_model=list[UserResponse],
    summary="List all registered users (Admin only)",
)
def list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Lists all registered users in the system (PRD Section 7 & 8.9).
    """
    return db.query(User).order_by(User.id.asc()).all()


@router.delete(
    "/users/{id}",
    response_model=DetailResponse,
    summary="Delete a user (Admin only, self-deletion prohibited)",
)
def delete_user(
    id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Deletes a user account.
    Safety rule: An admin cannot delete their own account (PRD Section 8.9).
    """
    if admin.id == id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}
