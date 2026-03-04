"""
The Hawk Hub — AlloyDB Client

Thread-safe singleton for the PostgreSQL (AlloyDB) connection.
Uses SQLAlchemy for connection pooling and session management.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
from config import get_config

_config = get_config()
_engine = None
_SessionFactory = None
_Session = None

Base = declarative_base()

def get_engine():
    """Returns the SQLAlchemy engine."""
    global _engine
    if _engine is None:
        _engine = create_engine(
            _config.DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_recycle=3600,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 10} # 10 seconds timeout
        )
    return _engine

def get_session():
    """Returns a thread-safe scoped session."""
    global _Session, _SessionFactory
    if _Session is None:
        engine = get_engine()
        _SessionFactory = sessionmaker(bind=engine)
        _Session = scoped_session(_SessionFactory)
    return _Session()

def init_db():
    """Initializes the database schema."""
    engine = get_engine()
    # Import all models here to ensure they are registered with Base
    import models.players
    import models.ratings
    import models.wellbeing
    import models.fitness
    import models.availability
    import models.injuries
    import models.team
    import models.woop
    import models.stats
    
    Base.metadata.create_all(bind=engine)
