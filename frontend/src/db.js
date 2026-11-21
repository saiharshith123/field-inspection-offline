import Dexie from "dexie";

export const db = new Dexie("FieldInspectionDB");
db.version(1).stores({
  inspections: "id, site_name, status, updated_at",
  queue: "operation_id, inspection_id, created_at, state, next_attempt_at"
});
