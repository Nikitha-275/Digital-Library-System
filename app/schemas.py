from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ==============================================================================
# Shared / Generic Schemas
# ==============================================================================
class DetailResponse(BaseModel):
    """
    Standard error/success message format (PRD Section 5: { "detail": "message" })
    """

    detail: str


# ==============================================================================
# Auth & User Schemas (PRD Section 7)
# ==============================================================================
class UserRegister(BaseModel):
    """
    Payload for POST /auth/register
    """

    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    """
    Payload for POST /auth/login
    """

    email: EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    """
    User object returned by /auth/register, /auth/me, /admin/users (PRD Section 7)
    """

    id: int
    name: str
    email: str
    role: str
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """
    Response returned by POST /auth/login (PRD Section 7)
    """

    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


# ==============================================================================
# Category Schemas (PRD Section 7)
# ==============================================================================
class CategoryCreate(BaseModel):
    """
    Payload for POST /categories (Admin)
    """

    name: str = Field(..., min_length=1, max_length=100)


class CategoryResponse(BaseModel):
    """
    Category object (PRD Section 7: [ { id, name } ])
    """

    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Book Schemas (PRD Section 7)
# ==============================================================================
class BookResponse(BaseModel):
    """
    Book object contract (PRD Section 7:
    { id, title, author, description, category_id, category_name,
      cover_url, download_count, created_at, is_favorite })
    """

    id: int
    title: str
    author: str
    description: str | None = None
    category_id: int | None = None
    category_name: str | None = None
    cover_url: str | None = None
    download_count: int = 0
    created_at: datetime
    is_favorite: bool = False

    model_config = ConfigDict(from_attributes=True)


class BookListResponse(BaseModel):
    """
    Response for GET /books (PRD Section 7: { total, items: [book] })
    """

    total: int
    items: list[BookResponse]


# ==============================================================================
# Download History Schemas (PRD Section 7)
# ==============================================================================
class DownloadHistoryItem(BaseModel):
    """
    Single download record in user history (PRD Section 7: [ { id, downloaded_at, book } ])
    """

    id: int
    downloaded_at: datetime
    book: BookResponse

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Book Request Schemas (PRD Section 7)
# ==============================================================================
class BookRequestCreate(BaseModel):
    """
    Payload for POST /requests (Student)
    """

    book_name: str = Field(..., min_length=1, max_length=200)
    author: str | None = Field(None, max_length=150)
    category: str | None = Field(None, max_length=100)
    note: str | None = None


class BookRequestStatusUpdate(BaseModel):
    """
    Payload for PATCH /admin/requests/{id} (Admin)
    """

    status: Literal["pending", "approved", "rejected"]


class BookRequestResponse(BaseModel):
    """
    Request object returned by POST /requests, GET /requests/mine, and PATCH /admin/requests/{id}
    """

    id: int
    user_id: int
    book_name: str
    author: str | None = None
    category: str | None = None
    note: str | None = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminBookRequestResponse(BaseModel):
    """
    Request object with requester info returned by GET /admin/requests (PRD Section 7)
    """

    id: int
    user_id: int
    book_name: str
    author: str | None = None
    category: str | None = None
    note: str | None = None
    status: str
    created_at: datetime
    user_name: str
    user_email: str

    model_config = ConfigDict(from_attributes=True)
