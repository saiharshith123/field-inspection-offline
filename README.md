# Offline-Capable Field Inspection App

A React + FastAPI + PostgreSQL application that keeps inspections usable offline and safely synchronizes queued changes when connectivity returns.

## Features
- Inspection list and editor
- IndexedDB persistence through Dexie
- Online/offline indicator
- Queue changes locally while offline
- Automatic sync on reconnect and manual sync
- Per-operation idempotency keys
- Optimistic concurrency using record versions
- Conflict reporting without silently overwriting server data
- Retry handling for transient network/server errors
- FastAPI tests using an isolated SQLite database

## Requirements
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## 1. Create PostgreSQL database

In psql or pgAdmin, run:

```sql
CREATE DATABASE field_inspection_db;
```

## 2. Start backend

Open a terminal in `backend`:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` and set your PostgreSQL username/password:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/field_inspection_db
CORS_ORIGINS=http://localhost:5173
```

Create tables and sample inspections:

```powershell
python seed.py
uvicorn app.main:app --reload
```

Backend: http://127.0.0.1:8000  
Swagger UI: http://127.0.0.1:8000/docs  
Health: http://127.0.0.1:8000/health

The application creates tables automatically at startup. `seed.py` inserts sample sites only when the database is empty.

## 3. Start frontend

Open another terminal in `frontend`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open http://localhost:5173

## 4. Test offline behavior

1. Open the app while the backend is running.
2. Wait for the inspection list to load. This caches the last successful server snapshot in IndexedDB.
3. In Chrome/Edge press F12, open Network, and select **Offline** (or stop the backend).
4. Create or edit an inspection. The change is saved locally and placed in the sync queue.
5. Restore network access.
6. The app automatically attempts synchronization. You can also press **Sync now**.
7. Refresh the browser while offline. Previously cached inspections remain available.

Browser DevTools' Offline mode simulates network loss for the page. The backend must be reachable again for synchronization to succeed.

## 5. Run backend tests

From `backend` with the virtual environment active:

```powershell
pytest -v
```

Tests use in-memory SQLite; the application itself is configured for PostgreSQL.

## Sync protocol

The frontend sends operations shaped like:

```json
{
  "operations": [
    {
      "operation_id": "a-unique-uuid",
      "type": "update",
      "inspection_id": 1,
      "base_version": 1,
      "payload": {
        "site_name": "North Warehouse",
        "inspector": "Asha",
        "status": "completed",
        "notes": "Fire exits checked"
      }
    }
  ]
}
```

- `operation_id` is unique and stored by the backend. Replaying the same ID returns the stored result rather than applying the change twice.
- `base_version` is the version the client edited. If the server has a newer version, the operation is returned as a conflict (HTTP response remains 200 for the batch, with `status: conflict` for that operation).
- Successful writes increment the record version.
- Failed network requests remain in IndexedDB and are retried with exponential backoff.
- Conflicts are retained locally for review. The app does not automatically overwrite the server's newer version.

## Important production notes
This is a runnable starter implementation. Before production deployment, add authentication/authorization, HTTPS, device/user identity, audit retention, schema migrations (Alembic), attachment upload/resume support, observability, and a deliberate conflict-resolution workflow. IndexedDB is device/browser-local and can be cleared by the user or browser storage eviction; consider persistent-storage requests and export/recovery for critical workflows.
