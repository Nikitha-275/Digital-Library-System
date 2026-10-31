"""
Database Seeding Script (PRD Section 5 & Section 8.11)
Creates:
- Admin account: admin@library.com / Admin@123
- Student account: student@library.com / Student@123
- 6 Categories
- 16 Books with cover image URLs, descriptions, and a sample PDF file
"""

import logging
import os

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.config import settings
from app.database import SessionLocal, init_db
from app.models import Book, Category, User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_sample_pdf(file_path: str) -> str:
    """
    Creates a minimal valid PDF file for test downloads if none exists.
    """
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    if not os.path.exists(file_path):
        # Minimal valid PDF binary representation
        pdf_content = (
            b"%PDF-1.4\n"
            b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
            b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
            b"xref\n0 4\n"
            b"0000000000 65535 f \n"
            b"0000000010 00000 n \n"
            b"0000000053 00000 n \n"
            b"0000000102 00000 n \n"
            b"trailer<</Size 4/Root 1 0 R>>\n"
            b"startxref\n178\n%%EOF\n"
        )
        with open(file_path, "wb") as f:
            f.write(pdf_content)
        logger.info(f"Created sample PDF at {file_path}")
    return file_path


def seed_database():
    """
    Executes the seeding process idempotently.
    """
    logger.info("Ensuring database tables exist...")
    init_db()

    db: Session = SessionLocal()
    try:
        # 1. Seed Demo Accounts (PRD Section 5)
        demo_users = [
            {
                "name": "Admin User",
                "email": "admin@library.com",
                "password": "Admin@123",
                "role": "admin",
            },
            {
                "name": "Student User",
                "email": "student@library.com",
                "password": "Student@123",
                "role": "student",
            },
        ]

        for u in demo_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    name=u["name"],
                    email=u["email"],
                    password_hash=hash_password(u["password"]),
                    role=u["role"],
                )
                db.add(user)
                logger.info(f"Seeded user: {u['email']} ({u['role']})")
            else:
                logger.info(f"User already exists: {u['email']}")

        db.commit()

        # 2. Seed Categories (PRD Section 8.11: 6 categories)
        categories_data = [
            "Computer Science",
            "Mathematics",
            "Physics",
            "Literature",
            "History",
            "Business & Economics",
        ]

        cat_map = {}
        for cat_name in categories_data:
            cat = db.query(Category).filter(Category.name == cat_name).first()
            if not cat:
                cat = Category(name=cat_name)
                db.add(cat)
                db.flush()
                logger.info(f"Seeded category: {cat_name}")
            cat_map[cat_name] = cat.id

        db.commit()

        # 3. Create sample PDF in upload directory
        sample_pdf_path = os.path.join(settings.UPLOAD_DIR, "sample_book.pdf")
        create_sample_pdf(sample_pdf_path)

        # 4. Seed Books (PRD Section 8.11: ~15 books)
        books_data = [
            {
                "title": "Designing Data-Intensive Applications",
                "author": "Martin Kleppmann",
                "description": "The big ideas behind reliable, scalable, and maintainable systems.",
                "category": "Computer Science",
                "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80",
                "download_count": 42,
            },
            {
                "title": "Clean Code",
                "author": "Robert C. Martin",
                "description": "A handbook of agile software craftsmanship and best practices.",
                "category": "Computer Science",
                "cover_url": "https://images.unsplash.com/photo-1532012164546-f432f2e3edd9?w=400&q=80",
                "download_count": 35,
            },
            {
                "title": "Introduction to Algorithms",
                "author": "Thomas H. Cormen",
                "description": "Comprehensive reference covering algorithms, data structures, and complexity.",
                "category": "Computer Science",
                "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80",
                "download_count": 28,
            },
            {
                "title": "Computer Networking: A Top-Down Approach",
                "author": "James Kurose & Keith Ross",
                "description": "A modern look at networking protocols, layered architecture, and the internet.",
                "category": "Computer Science",
                "cover_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80",
                "download_count": 19,
            },
            {
                "title": "Linear Algebra and Its Applications",
                "author": "Gilbert Strang",
                "description": "Renowned text on matrix theory, vector spaces, and eigenvalues.",
                "category": "Mathematics",
                "cover_url": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80",
                "download_count": 15,
            },
            {
                "title": "Calculus: Early Transcendentals",
                "author": "James Stewart",
                "description": "Clear explanations and problem sets in differential and integral calculus.",
                "category": "Mathematics",
                "cover_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
                "download_count": 22,
            },
            {
                "title": "Discrete Mathematics and Its Applications",
                "author": "Kenneth Rosen",
                "description": "Foundational text covering logic, sets, combinatorics, and graph theory.",
                "category": "Mathematics",
                "cover_url": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&q=80",
                "download_count": 14,
            },
            {
                "title": "The Feynman Lectures on Physics",
                "author": "Richard P. Feynman",
                "description": "Iconic physics lectures covering mechanics, radiation, heat, and quantum physics.",
                "category": "Physics",
                "cover_url": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&q=80",
                "download_count": 31,
            },
            {
                "title": "University Physics with Modern Physics",
                "author": "Hugh D. Young & Roger A. Freedman",
                "description": "Deep conceptual understanding of classic and modern physics principles.",
                "category": "Physics",
                "cover_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80",
                "download_count": 12,
            },
            {
                "title": "1984",
                "author": "George Orwell",
                "description": "The classic dystopian novel exploring surveillance, totalitarianism, and truth.",
                "category": "Literature",
                "cover_url": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80",
                "download_count": 50,
            },
            {
                "title": "To Kill a Mockingbird",
                "author": "Harper Lee",
                "description": "Pulitzer Prize-winning masterpiece addressing justice, empathy, and integrity.",
                "category": "Literature",
                "cover_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
                "download_count": 27,
            },
            {
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "description": "An enduring portrait of the Jazz Age, ambition, wealth, and heartbreak.",
                "category": "Literature",
                "cover_url": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&q=80",
                "download_count": 23,
            },
            {
                "title": "Sapiens: A Brief History of Humankind",
                "author": "Yuval Noah Harari",
                "description": "How an insignificant ape became the ruler of planet Earth.",
                "category": "History",
                "cover_url": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80",
                "download_count": 48,
            },
            {
                "title": "Guns, Germs, and Steel",
                "author": "Jared Diamond",
                "description": "The fates of human societies and environmental determinants of history.",
                "category": "History",
                "cover_url": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&q=80",
                "download_count": 18,
            },
            {
                "title": "Thinking, Fast and Slow",
                "author": "Daniel Kahneman",
                "description": "Nobel Laureate's exploration of the two systems that drive human thought.",
                "category": "Business & Economics",
                "cover_url": "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&q=80",
                "download_count": 39,
            },
            {
                "title": "Principles: Life and Work",
                "author": "Ray Dalio",
                "description": "Practical lessons and management philosophy from Bridgewater Associates.",
                "category": "Business & Economics",
                "cover_url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80",
                "download_count": 26,
            },
        ]

        for b in books_data:
            existing = db.query(Book).filter(Book.title == b["title"]).first()
            if not existing:
                cat_id = cat_map.get(b["category"])
                book = Book(
                    title=b["title"],
                    author=b["author"],
                    description=b["description"],
                    category_id=cat_id,
                    cover_url=b["cover_url"],
                    file_path=sample_pdf_path,
                    download_count=b["download_count"],
                )
                db.add(book)
                logger.info(f"Seeded book: '{b['title']}' by {b['author']}")
            else:
                logger.info(f"Book already exists: '{b['title']}'")

        db.commit()
        logger.info("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
