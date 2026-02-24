"""
The Shinboner Hub — Calendar Data Access Layer

BigQuery queries for the Calendar module.
"""

import logging
import uuid
from datetime import datetime, timezone
from google.cloud import bigquery
from db.bigquery_client import get_bq_client
from config import get_config

logger = logging.getLogger(__name__)

_config = get_config()
_PROJECT = _config.GOOGLE_CLOUD_PROJECT
_DATASET = _config.BQ_DATASET
_TABLE = "calendar_events"

def _ensure_table():
    """Create the calendar_events table if it doesn't exist."""
    client = get_bq_client()
    table_ref = f"{_PROJECT}.{_DATASET}.{_TABLE}"
    try:
        client.get_table(table_ref)
    except Exception:
        schema = [
            bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("title", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("type", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("description", "STRING"),
            bigquery.SchemaField("start_time", "TIMESTAMP", mode="REQUIRED"),
            bigquery.SchemaField("end_time", "TIMESTAMP", mode="REQUIRED"),
            bigquery.SchemaField("player_ids", "INTEGER", mode="REPEATED"),
            bigquery.SchemaField("created_at", "TIMESTAMP"),
        ]
        table = bigquery.Table(table_ref, schema=schema)
        client.create_table(table)
        logger.info("Created calendar_events table")

def create_event(data: dict) -> dict:
    """Inserts a calendar event record into BigQuery."""
    _ensure_table()
    
    event_id = str(uuid.uuid4())
    record = {
        "id": event_id,
        "title": data["title"],
        "type": data["type"],
        "description": data.get("description", ""),
        "start_time": data["start_time"],
        "end_time": data["end_time"],
        "player_ids": data.get("player_ids", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        client = get_bq_client()
        table_ref = f"{_PROJECT}.{_DATASET}.{_TABLE}"
        errors = client.insert_rows_json(table_ref, [record])

        if errors:
            logger.error("BigQuery insert errors: %s", errors)
            raise RuntimeError(f"Failed to insert event: {errors}")

        return record
    except Exception as e:
        logger.error("Error creating calendar event: %s", str(e))
        raise

def get_events(start_date: str = None, end_date: str = None, player_id: int = None) -> list[dict]:
    """Retrieves calendar events."""
    _ensure_table()
    client = get_bq_client()
    
    where_clauses = []
    query_params = []

    if start_date:
        where_clauses.append("start_time >= @start_date")
        query_params.append(bigquery.ScalarQueryParameter("start_date", "TIMESTAMP", start_date))
    
    if end_date:
        where_clauses.append("start_time <= @end_date")
        query_params.append(bigquery.ScalarQueryParameter("end_date", "TIMESTAMP", end_date))

    query = f"""
        SELECT *
        FROM `{_PROJECT}.{_DATASET}.{_TABLE}`
    """
    
    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)
    
    query += " ORDER BY start_time ASC"

    job_config = bigquery.QueryJobConfig(query_parameters=query_params)

    try:
        rows = client.query(query, job_config=job_config).result()
        events = [dict(row) for row in rows]
        
        # Filter by player_id in Python since player_ids is a repeated field and
        # we want to include "Whole Squad" (empty player_ids)
        if player_id:
            filtered_events = []
            for e in events:
                if not e['player_ids'] or player_id in e['player_ids']:
                    filtered_events.append(e)
            return filtered_events
            
        return events
    except Exception as e:
        logger.error("Error fetching calendar events: %s", str(e))
        raise

def delete_event(event_id: str):
    """Deletes a calendar event."""
    client = get_bq_client()
    table_ref = f"{_PROJECT}.{_DATASET}.{_TABLE}"
    query = f"DELETE FROM `{table_ref}` WHERE id = @id"
    job_config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ScalarQueryParameter("id", "STRING", event_id)]
    )
    client.query(query, job_config=job_config).result()
