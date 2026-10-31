import logging
import os
import time
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.models import Base

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL", settings.database_url)

# Engine configuration with connection pooling
engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db(max_retries: int = 30, delay_seconds: int = 3) -> None:
    """
    Initializes database schema and retries connection on startup (PRD Section 5).
    Retries every 3 seconds up to 30 attempts to survive MySQL starting late in Docker/K8s.
    """
    current_db_url = os.getenv("DATABASE_URL", settings.database_url)

    # If using in-memory or file SQLite, initialize immediately without retrying
    if current_db_url.startswith("sqlite") or os.getenv("TESTING") == "true":
        logger.info("Initializing test/SQLite database tables...")
        Base.metadata.create_all(bind=engine)
        return

    logger.info(
        f"Connecting to MySQL database at {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME} "
        f"(max {max_retries} retries, interval {delay_seconds}s)..."
    )

    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            logger.info("Database connection established successfully. Creating tables if not exist...")
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables initialized successfully.")
            return
        except OperationalError as exc:
            logger.warning(
                f"Database connection attempt {attempt}/{max_retries} failed: {exc}. "
                f"Retrying in {delay_seconds} seconds..."
            )
            time.sleep(delay_seconds)

    error_msg = f"Failed to connect to MySQL database after {max_retries} attempts."
    logger.error(error_msg)
    raise RuntimeError(error_msg)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a SQLAlchemy database session.
    Ensures session is closed after request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
