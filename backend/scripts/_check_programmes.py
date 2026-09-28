"""
scripts/_check_programmes.py
Print all existing programmes and branches for column mapping.
"""
import sys, os, asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app.config import get_settings
import asyncpg

settings = get_settings()


async def main():
    url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(dsn=url)

    progs = await conn.fetch("SELECT id, code, full_name, degree_type FROM programmes ORDER BY id")
    print("=== PROGRAMMES ===")
    for r in progs:
        print(f"  id={r['id']:3d}  code={r['code']:15s}  type={r['degree_type']:10s}  name={r['full_name']}")

    branches = await conn.fetch(
        "SELECT b.id, b.programme_id, b.code, b.full_name, p.code AS prog_code "
        "FROM branches b JOIN programmes p ON p.id=b.programme_id ORDER BY b.id"
    )
    print("\n=== BRANCHES ===")
    for r in branches:
        print(f"  id={r['id']:3d}  prog={r['prog_code']:10s}  code={r['code']:15s}  name={r['full_name']}")

    aliases = await conn.fetch(
        "SELECT ba.alias, b.code FROM branch_aliases ba "
        "JOIN branches b ON b.id=ba.branch_id ORDER BY ba.alias"
    )
    print("\n=== BRANCH ALIASES (first 20) ===")
    for r in aliases[:20]:
        print(f"  alias={r['alias']:30s}  -> branch={r['code']}")

    # Show 3 sample students
    students = await conn.fetch("SELECT register_number, full_name, branch_id, year_of_passing FROM students LIMIT 5")
    print("\n=== SAMPLE STUDENTS ===")
    for s in students:
        print(f"  reg={s['register_number']:20s}  name={s['full_name']:30s}  branch_id={s['branch_id']}  yop={s['year_of_passing']}")

    await conn.close()


asyncio.run(main())
