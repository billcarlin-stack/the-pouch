"""
The Shinboner Hub — Injury Logic

Handles injury logging and automatic player status updates.
"""

import uuid
from datetime import datetime
from google.cloud import bigquery
from config import get_config

_config = get_config()
_PROJECT = _config.GOOGLE_CLOUD_PROJECT
_DATASET = _config.BQ_DATASET

def log_injury(data: dict) -> dict:
    """
    Logs an injury and updates the player's status.
    
    Args:
        data: Dict containing player_id, injury_type, body_area, severity, status, notes
    """
    client = bigquery.Client()
    
    # 1. Insert into injury_logs
    rows_to_insert = [{
        "id": str(uuid.uuid4()),
        "player_id": int(data["player_id"]),
        "injury_type": data["injury_type"],
        "body_area": data["body_area"],
        "severity": data["severity"],
        "contact_load": int(data.get("contact_load", 0)),
        "status": data["status"], # Active, Recovering, Cleared
        "notes": data.get("notes", ""),
        "date": datetime.now().strftime("%Y-%m-%d"),
        "created_at": datetime.now().isoformat()
    }]
    
    errors = client.insert_rows_json(f"{_PROJECT}.{_DATASET}.injury_logs", rows_to_insert)
    if errors:
        raise Exception(f"Failed to insert injury log: {errors}")
        
    # 2. Update Player Status based on Injury Status/Severity
    # Logic: 
    # - Active Major -> Red
    # - Active Moderate -> Amber
    # - Active Minor -> Amber
    # - Recovering -> Amber
    # - Cleared -> Green
    
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
        
    # Valid statuses in players_2026 are Green, Amber, Red.
    
    update_query = f"""
        UPDATE `{_PROJECT}.{_DATASET}.players_2026`
        SET status = @status
        WHERE jumper_no = @player_id
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("status", "STRING", new_status),
            bigquery.ScalarQueryParameter("player_id", "INTEGER", int(data["player_id"]))
        ]
    )
    client.query(update_query, job_config=job_config).result()
    
    return {"message": "Injury logged and status updated", "new_status": new_status}

def get_injury_history() -> list[dict]:
    client = bigquery.Client()
    query = f"""
        SELECT 
            i.*, 
            p.name as player_name
        FROM `{_PROJECT}.{_DATASET}.injury_logs` i
        JOIN `{_PROJECT}.{_DATASET}.players_2026` p
        ON i.player_id = p.jumper_no
        ORDER BY i.created_at DESC
        LIMIT 100
    """
    rows = client.query(query).result()
    return [dict(row) for row in rows]
