"""
scripts/_test_import.py
Generates a synthetic Excel with the REAL column headers from the student batch
sheet, then runs import_students.py in both dry-run and real-insert modes.
"""
import sys, os, subprocess, tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
import pandas as pd

# Use the EXACT column names that appear in the real batch sheet
TEST_DATA = [
    {
        "Reg. No.":               "714025104245",   # 104 -> CSE
        "Name of the Student":    "Gopal",
        "Year of Passing":        "2025",
        "Date of Attend":         "2021-2025",
        "If any Backlogs":        "Nil",
    },
    {
        "Reg. No.":               "714025243001",   # 243 -> Artificial Intelligence and Data Science
        "Name of the Student":    "Arjun Ramaswamy",
        "Year of Passing":        "2025",
        "Date of Attend":         "2021-2025",
        "If any Backlogs":        "Nil",
    },
    {
        "Reg. No.":               "714025205002",   # 205 -> Information Technology
        "Name of the Student":    "Priya Venkatesh",
        "Year of Passing":        "2025",
        "Date of Attend":         "2021–2025",   
        "If any Backlogs":        "2 arrears",    
    },
    {
        "Reg. No.":               "714025105010",   # 105 -> EEE
        "Name of the Student":    "Karthik Selvam",
        "Year of Passing":        "2025",
        "Date of Attend":         "2021-2025",
        "If any Backlogs":        "",              
    },
]


def main():
    df = pd.DataFrame(TEST_DATA)
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False, prefix="test_batch_") as f:
        tmp_path = f.name

    df.to_excel(tmp_path, index=False)
    print(f"Test Excel written: {tmp_path}  ({len(df)} rows)")
    print(f"Columns: {list(df.columns)}\n")

    python = sys.executable
    script = str(BACKEND_DIR / "scripts" / "import_students.py")

    def run(args, label):
        print(f"=== {label} ===")
        r = subprocess.run([python, script] + args, cwd=str(BACKEND_DIR),
                           capture_output=True, text=True)
        out = (r.stdout + r.stderr).strip()
        print(out)
        print()
        return r.returncode

    rc = run(["--file", tmp_path, "--dry-run"], "DRY RUN")
    if rc != 0:
        print("DRY RUN FAILED – aborting real insert")
        os.unlink(tmp_path)
        return

    run(["--file", tmp_path, "--skip-errors"], "REAL INSERT")
    os.unlink(tmp_path)


if __name__ == "__main__":
    main()
