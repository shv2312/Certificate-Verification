import asyncio
import os
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"

from app.db.session import engine, Base
import app.db.models

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(init())
print("Database initialized.")
