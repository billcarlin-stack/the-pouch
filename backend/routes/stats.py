from flask import Blueprint, jsonify, request
from google.cloud import bigquery
from db.bigquery_client import get_bq_client
from config import get_config
import logging

logger = logging.getLogger(__name__)
stats_bp = Blueprint("stats", __name__)

@stats_bp.route("/2025", methods=["GET"])
def get_stats_2025():
    """
    Fetches player stats for the 2025 season.
    Joins with players table to get names and positions.
    Query param: jumper_no (optional)
    """
    config = get_config()
    client = get_bq_client()
    jumper_no = request.args.get("jumper_no")
    
    where_clause = ""
    query_params = []
    if jumper_no:
        where_clause = "WHERE p.jumper_no = @jumper_no"
        query_params = [bigquery.ScalarQueryParameter("jumper_no", "INTEGER", int(jumper_no))]
    
    query = f"""
        SELECT 
            p.jumper_no, p.name, p.position,
            s.games_played, s.af_avg, s.rating_points, 
            s.goals_avg, s.disposals_avg, s.marks_avg, 
            s.tackles_avg, s.clearances_avg, s.kicks_avg, 
            s.handballs_avg, s.hitouts_avg
        FROM `{config.GOOGLE_CLOUD_PROJECT}.{config.BQ_DATASET}.players_2026` p
        LEFT JOIN `{config.GOOGLE_CLOUD_PROJECT}.{config.BQ_DATASET}.player_stats_2025` s
        ON p.jumper_no = s.jumper_no
        {where_clause}
        ORDER BY s.disposals_avg DESC
    """
    
    try:
        job_config = bigquery.QueryJobConfig(query_parameters=query_params)
        rows = client.query(query, job_config=job_config).result()
        stats = []
        for row in rows:
            data = dict(row)
            # Fill Nones with 0 as requested
            for key in data:
                if data[key] is None and key not in ["name", "position"]:
                    data[key] = 0
            stats.append(data)
            
        return jsonify(stats), 200
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        return jsonify({"error": "Failed to fetch stats"}), 500
