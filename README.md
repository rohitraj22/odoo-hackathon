# AssetFlow — Enterprise Asset & Resource Management

AssetFlow is a full-stack, role-based asset management platform built for organizations that need to track, allocate, and maintain physical assets and shared resources. It replaces spreadsheet-based tracking with a structured, conflict-safe system covering the full asset lifecycle — from registration through retirement.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla JS (ES Modules), CSS3 |
| Backend | Python · FastAPI · SQLAlchemy |
| Database | SQLite (via `assetflow.db`) |
| Auth | JWT (pbkdf2_sha256 password hashing, Bearer tokens) |
| Icons | Lucide Icons CDN |
| Charts | Chart.js |

---

## 🚀 How to Run

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. The database is auto-seeded with departments, employees, and sample assets on first run.

### 2. Serve the Frontend

Open a second terminal in the project root and run:

```bash
# Python
python -m http.server 8080

# or Node
npx serve -l 8080
```

Then open **`http://localhost:8080`** in your browser.

> The frontend uses ES Modules and requires a local server — opening `index.html` directly will not work.

---

## 🔑 Demo Accounts

All demo accounts use the password **`password`**.

| Role | Email |
|---|---|
| Admin | admin@assetflow.com |
| Asset Manager | manager@assetflow.com |
| Department Head | head@assetflow.com |
| Employee | employee@assetflow.com |

New accounts created via the Signup screen are always assigned the **Employee** role. An Admin can promote users to higher roles from the Organization Setup screen.

---

## ✨ Features

### Authentication
- Email + password login with JWT session tokens
- Signup creates an **Employee** account only — no self-elevation
- Admins assign Department Head and Asset Manager roles from the Employee Directory
- Forgot password flow: email lookup → OTP verification → password reset
- Real-time password strength meter (length, number, uppercase checks)

### Dashboard
- Live KPI cards: Available assets, Allocations, Maintenance, Bookings, Transfers, Upcoming Returns
- Overdue return alerts with highlighted table
- Quick actions: Register Asset, Book Resource, Raise Maintenance (role-gated)
- Recent activity feed pulled from audit logs

### Organization Setup *(Admin only)*
- Department hierarchy management (parent/child relationships)
- Asset category builder with custom field definitions (e.g. Warranty for IT, Material for Furniture)
- Employee directory with role and status management

### Asset Directory
- Auto-generated asset tags (`AF-XXXX`)
- Full lifecycle tracking: Available → Allocated → Under Maintenance → Retired
- Search and filter by name, tag, category, and status
- Per-asset history drawer showing all allocation and maintenance events

### Allocations & Transfers
- Double-allocation prevention — blocked at both API and UI level
- Transfer requests when an asset is already held by another employee
- Manager approval workflow for transfers
- Return flow with condition-on-return and notes

### Resource Bookings
- Calendar-based timeline scheduler per bookable resource
- Strict overlap detection prevents double bookings
- Booking status tracking: Upcoming, Ongoing, Cancelled

### Maintenance
- Kanban board across five stages: Pending → Approved → Technician Assigned → In Progress → Resolved
- Priority levels: Low, Medium, High, Critical
- Auto-sets asset status to *Under Maintenance* on approval, reverts to *Available* on resolution

### Audit & Verification
- Audit cycle creation scoped to department or all assets
- Per-asset checklist: Verified / Missing / Damaged
- Progress bar and discrepancy banner
- Closed audits archived with full result summary

### Reports & Analytics
- Department asset utilization bar charts
- Maintenance frequency ranking by asset
- Idle asset identification
- Near-retirement asset flagging (3+ years since acquisition)

### Notifications
- In-app notification feed with category tabs (All, Alerts, Approvals, Bookings)
- Bell icon badge with unread count
- Notification dropdown in the header with per-type color coding

---

## 📁 Project Structure

```
odoo-hackathon/
├── backend/
│   ├── main.py          # FastAPI entry point
│   ├── api.py           # All route definitions
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── auth.py          # Password hashing & JWT creation
│   ├── config.py        # Environment settings (.env)
│   ├── database.py      # DB engine & session setup
│   ├── seed.py          # Initial data seeder
│   └── requirements.txt
├── css/
│   └── style.css        # Full design system & component styles
├── js/
│   ├── app.js           # Router, auth guard, shell events
│   ├── store.js         # API client & local-first data layer
│   └── screens/
│       ├── login.js
│       ├── dashboard.js
│       ├── assets.js
│       ├── allocations.js
│       ├── bookings.js
│       ├── maintenance.js
│       ├── audits.js
│       ├── reports.js
│       ├── logs.js
│       └── setup.js
└── index.html           # App shell (sidebar, header, modals)
```

---

## 🔒 Role Permissions Summary

| Feature | Employee | Dept Head | Asset Manager | Admin |
|---|:---:|:---:|:---:|:---:|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Register Assets | ❌ | ❌ | ✅ | ✅ |
| Allocate / Return | ❌ | ❌ | ✅ | ✅ |
| Approve Transfers | ❌ | ❌ | ✅ | ✅ |
| Approve Maintenance | ❌ | ❌ | ✅ | ✅ |
| Start Audit Cycle | ❌ | ❌ | ✅ | ✅ |
| Organization Setup | ❌ | ❌ | ❌ | ✅ |
| Manage Employees | ❌ | ❌ | ❌ | ✅ |
