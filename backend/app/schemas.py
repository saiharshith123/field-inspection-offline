from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

class InspectionData(BaseModel):
    site_name: str = Field(min_length=1, max_length=160)
    inspector: str = Field(min_length=1, max_length=120)
    status: Literal["pending", "in_progress", "completed", "needs_attention"] = "pending"
    notes: str = Field(default="", max_length=5000)

class InspectionOut(InspectionData):
    model_config = ConfigDict(from_attributes=True)
    id: int
    version: int
    updated_at: str | None = None

class SyncOperationIn(BaseModel):
    operation_id: str = Field(min_length=8, max_length=80)
    type: Literal["create", "update"]
    inspection_id: int | None = None
    base_version: int | None = None
    payload: InspectionData

class SyncRequest(BaseModel):
    operations: list[SyncOperationIn] = Field(max_length=100)

class SyncResult(BaseModel):
    operation_id: str
    status: Literal["synced", "conflict", "rejected"]
    inspection: dict | None = None
    server_version: int | None = None
    message: str
