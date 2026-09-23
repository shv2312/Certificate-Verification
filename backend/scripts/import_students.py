"""
scripts/import_students.py
===========================
Bulk-imports student records from an Excel file (.xlsx) into the
PostgreSQL `students` table.

USAGE
-----
    cd backend
    .venv\Scripts\python.exe scripts\import_students.py --file path\to\batch_2024_25.xlsx

    # Dry-run only:
    .venv\Scripts\python.exe scripts\import_students.py --file batch_2024_25.xlsx --dry-run

OPTIONS
    --file              Path to the Excel file (required)
    --sheet             Sheet name or 0-based index (default: 0)
    --dry-run           Print what would be inserted without writing to DB
    --skip-errors       Continue on row-level errors instead of aborting

BRANCH AUTO-DETECTION FROM REGISTER NUMBER
------------------------------------------
Anna University register numbers encode the department in digits 7-9 (1-indexed).
Uses COURSE_CODE_MAP to detect branch and programme.
Auto-creates missing programmes and branches in the database on the fly.
"""

import argparse
import asyncio
import logging
import re
import sys
import os
from pathlib import Path

# Fix OpenBLAS memory allocation issue on Windows for Pandas/Numpy
os.environ["OPENBLAS_NUM_THREADS"] = "1"

# ---------------------------------------------------------------------------
# Allow running from backend/ directory
# ---------------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import pandas as pd
import asyncpg
from app.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Column alias map
# ---------------------------------------------------------------------------
COLUMN_ALIASES: dict[str, list[str]] = {
    "register_number": [
        "reg. no.", "reg no", "reg.no", "register no", "register number",
        "register_number", "roll no", "roll number", "rollno",
    ],
    "full_name": [
        "name of the student", "student name", "name", "full_name",
        "student's name", "students name",
    ],
    "year_of_passing": [
        "year of passing", "yop", "year_of_passing", "passing year",
        "year of pass", "year passed",
    ],
    "date_of_attend": [
        "date of attend", "study period", "period of study", "batch",
        "date_of_attend", "duration", "attendance period",
    ],
    "has_arrear": [
        "if any backlogs", "backlogs", "arrear", "has_arrear",
        "backlog", "arrears", "standing arrears",
    ],
    "mode_of_education": [
        "mode", "mode of education", "mode_of_education", "type",
    ],
}

# ---------------------------------------------------------------------------
# Course Code Map
# ---------------------------------------------------------------------------
COURSE_CODE_MAP = {
    "104": {"branch": "Computer Science and Engineering", "programme": "B.E."},
    "243": {"branch": "Artificial Intelligence and Data Science", "programme": "B.Tech."},
    "205": {"branch": "Information Technology", "programme": "B.Tech."},
    "247": {"branch": "Artificial Intelligence and Machine Learning", "programme": "B.E."},
    "106": {"branch": "Electronics and Communication Engineering", "programme": "B.E."},
    "103": {"branch": "Civil Engineering", "programme": "B.E."},
    "105": {"branch": "Electrical and Electronics Engineering", "programme": "B.E."},
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _collapse(s) -> str:
    return re.sub(r"[\s_\-\.]+", " ", str(s).strip().lower())

def remap_columns(df: pd.DataFrame) -> pd.DataFrame:
    renamed: dict[str, str] = {}
    for col in df.columns:
        col_key = _collapse(col)
        for canonical, aliases in COLUMN_ALIASES.items():
            if col_key in [_collapse(a) for a in aliases]:
                renamed[col] = canonical
                break
    df = df.rename(columns=renamed)
    return df

def normalize_name(raw: str) -> str:
    return re.sub(r"\s+", " ", str(raw).strip()).upper()

def normalize_register_number(raw) -> str:
    s = str(raw).strip()
    if re.match(r"^\d+\.0$", s):
        s = s[:-2]
    return s.upper()

def get_course_info(register_number: str) -> dict | None:
    digits = re.sub(r"\D", "", register_number)
    if len(digits) >= 9:
        # digits[6:9] extracts the 7th, 8th, and 9th characters (0-indexed)
        dept_code = digits[6:9]
        return COURSE_CODE_MAP.get(dept_code)
    return None

def parse_study_period(val) -> tuple[int | None, int | None]:
    if pd.isna(val) or str(val).strip().lower() in ("", "nan"):
        return None, None
    s = str(val).strip()
    s = s.replace("–", "-").replace("—", "-")
    m = re.match(r"(\d{4})\s*[-–—]\s*(\d{4})", s)
    if m:
        return int(m.group(1)), int(m.group(2))
    m2 = re.match(r"^(\d{4})$", s.strip())
    if m2:
        yr = int(m2.group(1))
        return yr, yr
    return None, None

def parse_has_arrear(val) -> bool:
    if pd.isna(val):
        return False
    s = str(val).strip().lower()
    if s in ("nil", "none", "", "0", "no", "n", "false", "clean", "-", "na", "n/a"):
        return False
    if s in ("yes", "y", "1", "true"):
        return True
    return True

def generate_branch_code(branch_name: str) -> str:
    # "Artificial Intelligence and Data Science" -> "AIDS"
    # "Computer Science and Engineering" -> "CSE"
    words = branch_name.replace(" and ", " ").replace(" of ", " ").split()
    if len(words) == 1:
        return words[0][:4].upper()
    return "".join(w[0].upper() for w in words if w)

# ---------------------------------------------------------------------------
# Database auto-creation logic
# ---------------------------------------------------------------------------
async def get_or_create_course(conn, branch_name: str, programme_degree: str) -> tuple[int, int]:
    """
    Returns (programme_id, branch_id).
    Creates them if they don't exist.
    """
    branch_code = generate_branch_code(branch_name)
    prog_code = f"{programme_degree.replace('.', '')}-{branch_code}"
    
    # Check if programme exists by name
    prog = await conn.fetchrow("SELECT id FROM programmes WHERE full_name = $1", branch_name)
    
    if prog:
        programme_id = prog["id"]
    else:
        # Check if code exists to avoid conflict
        existing_code = await conn.fetchrow("SELECT id FROM programmes WHERE code = $1", prog_code)
        if existing_code:
            # Fallback code
            prog_code = f"{prog_code}-1"
        
        log.info(f"Auto-creating Programme: {branch_name} ({programme_degree})")
        programme_id = await conn.fetchval("""
            INSERT INTO programmes (code, full_name, degree_type, is_active)
            VALUES ($1, $2, $3, TRUE)
            RETURNING id
        """, prog_code, branch_name, programme_degree)

    # Check if branch exists
    branch = await conn.fetchrow(
        "SELECT id FROM branches WHERE programme_id = $1 AND full_name = $2",
        programme_id, branch_name
    )
    
    if branch:
        branch_id = branch["id"]
    else:
        existing_bcode = await conn.fetchrow("SELECT id FROM branches WHERE programme_id = $1 AND code = $2", programme_id, branch_code)
        if existing_bcode:
            branch_code = f"{branch_code}-1"
            
        log.info(f"Auto-creating Branch: {branch_name} (Code: {branch_code}) under Programme ID {programme_id}")
        branch_id = await conn.fetchval("""
            INSERT INTO branches (programme_id, code, full_name, is_active)
            VALUES ($1, $2, $3, TRUE)
            RETURNING id
        """, programme_id, branch_code, branch_name)

    return programme_id, branch_id

# ---------------------------------------------------------------------------
# Main import logic
# ---------------------------------------------------------------------------

async def import_students(
    file_path: Path,
    sheet,
    dry_run: bool,
    skip_errors: bool,
):
    settings = get_settings()
    url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

    log.info("Connecting to database...")
    conn = await asyncpg.connect(dsn=url)
    log.info("Connected.")

    try:
        log.info("Loading Excel: %s  (sheet=%s)", file_path, sheet)
        df = pd.read_excel(
            file_path,
            sheet_name=sheet,
            dtype=str,
            engine="openpyxl",
        )

        df = remap_columns(df)
        log.info("Raw rows: %d  |  Mapped columns: %s", len(df), list(df.columns))

        if "register_number" not in df.columns:
            log.error("Could not find a register number column. Found: %s", list(df.columns))
            sys.exit(1)
        if "full_name" not in df.columns:
            log.error("Could not find a student name column. Found: %s", list(df.columns))
            sys.exit(1)

        has_yop_col    = "year_of_passing"    in df.columns
        has_attend_col = "date_of_attend"     in df.columns
        has_arrear_col = "has_arrear"         in df.columns
        has_mode_col   = "mode_of_education"  in df.columns

        inserted = 0
        updated  = 0
        skipped  = 0
        records  = []

        # We will keep a cache of (branch_name, programme) -> (programme_id, branch_id)
        course_cache = {}

        for idx, row in df.iterrows():
            row_num = idx + 2
            try:
                # ── Register number ──────────────────────────────────────────
                raw_reg = row.get("register_number", "")
                if pd.isna(raw_reg) or str(raw_reg).strip().lower() in ("", "nan"):
                    log.warning("Row %d: blank register_number – skipped", row_num)
                    skipped += 1
                    continue
                register_number = normalize_register_number(raw_reg)

                # ── Full name ─────────────────────────────────────────────────
                raw_name = row.get("full_name", "")
                if pd.isna(raw_name) or str(raw_name).strip().lower() in ("", "nan"):
                    log.warning("Row %d [%s]: blank full_name – skipped", row_num, register_number)
                    skipped += 1
                    continue
                full_name_raw    = str(raw_name).strip()
                full_name_normalized = normalize_name(full_name_raw)

                # ── Study period ──────────────────────────────────────────────
                period_start: int | None = None
                period_end:   int | None = None
                if has_attend_col:
                    period_start, period_end = parse_study_period(row.get("date_of_attend", ""))

                # ── Year of passing ───────────────────────────────────────────
                if has_yop_col:
                    yop_raw = str(row.get("year_of_passing", "")).strip().rstrip(".0")
                    year_of_passing = int(yop_raw)
                elif period_end is not None:
                    year_of_passing = period_end
                else:
                    raise ValueError(
                        "No year_of_passing and could not derive it from date_of_attend."
                    )

                # ── Course Detection (Branch/Programme) ───────────────────────
                course_info = get_course_info(register_number)
                if not course_info:
                    raise ValueError(
                        f"Cannot detect branch/programme from register_number='{register_number}'. "
                        "Ensure digits [6:9] match a known code."
                    )

                branch_name = course_info["branch"]
                programme_degree = course_info["programme"]
                
                cache_key = (branch_name, programme_degree)
                if cache_key not in course_cache:
                    if dry_run:
                        # Dummy IDs for dry run to avoid DB modifications
                        programme_id, branch_id = 999, 999
                    else:
                        programme_id, branch_id = await get_or_create_course(conn, branch_name, programme_degree)
                    course_cache[cache_key] = (programme_id, branch_id)
                else:
                    programme_id, branch_id = course_cache[cache_key]

                # ── Backlogs ──────────────────────────────────────────────────
                has_arrear = parse_has_arrear(
                    row.get("has_arrear", "Nil") if has_arrear_col else "Nil"
                )

                # ── Mode of education ─────────────────────────────────────────
                mode: str = "Regular"
                if has_mode_col:
                    mv = row.get("mode_of_education", "")
                    if not pd.isna(mv) and str(mv).strip().lower() not in ("", "nan"):
                        mode = str(mv).strip()

                records.append({
                    "register_number":       register_number,
                    "full_name":             full_name_raw,
                    "full_name_normalized":  full_name_normalized,
                    "programme_id":          programme_id,
                    "branch_id":             branch_id,
                    "year_of_passing":       year_of_passing,
                    "period_of_study_start": period_start,
                    "period_of_study_end":   period_end,
                    "mode_of_education":     mode,
                    "has_arrear":            has_arrear,
                })

            except Exception as e:
                log.error("Row %d [reg=%s]: %s", row_num, row.get("register_number", "?"), e)
                if skip_errors:
                    skipped += 1
                    continue
                else:
                    log.error("Aborting. Use --skip-errors to continue past row-level failures.")
                    raise

        log.info("Parsed %d valid records (%d skipped)", len(records), skipped)

        if dry_run:
            log.info("[DRY RUN] Would insert/update %d records. Sample:", len(records))
            for r in records[:10]:
                log.info(
                    "  %-20s | %-35s | branch_id=%-3s | yop=%s | period=%s-%s | arrear=%s",
                    r["register_number"], r["full_name"][:35],
                    r["branch_id"], r["year_of_passing"],
                    r["period_of_study_start"], r["period_of_study_end"],
                    r["has_arrear"],
                )
            log.info("[DRY RUN] No changes written to the database.")
            return

        # -----------------------------------------------------------------------
        # UPSERT – insert or update on register_number conflict (idempotent)
        # -----------------------------------------------------------------------
        UPSERT_SQL = """
            INSERT INTO students (
                register_number, full_name, full_name_normalized,
                programme_id, branch_id, year_of_passing,
                university_name, institute_name,
                period_of_study_start, period_of_study_end,
                mode_of_education, has_arrear,
                is_active, imported_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6,
                'Anna University',
                'Sri Shakthi Institute of Engineering and Technology',
                $7, $8, $9, $10,
                TRUE, NOW(), NOW()
            )
            ON CONFLICT (register_number) DO UPDATE SET
                full_name             = EXCLUDED.full_name,
                full_name_normalized  = EXCLUDED.full_name_normalized,
                programme_id          = EXCLUDED.programme_id,
                branch_id             = EXCLUDED.branch_id,
                year_of_passing       = EXCLUDED.year_of_passing,
                period_of_study_start = EXCLUDED.period_of_study_start,
                period_of_study_end   = EXCLUDED.period_of_study_end,
                mode_of_education     = EXCLUDED.mode_of_education,
                has_arrear            = EXCLUDED.has_arrear,
                updated_at            = NOW()
            RETURNING (xmax = 0) AS was_inserted
        """

        async with conn.transaction():
            for r in records:
                result = await conn.fetchrow(
                    UPSERT_SQL,
                    r["register_number"],
                    r["full_name"],
                    r["full_name_normalized"],
                    r["programme_id"],
                    r["branch_id"],
                    r["year_of_passing"],
                    r["period_of_study_start"],
                    r["period_of_study_end"],
                    r["mode_of_education"],
                    r["has_arrear"],
                )
                if result and result["was_inserted"]:
                    inserted += 1
                else:
                    updated += 1

        log.info("=" * 60)
        log.info("IMPORT COMPLETE")
        log.info("  Inserted (new):  %d", inserted)
        log.info("  Updated (exist): %d", updated)
        log.info("  Skipped (error): %d", skipped)
        log.info("  Total processed: %d", inserted + updated + skipped)
        total = await conn.fetchval("SELECT COUNT(*) FROM students")
        log.info("  students table total rows: %d", total)
        log.info("=" * 60)

    finally:
        await conn.close()

# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Import student records from Excel into the SIET PostgreSQL database.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--file", required=True,
                        help="Path to .xlsx file (e.g. batch_2024_25.xlsx)")
    parser.add_argument("--sheet", default=0,
                        help="Sheet name or 0-based index (default: 0)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Parse and validate without writing to DB")
    parser.add_argument("--skip-errors", action="store_true",
                        help="Skip bad rows instead of aborting")
    args = parser.parse_args()

    file_path = Path(args.file)
    if not file_path.exists():
        log.error("File not found: %s", file_path.resolve())
        sys.exit(1)

    sheet = args.sheet
    try:
        sheet = int(sheet)
    except ValueError:
        pass

    asyncio.run(
        import_students(
            file_path=file_path,
            sheet=sheet,
            dry_run=args.dry_run,
            skip_errors=args.skip_errors,
        )
    )

if __name__ == "__main__":
    main()
