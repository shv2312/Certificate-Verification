import sqlite3

def create_db():
    conn = sqlite3.connect('dev_local.db')
    cursor = conn.cursor()

    # Create programmes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS programmes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(20) NOT NULL UNIQUE,
        full_name VARCHAR(200) NOT NULL UNIQUE,
        degree_type VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Create branches table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        programme_id INTEGER NOT NULL REFERENCES programmes(id),
        code VARCHAR(20) NOT NULL,
        full_name VARCHAR(200) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (programme_id, code)
    );
    """)

    # Create branch_aliases table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS branch_aliases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alias VARCHAR(100) NOT NULL UNIQUE,
        branch_id INTEGER NOT NULL REFERENCES branches(id)
    );
    """)

    # Create students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        register_number VARCHAR(30) NOT NULL UNIQUE,
        full_name VARCHAR(200) NOT NULL,
        full_name_normalized VARCHAR(200) NOT NULL,
        programme_id INTEGER NOT NULL REFERENCES programmes(id),
        branch_id INTEGER NOT NULL REFERENCES branches(id),
        year_of_passing SMALLINT NOT NULL,
        university_name VARCHAR(200) NOT NULL DEFAULT 'Anna University',
        institute_name VARCHAR(200) NOT NULL DEFAULT 'Sri Shakthi Institute of Engineering and Technology',
        period_of_study_start SMALLINT NULL,
        period_of_study_end SMALLINT NULL,
        mode_of_education VARCHAR(50) NULL,
        has_arrear BOOLEAN NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        imported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Insert basic mock student fixtures
    try:
        cursor.execute("INSERT INTO programmes (id, code, full_name, degree_type) VALUES (1, 'B.E.', 'Bachelor of Engineering', 'B.E.')")
        cursor.execute("INSERT INTO branches (id, programme_id, code, full_name) VALUES (1, 1, 'CSE', 'Computer Science and Engineering')")
        cursor.execute("INSERT INTO branch_aliases (id, alias, branch_id) VALUES (1, 'COMPUTER SCIENCE', 1)")
        cursor.execute("INSERT INTO branch_aliases (id, alias, branch_id) VALUES (2, 'CSE', 1)")
        cursor.execute("INSERT INTO branches (id, programme_id, code, full_name) VALUES (2, 1, 'IT', 'Information Technology')")
        cursor.execute("INSERT INTO branch_aliases (id, alias, branch_id) VALUES (3, 'INFORMATION TECHNOLOGY', 2)")
        cursor.execute("INSERT INTO branch_aliases (id, alias, branch_id) VALUES (4, 'IT', 2)")
        
        cursor.execute("""
        INSERT INTO students (register_number, full_name, full_name_normalized, programme_id, branch_id, year_of_passing) 
        VALUES ('713519104001', 'John Doe', 'JOHN DOE', 1, 1, 2023)
        """)
        cursor.execute("""
        INSERT INTO students (register_number, full_name, full_name_normalized, programme_id, branch_id, year_of_passing) 
        VALUES ('713519104002', 'Jane Doe', 'JANE DOE', 1, 2, 2024)
        """)
        conn.commit()
    except sqlite3.IntegrityError:
        pass # Fixtures already exist
    
    print("Database dev_local.db initialized with students table and fixtures.")
    conn.close()

if __name__ == "__main__":
    create_db()
