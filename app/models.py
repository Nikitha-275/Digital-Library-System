from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    """
    Users table (PRD Section 6)
    Roles: 'student', 'admin'
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        Enum("student", "admin", name="user_role", native_enum=False),
        nullable=False,
        default="student",
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    downloads = relationship("Download", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    requests = relationship("BookRequest", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    """
    Categories table (PRD Section 6)
    """

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)

    # Relationships
    books = relationship("Book", back_populates="category")


class Book(Base):
    """
    Books table (PRD Section 6)
    """

    __tablename__ = "books"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False, index=True)
    author = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    cover_url = Column(String(500), nullable=True)
    file_path = Column(String(500), nullable=True)
    download_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    category = relationship("Category", back_populates="books")
    downloads = relationship("Download", back_populates="book", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="book", cascade="all, delete-orphan")


class Download(Base):
    """
    Downloads table (PRD Section 6)
    Records user download events and history
    """

    __tablename__ = "downloads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    book_id = Column(
        Integer,
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
    )
    downloaded_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="downloads")
    book = relationship("Book", back_populates="downloads")


class Favorite(Base):
    """
    Favorites table (PRD Section 6)
    Unique composite constraint on (user_id, book_id)
    """

    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    book_id = Column(
        Integer,
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "book_id", name="uq_user_book_favorite"),)

    # Relationships
    user = relationship("User", back_populates="favorites")
    book = relationship("Book", back_populates="favorites")


class BookRequest(Base):
    """
    Book requests table (PRD Section 6)
    Statuses: 'pending', 'approved', 'rejected'
    """

    __tablename__ = "book_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    book_name = Column(String(200), nullable=False)
    author = Column(String(150), nullable=True)
    category = Column(String(100), nullable=True)
    note = Column(Text, nullable=True)
    status = Column(
        Enum("pending", "approved", "rejected", name="request_status", native_enum=False),
        nullable=False,
        default="pending",
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="requests")
