# Real PostgreSQL Validation Setup

**Target Environment:** Any machine with PostgreSQL 15+ and `psql` installed.
**Purpose:** To validate the Sprint 4 schema fixes natively against a real PostgreSQL database, ensuring all constraints, types, and mappings work seamlessly with the FastAPI ORM before production deployment.

## Prerequisites
1. PostgreSQL 15 or newer installed and running.
2. `psql` available in the system PATH.
3. The repository is cloned and you are on the `database/sprint-4-schema-validation` branch.

## Step 1: Initialize the Database
1. Open a terminal or command prompt.
2. Log in as a database superuser (e.g., `postgres`) to create the new database.
   ```bash
   psql -U postgres -c "CREATE DATABASE siet_verification;"
   ```

## Step 2: Apply the Schema
Apply the Sprint 4 resolved schema file to the new database. This schema has been aligned with the backend `models.py` to prevent mismatches on `verification_requests`, `payment_sessions`, and `admin_accounts`.

```bash
psql -U postgres -d siet_verification -f database/schema.sql
```
*Expected Output:* You should see a series of `CREATE TABLE`, `CREATE INDEX`, and `COMMENT` success messages with no errors.

## Step 3: Apply the Normalization Maps
Apply the seed data for academic programmes and branches.

```bash
psql -U postgres -d siet_verification -f database/normalization_maps.sql
```
*Expected Output:* A series of `INSERT 0 1` confirmations.

## Step 4: Insert Fictional Test Data
Load the fictional student dataset and test requests. This test data has been safely updated to use the new `admin_accounts` instead of `users`, and the new ID formats for `verification_requests` and `audit_logs`.

```bash
psql -U postgres -d siet_verification -f database/test_data.sql
```
*Expected Output:* Multiple `INSERT 0 1` confirmations.

## Step 5: Update the Backend `.env`
Create or modify `backend/.env` to point to this real PostgreSQL instance instead of the in-memory SQLite fallback used during development.

```env
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/siet_verification
```

## Step 6: Run Backend Integration Tests
Activate your virtual environment and run the test suite to confirm the backend models correctly map to the new real PostgreSQL schema without constraint violations.

```bash
cd backend
python -m venv .venv
# Activate venv based on OS:
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
pytest tests/
```

## Step 7: (Optional) Run Engine Tests
Verify that Parthiban's deterministic lookup logic works with the real database:

```bash
pytest ../verification_engine/tests/
```

## Completion
If all tests pass, the real database validation is complete and the branch can be merged into `develop`.
