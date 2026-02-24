"""
The Shinboner Hub — Team Availability Data Access Layer

BigQuery queries for the Team Availability module.

Aggregates squad availability by status (Green / Amber / Red)
and provides a breakdown per position group.
"""

import logging

from db.bigquery_client import get_bq_client
from config import get_config

logger = logging.getLogger(__name__)

_config = get_config()
_PROJECT = _config.GOOGLE_CLOUD_PROJECT
_DATASET = _config.BQ_DATASET
_PLAYERS_TABLE = _config.BQ_PLAYERS_TABLE


def get_team_availability() -> dict:
    """
    Returns a squad-wide availability summary.

    Queries the players table and groups by status to produce:
        - Total counts per status (Green, Amber, Red)
        - Overall availability percentage
        - Breakdown by position group
        - Players currently unavailable (Amber/Red)

    Returns:
        Dict with availability summary, position breakdown,
        and flagged players list.
    """
    client = get_bq_client()

    # Summary by status
    summary_query = f"""
        SELECT
            status,
            COUNT(*) as count
        FROM `{_PROJECT}.{_DATASET}.{_PLAYERS_TABLE}`
        GROUP BY status
        ORDER BY status
    """

    # Position breakdown
    position_query = f"""
        SELECT
            position,
            status,
            COUNT(*) as count
        FROM `{_PROJECT}.{_DATASET}.{_PLAYERS_TABLE}`
        GROUP BY position, status
        ORDER BY position, status
    """

    # Flagged players (not Green)
    flagged_query = f"""
        SELECT
            jumper_no,
            name,
            position,
            status
        FROM `{_PROJECT}.{_DATASET}.{_PLAYERS_TABLE}`
        WHERE status != 'Green'
        ORDER BY
            CASE status
                WHEN 'Red' THEN 1
                WHEN 'Amber' THEN 2
                ELSE 3
            END,
            name
    """

    try:
        # Execute all queries
        summary_rows = list(client.query(summary_query).result())
        position_rows = list(client.query(position_query).result())
        flagged_rows = list(client.query(flagged_query).result())

        # Build summary
        status_counts = {row["status"]: row["count"] for row in summary_rows}
        total = sum(status_counts.values())
        green = status_counts.get("Green", 0)

        # Build position breakdown
        position_breakdown = {}
        for row in position_rows:
            pos = row["position"]
            if pos not in position_breakdown:
                position_breakdown[pos] = {"Green": 0, "Amber": 0, "Red": 0}
            position_breakdown[pos][row["status"]] = row["count"]

        return {
            "total_players": total,
            "available": green,
            "availability_pct": round((green / total) * 100, 1) if total > 0 else 0,
            "status_breakdown": status_counts,
            "position_breakdown": position_breakdown,
            "flagged_players": [dict(row) for row in flagged_rows],
        }

    except Exception as e:
        logger.error("Error fetching team availability: %s", str(e))
        raise
