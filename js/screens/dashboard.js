/* =====================================================
   AssetFlow - Dashboard Screen Component (Wireframe Aligned)
   ===================================================== */

import { Store } from "../store.js";
import { showToast } from "../app.js";

export function renderDashboard(container, user) {
    const assets = Store.getAssets();
    const bookings = Store.getBookings();
    const maintenance = Store.getMaintenance();
    const allocations = Store.getAllocations();
    const transfers = Store.getTransfers();

    // Counts mapping to wireframe defaults if no localStorage exists
    const counts = {
        available: assets.filter(a => a.status === "Available").length || 128,
        allocated: assets.filter(a => a.status === "Allocated").length || 76,
        maintenance: assets.filter(a => a.status === "Under Maintenance").length || 4,
        bookings: bookings.filter(b => b.status === "Upcoming" || b.status === "Ongoing").length || 4,
        transfers: transfers.filter(t => t.status === "Pending").length || 3,
        returns: allocations.filter(a => a.status === "Active" && a.expectedReturnDate).length || 12
    };

    const overdueCount = 8; // Wireframe default overdue count

    container.innerHTML = `
        <div class="dashboard-wrapper">
            <h3 style="font-size:1.25rem; font-weight:700; margin-bottom:16px;">Today's Overview</h3>
            
            <!-- 2x3 Grid layout for stats -->
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-bottom:20px;">
                <div class="kpi-card" style="padding:14px; border:1px solid var(--color-gray-300);">
                    <div style="font-size:0.8rem; color:var(--color-gray-500); font-weight:600; margin-bottom:6px;">Available</div>
                    <span style="font-size:1.6rem; font-weight:800; color:var(--color-gray-900);">${counts.available}</span>
                </div>
                <div class="kpi-card" style="padding:14px; border:1px solid var(--color-gray-300);">
                    <div style="font-size:0.8rem; color:var(--color-gray-500); font-weight:600; margin-bottom:6px;">Allocated</div>
                    <span style="font-size:1.6rem; font-weight:800; color:var(--color-gray-900);">${counts.allocated}</span>
                </div>
                <div class="kpi-card" style="padding:14px; border:1px solid var(--color-gray-300);">
                    <div style="font-size:0.8rem; color:var(--color-gray-500); font-weight:600; margin-bottom:6px;">Under Maintenance</div>
                    <span style="font-size:1.6rem; font-weight:800; color:var(--color-gray-900);">${counts.maintenance}</span>
                </div>
                <div class="kpi-card" style="padding:14px; border:1px solid var(--color-gray-300);">
                    <div style="font-size:0.8rem; color:var(--color-gray-500); font-weight:600; margin-bottom:6px;">Active Bookings</div>
                    <span style="font-size:1.6rem; font-weight:800; color:var(--color-gray-900);">${counts.bookings}</span>
                </div>
                <div class="kpi-card" style="padding:14px; border:1px solid var(--color-gray-300);">
                    <div style="font-size:0.8rem; color:var(--color-gray-500); font-weight:600; margin-bottom:6px;">Pending Transfers</div>
                    <span style="font-size:1.6rem; font-weight:800; color:var(--color-gray-900);">${counts.transfers}</span>
                </div>
                <div class="kpi-card" style="padding:14px; border:1px solid var(--color-gray-300);">
                    <div style="font-size:0.8rem; color:var(--color-gray-500); font-weight:600; margin-bottom:6px;">Upcoming returns</div>
                    <span style="font-size:1.6rem; font-weight:800; color:var(--color-gray-900);">${counts.returns}</span>
                </div>
            </div>

            <!-- Overdue Return red alert banner -->
            <div class="banner-alert-red" style="padding:10px 16px; margin-bottom:20px; font-weight:600; font-size:0.875rem;">
                <i data-lucide="alert-circle" style="width:18px; height:18px; flex-shrink:0;"></i>
                <span>${overdueCount} assets overdue for return - flagged for follow-up</span>
            </div>

            <!-- Action buttons bottom row -->
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-bottom:30px;">
                <button class="btn btn-secondary" id="dash-btn-register" style="border:2px solid var(--color-gray-900); color:var(--color-gray-900); font-weight:600; background-color: #f6fbf8; padding:12px;" ${(user.role !== 'Admin' && user.role !== 'Asset Manager') ? 'disabled title="Requires Admin or Manager"' : ''}>
                    + register asset
                </button>
                <button class="btn btn-secondary" id="dash-btn-book" style="border:2px solid var(--color-gray-900); color:var(--color-gray-900); font-weight:600; background-color: #f6fbf8; padding:12px;">
                    Book resource
                </button>
                <button class="btn btn-secondary" id="dash-btn-maint" style="border:2px solid var(--color-gray-900); color:var(--color-gray-900); font-weight:600; background-color: #f6fbf8; padding:12px;">
                    Raise requests
                </button>
            </div>

            <!-- Recent Activity List -->
            <div class="action-card" style="border:1px solid var(--color-gray-300);">
                <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:14px; border-bottom:1px solid var(--color-gray-200); padding-bottom:8px;">Recent Activity</h3>
                <div style="display:flex; flex-direction:column; gap:10px; font-size:0.875rem; color:var(--color-gray-700);">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <i data-lucide="package" style="width:16px; height:16px; color:var(--color-primary-light);"></i>
                        <span>Laptop AF-0114 - allocated to Priya shah - Engineering</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <i data-lucide="calendar" style="width:16px; height:16px; color:var(--color-success);"></i>
                        <span>Room B2 - booking confirmed - 2:00 to 3:00 PM</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <i data-lucide="wrench" style="width:16px; height:16px; color:var(--color-warning);"></i>
                        <span>Projector AF-0062 - maintenance resolved</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Click triggers
    container.querySelector("#dash-btn-register").addEventListener("click", () => {
        window.location.hash = "#assets";
        setTimeout(() => {
            const btn = document.getElementById("trigger-register-btn");
            if (btn) btn.click();
        }, 150);
    });

    container.querySelector("#dash-btn-book").addEventListener("click", () => {
        window.location.hash = "#bookings";
    });

    container.querySelector("#dash-btn-maint").addEventListener("click", () => {
        window.location.hash = "#maintenance";
        setTimeout(() => {
            const btn = document.getElementById("trigger-maintenance-btn");
            if (btn) btn.click();
        }, 150);
    });

    lucide.createIcons();
}
