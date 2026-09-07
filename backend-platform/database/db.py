import importlib
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=True)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing. Create backend-platform/.env from .env.example."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def init_db() -> None:
    importlib.import_module("models.models")

    try:
        logger.info("Initializing PostgreSQL database schema.")
        Base.metadata.create_all(bind=engine)
        ensure_result_schema()
        logger.info("PostgreSQL database schema is ready.")
    except SQLAlchemyError:
        logger.exception("PostgreSQL database initialization failed.")
        raise


def ensure_result_schema() -> None:
    """Apply small non-destructive schema fixes for existing PostgreSQL databases."""
    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE test_results ADD COLUMN IF NOT EXISTS skipped INTEGER DEFAULT 0")
        )
        connection.execute(
            text("""
            INSERT INTO projects (name, repository_url, branch, language, visibility, access_method, credential_id, description, last_pipeline_status, created_at)
            SELECT 'sample-node-app', 'https://gitlab.com/devsecops-pipeline-manager/sample-node-app.git', 'main', 'javascript', 'private', 'token', 'gitlab-private-token', 'Sample Node.js application for DevSecOps testing', 'NOT_STARTED', NOW()
            WHERE NOT EXISTS (SELECT 1 FROM projects WHERE repository_url LIKE '%sample-node-app%');
            """)
        )


def check_database_connection() -> tuple[bool, str | None]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, None
    except SQLAlchemyError as exc:
        logger.warning("PostgreSQL health check failed.", exc_info=True)
        return False, exc.__class__.__name__


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()