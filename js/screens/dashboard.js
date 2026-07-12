/* =====================================================
   AssetFlow - Dashboard Screen Component (Enhanced)
   ===================================================== */

import { Store } from "../store.js";
import { showToast } from "../app.js";

export async function renderDashboard(container, user) {
    container.innerHTML = `
        <div class="loading-state">
            <i data-lucide="loader-2" class="spin-icon"></i>
            <div style="color:var(--color-gray-500); font-weight:600;">Loading dashboard...</div>
        </div>
    `;
    safeCreateIcons();

    const [assets, bookings, maintenance, allocations, transfers, logs, employees, departments] = await Promise.all([
        Store.fetchAssets(),
        Store.fetchBookings(),
        Store.fetchMaintenance(),
        Store.fetchAllocations(),
        Store.fetchTransfers(),
        Store.fetchLogs(),
        Store.fetchEmployees(),
        Store.fetchDepartments()
    ]);

    const today = new Date().toISOString().split("T")[0];

    // KPI calculations
    const availableAssets = assets.filter(a => a.status === "Available").length;
    const allocatedAssets = assets.filter(a => a.status === "Allocated").length;
    const maintenanceOpen = maintenance.filter(m => m.status !== "Resolved").length;
    const activeBookings = bookings.filter(b => b.status === "Upcoming" || b.status === "Ongoing").length;
    const pendingTransfers = transfers.filter(t => t.status === "Pending").length;
    const overdueAllocations = allocations.filter(a =>
        a.status === "Active" && a.expectedReturnDate && a.expectedReturnDate < today
    );

    // Asset status distribution for donut
    const assetStatusMap = {
        Available: assets.filter(a => a.status === "Available").length,
        Allocated: assets.filter(a => a.status === "Allocated").length,
        "Under Maintenance": assets.filter(a => a.status === "Under Maintenance").length,
        Other: assets.filter(a => !["Available","Allocated","Under Maintenance"].includes(a.status)).length
    };

    // Maintenance priority breakdown
    const maintenancePriorityMap = {
        Critical: maintenance.filter(m => m.priority === "Critical").length,
        High: maintenance.filter(m => m.priority === "High").length,
        Medium: maintenance.filter(m => m.priority === "Medium").length,
        Low: maintenance.filter(m => m.priority === "Low").length
    };

    const recentActivity = logs.slice(0, 8);

    const kpis = [
        {
            label: "Available Assets",
            value: availableAssets,
            total: assets.length,
            icon: "package-check",
            tone: "success",
            change: `${assets.length} total assets`,
            positive: true
        },
        {
            label: "Assets Allocated",
            value: allocatedAssets,
            total: employees.filter(e => e.status === "Active").length,
            icon: "users",
            tone: "info",
            change: `${employees.filter(e=>e.status==="Active").length} active employees`,
            positive: true
        },
        {
            label: "Open Maintenance",
            value: maintenanceOpen,
            total: maintenance.length,
            icon: "wrench",
            tone: maintenanceOpen > 0 ? "warning" : "success",
            change: `${maintenance.filter(m => m.priority === "Critical" || m.priority === "High").length} high priority`,
            positive: maintenanceOpen === 0
        },
        {
            label: "Active Bookings",
            value: activeBookings,
            total: bookings.length,
            icon: "calendar",
            tone: "primary",
            change: `${bookings.length} total bookings`,
            positive: true
        },
        {
            label: "Pending Transfers",
            value: pendingTransfers,
            total: transfers.length,
            icon: "arrow-right-left",
            tone: pendingTransfers > 0 ? "warning" : "success",
            change: `${transfers.filter(t => t.status === "Approved" || t.status === "Completed").length} approved`,
            positive: pendingTransfers === 0
        },
        {
            label: "Departments",
            value: departments.length,
            total: employees.filter(e=>e.status==="Active").length,
            icon: "building-2",
            tone: "info",
            change: `${employees.filter(e=>e.status==="Active").length} staff members`,
            positive: true
        }
    ];

    container.innerHTML = `
        <div class="dashboard-wrapper page-shell">
            <!-- Hero Section -->
            <div class="dash-hero">
                <div class="dash-hero-left">
                    <div class="dash-hero-eyebrow">
                        <span class="dash-date">${formatDate(new Date())}</span>
                        <span class="role-chip">${user.role}</span>
                    </div>
                    <h1 class="dash-hero-title">Welcome back, <span class="dash-name-highlight">${user.name.split(" ")[0]}</span> 👋</h1>
                    <p class="dash-hero-subtitle">Here's what's happening across your asset workspace today.</p>
                </div>
                <div class="dash-hero-right">
                    <div class="dash-stat-pill">
                        <i data-lucide="activity"></i>
                        <span><strong>${assets.length}</strong> assets tracked</span>
                    </div>
                </div>
            </div>

            ${overdueAllocations.length ? `
                <div class="banner-alert-red" style="margin-bottom: 24px;">
                    <i data-lucide="alert-circle"></i>
                    <span><strong>${overdueAllocations.length} overdue return${overdueAllocations.length > 1 ? "s" : ""}</strong> — assets past their expected return date require immediate follow-up.</span>
                </div>
            ` : ""}

            <!-- KPI Cards Row -->
            <div class="dashboard-kpi-grid">
                ${kpis.map(k => `
                    <div class="kpi-card kpi-card-${k.tone}">
                        <div class="kpi-card-top">
                            <span class="kpi-icon"><i data-lucide="${k.icon}"></i></span>
                            <span class="kpi-label">${k.label}</span>
                        </div>
                        <div class="kpi-value">${k.value}</div>
                        <div class="kpi-meta">
                            <span style="color: var(--color-gray-400); font-size: 0.78rem;">${k.change}</span>
                        </div>
                    </div>
                `).join("")}
            </div>

            <!-- Charts + Recent Activity Row -->
            <div class="dashboard-charts-row">
                <!-- Asset Status Donut -->
                <div class="action-card dash-chart-card">
                    <div class="card-title-row">
                        <h4 class="card-title" style="margin-bottom:0;"><i data-lucide="pie-chart"></i> Asset Status Overview</h4>
                    </div>
                    <div class="dash-donut-container">
                        <canvas id="assetStatusChart" style="max-height:220px;"></canvas>
                    </div>
                    <div class="dash-legend">
                        ${Object.entries(assetStatusMap).map(([label, val]) => `
                            <div class="dash-legend-item">
                                <span class="dash-legend-dot" style="background: ${getStatusColor(label)};"></span>
                                <span>${label}</span>
                                <strong>${val}</strong>
                            </div>
                        `).join("")}
                    </div>
                </div>

                <!-- Maintenance Priority Bar -->
                <div class="action-card dash-chart-card">
                    <div class="card-title-row">
                        <h4 class="card-title" style="margin-bottom:0;"><i data-lucide="bar-chart-2"></i> Maintenance by Priority</h4>
                    </div>
                    <div class="dash-donut-container">
                        <canvas id="maintenanceChart" style="max-height:220px;"></canvas>
                    </div>
                    <div class="dash-legend">
                        ${Object.entries(maintenancePriorityMap).map(([label, val]) => `
                            <div class="dash-legend-item">
                                <span class="dash-legend-dot" style="background: ${getPriorityColor(label)};"></span>
                                <span>${label}</span>
                                <strong>${val}</strong>
                            </div>
                        `).join("")}
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="action-card dash-activity-card">
                    <h4 class="card-title"><i data-lucide="activity"></i> Recent Activity</h4>
                    ${recentActivity.length ? `
                        <div class="activity-feed">
                            ${recentActivity.map(log => `
                                <div class="activity-item">
                                    <div class="activity-icon-wrap activity-${log.type || "info"}">
                                        <i data-lucide="${getActivityIcon(log.type)}"></i>
                                    </div>
                                    <div>
                                        <strong>${log.action}</strong>
                                        <p>${log.details}</p>
                                        <small>${formatTime(log.timestamp)} · ${log.user}</small>
                                    </div>
                                </div>
                            `).join("")}
                        </div>
                    ` : `<div class="empty-state"><i data-lucide="activity"></i><p>No recent activity recorded.</p></div>`}
                </div>
            </div>

            <!-- Bottom Row: Quick Actions + Overdue -->
            <div class="dashboard-bottom-row">
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
                            <span>Raise Ticket</span>
                        </button>
                        <button class="quick-action-btn" id="dash-btn-reports">
                            <i data-lucide="bar-chart-3"></i>
                            <span>View Reports</span>
                        </button>
                    </div>
                </div>

                ${overdueAllocations.length ? `
                    <div class="action-card">
                        <h4 class="card-title"><i data-lucide="alarm-clock"></i> Overdue Returns</h4>
                        <div class="table-responsive" style="margin-bottom:0;">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Asset</th>
                                        <th>Current Holder</th>
                                        <th>Expected Return</th>
                                        <th>Overdue By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${overdueAllocations.slice(0, 5).map(a => {
                                        const daysOverdue = Math.floor((new Date() - new Date(a.expectedReturnDate)) / (1000 * 60 * 60 * 24));
                                        return `
                                        <tr class="row-overdue">
                                            <td><span class="asset-tag-chip">${a.assetId}</span> <span style="font-weight:600;">${a.assetName || ""}</span></td>
                                            <td>${a.holderName || "—"}</td>
                                            <td class="text-danger">${a.expectedReturnDate}</td>
                                            <td><span class="badge badge-cancelled">${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}</span></td>
                                        </tr>`;
                                    }).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : `
                    <div class="action-card dash-all-clear">
                        <div class="all-clear-icon"><i data-lucide="check-circle-2"></i></div>
                        <h4>All Returns On Track</h4>
                        <p>No overdue allocations. Your asset inventory is healthy.</p>
                    </div>
                `}
            </div>
        </div>
    `;

    // Wire up buttons
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
    container.querySelector("#dash-btn-reports")?.addEventListener("click", () => {
        window.location.hash = "#reports";
    });

    safeCreateIcons();

    // Render charts after icons
    setTimeout(() => {
        renderAssetStatusChart(assetStatusMap);
        renderMaintenanceChart(maintenancePriorityMap);
    }, 80);
}

function renderAssetStatusChart(data) {
    const canvas = document.getElementById("assetStatusChart");
    if (!canvas) return;

    const labels = Object.keys(data);
    const values = Object.values(data);
    const colors = labels.map(getStatusColor);

    new Chart(canvas, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: "#ffffff",
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: "72%",
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.raw} assets`
                    },
                    backgroundColor: "#1f2937",
                    titleColor: "#fff",
                    bodyColor: "#9ca3af",
                    padding: 12,
                    cornerRadius: 10
                }
            }
        }
    });
}

function renderMaintenanceChart(data) {
    const canvas = document.getElementById("maintenanceChart");
    if (!canvas) return;

    const labels = Object.keys(data);
    const values = Object.values(data);
    const colors = labels.map(getPriorityColor);

    new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Tickets",
                data: values,
                backgroundColor: colors.map(c => c + "cc"),
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.raw} ticket${ctx.raw !== 1 ? "s" : ""}`
                    },
                    backgroundColor: "#1f2937",
                    titleColor: "#fff",
                    bodyColor: "#9ca3af",
                    padding: 12,
                    cornerRadius: 10
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: "#9ca3af",
                        font: { size: 11 }
                    },
                    grid: {
                        color: "rgba(0,0,0,0.04)"
                    }
                },
                x: {
                    ticks: {
                        color: "#6b7280",
                        font: { size: 11, weight: "600" }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

function getStatusColor(status) {
    const map = {
        Available: "#10b981",
        Allocated: "#3b82f6",
        "Under Maintenance": "#f59e0b",
        Other: "#e5e7eb"
    };
    return map[status] || "#e5e7eb";
}

function getPriorityColor(priority) {
    const map = {
        Critical: "#ef4444",
        High: "#f97316",
        Medium: "#f59e0b",
        Low: "#3b82f6"
    };
    return map[priority] || "#9ca3af";
}

function getActivityIcon(type) {
    const map = {
        info: "info",
        success: "check-circle",
        warning: "alert-triangle",
        danger: "x-circle"
    };
    return map[type] || "activity";
}

function formatDate(date) {
    return date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatTime(ts) {
    if (!ts) return "—";
    try {
        return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
        return ts;
    }
}
