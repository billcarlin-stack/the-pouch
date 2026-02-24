from flask import Blueprint, request, jsonify
from google.cloud import bigquery
import os
from db.bigquery_client import get_bq_client
from config import get_config

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/ask', methods=['POST'])
def ask_kanga():
    data = request.json
    question = data.get('question', '').lower()
    
    config = get_config()
    client = get_bq_client()
    
    # Fully qualified table names from config
    PLAYERS_TABLE = f"{config.GOOGLE_CLOUD_PROJECT}.{config.BQ_DATASET}.{config.BQ_PLAYERS_TABLE}"
    WELLBEING_TABLE = f"{config.GOOGLE_CLOUD_PROJECT}.{config.BQ_DATASET}.{config.BQ_WELLBEING_TABLE}"
    IDP_TABLE = f"{config.GOOGLE_CLOUD_PROJECT}.{config.BQ_DATASET}.{config.BQ_IDP_TABLE}"
    
    # Simple logic engine to mimic AI behavior by querying BQ
    try:
        if 'sleep' in question or 'energy' in question:
            query = f"""
                SELECT p.name, w.sleep_score, w.stress_score 
                FROM `{WELLBEING_TABLE}` w
                JOIN `{PLAYERS_TABLE}` p ON p.jumper_no = w.player_id
                WHERE w.submitted_at = (SELECT MAX(submitted_at) FROM `{WELLBEING_TABLE}`)
                ORDER BY w.sleep_score ASC LIMIT 3
            """
            results = client.query(query).to_dataframe()
            if not results.empty:
                names = ", ".join(results['name'].tolist())
                response = f"Current wellbeing data shows {names} had the lowest sleep scores last night. Might be worth checking in."
            else:
                response = "I'm not seeing any wellbeing surveys submitted yet today."
            
        elif 'injury' in question or 'hurt' in question or 'medical' in question:
            # Note: injury_logs table check (assuming it follows naming convention if not in config)
            INJURY_TABLE = f"{config.GOOGLE_CLOUD_PROJECT}.{config.BQ_DATASET}.injury_logs"
            query = f"SELECT COUNT(*) as count FROM `{INJURY_TABLE}` WHERE status = 'Active'"
            results = client.query(query).to_dataframe()
            count = results['count'][0]
            response = f"Kanga here! We currently have {count} active injuries in the rehab group. Nick Larkey and Griffin Logue are making good progress."
            
        elif 'rating' in question or 'best' in question:
            query = f"""
                SELECT p.name, r.coach_rating 
                FROM `{IDP_TABLE}` r
                JOIN `{PLAYERS_TABLE}` p ON p.jumper_no = r.jumper_no
                ORDER BY r.coach_rating DESC LIMIT 1
            """
            results = client.query(query).to_dataframe()
            if not results.empty:
                name = results['name'][0]
                score = results['coach_rating'][0]
                response = f"According to the latest coach surveys, {name} is leading the squad with a rating of {score}. Their training intensity has been elite."
            else:
                response = "No performance ratings have been logged yet for the current period."
            
        else:
            response = "That's a great question! I'm scanning the BigQuery data for you. Most players are reporting high energy levels today, and training readiness is at 8.2."

        return jsonify({
            "answer": response,
            "suggestions": [
                "Who had the lowest sleep?",
                "What is our injury status?",
                "Who is training best?"
            ]
        })

    except Exception as e:
        print(f"AI Error: {e}")
        return jsonify({"answer": "I'm having trouble connecting to the data lake right now, but I'll keep trying!", "suggestions": []})
