# AssetFlow - Enterprise Asset & Resource Management System

AssetFlow is an Enterprise Asset & Resource Management prototype built to simplify how organizations register, track, allocate, and maintain physical assets and shared resources. Designed to integrate into a centralized ERP platform (matching Odoo aesthetics), it provides role-based workspaces and strict business-rule validations.

---

## Technical Stack & Architecture

- **Frontend Core**: HTML5 + Vanilla JavaScript (Modular ES6 syntax). No heavy frameworks or build steps required.
- **Styling**: Vanilla CSS custom design system (Odoo-inspired purple theme, glassmorphic paneling, responsive layouts, micro-animations, and CSS Grid/Flex layouts).
- **Persistence**: Centralized reactive data store (`localStorage`-backed `store.js`), ensuring data modifications (e.g., registration, bookings, audits) persist across refreshes.
- **Libraries**:
  - [Lucide Icons](https://unpkg.com/lucide) (crisp vector SVG icons via CDN).
  - [Chart.js](https://cdn.jsdelivr.net/npm/chart.js) (interactive canvas charts for operational analytics via CDN).
  - [Google Fonts (Inter)](https://fonts.google.com/specimen/Inter).

---

## Project Structure

```text
├── index.html               # Shell UI structure, global modals, drawers, and overlays
├── README.md                # System documentation
├── css/
│   └── style.css            # Central design tokens, animations, widgets, and styles
└── js/
    ├── app.js               # Page routing (hashchange), global events, and modal utilities
    ├── store.js             # LocalStorage database engine & business logic validations
    └── screens/
        ├── login.js         # Authentication page, signup engine, and credentials helper
        ├── dashboard.js     # Home widgets, KPI statistics, and overdue allocations list
        ├── setup.js         # Admin panel (department trees, custom fields, role promotion)
        ├── assets.js        # Dynamic assets list, details slider, and specifications forms
        ├── allocations.js   # Return check-ins, allocations, and transfer request approvals
        ├── bookings.js      # Month calendar scheduler widget and overlap checker
        ├── maintenance.js   # Repair reporting, manager approvals, tech assignment, and resolve
        ├── audits.js        # Audit launches, checklist marks, and discrepancy freeze reports
        ├── reports.js       # Chart.js dashboards (conditions, depts, incidents, bookings)
        └── logs.js          # Audit trails logs viewer and notification panel history
```

---

## Core Business Validations Supported

1. **Asset Allocation Conflict Prevention**:
   - Assets cannot be double-allocated. Attempting to allocate an already assigned asset prompts the user with a conflict warning, suggesting a **Transfer Request** from the current holder instead.
2. **Resource Overlap Booking Validation**:
   - Shared resources (rooms, vehicles) prevent concurrent bookings. Booking requests are cross-checked (`(StartA < EndB) and (EndA > StartB)`) and rejected with alert banners if overlapping.
3. **Structured Maintenance Flow**:
   - Tickets are routed from *Pending* ➔ *Approved/Rejected* (Managers) ➔ *In Progress* (Technician Assigned) ➔ *Resolved*.
   - Asset status automatically flips to `Under Maintenance` upon approval, and reverts to `Available`/`Allocated` upon resolution.
4. **Audit Cycle Discrepancy Reporting**:
   - Auditor verify checklists freeze when closed by Admin.
   - Any items marked `Missing` auto-generate discrepancy reports and change asset statuses to `Lost` in the main directory.

---

## Simulated Accounts & Logins

A floating **Prototype Tester Panel** is provided in the bottom-right corner of the workspace. This panel allows you to instantly switch roles to test different permissions without logging out.

| Workspace Persona | Email Login | Password | Role Description |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@assetflow.com` | `password` | Organization setup, department head Promotions, closes audits, views analytics |
| **Asset Manager** | `manager@assetflow.com` | `password` | Asset registration, allocations, transfer approvals, maintenance approvals |
| **Dept Head** | `head@assetflow.com` | `password` | Views department assets, books resources, approves transfers within dept |
| **Employee** | `employee@assetflow.com` | `password` | General requests, books resources, raises maintenance tickets |

*Note: You can also sign up as a new Employee. The Admin can then promote your new account to any role via the **Org Setup** screen.*

## Getting Started / Running Locally

Since the application is built using standard ES6 Modules, it requires running inside a local web server environment (browsers restrict ES modules imports on direct `file://` protocols).

Navigate to the project directory in your terminal and start the local HTTP server:
```bash
python3 -m http.server 8080
```
Then open **[http://localhost:8080](http://localhost:8080)** in your web browser.
