import logging
from sqlalchemy import Column, Integer, String, Float, DateTime
from db.alloydb_client import Base, get_session
from datetime import datetime

logger = logging.getLogger(__name__)

class FitnessSession(Base):
    __tablename__ = 'fitness_sessions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, nullable=False)
    session_date = Column(DateTime, nullable=False)
    distance_km = Column(Float)
    top_speed_kmh = Column(Float)
    avg_hr = Column(Integer)
    caloric_burn = Column(Integer)

def get_latest_session(player_id: int) -> dict | None:
    """
    Returns the most recent GPS/training session for a player from AlloyDB.
    """
    session = get_session()
    try:
        row = session.query(FitnessSession).filter(FitnessSession.player_id == player_id).order_by(FitnessSession.session_date.desc()).first()
        if not row:
            return None
        return {
            "player_id": row.player_id,
            "session_date": row.session_date.isoformat(),
            "distance_km": row.distance_km,
            "top_speed_kmh": row.top_speed_kmh,
            "avg_hr": row.avg_hr,
            "caloric_burn": row.caloric_burn
        }
    finally:
        session.close()

class FitnessPBs(Base):
    __tablename__ = 'fitness_pbs'

    player_id = Column(Integer, primary_key=True)
    run_2k_min = Column(Integer)
    run_2k_sec = Column(Integer)
    bench_press_kg = Column(Integer)
    vertical_jump_cm = Column(Integer)
    shuttle_run_level = Column(Integer)

def get_fitness_pbs(player_id: int) -> dict | None:
    """
    Returns the personal best fitness metrics for a player from AlloyDB.
    """
    session = get_session()
    try:
        row = session.query(FitnessPBs).filter(FitnessPBs.player_id == player_id).first()
        if not row:
            return None
        return {
            "player_id": row.player_id,
            "run_2k_min": row.run_2k_min,
            "run_2k_sec": row.run_2k_sec,
            "bench_press_kg": row.bench_press_kg,
            "vertical_jump_cm": row.vertical_jump_cm,
            "shuttle_run_level": row.shuttle_run_level
        }
    finally:
        session.close()
