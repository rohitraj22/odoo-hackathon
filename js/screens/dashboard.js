/* =====================================================
   AssetFlow - Dashboard Screen Component
   ===================================================== */

import { Store } from "../store.js";
import { showToast } from "../app.js";

export async function renderDashboard(container, user) {
    container.innerHTML = `
        <div class="loading-state">
            <i data-lucide="loader-2" class="spin-icon"></i>
            <div>Loading dashboard...</div>
        </div>
    `;
    lucide.createIcons();

    const [assets, bookings, maintenance, allocations, transfers, logs] = await Promise.all([
        Store.fetchAssets(),
        Store.fetchBookings(),
        Store.fetchMaintenance(),
        Store.fetchAllocations(),
        Store.fetchTransfers(),
        Store.fetchLogs()
    ]);

    const today = new Date().toISOString().split("T")[0];
    const overdueAllocations = allocations.filter(a =>
        a.status === "Active" && a.expectedReturnDate && a.expectedReturnDate < today
    );
    const upcomingReturns = allocations.filter(a =>
        a.status === "Active" && a.expectedReturnDate && a.expectedReturnDate >= today
    );
    const maintenanceToday = maintenance.filter(m =>
        (m.reportedDate === today || m.status === "In Progress") && m.status !== "Resolved"
    ).length;

    const kpis = [
        { label: "Assets Available", value: assets.filter(a => a.status === "Available").length, icon: "package-check", tone: "success" },
        { label: "Assets Allocated", value: assets.filter(a => a.status === "Allocated").length, icon: "users", tone: "info" },
        { label: "Maintenance Today", value: maintenanceToday, icon: "wrench", tone: "warning" },
        { label: "Active Bookings", value: bookings.filter(b => b.status === "Upcoming" || b.status === "Ongoing").length, icon: "calendar", tone: "primary" },
        { label: "Pending Transfers", value: transfers.filter(t => t.status === "Pending").length, icon: "arrow-right-left", tone: "warning" },
        { label: "Upcoming Returns", value: upcomingReturns.length, icon: "rotate-ccw", tone: "info" }
    ];

    const recentActivity = logs.slice(0, 6);

    container.innerHTML = `
        <div class="dashboard-wrapper page-shell">
            <div class="page-hero compact">
                <div>
                    <p class="page-eyebrow">Operations overview</p>
                    <h2 class="page-title">Welcome back, ${user.name.split(" ")[0]}</h2>
                    <p class="page-subtitle">Real-time snapshot of assets, bookings, and maintenance across your workspace.</p>
                </div>
                <span class="role-chip">${user.role}</span>
            </div>

            ${overdueAllocations.length ? `
                <div class="banner-alert-red">
                    <i data-lucide="alert-circle"></i>
                    <span><strong>${overdueAllocations.length} overdue return${overdueAllocations.length > 1 ? "s" : ""}</strong> — follow up on assets past their expected return date.</span>
                </div>
            ` : ""}

            <div class="kpi-grid dashboard-kpi-grid">
                ${kpis.map(k => `
                    <div class="kpi-card kpi-card-${k.tone}">
                        <div class="kpi-card-top">
                            <span class="kpi-icon"><i data-lucide="${k.icon}"></i></span>
                            <span class="kpi-label">${k.label}</span>
                        </div>
                        <span class="kpi-value">${k.value}</span>
                    </div>
                `).join("")}
            </div>

            <div class="dashboard-grid">
                <div class="action-card">
                    <h4 class="card-title"><i data-lucide="zap"></i> Quick Actions</h4>
                    <div class="quick-actions">
                        <button class="quick-action-btn" id="dash-btn-register" ${(user.role !== "Admin" && user.role !== "Asset Manager") ? "disabled" : ""}>
                            <i data-lucide="plus-circle"></i>
                            <span>Register Asset</span>
                        </button>
                        <button class="quick-action-btn" id="dash-btn-book">
                            <i data-lucide="calendar-plus"></i>
                            <span>Book Resource</span>
                        </button>
                        <button class="quick-action-btn" id="dash-btn-maint">
                            <i data-lucide="wrench"></i>
                            <span>Raise Maintenance</span>
                        </button>
                    </div>
                </div>

                <div class="action-card">
                    <h4 class="card-title"><i data-lucide="activity"></i> Recent Activity</h4>
                    ${recentActivity.length ? `
                        <div class="activity-feed">
                            ${recentActivity.map(log => `
                                <div class="activity-item">
                                    <div class="activity-dot activity-${log.type || "info"}"></div>
                                    <div>
                                        <strong>${log.action}</strong>
                                        <p>${log.details}</p>
                                        <small>${formatTime(log.timestamp)} · ${log.user}</small>
                                    </div>
                                </div>
                            `).join("")}
                        </div>
                    ` : `<p class="muted-text">No recent activity.</p>`}
                </div>
            </div>

            ${overdueAllocations.length ? `
                <div class="action-card">
                    <h4 class="card-title"><i data-lucide="alarm-clock"></i> Overdue Returns</h4>
                    <div class="table-responsive">
                        <table class="table">
                            <thead><tr><th>Asset</th><th>Holder</th><th>Expected Return</th></tr></thead>
                            <tbody>
                                ${overdueAllocations.map(a => `
                                    <tr class="row-overdue">
                                        <td><span class="asset-tag-chip">${a.assetId}</span> ${a.assetName || ""}</td>
                                        <td>${a.holderName || "—"}</td>
                                        <td class="text-danger">${a.expectedReturnDate}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ""}
        </div>
    `;

    container.querySelector("#dash-btn-register")?.addEventListener("click", () => {
        window.location.hash = "#assets";
        setTimeout(() => document.getElementById("trigger-register-btn")?.click(), 200);
    });
    container.querySelector("#dash-btn-book")?.addEventListener("click", () => {
        window.location.hash = "#bookings";
    });
    container.querySelector("#dash-btn-maint")?.addEventListener("click", () => {
        window.location.hash = "#maintenance";
        setTimeout(() => document.getElementById("trigger-maintenance-btn")?.click(), 200);
    });

    lucide.createIcons();
}

function formatTime(ts) {
    if (!ts) return "—";
    try {
        return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
        return ts;
    }
}
