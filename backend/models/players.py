"""
The Shinboner Hub — Player Data Access Layer

BigQuery queries for the Players module.
"""

from google.cloud import bigquery

from db.bigquery_client import get_bq_client
from config import get_config

_config = get_config()
_PROJECT = _config.GOOGLE_CLOUD_PROJECT
_DATASET = _config.BQ_DATASET
_TABLE = _config.BQ_PLAYERS_TABLE


def get_all_players() -> list[dict]:
    """
    Fetches all players from BigQuery ordered by jumper number.

    Returns:
        List of player dicts with all columns from the players table.
    """
    client = get_bq_client()
    query = f"""
        SELECT *
        FROM `{_PROJECT}.{_DATASET}.{_TABLE}`
        ORDER BY jumper_no
    """
    rows = client.query(query).result()
    return [dict(row) for row in rows]


def get_player_by_id(jumper_no: int) -> dict | None:
    """
    Fetches a single player by jumper number.

    Args:
        jumper_no: The player's jumper number.

    Returns:
        Player dict if found, None otherwise.
    """
    client = get_bq_client()
    query = f"""
        SELECT *
        FROM `{_PROJECT}.{_DATASET}.{_TABLE}`
        WHERE jumper_no = @jumper_no
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("jumper_no", "INTEGER", jumper_no)
        ]
    )
    rows = list(client.query(query, job_config=job_config).result())
    if not rows:
        return None
    return dict(rows[0])
