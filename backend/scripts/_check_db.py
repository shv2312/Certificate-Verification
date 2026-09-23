"""
scripts/_check_db.py
Inspect the live database: tables, row counts, and students schema.
Run from backend/ with: .venv\Scripts\python.exe scripts\_check_db.py
"""
import sys, os, asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.config import get_settings
import asyncpg

settings = get_settings()


async def main():
    url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    try:
        conn = await asyncpg.connect(dsn=url)
    except Exception as e:
        print(f"[ERROR] Cannot connect to database: {e}")
        return

    tables = await conn.fetch(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema='public' ORDER BY table_name"
    )
    print("Tables:", [r["table_name"] for r in tables])

    table_names = [r["table_name"] for r in tables]

    for tbl in ["students", "programmes", "branches", "branch_aliases"]:
        if tbl in table_names:
            n = await conn.fetchval(f"SELECT COUNT(*) FROM {tbl}")
            print(f"  {tbl}: {n} rows")
        else:
            print(f"  {tbl}: TABLE NOT FOUND")

    # Print students columns if table exists
    if "students" in table_names:
        cols = await conn.fetch(
            "SELECT column_name, data_type, is_nullable "
            "FROM information_schema.columns "
            "WHERE table_name='students' ORDER BY ordinal_position"
        )
        print("\nstudents columns:")
        for c in cols:
            print(f"  {c['column_name']:30s} {c['data_type']:20s} nullable={c['is_nullable']}")

    await conn.close()


asyncio.run(main())
