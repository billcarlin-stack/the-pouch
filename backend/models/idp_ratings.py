"""
The Shinboner Hub — IDP Ratings Data Access Layer

BigQuery queries for the Individual Development Plan (IDP) Ratings module.

IDP Categories (1-10 scale):
    - Grit: Mental toughness and willingness to compete
    - TacticalIQ: Game sense and decision-making
    - Execution: Skill execution under pressure
    - Resilience: Bounce-back from setbacks
    - Leadership: On-field and off-field leadership qualities
    - composite_score: Weighted average of all categories
"""

import logging

from google.cloud import bigquery

from db.bigquery_client import get_bq_client
from config import get_config

logger = logging.getLogger(__name__)

_config = get_config()
_PROJECT = _config.GOOGLE_CLOUD_PROJECT
_DATASET = _config.BQ_DATASET
_TABLE = _config.BQ_IDP_TABLE


def get_idp_for_player(jumper_no: int) -> dict | None:
    """
    Returns IDP ratings for a given player from BigQuery.

    Args:
        jumper_no: The player's jumper number.

    Returns:
        Dict with IDP category scores and composite, or None if not found.
    """
    client = get_bq_client()
    query = f"""
        SELECT
            player_id,
            grit AS Grit,
            tactical_iq AS TacticalIQ,
            execution AS Execution,
            resilience AS Resilience,
            leadership AS Leadership,
            composite_score,
            assessed_at
        FROM `{_PROJECT}.{_DATASET}.{_TABLE}`
        WHERE player_id = @player_id
        ORDER BY assessed_at DESC
        LIMIT 1
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("player_id", "INTEGER", jumper_no)
        ]
    )

    try:
        rows = list(client.query(query, job_config=job_config).result())
        if not rows:
            return None
        return dict(rows[0])
    except Exception as e:
        logger.error(
            "Error fetching IDP for player %d: %s", jumper_no, str(e)
        )
        raise


def get_idp_for_players(jumper_nos: list[int]) -> list[dict]:
    """
    Returns IDP ratings for multiple players (used by comparison endpoint).

    Args:
        jumper_nos: List of player jumper numbers.

    Returns:
        List of IDP dicts ordered by composite score descending.
    """
    client = get_bq_client()

    # Build parameterized query for multiple players
    params = []
    placeholders = []
    for i, jn in enumerate(jumper_nos):
        param_name = f"p{i}"
        placeholders.append(f"@{param_name}")
        params.append(
            bigquery.ScalarQueryParameter(param_name, "INTEGER", jn)
        )

    query = f"""
        SELECT
            player_id,
            grit AS Grit,
            tactical_iq AS TacticalIQ,
            execution AS Execution,
            resilience AS Resilience,
            leadership AS Leadership,
            composite_score,
            assessed_at
        FROM `{_PROJECT}.{_DATASET}.{_TABLE}`
        WHERE player_id IN ({', '.join(placeholders)})
        ORDER BY composite_score DESC
    """
    job_config = bigquery.QueryJobConfig(query_parameters=params)

    try:
        rows = client.query(query, job_config=job_config).result()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.error(
            "Error fetching IDP for players %s: %s", jumper_nos, str(e)
        )
        raise
