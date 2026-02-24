"""
The Shinboner Hub — BigQuery Seed Script

Seeds the nmfc_performance_hub dataset with the 2026 projected roster.
This is the original seed script, preserved in the seeds/ directory.

Usage:
    python seeds/seed_bq_2026.py
"""

from google.cloud import bigquery
from google.api_core.exceptions import Conflict
import os

# Configuration
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "bill-sandpit")
DATASET_ID = "nmfc_performance_hub"
TABLE_ID = "players_2026"

# 2026 Roster Data (Projected)
PLAYERS = [
    {"jumper_no": 1, "name": "Lachy Dovaston", "age": 18, "height_cm": 178, "games": 0, "position": "Forward", "status": "Green"},
    {"jumper_no": 2, "name": "Finn O'Sullivan", "age": 19, "height_cm": 182, "games": 22, "position": "Def/Mid", "status": "Green"},
    {"jumper_no": 3, "name": "Harry Sheezel", "age": 21, "height_cm": 185, "games": 67, "position": "Def/Mid", "status": "Green"},
    {"jumper_no": 4, "name": "Aidan Corr", "age": 32, "height_cm": 195, "games": 180, "position": "Defender", "status": "Amber"},
    {"jumper_no": 5, "name": "Caleb Daniel", "age": 29, "height_cm": 171, "games": 215, "position": "Mid/Fwd", "status": "Green"},
    {"jumper_no": 6, "name": "George Wardlaw", "age": 21, "height_cm": 182, "games": 39, "position": "Midfielder", "status": "Green"},
    {"jumper_no": 7, "name": "Zane Duursma", "age": 20, "height_cm": 189, "games": 35, "position": "Forward", "status": "Green"},
    {"jumper_no": 8, "name": "Bailey Scott", "age": 25, "height_cm": 186, "games": 130, "position": "Mid/Def", "status": "Green"},
    {"jumper_no": 9, "name": "L. Davies-Uniacke", "age": 26, "height_cm": 188, "games": 130, "position": "Midfielder", "status": "Green"},
    {"jumper_no": 10, "name": "Colby McKercher", "age": 20, "height_cm": 182, "games": 39, "position": "Defender", "status": "Green"},
    {"jumper_no": 11, "name": "Luke McDonald", "age": 31, "height_cm": 189, "games": 230, "position": "Defender", "status": "Green"},
    {"jumper_no": 12, "name": "Jy Simpkin", "age": 27, "height_cm": 183, "games": 173, "position": "Midfielder", "status": "Green"},
    {"jumper_no": 13, "name": "Tyler Sellers", "age": 23, "height_cm": 193, "games": 10, "position": "Key Fwd", "status": "Green"},
    {"jumper_no": 14, "name": "Liam Shiels", "age": 35, "height_cm": 183, "games": 300, "position": "Midfielder", "status": "Red"},
    {"jumper_no": 15, "name": "Daniel Howe", "age": 30, "height_cm": 191, "games": 110, "position": "Mid/Def", "status": "Amber"},
    {"jumper_no": 16, "name": "Zac Fisher", "age": 27, "height_cm": 175, "games": 140, "position": "Def/Mid", "status": "Green"},
    {"jumper_no": 17, "name": "Riley Hardeman", "age": 21, "height_cm": 185, "games": 15, "position": "Midfielder", "status": "Green"},
    {"jumper_no": 18, "name": "Wil Dawson", "age": 20, "height_cm": 200, "games": 8, "position": "Key Def", "status": "Green"},
    {"jumper_no": 19, "name": "Griffin Logue", "age": 28, "height_cm": 193, "games": 95, "position": "Key Def", "status": "Amber"},
    {"jumper_no": 20, "name": "Nick Larkey", "age": 27, "height_cm": 198, "games": 134, "position": "Key Forward", "status": "Green"},
    {"jumper_no": 21, "name": "Callum Coleman-Jones", "age": 26, "height_cm": 200, "games": 60, "position": "Ruck/Fwd", "status": "Amber"},
    {"jumper_no": 22, "name": "Taylor Goad", "age": 20, "height_cm": 206, "games": 5, "position": "Ruck", "status": "Green"},
    {"jumper_no": 23, "name": "Dylan Stephens", "age": 25, "height_cm": 183, "games": 85, "position": "Midfielder", "status": "Green"},
    {"jumper_no": 24, "name": "Tom Powell", "age": 24, "height_cm": 187, "games": 80, "position": "Midfielder", "status": "Green"},
    {"jumper_no": 25, "name": "Paul Curtis", "age": 23, "height_cm": 183, "games": 75, "position": "Forward", "status": "Green"},
    {"jumper_no": 26, "name": "Luke Parker", "age": 33, "height_cm": 183, "games": 315, "position": "Mid/Fwd", "status": "Green"},
    {"jumper_no": 27, "name": "Jack Darling", "age": 33, "height_cm": 191, "games": 320, "position": "Key Forward", "status": "Green"},
    {"jumper_no": 28, "name": "Bigoa Nyuon", "age": 24, "height_cm": 195, "games": 25, "position": "Key Def", "status": "Green"},
    {"jumper_no": 29, "name": "Will Phillips", "age": 24, "height_cm": 180, "games": 60, "position": "Midfielder", "status": "Amber"},
    {"jumper_no": 30, "name": "Charlie Comben", "age": 24, "height_cm": 199, "games": 45, "position": "Key Def", "status": "Green"},
    {"jumper_no": 31, "name": "Josh Goater", "age": 22, "height_cm": 190, "games": 25, "position": "Defender", "status": "Red"},
    {"jumper_no": 32, "name": "Toby Pink", "age": 27, "height_cm": 194, "games": 40, "position": "Key Def", "status": "Green"},
    {"jumper_no": 33, "name": "Brayden George", "age": 22, "height_cm": 186, "games": 15, "position": "Forward", "status": "Amber"},
    {"jumper_no": 34, "name": "Jackson Archer", "age": 23, "height_cm": 183, "games": 35, "position": "Defender", "status": "Green"},
    {"jumper_no": 35, "name": "Charlie Lazzaro", "age": 24, "height_cm": 179, "games": 55, "position": "Mid/Fwd", "status": "Green"},
    {"jumper_no": 36, "name": "Robert Hansen Jr", "age": 22, "height_cm": 180, "games": 10, "position": "Forward", "status": "Green"},
    {"jumper_no": 37, "name": "Cooper Harvey", "age": 21, "height_cm": 180, "games": 12, "position": "Mid/Fwd", "status": "Green"},
    {"jumper_no": 38, "name": "Tristan Xerri", "age": 26, "height_cm": 201, "games": 76, "position": "Ruck", "status": "Green"},
    {"jumper_no": 39, "name": "Geordie Payne", "age": 20, "height_cm": 184, "games": 3, "position": "Defender", "status": "Green"},
    {"jumper_no": 40, "name": "Eddie Ford", "age": 23, "height_cm": 189, "games": 50, "position": "Forward", "status": "Green"},
    {"jumper_no": 41, "name": "Blake Drury", "age": 22, "height_cm": 178, "games": 20, "position": "Mid/Fwd", "status": "Green"},
    {"jumper_no": 42, "name": "Kallan Dawson", "age": 27, "height_cm": 196, "games": 45, "position": "Key Def", "status": "Green"},
    {"jumper_no": 43, "name": "Aaron Hall", "age": 35, "height_cm": 185, "games": 190, "position": "Defender", "status": "Red"},
    {"jumper_no": 44, "name": "Cameron Zurhaar", "age": 28, "height_cm": 189, "games": 150, "position": "Forward", "status": "Green"},
]


def seed_database():
    client = bigquery.Client()

    # Create Dataset
    dataset_ref = client.dataset(DATASET_ID)
    try:
        client.create_dataset(dataset_ref)
        print(f"Dataset {DATASET_ID} created.")
    except Conflict:
        print(f"Dataset {DATASET_ID} already exists.")

    # Create Table
    table_ref = dataset_ref.table(TABLE_ID)
    schema = [
        bigquery.SchemaField("jumper_no", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("name", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("age", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("height_cm", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("games", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("position", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("status", "STRING", mode="REQUIRED"),
    ]

    table = bigquery.Table(table_ref, schema=schema)

    try:
        client.create_table(table)
        print(f"Table {TABLE_ID} created.")
    except Conflict:
        print(f"Table {TABLE_ID} already exists. Deleting and recreating...")
        client.delete_table(table_ref)
        client.create_table(table)
        print(f"Table {TABLE_ID} recreated.")

    # Insert Data
    errors = client.insert_rows_json(table, PLAYERS)
    if errors:
        print(f"Encountered errors while inserting rows: {errors}")
    else:
        print(f"Successfully inserted {len(PLAYERS)} players into {DATASET_ID}.{TABLE_ID}.")


if __name__ == "__main__":
    seed_database()
