# 🌐 Offline-Capable Field Inspection App

<h3 align="center">📋 An Offline-First Field Inspection Management System</h3>

<p align="center">
  A full-stack web application that enables field staff to perform site inspections, record observations, and manage inspection records even in areas with unreliable internet connectivity.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Storage-IndexedDB-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/Testing-Pytest-green?style=flat-square&logo=pytest&logoColor=white" />
</p>

---

## 📌 1. Project Overview

Field inspection staff often work in remote locations, warehouses, construction sites, and industrial environments where internet connectivity is unreliable.

Traditional web applications depend on an active internet connection, making it difficult for field staff to record inspection details when offline.

The **Offline-Capable Field Inspection App** addresses this challenge through an offline-first architecture.

The application stores inspection records locally using IndexedDB, maintains a synchronization queue for offline changes, and automatically attempts to synchronize pending operations with the FastAPI backend when network connectivity is restored.

PostgreSQL provides permanent server-side storage, while idempotency and version-based conflict detection help maintain data consistency during synchronization.

### 🎯 Project Objectives

- Enable inspection activities without an active internet connection.
- Store inspection records locally in the browser.
- Display clear online and offline connection indicators.
- Maintain a queue of unsynchronized changes.
- Automatically synchronize pending changes after reconnection.
- Prevent duplicate operations during synchronization.
- Detect conflicting updates using version comparison.
- Provide meaningful synchronization status messages.

---

## ✨ 2. Key Features

| Feature | Description |
|---|---|
| 🌐 Online/Offline Detection | Detects network connectivity changes automatically. |
| 📋 Inspection Management | Create, view, and update inspection records. |
| 💾 Local Persistence | Stores inspection data using IndexedDB. |
| 📦 Synchronization Queue | Maintains offline operations until synchronization. |
| 🔄 Automatic Synchronization | Attempts synchronization when connectivity returns. |
| 🔁 Retry Mechanism | Retries failed requests using exponential backoff. |
| 🔐 Idempotency Handling | Prevents duplicate operations using unique operation IDs. |
| ⚠️ Conflict Detection | Detects outdated updates through version validation. |
| 📊 Status Dashboard | Displays saved inspections, pending changes, and conflicts. |
| 📱 Responsive UI | Provides an interface suitable for field operations. |

---

## 🛠️ 3. Technology Stack

### Frontend
- React.js
- Vite
- JavaScript (ES6+)
- CSS3
- Dexie.js
- IndexedDB

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- REST API

### Database
- PostgreSQL

### Testing
- Pytest
- HTTPX
- Vitest

### Development Tools
- Visual Studio Code
- Git and GitHub
- Swagger UI
- pgAdmin 4

---

## 🏗️ 4. System Architecture

The application follows an offline-first architecture where the frontend can continue storing inspection information locally when the backend is unavailable.

```text
                  FIELD INSPECTION APP
                           |
                    React Frontend
                           |
                    Network Detection
                           |
                  +--------+--------+
                  |                 |
                ONLINE            OFFLINE
                  |                 |
              FastAPI API       IndexedDB
                  |                 |
              PostgreSQL        Sync Queue
                  |                 |
                  |          Network Restored
                  |                 |
                  +--------+--------+
                           |
                     Sync Endpoint
                           |
                  Conflict Detection
                           |
                   Idempotency Check
                           |
                      PostgreSQL
```

### 🔄 Synchronization Workflow

1. The frontend retrieves inspection records from FastAPI.
2. Successfully retrieved records are stored in IndexedDB.
3. When offline, new or updated inspections are saved locally.
4. Each offline operation is added to the synchronization queue.
5. When connectivity returns, the frontend attempts to send pending operations to FastAPI.
6. The backend checks operation IDs to prevent duplicate processing.
7. Record versions are compared to identify conflicting updates.
8. Successful operations are saved in PostgreSQL.
9. The frontend updates its local records and removes successfully synchronized operations from the queue.

---

## 📂 5. Project Structure

```text
field-inspection-offline/
│
├── backend/
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── schemas.py
│   │
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_sync.py
│   │
│   ├── seed.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── db.js
│   │   ├── sync.js
│   │   ├── sync.test.js
│   │   └── style.css
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## ⚙️ 6. Installation and Setup

### 📋 Prerequisites

Make sure the following software is installed:

- Python 3.10 or above
- Node.js 18 or above
- PostgreSQL 14 or above
- pgAdmin 4
- Visual Studio Code
- Git

### 6.1 Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/field-inspection-offline.git
```

Navigate to the project directory:

```bash
cd field-inspection-offline
```

### 6.2 Create PostgreSQL Database

Open pgAdmin 4 and execute:

```sql
CREATE DATABASE field_inspection_db;
```

### 6.3 Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.venv\Scripts\activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

### 6.4 Configure Backend Environment Variables

Create a `.env` file inside the backend directory using `.env.example` as a reference.

Configure the PostgreSQL connection:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/field_inspection_db

CORS_ORIGINS=http://localhost:5173
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

### 6.5 Initialize Database and Sample Data

Execute:

```bash
python seed.py
```

This creates the required tables and inserts sample inspection records when the database is empty.

### 6.6 Start FastAPI Backend

```bash
uvicorn app.main:app --reload
```

Backend URL:

http://127.0.0.1:8000

Swagger documentation:

http://127.0.0.1:8000/docs

### 6.7 Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the frontend directory:

```env
VITE_API_URL=http://127.0.0.1:8000
```

### 6.8 Start React Application

```bash
npm run dev
```

Open the application:

http://localhost:5173

---

## 🔌 7. API Endpoints

The FastAPI backend provides the following REST API endpoints:

| HTTP Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API welcome message |
| GET | `/health` | Check backend health |
| GET | `/api/inspections` | Retrieve inspection records |
| POST | `/api/sync` | Synchronize offline operations |

### 📖 Swagger API Documentation

FastAPI provides interactive API documentation through Swagger UI.

Open:

http://127.0.0.1:8000/docs

You can execute and test the available API endpoints directly from the browser.

---

## 🖥️ 8. Application Outputs

This section displays the actual application interface and its important functionalities.

### 8.1 Main Dashboard – Online Mode

Displays the inspection dashboard with connection status, saved inspection count, pending synchronization count, and recent inspection records.

<img width="1119" height="930" alt="Screenshot 2026-11-21 105816" src="https://github.com/user-attachments/assets/c2ef1d5b-8c61-4fa3-bcb7-25bf0f9e7498" />

### 8.2 New Inspection – Create Record

Allows field staff to enter the site name, inspector details, inspection status, and observations.

<img width="949" height="924" alt="Screenshot 2026-11-21 104451" src="https://github.com/user-attachments/assets/85e4dc1d-916a-45cd-bfaf-75dfdb97fff4" />

### 8.3 Offline Mode – Connection Status

When network connectivity is unavailable, the application clearly displays offline status while allowing users to continue recording inspection information.

<img width="834" height="919" alt="image" src="https://github.com/user-attachments/assets/49eaf7d2-f56c-4239-90cb-7729f3ef4e8e" />

### 8.4 Local Storage – IndexedDB

Inspection records and pending synchronization operations are stored in the browser's IndexedDB database.

<img width="549" height="667" alt="image" src="https://github.com/user-attachments/assets/5abd5a6c-7955-4e76-b7bc-764083fe77c3" />

### 8.5 Synchronization Queue

Displays inspection changes waiting to be synchronized with the backend.

<img width="1119" height="930" alt="Screenshot 2026-11-21 105816" src="https://github.com/user-attachments/assets/9518ef3c-0bd0-416b-a03a-6ca36b0dc74b" />

### 8.6 Successful Synchronization

When connectivity returns, the application attempts to synchronize pending changes and updates the synchronization status.

<img width="848" height="925" alt="image" src="https://github.com/user-attachments/assets/f6de1635-a34e-42c5-8681-72f9f019fe6b" />

### 8.7 PostgreSQL Database Output

Displays the inspection records successfully stored in PostgreSQL after synchronization.

<img width="1548" height="833" alt="image" src="https://github.com/user-attachments/assets/845498bd-485e-4aad-ad66-7ef24dc11520" />

### 8.8 FastAPI Swagger UI

Displays the backend API documentation and available REST endpoints.

<img width="1177" height="1002" alt="image" src="https://github.com/user-attachments/assets/81b97c5e-b49e-444f-9db6-929d915d922f" />

<img width="1100" height="999" alt="Screenshot 2026-11-21 110508" src="https://github.com/user-attachments/assets/6b7ff9aa-04f7-4162-a6a7-2a8b914a1137" />

---

## 🧪 9. Testing Offline Functionality

The main objective of this project is to ensure that inspection activities continue even when internet connectivity is unavailable.

### Test 1: Online Functionality

1. Start the FastAPI backend.
2. Start the React frontend.
3. Open the application in your browser.
4. Verify that existing inspection records are displayed.
5. Create a new inspection.
6. Check whether the inspection is stored in PostgreSQL.

**Expected Output:** The inspection should be created and synchronized successfully.

### Test 2: Offline Functionality

1. Open the application in Chrome.
2. Press `F12` to open Developer Tools.
3. Navigate to the Network tab.
4. Select `Offline` from the throttling dropdown.
5. Verify that the application displays Offline status.
6. Create a new inspection.
7. Check whether the inspection appears in the local inspection list.

**Expected Output:** The inspection should be stored locally in IndexedDB and added to the synchronization queue.

### Test 3: Verify Local Storage

1. Open Chrome Developer Tools.
2. Navigate to the Application tab.
3. Expand IndexedDB.
4. Open `FieldInspectionDB`.
5. Select the `inspections` object store.
6. Select the `queue` object store.

**Expected Output:** Inspection information and pending operations should be available in local storage.

### Test 4: Automatic Synchronization

1. Keep the application open.
2. Change Network from `Offline` to `No throttling`.
3. Wait for the application to detect the restored connection.
4. Observe the synchronization status.
5. Verify that pending operations are synchronized.

**Expected Output:** Successfully synchronized operations should be removed from the local queue.

### Test 5: Verify PostgreSQL Records

Execute the following SQL query in pgAdmin:

```sql
SELECT
    id,
    site_name,
    inspector,
    status,
    notes,
    version
FROM inspections
ORDER BY id DESC;
```

**Expected Output:** The inspection records created while offline should now appear in PostgreSQL.

---

## 🔐 10. Synchronization Reliability

### 10.1 Idempotency Handling

Each synchronization operation contains a unique operation ID.

The backend stores processed operation IDs in the `sync_operations` table.

If the same operation is submitted again, the backend returns the previously stored result rather than applying the operation again.

This helps prevent duplicate inspection records.

### 10.2 Conflict Detection

The application uses version-based concurrency control.

Example:

- A client retrieves an inspection with version `1`.
- Another update changes the server version to `2`.
- The first client attempts to submit an update using version `1`.
- The backend detects the outdated version.
- The operation is marked as a conflict.

This prevents stale updates from silently overwriting newer server data.

### 10.3 Retry Mechanism

When synchronization fails:

- The operation remains in the local queue.
- The retry attempt count is increased.
- Exponential backoff is applied.
- Synchronization can be attempted again when connectivity returns or the user manually triggers it.

---

## 🧪 11. Running Tests

### Backend Testing

Navigate to the backend folder:

```bash
cd backend
```

Activate the virtual environment and execute:

```bash
pytest -v
```

Backend tests cover:

- Inspection creation.
- Duplicate operation prevention.
- Successful inspection updates.
- Version conflict detection.
- Missing inspection handling.

The backend tests use an isolated SQLite database.

### Frontend Testing

Navigate to the frontend folder:

```bash
cd frontend
```

Execute:

```bash
npm test
```

The frontend test covers the exponential retry backoff policy.

---

## 📊 12. Expected Results

| Test Scenario | Expected Result |
|---|---|
| Internet available | Online status |
| Internet unavailable | Offline status |
| Create inspection offline | Saved locally |
| Update inspection offline | Added to sync queue |
| Internet restored | Automatic sync attempt |
| Successful synchronization | Queue operation removed |
| Duplicate operation | No duplicate database record |
| Outdated record version | Conflict detected |
| Backend unavailable | Changes retained for retry |

---

## 🚀 13. Future Enhancements

- 🔐 User authentication and role-based access control.
- 📷 Offline image and document attachments.
- 📍 GPS-based inspection location tracking.
- 🗺️ Interactive site maps.
- 📊 Inspection analytics and reporting dashboard.
- 🔔 Notifications for synchronization failures.
- 👥 Multi-user inspection assignment.
- 🔄 Manual conflict merging and resolution.
- 📱 Progressive Web App (PWA) installation support.
- 📄 Export inspection reports to PDF and Excel.

---

## ⚠️ 14. Current Limitations

- Local inspection records are stored in browser IndexedDB and are device-specific.
- Clearing browser storage may remove unsynchronized records.
- User authentication is not currently implemented.
- Photo and document attachment synchronization is not implemented.
- Conflicts are detected, but full manual field-by-field merging is not implemented.
- Production deployment requires additional security, monitoring, database migrations, and recovery mechanisms.

---

## 🎓 15. Learning Outcomes

Through this project, the following concepts were implemented and practiced:

- React frontend development.
- FastAPI REST API development.
- PostgreSQL database integration.
- IndexedDB local persistence.
- Offline-first application architecture.
- Network connectivity detection.
- Synchronization queue management.
- API idempotency.
- Version-based concurrency control.
- Conflict detection.
- Retry mechanisms with exponential backoff.
- Backend testing using Pytest.
- Frontend testing using Vitest.
- Git and GitHub version control.

---

## 👨‍💻 16. Author

**Sai Harshith Bachina**

- GitHub: [saiharshith123](https://github.com/saiharshith123)
- LinkedIn: [Bachina Sai Harshith](https://www.linkedin.com/in/bachina-sai-harshith-b06a50208/)

---

## 📄 17. License

This project is available under the MIT License.

---
