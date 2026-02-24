"""
The Shinboner Hub — Seed Random Coach Ratings (Phase 9)

Populates `coach_ratings` table with initial data for all players (1-44).
Generates random ratings (6-9) for all 12 skills.
"""

from google.cloud import bigquery
import uuid
import random
from datetime import datetime, timedelta
import os

# Configuration
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "bill-sandpit")
DATASET_ID = "nmfc_performance_hub"

SKILL_CATEGORIES = {
    "Technical": ["Kicking", "Handball", "Marking", "Tackling"],
    "Tactical": ["Decision Making", "Positioning", "Stoppage Craft"],
    "Physical": ["Speed", "Endurance", "Strength"],
    "Mental": ["Resilience", "Leadership", "Professionalism"]
}

def seed_ratings():
    client = bigquery.Client()
    table_id = f"{PROJECT_ID}.{DATASET_ID}.coach_ratings"
    
    rows_to_insert = []
    
    print("Generating ratings for 44 players...")
    
    for player_id in range(1, 45):
        # Create a "base" rating for the player so they aren't all random noise
        # e.g. some players are better than others
        player_quality = random.randint(-1, 2) # -1 (developing) to +2 (elite)
        
        for category, skills in SKILL_CATEGORIES.items():
            for skill in skills:
                # Base 7, plus player quality, plus random variance
                rating = 7 + player_quality + random.randint(-1, 1)
                
                # Clamp between 1 and 10
                rating = max(1, min(10, rating))
                
                rows_to_insert.append({
                    "id": str(uuid.uuid4()),
                    "player_id": player_id,
                    "skill_category": category,
                    "skill_name": skill,
                    "rating_value": rating,
                    "notes": "Initial assessment",
                    "date": (datetime.now() - timedelta(days=random.randint(0, 5))).strftime("%Y-%m-%d"),
                    "created_at": datetime.now().isoformat()
                })
    
    # Insert in batches of 500 to be safe
    batch_size = 500
    for i in range(0, len(rows_to_insert), batch_size):
        batch = rows_to_insert[i : i + batch_size]
        errors = client.insert_rows_json(table_id, batch)
        if errors:
            print(f"⚠️ Errors inserting batch {i//batch_size}: {errors}")
        else:
            print(f"✅ Batch {i//batch_size} inserted ({len(batch)} rows).")

if __name__ == "__main__":
    seed_ratings()
