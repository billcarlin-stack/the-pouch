import os
import logging
from google.cloud import bigquery
from sqlalchemy.orm import sessionmaker
from db.alloydb_client import get_engine, Base
from models.players import Player
from utils.cache import data_cache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def sync_photos():
    # 1. Fetch data from BigQuery
    logger.info("Fetching player photos from BigQuery...")
    bq_client = bigquery.Client(project="bill-sandpit")
    query = 'SELECT jersey_number, name, photo_url FROM `dan-sandpit.hawks_idp.players`'
    
    try:
        bq_rows = bq_client.query(query).result()
        bq_players = {row.jersey_number: row.photo_url for row in bq_rows if row.photo_url}
        logger.info(f"Found {len(bq_players)} photos in BigQuery.")
    except Exception as e:
        logger.error(f"Failed to fetch from BigQuery: {e}")
        return

    # 2. Update AlloyDB
    logger.info("Updating AlloyDB players...")
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        players = session.query(Player).all()
        updated_count = 0
        
        for player in players:
            new_photo = bq_players.get(player.jumper_no)
            if new_photo:
                player.photo_url = new_photo
                updated_count += 1
                logger.info(f"Updated photo for #{player.jumper_no} {player.name}")
        
        session.commit()
        logger.info(f"Successfully updated {updated_count} player photos in AlloyDB.")
        
        # 3. Clear Cache
        data_cache.clear()
        logger.info("Cleared application data cache.")
        
    except Exception as e:
        session.rollback()
        logger.error(f"AlloyDB update failed: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    sync_photos()
