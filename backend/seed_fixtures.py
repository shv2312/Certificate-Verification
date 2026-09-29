"""Seed fixture students into dev_local.db.
Run from the backend/ directory with the venv activated.
"""
import sqlite3

conn = sqlite3.connect("dev_local.db")
cur = conn.cursor()

# Seed programmes (idempotent)
cur.execute("""
INSERT OR IGNORE INTO programmes (id, code, full_name, degree_type)
VALUES (1, 'B.E.', 'Bachelor of Engineering', 'B.E.')
""")
cur.execute("""
INSERT OR IGNORE INTO programmes (id, code, full_name, degree_type)
VALUES (2, 'M.E.', 'Master of Engineering', 'M.E.')
""")
cur.execute("""
INSERT OR IGNORE INTO programmes (id, code, full_name, degree_type)
VALUES (3, 'MBA', 'Master of Business Administration', 'MBA')
""")

# Seed branches (idempotent)
branches = [
    (1, 1, "CSE",   "Computer Science and Engineering"),
    (2, 1, "IT",    "Information Technology"),
    (3, 1, "ECE",   "Electronics and Communication Engineering"),
    (4, 1, "EEE",   "Electrical and Electronics Engineering"),
    (5, 1, "MECH",  "Mechanical Engineering"),
    (6, 1, "CIVIL", "Civil Engineering"),
    (7, 1, "AIML",  "Artificial Intelligence and Machine Learning"),
    (8, 1, "AIDS",  "Artificial Intelligence and Data Science"),
    (9, 2, "CSE-ME","Computer Science and Engineering (M.E.)"),
]
for b in branches:
    cur.execute("INSERT OR IGNORE INTO branches (id, programme_id, code, full_name) VALUES (?,?,?,?)", b)

# Seed branch aliases (idempotent)
aliases = [
    ("COMPUTER SCIENCE",               1),
    ("CSE",                            1),
    ("INFORMATION TECHNOLOGY",         2),
    ("IT",                             2),
    ("ELECTRONICS AND COMMUNICATION",  3),
    ("ECE",                            3),
    ("ELECTRICAL AND ELECTRONICS",     4),
    ("EEE",                            4),
    ("MECHANICAL",                     5),
    ("MECH",                           5),
    ("CIVIL",                          6),
    ("AI AND ML",                      7),
    ("AIML",                           7),
    ("AI AND DS",                      8),
    ("AIDS",                           8),
]
for alias, bid in aliases:
    cur.execute("INSERT OR IGNORE INTO branch_aliases (alias, branch_id) VALUES (?,?)", (alias, bid))

# Seed demo students (idempotent via INSERT OR IGNORE on register_number UNIQUE)
students = [
    ("713519104001", "John Doe",           "JOHN DOE",           1, 1, 2023, "siet-cbe"),
    ("713519104002", "Jane Smith",         "JANE SMITH",         1, 2, 2023, "siet-cbe"),
    ("821621104055", "Ravi Kumar",         "RAVI KUMAR",         1, 3, 2022, "siet-cbe"),
    ("821621104056", "Priya Ramesh",       "PRIYA RAMESH",       1, 4, 2022, "siet-cbe"),
    ("713521104100", "Arjun Krishnamurthy","ARJUN KRISHNAMURTHY",1, 5, 2024, "siet-cbe"),
    ("713521104101", "Divya Lakshmi",      "DIVYA LAKSHMI",      1, 7, 2024, "siet-cbe"),
]
for s in students:
    cur.execute("""
        INSERT OR IGNORE INTO students
          (register_number, full_name, full_name_normalized,
           programme_id, branch_id, year_of_passing, institution_id)
        VALUES (?,?,?,?,?,?,?)
    """, s)

conn.commit()
conn.close()

print("=== Fixtures seeded successfully ===")
print(f"  Programmes : 3")
print(f"  Branches   : {len(branches)}")
print(f"  Aliases    : {len(aliases)}")
print(f"  Students   : {len(students)}")
