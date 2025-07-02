from .database import engine, Base
from .chat import ChatSession, ChatMessage, ConnectionLog

def create_tables():
    """
    Create all database tables.
    """
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """
    Drop all database tables.
    """
    Base.metadata.drop_all(bind=engine)

if __name__ == "__main__":
    create_tables()
    print("Database tables created successfully.")