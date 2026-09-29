"""
create_dev_local.py
===================
Turnkey local database provisioning for new teammates.

Steps:
  1. Runs init_db.py  → creates all SQLAlchemy-managed tables & seeds Institution + AdminAccount
  2. Runs seed_fixtures.py → populates programmes, branches, aliases, and demo students (idempotent)

Usage (from backend/ with venv activated):
    python create_dev_local.py
"""
import subprocess
import sys


def main():
    print("=" * 55)
    print("  SIET BGV – Local Database Provisioning")
    print("=" * 55)

    print("\n[1/2] Creating tables & seeding Institution / AdminAccount...")
    subprocess.run([sys.executable, "init_db.py"], check=True)

    print("\n[2/2] Seeding Programmes, Branches, Aliases & Demo Students...")
    subprocess.run([sys.executable, "seed_fixtures.py"], check=True)

    print("\n" + "=" * 55)
    print("  Done! dev_local.db is ready.")
    print("  Admin login  : admin@siet.ac.in / admin123")
    print("  Demo students: 713519104001, 713519104002, ...")
    print("=" * 55)


if __name__ == "__main__":
    main()

