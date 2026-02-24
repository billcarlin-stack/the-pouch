"""
The Shinboner Hub — IDP Ratings Seed Script

Creates the idp_ratings table and seeds one IDP assessment per player (44 records)
with experience-weighted scores.

IDP Categories (1-10):
    Grit, TacticalIQ, Execution, Resilience, Leadership

Usage:
    python seeds/seed_idp.py
"""

import os
import random
from datetime import datetime, timedelta, timezone

from google.cloud import bigquery
from google.api_core.exceptions import NotFound

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "bill-sandpit")
DATASET_ID = "nmfc_performance_hub"
TABLE_ID = "idp_ratings"

# Player data: (jumper_no, name, games, position)
# Used to weight IDP scores realistically
PLAYERS = [
    (1, "Lachy Dovaston", 0, "Forward"),
    (2, "Finn O'Sullivan", 22, "Def/Mid"),
    (3, "Harry Sheezel", 67, "Def/Mid"),
    (4, "Aidan Corr", 180, "Defender"),
    (5, "Caleb Daniel", 215, "Mid/Fwd"),
    (6, "George Wardlaw", 39, "Midfielder"),
    (7, "Zane Duursma", 35, "Forward"),
    (8, "Bailey Scott", 130, "Mid/Def"),
    (9, "L. Davies-Uniacke", 130, "Midfielder"),
    (10, "Colby McKercher", 39, "Defender"),
    (11, "Luke McDonald", 230, "Defender"),
    (12, "Jy Simpkin", 173, "Midfielder"),
    (13, "Tyler Sellers", 10, "Key Fwd"),
    (14, "Liam Shiels", 300, "Midfielder"),
    (15, "Daniel Howe", 110, "Mid/Def"),
    (16, "Zac Fisher", 140, "Def/Mid"),
    (17, "Riley Hardeman", 15, "Midfielder"),
    (18, "Wil Dawson", 8, "Key Def"),
    (19, "Griffin Logue", 95, "Key Def"),
    (20, "Nick Larkey", 134, "Key Forward"),
    (21, "Callum Coleman-Jones", 60, "Ruck/Fwd"),
    (22, "Taylor Goad", 5, "Ruck"),
    (23, "Dylan Stephens", 85, "Midfielder"),
    (24, "Tom Powell", 80, "Midfielder"),
    (25, "Paul Curtis", 75, "Forward"),
    (26, "Luke Parker", 315, "Mid/Fwd"),
    (27, "Jack Darling", 320, "Key Forward"),
    (28, "Bigoa Nyuon", 25, "Key Def"),
    (29, "Will Phillips", 60, "Midfielder"),
    (30, "Charlie Comben", 45, "Key Def"),
    (31, "Josh Goater", 25, "Defender"),
    (32, "Toby Pink", 40, "Key Def"),
    (33, "Brayden George", 15, "Forward"),
    (34, "Jackson Archer", 35, "Defender"),
    (35, "Charlie Lazzaro", 55, "Mid/Fwd"),
    (36, "Robert Hansen Jr", 10, "Forward"),
    (37, "Cooper Harvey", 12, "Mid/Fwd"),
    (38, "Tristan Xerri", 76, "Ruck"),
    (39, "Geordie Payne", 3, "Defender"),
    (40, "Eddie Ford", 50, "Forward"),
    (41, "Blake Drury", 20, "Mid/Fwd"),
    (42, "Kallan Dawson", 45, "Key Def"),
    (43, "Aaron Hall", 190, "Defender"),
    (44, "Cameron Zurhaar", 150, "Forward"),
]


def experience_tier(games: int) -> str:
    """Classify player by experience."""
    if games >= 150:
        return "elite"
    elif games >= 75:
        return "established"
    elif games >= 25:
        return "developing"
    else:
        return "rookie"


def generate_idp_ratings():
    """Generate realistic IDP ratings based on experience and position."""
    records = []
    now = datetime.now(timezone.utc)

    for jumper_no, name, games, position in PLAYERS:
        tier = experience_tier(games)

        # Base ranges by tier
        ranges = {
            "elite":       {"grit": (8, 10), "tiq": (8, 10), "exec": (8, 10), "res": (8, 10), "lead": (8, 10)},
            "established": {"grit": (7, 9),  "tiq": (6, 9),  "exec": (7, 9),  "res": (7, 9),  "lead": (6, 8)},
            "developing":  {"grit": (6, 8),  "tiq": (5, 8),  "exec": (6, 8),  "res": (6, 8),  "lead": (4, 7)},
            "rookie":      {"grit": (5, 8),  "tiq": (4, 7),  "exec": (5, 7),  "res": (5, 7),  "lead": (3, 6)},
        }
        r = ranges[tier]

        grit = random.randint(*r["grit"])
        tactical_iq = random.randint(*r["tiq"])
        execution = random.randint(*r["exec"])
        resilience = random.randint(*r["res"])
        leadership = random.randint(*r["lead"])

        # Known overrides for key players
        if jumper_no == 12:  # Jy Simpkin (Captain)
            leadership = 10
            grit = max(grit, 9)
        elif jumper_no == 11:  # Luke McDonald (Vice-Captain)
            leadership = 10
            resilience = max(resilience, 9)
        elif jumper_no == 3:  # Harry Sheezel
            execution = 10
            tactical_iq = max(tactical_iq, 9)
        elif jumper_no == 6:  # George Wardlaw
            grit = 10
            resilience = max(resilience, 9)
        elif jumper_no == 26:  # Luke Parker
            grit = 10
            leadership = max(leadership, 9)
        elif jumper_no == 9:  # LDU
            tactical_iq = max(tactical_iq, 9)
            execution = max(execution, 9)
        elif jumper_no == 27:  # Jack Darling
            resilience = 10
            leadership = max(leadership, 8)
        elif jumper_no == 20:  # Nick Larkey
            execution = max(execution, 9)
            grit = max(grit, 8)

        # Composite: weighted average
        composite = round(
            grit * 0.20 + tactical_iq * 0.20 + execution * 0.25
            + resilience * 0.20 + leadership * 0.15,
            1,
        )

        # Assessment date: random within last 14 days
        assessed = now - timedelta(days=random.randint(0, 14))

        records.append({
            "player_id": jumper_no,
            "grit": grit,
            "tactical_iq": tactical_iq,
            "execution": execution,
            "resilience": resilience,
            "leadership": leadership,
            "composite_score": composite,
            "assessed_at": assessed.isoformat(),
        })

    return records


def seed_idp():
    client = bigquery.Client(project=PROJECT_ID)
    dataset_ref = client.dataset(DATASET_ID)
    table_ref = dataset_ref.table(TABLE_ID)

    schema = [
        bigquery.SchemaField("player_id", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("grit", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("tactical_iq", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("execution", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("resilience", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("leadership", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("composite_score", "FLOAT", mode="REQUIRED"),
        bigquery.SchemaField("assessed_at", "TIMESTAMP", mode="REQUIRED"),
    ]

    # Create or recreate table
    try:
        client.get_table(table_ref)
        print(f"Table {TABLE_ID} exists. Deleting and recreating...")
        client.delete_table(table_ref)
    except NotFound:
        pass

    client.create_table(bigquery.Table(table_ref, schema=schema))
    print(f"Table {TABLE_ID} created.")

    # Generate and insert data
    records = generate_idp_ratings()
    errors = client.insert_rows_json(table_ref, records)

    if errors:
        print(f"Errors inserting rows: {errors[:3]}...")
    else:
        print(f"Successfully inserted {len(records)} IDP ratings.")


if __name__ == "__main__":
    seed_idp()
