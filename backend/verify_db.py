import sqlite3

conn = sqlite3.connect('dev_local.db')
cur = conn.cursor()

print("=== Tables ===")
for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall():
    print(" ", r[0])

print("\n=== students ===")
for r in cur.execute("SELECT register_number, full_name, year_of_passing FROM students").fetchall():
    print(f"  {r[0]} | {r[1]} | {r[2]}")

print("\n=== admin_accounts ===")
for r in cur.execute("SELECT email, is_active FROM admin_accounts").fetchall():
    print(f"  {r[0]} | active={r[1]}")

print("\n=== institutions ===")
for r in cur.execute("SELECT id, name, code FROM institutions").fetchall():
    print(f"  {r[0]} | {r[1]} | {r[2]}")

conn.close()
print("\nDatabase verification complete.")
