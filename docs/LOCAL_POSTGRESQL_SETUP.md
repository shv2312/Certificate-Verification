# Local PostgreSQL Setup

This document outlines the setup steps required to run the SIET Academic Background Verification Portal using a real PostgreSQL instance on a local development machine. 

## Requirements
- PostgreSQL 15 or newer

## Installation
If you have Administrator access on Windows, you can use Chocolatey in an **elevated PowerShell**:
```powershell
choco install postgresql15 -y
```
Alternatively, download the [official installer](https://www.postgresql.org/download/windows/).

## Environment Variables
Create a `.env` file in the `backend/` directory if you haven't already. Do NOT commit the `.env` file with real passwords.

Use the following placeholders to connect the FastAPI backend and SQLAlchemy to the local PostgreSQL database:

```env
# backend/.env

# Replace YOUR_SUPERUSER_PASSWORD with the password you set during PostgreSQL installation
# Ensure no special characters break the URL encoding
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_SUPERUSER_PASSWORD@localhost:5432/siet_verification

# For running Pytest against the test database:
TEST_DATABASE_URL=postgresql+asyncpg://postgres:YOUR_SUPERUSER_PASSWORD@localhost:5432/siet_test
```

## Database Initialization
Once PostgreSQL is installed and the service is running, run the following commands via `psql` to set up the databases:

```bash
# Create Development and Test Databases
psql -U postgres -c "CREATE DATABASE siet_verification;"
psql -U postgres -c "CREATE DATABASE siet_test;"

# Apply Schemas (Run from the project root)
psql -U postgres -d siet_verification -f database/schema.sql
psql -U postgres -d siet_test -f database/schema.sql

# Insert Seed Data
psql -U postgres -d siet_verification -f database/normalization_maps.sql
psql -U postgres -d siet_verification -f database/test_data.sql

# Insert Synthetic Fixtures for Sprint 5 Tests
psql -U postgres -d siet_test -f database/synthetic_fixtures.sql
```
