def payload(name="Test Site"):
    return {
        "site_name": name,
        "inspector": "Tester",
        "status": "pending",
        "notes": "Initial notes"
    }

def test_create_and_idempotent_replay(client):
    op = {
        "operation_id": "create-operation-001",
        "type": "create",
        "payload": payload()
    }
    first = client.post("/api/sync", json={"operations": [op]})
    assert first.status_code == 200
    created = first.json()["results"][0]
    assert created["status"] == "synced"
    inspection_id = created["inspection"]["id"]

    second = client.post("/api/sync", json={"operations": [op]})
    replayed = second.json()["results"][0]
    assert replayed["inspection"]["id"] == inspection_id

    all_rows = client.get("/api/inspections").json()
    assert len(all_rows) == 1

def test_update_and_version_conflict(client):
    create = {
        "operation_id": "create-operation-002",
        "type": "create",
        "payload": payload()
    }
    created = client.post("/api/sync", json={"operations": [create]}).json()["results"][0]
    inspection_id = created["inspection"]["id"]

    update = {
        "operation_id": "update-operation-001",
        "type": "update",
        "inspection_id": inspection_id,
        "base_version": 1,
        "payload": {**payload(), "status": "completed"}
    }
    response = client.post("/api/sync", json={"operations": [update]})
    assert response.json()["results"][0]["status"] == "synced"
    assert response.json()["results"][0]["server_version"] == 2

    stale_update = {
        **update,
        "operation_id": "update-operation-002",
        "base_version": 1,
        "payload": {**payload("Stale local name"), "status": "needs_attention"}
    }
    conflict = client.post("/api/sync", json={"operations": [stale_update]})
    assert conflict.json()["results"][0]["status"] == "conflict"
    assert conflict.json()["results"][0]["server_version"] == 2

def test_missing_record_is_rejected(client):
    op = {
        "operation_id": "update-operation-003",
        "type": "update",
        "inspection_id": 999,
        "base_version": 1,
        "payload": payload()
    }
    result = client.post("/api/sync", json={"operations": [op]}).json()["results"][0]
    assert result["status"] == "rejected"
