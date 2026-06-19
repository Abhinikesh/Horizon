"""
MongoDB async client for Horizon.
Uses Motor (async PyMongo wrapper) for non-blocking database operations.

If MONGODB_URL is not set or is invalid, the app starts in "no-DB" mode:
  - health check still works
  - auth endpoints return 503 with a clear message
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Global client / db references (set during startup)
_client: AsyncIOMotorClient | None = None
_db = None


async def connect_db():
    """Called during FastAPI lifespan startup.  Never raises — failures are logged."""
    global _client, _db

    mongodb_url = os.getenv("MONGODB_URL", "")
    db_name     = os.getenv("DB_NAME", "horizon")

    # Skip if placeholder or empty
    if not mongodb_url or "YOUR_USERNAME" in mongodb_url or "YOUR_CLUSTER" in mongodb_url:
        print("⚠️  MONGODB_URL not configured. Running without database.")
        print("   → Set MONGODB_URL in backend/.env to enable auth & storage.")
        return

    try:
        _client = AsyncIOMotorClient(mongodb_url, serverSelectionTimeoutMS=5000)
        _db     = _client[db_name]

        # Ping to validate the connection actually works
        await _client.admin.command("ping")

        # Create indexes
        await _db.users.create_index("email", unique=True)
        await _db.projects.create_index("user_id")
        print(f"✅ Connected to MongoDB — database: {db_name}")

    except Exception as exc:
        print(f"⚠️  MongoDB connection failed: {exc}")
        print("   → Running without database. Set MONGODB_URL in backend/.env")
        _client = None
        _db     = None


async def close_db():
    """Called during FastAPI lifespan shutdown."""
    global _client
    if _client:
        _client.close()
        print("MongoDB connection closed.")


def get_db():
    """Return the active Motor database instance (may be None if not connected)."""
    return _db


# ─── Document serialization helpers ──────────────────────────────────────────

def serialize_doc(doc: dict | None) -> dict | None:
    """Convert MongoDB _id ObjectId to string 'id' field."""
    if doc is None:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    from datetime import datetime
    for k, v in doc.items():
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc


def serialize_list(docs) -> list:
    return [serialize_doc(d) for d in docs]
