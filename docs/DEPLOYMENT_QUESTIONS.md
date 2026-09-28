# Deployment Questions — Unresolved Requirements
## SIET Academic Background Verification Portal — Sprint 1

**Owner**: Parthiban V (Deployment Lead)  
**Date**: 2026-09-02  
**Status**: OPEN — awaiting college IT information

---

## Overview

Parthiban owns eventual deployment and DevOps support. Sprint 1 does NOT attempt production deployment. These questions must be answered before a deployment plan can be finalized.

---

## College Server — Unknown

| Question | Status | Notes |
|---|---|---|
| Operating system? | ❓ Unknown | Ubuntu/Debian/CentOS/Windows Server? |
| Available RAM? | ❓ Unknown | Affects PostgreSQL tuning |
| Available storage? | ❓ Unknown | For DB + backups + logs |
| CPU count/speed? | ❓ Unknown | For connection pool sizing |
| Is Docker available? | ❓ Unknown | Preferred for clean deployment |
| Is Docker Compose available? | ❓ Unknown | For multi-container orchestration |
| Are port forwarding/firewall rules manageable? | ❓ Unknown | For DB isolation |

---

## Domain & Network

| Question | Status | Notes |
|---|---|---|
| What domain/subdomain will the portal use? | ❓ Unknown | e.g. `verify.siet.ac.in` |
| Is the domain managed by the college IT team? | ❓ Unknown | |
| Will a reverse proxy (Nginx/Traefik) be used? | ❓ Unknown | Required for HTTPS |
| SSL certificate provider? | ❓ Unknown | Let's Encrypt vs institution-issued |
| Are there network restrictions (intranet-only)? | ❓ Unknown | Would affect public access for HR users |

---

## Database Hosting

| Question | Status | Notes |
|---|---|---|
| Will PostgreSQL run on the same server as the app? | ❓ Unknown | |
| Is a managed PostgreSQL service available? | ❓ Unknown | e.g. AWS RDS, etc. |
| Database backup policy? | ❓ Unknown | Daily/weekly? Where stored? |
| Who has superuser access to the production DB? | ❓ Unknown | For initial schema setup |
| Is there a separate staging environment? | ❓ Unknown | Recommended before live launch |

---

## Student Data Import

| Question | Status | Notes |
|---|---|---|
| Will the college provide an official student dataset? | ❓ Unknown | Required before production launch |
| In what format? (CSV, Excel, DB export) | ❓ Unknown | Affects import tooling |
| Who is the authorizing contact for the dataset? | ❓ Unknown | Must be an official registrar |
| Will the dataset need GDPR/privacy handling? | ❓ Unknown | |
| Who approves which fields are included? | ❓ Unknown | HOD approval required |

---

## Deployment Architecture (Planned — Pending Server Info)

Once the above questions are answered, the proposed deployment will be:

```
Internet (HR Users)
       ↓
   Nginx (HTTPS reverse proxy)
       ↓
   FastAPI application (Uvicorn/Gunicorn)
       ↓
   Verification Engine (embedded in FastAPI process)
       ↓
   PostgreSQL (private network / localhost only)
```

Docker Compose is the preferred deployment method for clean, reproducible setup.

---

## Action Items

| Item | Responsible | Status |
|---|---|---|
| Gather college server specifications | Parthiban (or project lead) | 🔴 Open |
| Get domain/subdomain assignment | HOD / IT team | 🔴 Open |
| Obtain official student dataset authorization | HOD / Registrar | 🔴 Open |
| Confirm PostgreSQL hosting approach | Parthiban | 🔴 Open |
| Confirm staging environment plan | Team | 🔴 Open |
