import os
import sys

# Ensure app is found
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.services.seed_service import seed_database

def main():
    print("Initializing Medivanta AI Hospital Database Schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        print("Database initialized and verified successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
