"""
The Shinboner Hub — Coach Ratings Logic

Handles submitting coach ratings and fetching comparison data.
"""

import uuid
from datetime import datetime
from google.cloud import bigquery
from config import get_config

_config = get_config()
_PROJECT = _config.GOOGLE_CLOUD_PROJECT
_DATASET = _config.BQ_DATASET

def submit_rating(data: dict) -> dict:
    """
    Submits a coach rating for a player skill.
    
    Args:
        data: Dict containing player_id, skill_category, skill_name, rating_value, notes
    """
    client = bigquery.Client()
    
    rows_to_insert = [{
        "id": str(uuid.uuid4()),
        "player_id": int(data["player_id"]),
        "skill_category": data["skill_category"],
        "skill_name": data["skill_name"],
        "rating_value": int(data["rating_value"]),
        "notes": data.get("notes", ""),
        "date": datetime.now().strftime("%Y-%m-%d"),
        "created_at": datetime.now().isoformat()
    }]
    
    errors = client.insert_rows_json(f"{_PROJECT}.{_DATASET}.coach_ratings", rows_to_insert)
    if errors:
        raise Exception(f"Failed to submit rating: {errors}")
        
    return {"message": "Rating submitted successfully"}

def get_player_ratings(player_id: int) -> dict:
    """
    Fetches the latest coach ratings for a player and compares with mock Self/Squad data.
    """
    client = bigquery.Client()
    
    # Get latest coach ratings for this player
    query = f"""
        SELECT skill_category, skill_name, rating_value, notes, date
        FROM `{_PROJECT}.{_DATASET}.coach_ratings`
        WHERE player_id = @player_id
        ORDER BY created_at DESC
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("player_id", "INTEGER", player_id)
        ]
    )
    rows = client.query(query, job_config=job_config).result()
    
    # Deduplicate to get only the latest rating per skill
    coach_ratings = {}
    for row in rows:
        key = f"{row.skill_category}_{row.skill_name}"
        if key not in coach_ratings:
            coach_ratings[key] = {
                "category": row.skill_category,
                "skill": row.skill_name,
                "rating": row.rating_value,
                "notes": row.notes,
                "date": row.date.strftime("%Y-%m-%d")
            }
            
    # Mock Self and Squad Ratings (as per requirements)
    # In a real app, 'Self' would come from a player app submission, and 'Squad' would be an aggregation query.
    
    comparison_data = []
    
    # If no coach ratings exist, we return empty or default list. 
    # Let's populate the standard skill list to ensure the UI has something to show even if empty.
    standard_skills = [
        ("Technical", "Kicking"), ("Technical", "Handball"), ("Technical", "Marking"),
        ("Tactical", "Decision Making"), ("Tactical", "Positioning"),
        ("Physical", "Speed"), ("Physical", "Endurance"),
        ("Mental", "Resilience"), ("Mental", "Leadership")
    ]
    
    import random
    
    for category, skill in standard_skills:
        key = f"{category}_{skill}"
        coach_val = coach_ratings.get(key, {}).get("rating", 0) # Default to 0 if not rated
        
        # Mock values
        self_val = random.randint(5, 9)
        squad_val = random.randint(6, 8)
        
        comparison_data.append({
            "skill": skill,
            "category": category,
            "coach_rating": coach_val,
            "self_rating": self_val,
            "squad_avg": squad_val,
            "gap": coach_val - self_val
        })
        
    return {"ratings": comparison_data}
