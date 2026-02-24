"""
The Shinboner Hub — Wellbeing Survey Data Access Layer

BigQuery queries for the Wellbeing Surveys module.

Survey fields:
    - player_id (jumper_no)
    - sleep_score (1-10)
    - soreness_score (1-10)
    - stress_score (1-10)
    - notes (optional text)
    - submitted_at (auto-generated timestamp)
"""

import logging
from datetime import datetime, timezone

from google.cloud import bigquery

from db.bigquery_client import get_bq_client
from config import get_config

logger = logging.getLogger(__name__)

_config = get_config()
_PROJECT = _config.GOOGLE_CLOUD_PROJECT
_DATASET = _config.BQ_DATASET
_TABLE = _config.BQ_WELLBEING_TABLE


def submit_survey(data: dict) -> dict:
    """
    Inserts a wellbeing survey record into BigQuery.

    Args:
        data: Dict with keys: player_id, sleep_score, soreness_score,
              stress_score, notes (optional).

    Returns:
        Dict with the submitted survey data and confirmation.

    Raises:
        ValueError: If required fields are missing or invalid.
    """
    # Validate required fields
    required = ["player_id", "sleep_score", "soreness_score", "stress_score"]
    missing = [f for f in required if f not in data]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    # Validate score ranges
    for field in ["sleep_score", "soreness_score", "stress_score"]:
        score = data[field]
        if not isinstance(score, int) or not 1 <= score <= 10:
            raise ValueError(f"{field} must be an integer between 1 and 10")

    record = {
        "player_id": int(data["player_id"]),
        "sleep_score": int(data["sleep_score"]),
        "soreness_score": int(data["soreness_score"]),
        "stress_score": int(data["stress_score"]),
        "notes": data.get("notes", ""),
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        client = get_bq_client()
        table_ref = f"{_PROJECT}.{_DATASET}.{_TABLE}"
        errors = client.insert_rows_json(table_ref, [record])

        if errors:
            logger.error("BigQuery insert errors: %s", errors)
            raise RuntimeError(f"Failed to insert survey: {errors}")

        logger.info(
            "Wellbeing survey submitted for player %d", record["player_id"]
        )
        return record

    except Exception as e:
        logger.error("Error submitting wellbeing survey: %s", str(e))
        raise


def get_surveys_for_player(jumper_no: int, limit: int = 90) -> list[dict]:
    """
    Retrieves wellbeing survey history for a player.

    Args:
        jumper_no: The player's jumper number.
        limit: Maximum number of records to return (default: 90).

    Returns:
        List of survey dicts ordered by most recent first.
    """
    client = get_bq_client()
    query = f"""
        SELECT *
        FROM `{_PROJECT}.{_DATASET}.{_TABLE}`
        WHERE player_id = @player_id
        ORDER BY submitted_at DESC
        LIMIT @limit
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("player_id", "INTEGER", jumper_no),
            bigquery.ScalarQueryParameter("limit", "INTEGER", limit),
        ]
    )

    try:
        rows = client.query(query, job_config=job_config).result()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.error(
            "Error fetching wellbeing surveys for player %d: %s",
            jumper_no,
            str(e),
        )
        raise


def get_surveys_with_notes(limit: int = 20) -> list[dict]:
    """
    Retrieves recent wellbeing surveys that have non-empty notes.
    Joins with the players table to include player names.

    Args:
        limit: Max records to return.

    Returns:
        List of dicts with player_name, jumper_no, notes, sleep_score, etc.
    """
    client = get_bq_client()
    PLAYERS_TABLE = f"{_PROJECT}.{_DATASET}.{_config.BQ_PLAYERS_TABLE}"
    query = f"""
        SELECT 
            w.*,
            p.name as player_name
        FROM `{_PROJECT}.{_DATASET}.{_TABLE}` w
        JOIN `{PLAYERS_TABLE}` p ON w.player_id = p.jumper_no
        WHERE w.notes IS NOT NULL AND TRIM(w.notes) != ''
        ORDER BY w.submitted_at DESC
        LIMIT @limit
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("limit", "INTEGER", limit),
        ]
    )

    try:
        rows = client.query(query, job_config=job_config).result()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.error("Error fetching wellbeing surveys with notes: %s", str(e))
        raise
