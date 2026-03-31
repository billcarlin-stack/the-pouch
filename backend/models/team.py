from sqlalchemy import Column, Integer, String, DateTime, text
from db.cloudsql_client import Base, get_session
from datetime import datetime

class TeamSelection(Base):
    __tablename__ = 'team_selections'

    position_id = Column(String(50), primary_key=True)
    player_id = Column(Integer)
    rotation_color = Column(String(50))
    rotation_minutes = Column(Integer)
    notes = Column(String(255))
    updated_at = Column(DateTime(timezone=True), server_default=text('now()'), onupdate=text('now()'))


    def to_dict(self):
        return {
            "position_id": self.position_id,
            "player_id": self.player_id,
            "rotation_color": self.rotation_color,
            "rotation_minutes": self.rotation_minutes,
            "notes": self.notes
        }

class SavedSquad(Base):
    __tablename__ = 'saved_squads'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    data = Column(String) # JSON string of selections
    created_at = Column(DateTime(timezone=True), server_default=text('now()'))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "data": self.data,
            "created_at": self.created_at
        }


def get_all_team_selections() -> list[dict]:
    session = get_session()
    try:
        selections = session.query(TeamSelection).all()
        return [s.to_dict() for s in selections]
    finally:
        session.close()

def get_saved_squads() -> list[dict]:
    session = get_session()
    try:
        squads = session.query(SavedSquad).order_by(SavedSquad.created_at.desc()).all()
        return [s.to_dict() for s in squads]
    finally:
        session.close()

def save_squad(name: str, data: str) -> dict:
    session = get_session()
    try:
        squad = SavedSquad(name=name, data=data)
        session.add(squad)
        session.commit()
        return squad.to_dict()
    finally:
        session.close()

def load_squad_data(squad_id: int) -> str | None:
    session = get_session()
    try:
        squad = session.query(SavedSquad).filter(SavedSquad.id == squad_id).first()
        return squad.data if squad else None
    finally:
        session.close()


def update_team_selection(pos_id: str, player_id: int | None, notes: str, rotation_color: str | None = None, rotation_minutes: int | None = None) -> bool:
    session = get_session()
    try:
        selection = session.query(TeamSelection).filter(TeamSelection.position_id == pos_id).first()
        if not selection:
            selection = TeamSelection(position_id=pos_id)
            session.add(selection)
        
        selection.player_id = player_id
        selection.notes = notes
        if rotation_color is not None: selection.rotation_color = rotation_color
        if rotation_minutes is not None: selection.rotation_minutes = rotation_minutes
        selection.updated_at = datetime.now()
        session.commit()
        return True

    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

