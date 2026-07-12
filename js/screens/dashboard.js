/* =====================================================
   AssetFlow - Dashboard Screen Component (Backend Connected)
   ===================================================== */

import { Store } from "../store.js";
import { showToast } from "../app.js";

export async function renderDashboard(container, user) {
    // 1. Show a loading state while fetching data
    container.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height: 50vh; flex-direction:column; gap:16px;">
            <i data-lucide="loader-2" style="width:40px; height:40px; color:var(--color-primary); animation: spin 1s linear infinite;"></i>
            <div style="color:var(--color-gray-500); font-weight:600;">Loading Dashboard Data...</div>
        </div>
        <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;
    lucide.createIcons();

    // 2. Fetch all required data concurrently
    const [assets, bookings, maintenance, allocations, transfers] = await Promise.all([
        Store.fetchAssets(),
        Store.fetchBookings(),
        Store.fetchMaintenance(),
        Store.fetchAllocations(),
        Store.fetchTransfers()
    ]);

    // 3. Compute KPIs
    const counts = {
        available: assets.filter(a => a.status === "Available").length || 0,
        allocated: assets.filter(a => a.status === "Allocated").length || 0,
        maintenance: assets.filter(a => a.status === "Under Maintenance").length || 0,
        bookings: bookings.filter(b => b.status === "Upcoming" || b.status === "Ongoing").length || 0,
        transfers: transfers.filter(t => t.status === "Pending").length || 0,
        returns: allocations.filter(a => a.status === "Active" && a.expected_return_date).length || 0
    };

    const overdueCount = 0; // We can add logic for this later

    // 4. Render the UI
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
            ${overdueCount > 0 ? `
            <div class="banner-alert-red" style="padding:10px 16px; margin-bottom:20px; font-weight:600; font-size:0.875rem;">
                <i data-lucide="alert-circle" style="width:18px; height:18px; flex-shrink:0;"></i>
                <span>${overdueCount} assets overdue for return - flagged for follow-up</span>
            </div>
            ` : ''}

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