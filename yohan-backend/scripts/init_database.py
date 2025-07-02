#!/usr/bin/env python3
"""
Initialize the database for the Yohan backend.
Run this script to create all necessary database tables.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.init_db import create_tables

if __name__ == "__main__":
    try:
        create_tables()
        print("✅ Database tables created successfully!")
        print("📊 Tables created:")
        print("  - chat_sessions")
        print("  - chat_messages") 
        print("  - connection_logs")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        sys.exit(1)