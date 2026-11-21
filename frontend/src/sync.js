import { db } from "./db";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function syncQueue() {
  if (!navigator.onLine) return { synced: 0, pending: await db.queue.count(), offline: true };

  let synced = 0;
  const pending = await db.queue.where("state").equals("pending").sortBy("created_at");

  for (const item of pending) {
    if (!navigator.onLine) break;
    if (item.next_attempt_at && item.next_attempt_at > Date.now()) continue;

    try {
      const response = await fetch(`${API}/api/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        
        body: JSON.stringify({
          operations: [{
            operation_id: item.operation_id,
            type: item.type,

            inspection_id: item.type === "update"
              ? item.inspection_id
              : null,

            base_version: item.base_version ?? null,
            payload: item.payload
          }]
        })
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const body = await response.json();
      const result = body.results[0];

      if (result.status === "synced") {
        await db.transaction("rw", db.inspections, db.queue, async () => {
          // Replace the temporary local key used for an offline create with the
          // server-assigned numeric ID, avoiding duplicate cards in the list.
          if (item.type === "create" && item.inspection_id != null) {
            await db.inspections.delete(item.inspection_id);
          }
          await db.inspections.put(result.inspection);
          await db.queue.delete(item.operation_id);
        });
        synced += 1;
      } else if (result.status === "conflict") {
        await db.queue.update(item.operation_id, {
          state: "conflict",
          message: result.message,
          server_record: result.inspection
        });
      } else {
        await db.queue.update(item.operation_id, {
          state: "failed",
          message: result.message
        });
      }
    } catch (error) {
      const attempts = (item.attempts || 0) + 1;
      const delay = Math.min(30000, 1000 * (2 ** Math.min(attempts, 5)));
      await db.queue.update(item.operation_id, {
        attempts,
        next_attempt_at: Date.now() + delay,
        last_error: error.message
      });
      // Do not spin on an unavailable API; next online event/manual sync retries.
      if (!navigator.onLine) break;
      await sleep(150);
    }
  }

  return {
    synced,
    pending: await db.queue.where("state").equals("pending").count(),
    conflicts: await db.queue.where("state").equals("conflict").count()
  };
}

export async function refreshFromServer() {
  if (!navigator.onLine) return;
  const response = await fetch(`${API}/api/inspections`);
  if (!response.ok) throw new Error(`Could not refresh inspections (${response.status})`);
  const records = await response.json();
  await db.transaction("rw", db.inspections, async () => {
    for (const record of records) {
      const queued = await db.queue.where("inspection_id").equals(record.id).count();
      // Never replace a local record while it has unsynchronized edits.
      if (!queued) await db.inspections.put(record);
    }
  });
}
