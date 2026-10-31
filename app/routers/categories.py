from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.models import Book, Category, User
from app.schemas import CategoryCreate, CategoryResponse, DetailResponse

router = APIRouter()


@router.get(
    "",
    response_model=list[CategoryResponse],
    summary="List all book categories",
)
def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all categories for logged-in users (PRD Section 7).
    """
    return db.query(Category).order_by(Category.name.asc()).all()


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new category (Admin only)",
)
def create_category(
    payload: CategoryCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Create a new category (Admin access required, PRD Section 7).
    """
    name_clean = payload.name.strip()
    existing = db.query(Category).filter(Category.name.ilike(name_clean)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category already exists",
        )

    category = Category(name=name_clean)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete(
    "/{id}",
    response_model=DetailResponse,
    summary="Delete a category (Admin only)",
)
def delete_category(
    id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Delete a category by ID (Admin access required, PRD Section 7).
    Associated books will have category_id set to NULL.
    """
    category = db.query(Category).filter(Category.id == id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    # Dissociate any books linked to this category (PRD Section 6: ON DELETE SET NULL)
    db.query(Book).filter(Book.category_id == id).update({Book.category_id: None})

    db.delete(category)
    db.commit()
    return {"detail": "Category deleted successfully"}
