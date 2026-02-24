from flask import Blueprint, jsonify, request
from db.bigquery_client import get_bq_client
from config import get_config
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
team_bp = Blueprint("team", __name__)

@team_bp.route("/builder", methods=["GET"])
def get_team_selections():
    """Fetches current team builder selections."""
    config = get_config()
    client = get_bq_client()
    
    query = f"""
        SELECT position_id, player_id, notes
        FROM `{config.GOOGLE_CLOUD_PROJECT}.{config.BQ_DATASET}.team_selections`
    """
    try:
        rows = client.query(query).result()
        return jsonify([dict(row) for row in rows]), 200
    except Exception as e:
        logger.error(f"Error fetching team: {e}")
        return jsonify({"error": "Failed to fetch team selections"}), 500

@team_bp.route("/builder", methods=["POST"])
def update_team_selection():
    """Updates a specific position in the team builder."""
    data = request.json
    pos_id = data.get("position_id")
    player_id = data.get("player_id") # Can be None
    notes = data.get("notes", "")
    
    if not pos_id:
        return jsonify({"error": "position_id is required"}), 400
        
    config = get_config()
    client = get_bq_client()
    table_ref = f"{config.GOOGLE_CLOUD_PROJECT}.{config.BQ_DATASET}.team_selections"
    
    # Update query
    # Note: BigQuery UPDATE requires a WHERE clause and usually standard SQL
    # Since we only have 27 rows, we can just do a direct update.
    query = f"""
        UPDATE `{table_ref}`
        SET player_id = @player_id,
            notes = @notes,
            updated_at = CURRENT_TIMESTAMP()
        WHERE position_id = @pos_id
    """
    
    from google.cloud import bigquery
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("player_id", "INTEGER", player_id),
            bigquery.ScalarQueryParameter("notes", "STRING", notes),
            bigquery.ScalarQueryParameter("pos_id", "STRING", pos_id),
        ]
    )
    
    try:
        client.query(query, job_config=job_config).result()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        logger.error(f"Error updating team: {e}")
        return jsonify({"error": "Failed to update team selection"}), 500
