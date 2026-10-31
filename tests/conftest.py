import os

# Set test environment flags before importing application modules
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import create_access_token, hash_password
from app.database import Base, get_db
from app.main import app
from app.models import Book, Category, User

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """
    Yields a clean transactional test database session for each test.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """
    FastAPI TestClient with overridden get_db dependency.
    """

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def student_user(db_session) -> User:
    user = User(
        name="Student User",
        email="student@library.com",
        password_hash=hash_password("Student@123"),
        role="student",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session) -> User:
    user = User(
        name="Admin User",
        email="admin@library.com",
        password_hash=hash_password("Admin@123"),
        role="admin",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def student_token(student_user: User) -> str:
    return create_access_token(data={"sub": str(student_user.id), "role": student_user.role})


@pytest.fixture
def admin_token(admin_user: User) -> str:
    return create_access_token(data={"sub": str(admin_user.id), "role": admin_user.role})


@pytest.fixture
def sample_category(db_session) -> Category:
    cat = Category(name="Computer Science")
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(cat)
    return cat


@pytest.fixture
def sample_book(db_session, sample_category: Category) -> Book:
    book = Book(
        title="Designing Data-Intensive Applications",
        author="Martin Kleppmann",
        description="The big ideas behind reliable, scalable, and maintainable systems.",
        category_id=sample_category.id,
        cover_url="https://example.com/cover.jpg",
        download_count=10,
    )
    db_session.add(book)
    db_session.commit()
    db_session.refresh(book)
    return book
