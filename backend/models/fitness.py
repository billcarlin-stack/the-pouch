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
    session_type = Column(String(100))
    distance_km = Column(Float)
    top_speed_kmh = Column(Float)
    hsd_m = Column(Float)
    hr_avg_bpm = Column(Integer)
    hr_max_bpm = Column(Integer)
    total_load = Column(Float)
    sprints = Column(Integer)
    accelerations = Column(Integer)
    decelerations = Column(Integer)
    is_live = Column(Integer) # Using Integer for Boolean compatibility if needed, or just Integer

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
            "session_type": row.session_type or "Training",
            "distance_km": row.distance_km or 0,
            "top_speed_kmh": row.top_speed_kmh or 0,
            "hsd_m": row.hsd_m or 0,
            "hr_avg_bpm": row.hr_avg_bpm or 0,
            "hr_max_bpm": row.hr_max_bpm or 0,
            "total_load": row.total_load or 0,
            "sprints": row.sprints or 0,
            "accelerations": row.accelerations or 0,
            "decelerations": row.decelerations or 0,
            "is_live": bool(row.is_live)
        }
    finally:
        session.close()

class FitnessPBs(Base):
    __tablename__ = 'fitness_pbs'

    player_id = Column(Integer, primary_key=True)
    run_2k_seconds = Column(Integer)
    bench_press_kg = Column(Float)
    squat_kg = Column(Float)
    vertical_jump_cm = Column(Float)
    beep_test_level = Column(Float)
    top_speed_kmh = Column(Float)
    sprint_10m_s = Column(Float)
    sprint_40m_s = Column(Float)
    date_recorded = Column(DateTime)

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
            "run_2k_seconds": row.run_2k_seconds or 0,
            "bench_press_kg": row.bench_press_kg or 0,
            "squat_kg": row.squat_kg or 0,
            "vertical_jump_cm": row.vertical_jump_cm or 0,
            "beep_test_level": row.beep_test_level or 0,
            "top_speed_kmh": row.top_speed_kmh or 0,
            "sprint_10m_s": row.sprint_10m_s or 0,
            "sprint_40m_s": row.sprint_40m_s or 0,
            "date_recorded": row.date_recorded.isoformat() if row.date_recorded else None
        }
    finally:
        session.close()
