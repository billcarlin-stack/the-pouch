"""
The Shinboner Hub — BigQuery Seed Script (Phase 7)

Adds tables for Advanced Modules:
1. `injury_logs`: Tracks player injury history and status.
2. `coach_ratings`: Stores 1-10 skill ratings from coaches.

Usage:
    python seeds/seed_bq_phase7.py
"""

from google.cloud import bigquery
from google.api_core.exceptions import Conflict
import os

# Configuration
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "bill-sandpit")
DATASET_ID = "nmfc_performance_hub"

def seed_phase7():
    client = bigquery.Client()
    dataset_ref = client.dataset(DATASET_ID)

    # 1. Create `injury_logs` Table
    table_id = "injury_logs"
    schema = [
        bigquery.SchemaField("id", "STRING", mode="REQUIRED", description="UUID"),
        bigquery.SchemaField("player_id", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("injury_type", "STRING", mode="REQUIRED"), # e.g. Hamstring, Ankle
        bigquery.SchemaField("body_area", "STRING", mode="REQUIRED"),   # e.g. Lower Body, Upper Body
        bigquery.SchemaField("severity", "STRING", mode="REQUIRED"),    # Minor, Moderate, Major
        bigquery.SchemaField("contact_load", "INTEGER", mode="NULLABLE"), # Mins of contact
        bigquery.SchemaField("status", "STRING", mode="REQUIRED"),      # Active, Recovering, Cleared
        bigquery.SchemaField("notes", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("date", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("created_at", "TIMESTAMP", mode="REQUIRED", default_value_expression="CURRENT_TIMESTAMP()"),
    ]
    create_table(client, dataset_ref, table_id, schema)

    # 2. Create `coach_ratings` Table
    table_id = "coach_ratings"
    schema = [
        bigquery.SchemaField("id", "STRING", mode="REQUIRED", description="UUID"),
        bigquery.SchemaField("player_id", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("skill_category", "STRING", mode="REQUIRED"), # Technical, Tactical, etc.
        bigquery.SchemaField("skill_name", "STRING", mode="REQUIRED"),     # Kicking, Marking, etc.
        bigquery.SchemaField("rating_value", "INTEGER", mode="REQUIRED"),  # 1-10
        bigquery.SchemaField("notes", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("date", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("created_at", "TIMESTAMP", mode="REQUIRED", default_value_expression="CURRENT_TIMESTAMP()"),
    ]
    create_table(client, dataset_ref, table_id, schema)

def create_table(client, dataset_ref, table_id, schema):
    table_ref = dataset_ref.table(table_id)
    table = bigquery.Table(table_ref, schema=schema)
    try:
        client.create_table(table)
        print(f"✅ Table {table_id} created.")
    except Conflict:
        print(f"⚠️ Table {table_id} already exists. Skipping.")

if __name__ == "__main__":
    seed_phase7()
