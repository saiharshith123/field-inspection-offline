from datetime import timezone
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from .database import Base, engine, get_db
from .config import CORS_ORIGINS
from .models import Inspection, SyncOperation
from .schemas import InspectionOut, SyncRequest

app = FastAPI(title="Offline Field Inspection API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

def serialize(record: Inspection):
    updated = record.updated_at
    if updated and updated.tzinfo is None:
        updated = updated.replace(tzinfo=timezone.utc)
    return {
        "id": record.id,
        "site_name": record.site_name,
        "inspector": record.inspector,
        "status": record.status,
        "notes": record.notes,
        "version": record.version,
        "updated_at": updated.isoformat() if updated else None,
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/inspections", response_model=list[InspectionOut])
def list_inspections(db: Session = Depends(get_db)):
    records = db.scalars(select(Inspection).order_by(Inspection.id)).all()
    return [serialize(item) for item in records]

@app.post("/api/sync")
def sync(request: SyncRequest, db: Session = Depends(get_db)):
    results = []
    for operation in request.operations:
        # Idempotency: replay returns the original result, never applies twice.
        previous = db.scalar(
            select(SyncOperation).where(
                SyncOperation.operation_id == operation.operation_id
            )
        )
        if previous:
            results.append(previous.result)
            continue

        payload = operation.payload.model_dump()
        if operation.type == "create":
            record = Inspection(**payload, version=1)
            db.add(record)
            db.flush()
            result = {
                "operation_id": operation.operation_id,
                "status": "synced",
                "inspection": serialize(record),
                "server_version": record.version,
                "message": "Inspection created.",
            }
        else:
            record = db.get(Inspection, operation.inspection_id)
            if not record:
                result = {
                    "operation_id": operation.operation_id,
                    "status": "rejected",
                    "inspection": None,
                    "server_version": None,
                    "message": "Inspection no longer exists on the server.",
                }
            elif operation.base_version != record.version:
                result = {
                    "operation_id": operation.operation_id,
                    "status": "conflict",
                    "inspection": serialize(record),
                    "server_version": record.version,
                    "message": "A newer server version exists. Review before resolving.",
                }
            else:
                for key, value in payload.items():
                    setattr(record, key, value)
                record.version += 1
                db.flush()
                result = {
                    "operation_id": operation.operation_id,
                    "status": "synced",
                    "inspection": serialize(record),
                    "server_version": record.version,
                    "message": "Inspection updated.",
                }

        db.add(SyncOperation(operation_id=operation.operation_id, result=result))
        db.commit()
        results.append(result)

    return {"results": results}

@app.get("/")
def root():
    return {"message": "Field Inspection API is running", "docs": "/docs"}
