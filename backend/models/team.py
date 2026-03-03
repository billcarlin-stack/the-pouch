from sqlalchemy import Column, Integer, String, DateTime, text
from db.alloydb_client import Base, get_session
from datetime import datetime

class TeamSelection(Base):
    __tablename__ = 'team_selections'

    position_id = Column(String(50), primary_key=True)
    player_id = Column(Integer)
    notes = Column(String(255))
    updated_at = Column(DateTime(timezone=True), server_default=text('now()'), onupdate=text('now()'))

    def to_dict(self):
        return {
            "position_id": self.position_id,
            "player_id": self.player_id,
            "notes": self.notes
        }

def get_all_team_selections() -> list[dict]:
    session = get_session()
    try:
        selections = session.query(TeamSelection).all()
        return [s.to_dict() for s in selections]
    finally:
        session.close()

def update_team_selection(pos_id: str, player_id: int | None, notes: str) -> bool:
    session = get_session()
    try:
        selection = session.query(TeamSelection).filter(TeamSelection.position_id == pos_id).first()
        if selection:
            selection.player_id = player_id
            selection.notes = notes
            selection.updated_at = datetime.now()
            session.commit()
            return True
        return False
    finally:
        session.close()
