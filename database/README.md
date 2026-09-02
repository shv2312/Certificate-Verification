# Database — README

## Overview

This folder contains all PostgreSQL database artifacts for the SIET Academic Background Verification Portal.

**Owner**: Parthiban V (Database, Verification Engine & Deployment Lead)

---

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Full PostgreSQL DDL — creates all tables, constraints, indexes |
| `normalization_maps.sql` | Canonical programme/branch seed data and alias mappings |
| `test_data.sql` | Fictional test records only — NEVER for production |

---

## Setup Instructions

### 1. Install PostgreSQL
Install PostgreSQL 15+ on your machine.

### 2. Create the database and user

```sql
-- Run as a PostgreSQL superuser (e.g. postgres)
CREATE DATABASE siet_verification;
CREATE USER siet_app_user WITH PASSWORD 'your_local_dev_password';
GRANT CONNECT ON DATABASE siet_verification TO siet_app_user;
```

### 3. Run schema

```bash
psql -U postgres -d siet_verification -f schema.sql
```

### 4. Run normalization maps (seed data)

```bash
psql -U postgres -d siet_verification -f normalization_maps.sql
```

### 5. (Optional) Run test data — development only

```bash
psql -U postgres -d siet_verification -f test_data.sql
```

> ⚠️ **Never run `test_data.sql` in production.**

### 6. Grant privileges to app user

```sql
-- Run as superuser after schema is created
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO siet_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO siet_app_user;
```

---

## Security Notes

- **Database credentials** must be stored in `.env` only. Never commit to git.
- **Real student data** must never be committed to git. Contact the college registrar for official data import procedures.
- **App user** (`siet_app_user`) should have minimal privileges (SELECT/INSERT/UPDATE only). No DROP or DDL permissions in production.
- **Audit logs** table is append-only by application design. The app user should not have DELETE on `audit_logs`.

---

## Database Tables

| Table | Owner Layer | Purpose |
|---|---|---|
| `programmes` | Parthiban | Canonical programme list |
| `branches` | Parthiban | Canonical branch list |
| `branch_aliases` | Parthiban | HR shorthand → canonical branch mapping |
| `students` | Parthiban | Official institutional student records |
| `verification_requests` | Shri Hari (creates) / Parthiban (schema) | One per payment |
| `verification_results` | Parthiban engine / Shri Hari backend | Outcome of each verification |
| `audit_logs` | Shri Hari (writes) / Parthiban (schema) | System-wide event ledger |

---

## Pending — Official Data

> ⚠️ The full official list of SIET programmes and branches must be confirmed with the college registrar.
> Current `normalization_maps.sql` entries are structural placeholders based on common engineering college offerings.
> They **must** be replaced with verified institutional data before production deployment.

---

## Migration Strategy (Future)

Currently using plain SQL files. When Shri Hari's backend ORM choice is confirmed (e.g. SQLAlchemy Alembic), migrations should be tracked through the chosen migration tool. Any schema changes after Sprint 1 should follow the agreed migration process — do not manually ALTER tables without tracking.
