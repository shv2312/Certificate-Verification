# SIET Academic Background Verification Portal

**Sri Shakthi Institute of Engineering and Technology (SIET)**

An official institutional service for HR departments and companies to
verify the academic background of candidates against SIET's authoritative
student records.

---

## Project Team

| Member | Role | Primary Technologies |
|--------|------|----------------------|
| Sanjay V | Frontend & UI/UX Lead | React.js, TypeScript, Vite, Tailwind CSS |
| Shri Hari Vishnu S | Backend & Project Integration Lead | Python, FastAPI |
| Parthiban V | Database, Verification Engine & Deployment Lead | PostgreSQL, Python |

---

## High-Level Architecture

```
College Website
      ↓
Background Verification Portal (React – Sanjay)
      ↓
FastAPI Backend (Python – Shri Hari)
      ↓
Verification Engine + PostgreSQL (Parthiban)
```

## Approved Workflow

1. HR/Company enters company name + official email
2. Email OTP verification
3. Payment gateway
4. Unlock candidate details form (one payment = one candidate)
5. HR enters candidate details → confirmation screen
6. Backend verifies against institutional database
7. VERIFIED → official report sent to verified HR email
8. NOT VERIFIED → neutral failure response (no manual review in V1)

---

## Repository Structure

```
.
├── backend/            ← FastAPI backend (Shri Hari)
├── frontend/           ← React frontend (Sanjay) – to be added
├── database/           ← DB schemas & engine (Parthiban) – to be added
├── docs/               ← Work logs and contracts
└── README.md
```

---

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env     # fill in your local values
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
API docs at:     http://localhost:8000/docs

---

## Development Methodology

Agile Software Development – Sprint-based delivery.

See `docs/` for individual work logs and integration log.

---

## Security Notes

- Never commit `.env` files containing real credentials
- See `.env.example` for required configuration keys
- Payment gateway credentials must be set via environment variables only
- Student data must never be committed to this repository
