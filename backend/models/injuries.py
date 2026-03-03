import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from db.alloydb_client import Base, get_session
from models.players import Player
from config import get_config

_config = get_config()

class InjuryLog(Base):
    __tablename__ = 'injury_logs'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    player_id = Column(Integer, nullable=False)
    injury_type = Column(String(255), nullable=False)
    body_area = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False) # Major, Moderate, Minor
    contact_load = Column(Integer, default=0)
    status = Column(String(50), nullable=False) # Active, Recovering, Cleared
    notes = Column(Text)
    date = Column(String(10)) # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)

def log_injury(data: dict) -> dict:
    """
    Logs an injury and updates the player's status in AlloyDB.
    """
    session = get_session()
    try:
        # 1. Insert into injury_logs
        record = InjuryLog(
            player_id=int(data["player_id"]),
            injury_type=data["injury_type"],
            body_area=data["body_area"],
            severity=data["severity"],
            contact_load=int(data.get("contact_load", 0)),
            status=data["status"],
            notes=data.get("notes", ""),
            date=datetime.now().strftime("%Y-%m-%d")
        )
        session.add(record)
        
        # 2. Update Player Status
        new_status = "Green"
        injury_status = data["status"]
        severity = data["severity"]
        
        if injury_status == "Active":
            if severity == "Major":
                new_status = "Red"
            else:
                new_status = "Amber"
        elif injury_status == "Recovering":
            new_status = "Amber"
        elif injury_status == "Cleared":
            new_status = "Green"
            
        player = session.query(Player).filter(Player.jumper_no == int(data["player_id"])).first()
        if player:
            player.status = new_status
            
        session.commit()
        return {"message": "Injury logged and status updated", "new_status": new_status}
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def get_injury_history() -> list[dict]:
    """
    Fetches injury history from AlloyDB.
    """
    session = get_session()
    try:
        results = session.query(
            InjuryLog,
            Player.name.label('player_name')
        ).join(Player, InjuryLog.player_id == Player.jumper_no).order_by(InjuryLog.created_at.desc()).limit(100).all()
        
        history = []
        for i, player_name in results:
            d = {
                "id": i.id,
                "player_id": i.player_id,
                "player_name": player_name,
                "injury_type": i.injury_type,
                "body_area": i.body_area,
                "severity": i.severity,
                "contact_load": i.contact_load,
                "status": i.status,
                "notes": i.notes,
                "date": i.date,
                "created_at": i.created_at.isoformat()
            }
            history.append(d)
        return history
    finally:
        session.close()
