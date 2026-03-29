from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import SQLITE_URL
from app.database.models import Base

engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
