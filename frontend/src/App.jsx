import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "./db";
import { refreshFromServer, syncQueue } from "./sync";

const emptyForm = { site_name: "", inspector: "", status: "pending", notes: "" };
const makeId = () => globalThis.crypto?.randomUUID?.() ||
  `op-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function App() {
  const [records, setRecords] = useState([]);
  const [queue, setQueue] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("Loading saved inspections…");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");

  const loadLocal = useCallback(async () => {
    setRecords(await db.inspections.orderBy("id").toArray());
    setQueue(await db.queue.orderBy("created_at").reverse().toArray());
  }, []);

  const refresh = useCallback(async () => {
    await loadLocal();
    if (!navigator.onLine) {
      setMessage("Offline mode: showing your last saved inspections.");
      return;
    }
    try {
      await refreshFromServer();
      await loadLocal();
      setMessage("Your inspection data is up to date.");
    } catch {
      setMessage("Could not reach the server. Showing locally saved data.");
    }
  }, [loadLocal]);

  const runSync = useCallback(async () => {
    if (!navigator.onLine) {
      setMessage("You are offline. Changes are safely queued on this device.");
      return;
    }
    setSyncing(true);
    setMessage("Synchronizing pending changes…");
    try {
      const result = await syncQueue();
      await refreshFromServer();
      await loadLocal();
      setMessage(result.conflicts
        ? `${result.synced} change(s) synced. ${result.conflicts} conflict(s) need review.`
        : `${result.synced} change(s) synchronized successfully.`);
    } catch {
      setMessage("Sync could not finish. Your pending changes remain saved for retry.");
    } finally {
      setSyncing(false);
    }
  }, [loadLocal]);

  useEffect(() => {
    const onlineHandler = () => {
      setOnline(true);
      setMessage("Connection restored. Checking for pending changes…");
      runSync();
    };
    const offlineHandler = () => {
      setOnline(false);
      setMessage("Offline mode: new changes will be saved on this device.");
    };
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    const subscription = db.inspections.toArray().then(loadLocal);
    refresh();
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
      void subscription;
    };
  }, [loadLocal, refresh, runSync]);

  const visible = useMemo(() => records.filter((r) =>
    filter === "all" ? true : r.status === filter
  ), [records, filter]);

  async function saveInspection(event) {
    event.preventDefault();
    if (!form.site_name.trim() || !form.inspector.trim()) {
      setMessage("Please enter both site name and inspector.");
      return;
    }

    const now = new Date().toISOString();
    if (editing) {
      const local = {
        ...editing,
        ...form,
        updated_at: now,
        local_pending: true
      };
      const operation = {
        operation_id: makeId(),
        type: "update",
        inspection_id: editing.id,
        base_version: editing.version,
        payload: { ...form },
        created_at: Date.now(),
        state: "pending",
        attempts: 0
      };
      await db.transaction("rw", db.inspections, db.queue, async () => {
        await db.inspections.put(local);
        await db.queue.add(operation);
      });
    } else {
      const localId = `local-${makeId()}`;
      const local = { id: localId, ...form, version: 0, updated_at: now, local_pending: true };
      const operation = {
        operation_id: makeId(),
        type: "create",
        inspection_id: localId,
        payload: { ...form },
        created_at: Date.now(),
        state: "pending",
        attempts: 0
      };
      await db.transaction("rw", db.inspections, db.queue, async () => {
        await db.inspections.put(local);
        await db.queue.add(operation);
      });
    }

    setForm(emptyForm);
    setEditing(null);
    await loadLocal();
    setMessage(navigator.onLine
      ? "Saved on this device. Synchronization will start now."
      : "Saved offline. This inspection is queued for synchronization.");
    if (navigator.onLine) runSync();
  }

  function startEdit(record) {
    setEditing(record);
    setForm({
      site_name: record.site_name,
      inspector: record.inspector,
      status: record.status,
      notes: record.notes || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function discardConflict(item) {
    // Keep the authoritative server copy and discard the conflicted local operation.
    await db.transaction("rw", db.inspections, db.queue, async () => {
      if (item.server_record) await db.inspections.put(item.server_record);
      await db.queue.delete(item.operation_id);
    });
    await loadLocal();
    setMessage("Conflict resolved by keeping the server version.");
  }

  const pendingCount = queue.filter(q => q.state === "pending").length;
  const conflictCount = queue.filter(q => q.state === "conflict").length;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">FIELD OPERATIONS</div>
          <h1>Site Inspections</h1>
          <p className="subtitle">Capture findings anywhere, even without a connection.</p>
        </div>
        <div className={`connection ${online ? "is-online" : "is-offline"}`}>
          <span className="dot" /> {online ? "Online" : "Offline"}
        </div>
      </header>

      <section className="status-panel">
        <div className="status-copy">
          <strong>{syncing ? "Syncing your changes" : online ? "Connection available" : "Working offline"}</strong>
          <span>{message}</span>
        </div>
        <button className="secondary" onClick={runSync} disabled={!online || syncing}>
          {syncing ? "Syncing…" : "↻ Sync now"}
        </button>
      </section>

      <section className="metrics">
        <div className="metric"><span>Saved inspections</span><strong>{records.length}</strong></div>
        <div className="metric"><span>Waiting to sync</span><strong>{pendingCount}</strong></div>
        <div className="metric"><span>Conflicts to review</span><strong>{conflictCount}</strong></div>
      </section>

      <section className="content-grid">
        <section className="panel form-panel">
          <div className="panel-heading">
            <div><div className="eyebrow">FIELD ENTRY</div><h2>{editing ? "Update inspection" : "New inspection"}</h2></div>
            {editing && <button className="text-button" onClick={() => {setEditing(null);setForm(emptyForm);}}>Cancel</button>}
          </div>
          <form onSubmit={saveInspection}>
            <label>Site name<input value={form.site_name} onChange={e => setForm({...form,site_name:e.target.value})} placeholder="e.g. North Warehouse" required /></label>
            <label>Inspector name<input value={form.inspector} onChange={e => setForm({...form,inspector:e.target.value})} placeholder="Your name" required /></label>
            <label>Inspection status
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})}>
                <option value="pending">Pending</option><option value="in_progress">In progress</option>
                <option value="completed">Completed</option><option value="needs_attention">Needs attention</option>
              </select>
            </label>
            <label>Observations / notes<textarea rows="4" value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Record observations, issues and actions…" /></label>
            <button className="primary" type="submit">{editing ? "Save changes" : "Save inspection"} <span>→</span></button>
            <p className="form-hint">Saved locally first. {online ? "Will sync when possible." : "Will sync when you reconnect."}</p>
          </form>
        </section>

        <section className="panel list-panel">
          <div className="panel-heading list-heading">
            <div><div className="eyebrow">LOCAL RECORDS</div><h2>Recent inspections</h2></div>
            <select className="filter" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All statuses</option><option value="pending">Pending</option>
              <option value="in_progress">In progress</option><option value="completed">Completed</option>
              <option value="needs_attention">Needs attention</option>
            </select>
          </div>
          <div className="records">
            {visible.length === 0 && <div className="empty">No inspections saved yet. Create your first inspection.</div>}
            {visible.map(record => (
              <article className="record" key={record.id}>
                <div className="record-top">
                  <div><h3>{record.site_name}</h3><span className="inspector">Inspector: {record.inspector}</span></div>
                  <span className={`tag ${record.status}`}>{record.status.replaceAll("_"," ")}</span>
                </div>
                <p className="notes">{record.notes || "No notes added."}</p>
                <div className="record-bottom">
                  <span>{record.local_pending ? "● Saved on device" : `Version ${record.version}`}</span>
                  <button className="text-button" onClick={() => startEdit(record)}>Edit</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      {queue.length > 0 && <section className="panel queue-panel">
        <div className="panel-heading"><div><div className="eyebrow">SYNC QUEUE</div><h2>Pending changes</h2></div></div>
        {queue.map(item => <div className="queue-row" key={item.operation_id}>
          <div><strong>{item.payload.site_name}</strong><span>{item.message || item.last_error || (item.type === "create" ? "New inspection" : "Updated inspection")}</span></div>
          <div className="queue-actions">
            <span className={`queue-state ${item.state}`}>{item.state}</span>
            {item.state === "conflict" && <button className="text-button" onClick={() => discardConflict(item)}>Keep server version</button>}
          </div>
        </div>)}
        {conflictCount > 0 && <p className="conflict-note">A conflict means the server record changed after this device began editing. Review the server version before discarding the local change.</p>}
      </section>}
      <footer>Field Inspection · Offline-first workspace <span>Data is stored in this browser on this device.</span></footer>
    </main>
  );
}
