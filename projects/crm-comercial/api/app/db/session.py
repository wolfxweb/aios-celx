from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def _set_sqlite_pragmas(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()


def make_engine(url: str) -> Engine:
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    # :memory: sem pool partilhado = cada conexão vê BD vazia; StaticPool alinha com init_db + requests.
    extra = {}
    if url.startswith("sqlite") and ":memory:" in url:
        extra["poolclass"] = StaticPool
    eng = create_engine(url, connect_args=connect_args, **extra)
    if url.startswith("sqlite"):
        event.listen(eng, "connect", _set_sqlite_pragmas)
    return eng


settings = get_settings()
engine = make_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models import (  # noqa: F401 — registar modelos (ordem FK)
        activity,
        company,
        contact,
        contact_submission,
        lead,
        loss_reason,
        opportunity,
        pipeline,
        tag,
        task,
        user,
    )

    Base.metadata.create_all(bind=engine)
