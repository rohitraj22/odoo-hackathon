# AssetFlow - Enterprise Asset & Resource Management System

AssetFlow is a centralized, role-based ERP platform designed to simplify how organizations track, allocate, and maintain their physical assets and shared resources. It eliminates manual tracking inefficiencies by digitizing asset lifecycles, resource bookings, and maintenance workflows into an intuitive, responsive interface.

---

## 🚀 Key Features

### 1. 🔐 Upgraded Login & Signup Experience
* **Split-Screen Layout**: A desktop-optimized design featuring a brand panel with glassmorphic elements and key features list, collapsing to a single-pane form layout on mobile.
* **Password Visibility Toggles**: Interactive toggle buttons for all password fields (Login, Signup, and Reset).
* **Password Strength Checker**: Real-time password feedback (minimum length, capital letter, digit checklist) that dynamically enables/disables sign-up completion.
* **Simulated Password Recovery**: A fully functional multi-step forgot password flow:
  1. **Request**: Look up registered email addresses.
  2. **OTP Verification**: Enter code `123456` (simulation).
  3. **Reset**: Set and confirm a new password.
  4. **Persist**: Directly updates the user’s credentials in the local database.

### 2. 📊 Real-Time Operations Dashboard
* **KPI Metrics**: Dynamic cards for Assets Available, Assets Allocated, Active Bookings, and Overdue Returns.
* **Alert System**: Overdue expected return dates are flagged and highlighted in warning/danger logs.
* **Quick Actions**: Instant access to Register Asset, Book Resource, and Raise Maintenance Request based on roles.

### 3. 🏢 Organization Setup (Admin-Only)
* **Department Management**: Create, edit, and deactivate departments with hierarchy (parent/child relationships).
* **Asset Categories**: Set custom fields per category (e.g. warranty period for Electronics, material for Furniture).
* **Employee Directory**: Manage roles (Admin, Asset Manager, Department Head, Employee) and statuses.

### 4. 📁 Central Asset Directory
* **Registration**: Auto-generated asset tags (e.g. `AF-0001`), location tracking, acquisition logs, and bookable configuration.
* **Lifecycle Transitions**: Tracks assets through Available, Allocated, Under Maintenance, Lost, and Retired states.
* **Audit Trail**: Direct per-asset history of allocation and maintenance events.

### 5. 🔄 Conflict-Free Allocations & P2P Transfers
* **Double-Allocation Prevention**: System blocks allocating already-taken assets.
* **Transfer Requests**: Offers a "Request Transfer" action if an asset is occupied, sending a request to the current holder's manager.
* **Check-In Return Flow**: Enter notes and check condition on return, reverting status back to Available.

### 6. 📅 Smart Resource Bookings
* **Overlap Check**: Strict calendar-based time slot check to prevent double bookings of rooms/equipment.
* **Booking Status**: Track Upcoming, Ongoing, and Completed reservations.

### 7. 🔧 Maintenance Workflows
* **Ticket Lifecycle**: Pending Request ➔ Approved ➔ In Progress (Technician Assigned) ➔ Resolved.
* **Asset Automation**: Auto-updates asset status to *Under Maintenance* upon approval, reverting to *Available* on resolution.

---

## 🛠️ Architecture & Database

AssetFlow is built with a zero-dependency front-end architecture:
* **Frontend**: HTML5, Vanilla ES Modules JS, CSS3 Design Tokens.
* **Mock Database**: Browser **`localStorage`** (implemented in `js/store.js`). This allows:
  * **Zero Setup**: Immediate use in any browser sandbox.
  * **Data Persistence**: Data persists across page reloads and browser sessions.
  * **Interactive Testing**: Role changes update data instantly.

---

## 🚀 How to Run the Project

Since the project uses ES Modules, it requires a local web server to avoid CORS policy blockages when loading script imports.

### Option A: Using Python (Recommended)
1. Open terminal inside the `odoo-hackathon` folder.
2. Run the command:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to **`http://localhost:8000`**.

### Option B: Using Node.js
1. Open terminal inside the `odoo-hackathon` folder.
2. Run the command:
   ```bash
   npx serve -l 8000
   ```
3. Open your browser and navigate to **`http://localhost:8000`**.

---

## 🔑 Starter Access

The workspace includes local starter accounts and seed data for testing the full flow without any manual setup. You can create additional employee accounts directly from the login screen, and the data will persist in the browser.
