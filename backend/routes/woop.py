"""
The Shinboner Hub — WOOP Goal Setting Routes

WOOP = Wish, Outcome, Obstacle, Plan
Players set weekly goals; coaches review and track completion.

Endpoints:
    GET  /api/woop/<player_id>   — get all WOOP goals for a player
    POST /api/woop               — create a new WOOP goal
    PATCH /api/woop/<goal_id>    — update a goal's status
"""

import logging
import uuid
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from db.bigquery_client import get_bq_client
from config import get_config
from google.cloud import bigquery

logger = logging.getLogger(__name__)
woop_bp = Blueprint("woop", __name__)

_config = get_config()
_PROJECT = _config.GOOGLE_CLOUD_PROJECT
_DATASET = _config.BQ_DATASET
_TABLE = "woop_goals"


def _ensure_table():
    """Create the woop_goals table if it doesn't exist."""
    client = get_bq_client()
    table_ref = f"{_PROJECT}.{_DATASET}.{_TABLE}"
    try:
        client.get_table(table_ref)
    except Exception:
        schema = [
            bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("player_id", "INTEGER", mode="REQUIRED"),
            bigquery.SchemaField("wish", "STRING"),
            bigquery.SchemaField("outcome", "STRING"),
            bigquery.SchemaField("obstacle", "STRING"),
            bigquery.SchemaField("plan", "STRING"),
            bigquery.SchemaField("status", "STRING"),  # 'active', 'completed'
            bigquery.SchemaField("week_of", "STRING"),
            bigquery.SchemaField("created_at", "TIMESTAMP"),
        ]
        table = bigquery.Table(table_ref, schema=schema)
        client.create_table(table)
        logger.info("Created woop_goals table")


@woop_bp.route("/woop/<int:player_id>", methods=["GET"])
def get_woop_goals(player_id):
    """Get all WOOP goals for a player, newest first."""
    _ensure_table()
    client = get_bq_client()
    query = f"""
        SELECT *
        FROM `{_PROJECT}.{_DATASET}.{_TABLE}`
        WHERE player_id = @player_id
        ORDER BY created_at DESC
        LIMIT 50
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("player_id", "INTEGER", player_id),
        ]
    )
    try:
        rows = client.query(query, job_config=job_config).result()
        results = []
        for row in rows:
            d = dict(row)
            # Convert datetime objects to ISO format strings
            for key, val in d.items():
                if isinstance(val, datetime):
                    d[key] = val.isoformat()
            results.append(d)
        return jsonify(results), 200
    except Exception as e:
        logger.error(f"Error fetching WOOP goals: {e}")
        return jsonify({"error": "Failed to fetch goals"}), 500


@woop_bp.route("/woop", methods=["POST"])
def create_woop_goal():
    """Create a new WOOP goal."""
    _ensure_table()
    data = request.get_json()
    if not data or not data.get("player_id"):
        return jsonify({"error": "player_id is required"}), 400

    goal_id = str(uuid.uuid4())[:8]
    record = {
        "id": goal_id,
        "player_id": int(data["player_id"]),
        "wish": data.get("wish", ""),
        "outcome": data.get("outcome", ""),
        "obstacle": data.get("obstacle", ""),
        "plan": data.get("plan", ""),
        "status": "active",
        "week_of": data.get("week_of", datetime.now().strftime("%Y-W%W")),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    client = get_bq_client()
    table_ref = f"{_PROJECT}.{_DATASET}.{_TABLE}"

    try:
        errors = client.insert_rows_json(table_ref, [record])
        if errors:
            logger.error(f"BigQuery insert errors: {errors}")
            return jsonify({"error": "Failed to save goal"}), 500
        return jsonify(record), 201
    except Exception as e:
        logger.error(f"Error creating WOOP goal: {e}")
        return jsonify({"error": "Failed to create goal"}), 500


@woop_bp.route("/woop/<goal_id>", methods=["PATCH"])
def update_woop_goal(goal_id):
    """Update a WOOP goal's status (e.g., mark as completed)."""
    _ensure_table()
    data = request.get_json()
    new_status = data.get("status", "active") if data else "active"

    client = get_bq_client()
    table_ref = f"{_PROJECT}.{_DATASET}.{_TABLE}"

    query = f"""
        UPDATE `{table_ref}`
        SET status = @status
        WHERE id = @goal_id
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("status", "STRING", new_status),
            bigquery.ScalarQueryParameter("goal_id", "STRING", goal_id),
        ]
    )

    try:
        client.query(query, job_config=job_config).result()
        return jsonify({"status": "success", "id": goal_id, "new_status": new_status}), 200
    except Exception as e:
        logger.error(f"Error updating WOOP goal: {e}")
        return jsonify({"error": "Failed to update goal"}), 500
