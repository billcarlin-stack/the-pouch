import sys
import os
import logging

# Add backend directory to path so imports work
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from db.alloydb_client import init_db
    from seeds.seed_alloydb_players import seed_alloydb
    from seeds.seed_alloydb_fitness import seed_alloydb_fitness
    
    logger.info("Initializing database schema...")
    init_db()
    
    logger.info("Running player seed...")
    seed_alloydb()
    
    logger.info("Running fitness seed...")
    seed_alloydb_fitness()
    
    logger.info("SUCCESS!")
except Exception as e:
    logger.error("Seeding failed: %s", str(e), exc_info=True)
