/* ======================================================
   AssetFlow - Reports & Analytics (Enhanced Professional)
   ====================================================== */

import { Store } from "../store.js";

export async function renderReports(container, user) {
    container.innerHTML = `
        <div class="loading-state">
            <i data-lucide="loader-2" class="spin-icon"></i>
            <div style="color:var(--color-gray-500); font-weight:600;">Loading reports...</div>
        </div>
    `;
    safeCreateIcons();

    const [assets, allocations, maintenance, depts, employees] = await Promise.all([
        Store.fetchAssets(),
        Store.fetchAllocations(),
        Store.fetchMaintenance(),
        Store.fetchDepartments(),
        Store.fetchEmployees()
    ]);

    // Department utilization calculation
    const deptUtil = depts.map(d => {
        const emps = employees.filter(e => e.departmentId === d.id);
        const empIds = new Set(emps.map(e => e.id));
        const deptAssets = allocations.filter(a => empIds.has(a.employeeId || a.holderId) && a.status === "Active").length;
        const pct = emps.length > 0 ? Math.min(Math.round((deptAssets / (emps.length * 1.5)) * 100), 100) : 0;
        return { name: d.name, pct, count: deptAssets, employees: emps.length };
    });

    // Most used assets (by history events)
    const usedAssets = [...assets]
        .sort((a, b) => (b.history || []).length - (a.history || []).length)
        .slice(0, 6);

    // Idle assets (Available for a long time, no allocations)
    const idleAssets = assets.filter(a => a.status === "Available").slice(0, 6);

    // Near retirement — assets older than 3 years
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const nearRetirement = assets.filter(a => a.acquisitionDate && new Date(a.acquisitionDate) < threeYearsAgo).slice(0, 6);

    // Maintenance frequency by asset
    const maintByAsset = {};
    maintenance.forEach(m => {
        maintByAsset[m.assetId] = (maintByAsset[m.assetId] || 0) + 1;
    });
    const maintAssets = Object.entries(maintByAsset).sort((a, b) => b[1] - a[1]).slice(0, 6);

    // Asset status breakdown
    const statusCounts = {
        Available: assets.filter(a => a.status === "Available").length,
        Allocated: assets.filter(a => a.status === "Allocated").length,
        "Under Maintenance": assets.filter(a => a.status === "Under Maintenance").length,
        Other: assets.filter(a => !["Available","Allocated","Under Maintenance"].includes(a.status)).length
    };

    container.innerHTML = `
        <div class="reports-wrapper page-shell">
            <div class="page-hero compact">
                <div>
                    <p class="page-eyebrow">Business intelligence</p>
                    <h2 class="page-title">Reports & Analytics</h2>
                    <p class="page-subtitle">Insights into asset utilization, maintenance trends, and departmental performance.</p>
                </div>
            </div>

            <!-- Summary KPI Cards -->
            <div class="reports-kpi-grid">
                <div class="report-kpi-card report-kpi-primary">
                    <div class="report-kpi-icon"><i data-lucide="package"></i></div>
                    <div class="report-kpi-content">
                        <div class="report-kpi-value">${assets.length}</div>
                        <div class="report-kpi-label">Total Assets</div>
                    </div>
                </div>
                <div class="report-kpi-card report-kpi-success">
                    <div class="report-kpi-icon"><i data-lucide="trending-up"></i></div>
                    <div class="report-kpi-content">
                        <div class="report-kpi-value">${allocations.filter(a => a.status === "Active").length}</div>
                        <div class="report-kpi-label">Active Allocations</div>
                    </div>
                </div>
                <div class="report-kpi-card report-kpi-warning">
                    <div class="report-kpi-icon"><i data-lucide="wrench"></i></div>
                    <div class="report-kpi-content">
                        <div class="report-kpi-value">${maintenance.filter(m => m.status !== "Resolved").length}</div>
                        <div class="report-kpi-label">Open Maintenance</div>
                    </div>
                </div>
                <div class="report-kpi-card report-kpi-info">
                    <div class="report-kpi-icon"><i data-lucide="users"></i></div>
                    <div class="report-kpi-content">
                        <div class="report-kpi-value">${depts.length}</div>
                        <div class="report-kpi-label">Departments</div>
                    </div>
                </div>
            </div>

            <!-- Main Charts Row -->
            <div class="reports-charts-row">
                <!-- Department Utilization -->
                <div class="action-card report-chart-card">
                    <h4 class="card-title"><i data-lucide="building-2"></i> Department Asset Utilization</h4>
                    <div class="report-chart-container">
                        <canvas id="deptUtilChart"></canvas>
                    </div>
                </div>

                <!-- Asset Status Breakdown -->
                <div class="action-card report-chart-card">
                    <h4 class="card-title"><i data-lucide="pie-chart"></i> Asset Status Breakdown</h4>
                    <div class="report-chart-container" style="max-height:280px;">
                        <canvas id="assetStatusChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Maintenance Frequency -->
            <div class="action-card" style="margin-bottom:24px;">
                <h4 class="card-title"><i data-lucide="alert-circle"></i> High Maintenance Assets</h4>
                ${maintAssets.length === 0
                    ? `<div class="empty-state"><i data-lucide="check-circle"></i><p>No maintenance records yet.</p></div>`
                    : `<div class="maint-freq-list">
                        ${maintAssets.map(([assetId, count]) => {
                            const asset = assets.find(a => a.id === assetId);
                            const maxCount = maintAssets[0][1];
                            const pct = Math.round((count / maxCount) * 100);
                            return `
                                <div class="maint-freq-item">
                                    <div class="maint-freq-info">
                                        <span class="asset-tag-chip">${assetId}</span>
                                        <span class="maint-asset-name">${asset ? asset.name : "Unknown"}</span>
                                    </div>
                                    <div class="maint-freq-bar-wrap">
                                        <div class="maint-freq-bar" style="width: ${pct}%;"></div>
                                    </div>
                                    <div class="maint-freq-count">${count} ticket${count > 1 ? 's' : ''}</div>
                                </div>
                            `;
                        }).join("")}
                    </div>`
                }
            </div>

            <!-- Bottom Lists Row -->
            <div class="reports-lists-row">
                <!-- Most Used -->
                <div class="action-card report-list-card">
                    <h4 class="card-title"><i data-lucide="trending-up"></i> Most Active Assets</h4>
                    ${usedAssets.length === 0
                        ? `<p class="muted-text">No activity yet</p>`
                        : `<div class="report-list">
                            ${usedAssets.map((a, i) => `
                                <div class="report-list-item">
                                    <div class="report-list-rank">${i + 1}</div>
                                    <div class="report-list-content">
                                        <div class="report-list-title">${a.name}</div>
                                        <div class="report-list-meta"><span class="asset-tag-chip">${a.id}</span> · ${(a.history || []).length} events</div>
                                    </div>
                                </div>
                            `).join("")}
                        </div>`
                    }
                </div>

                <!-- Idle Assets -->
                <div class="action-card report-list-card">
                    <h4 class="card-title"><i data-lucide="archive"></i> Idle Assets</h4>
                    ${idleAssets.length === 0
                        ? `<p class="muted-text">All assets utilized</p>`
                        : `<div class="report-list">
                            ${idleAssets.map(a => `
                                <div class="report-list-item">
                                    <div class="report-list-icon idle"><i data-lucide="pause"></i></div>
                                    <div class="report-list-content">
                                        <div class="report-list-title">${a.name}</div>
                                        <div class="report-list-meta"><span class="asset-tag-chip">${a.id}</span> · ${a.location || "—"}</div>
                                    </div>
                                </div>
                            `).join("")}
                        </div>`
                    }
                </div>

                <!-- Near Retirement -->
                <div class="action-card report-list-card">
                    <h4 class="card-title"><i data-lucide="calendar-clock"></i> Near Retirement</h4>
                    ${nearRetirement.length === 0
                        ? `<p class="muted-text">No aging assets</p>`
                        : `<div class="report-list">
                            ${nearRetirement.map(a => {
                                const age = Math.floor((new Date() - new Date(a.acquisitionDate)) / (1000 * 60 * 60 * 24 * 365));
                                return `
                                <div class="report-list-item">
                                    <div class="report-list-icon warning"><i data-lucide="alert-triangle"></i></div>
                                    <div class="report-list-content">
                                        <div class="report-list-title">${a.name}</div>
                                        <div class="report-list-meta"><span class="asset-tag-chip">${a.id}</span> · ${age} years old</div>
                                    </div>
                                </div>
                            `;}).join("")}
                        </div>`
                    }
                </div>
            </div>
        </div>
    `;

    safeCreateIcons();

    // Render charts after DOM is ready
    setTimeout(() => {
        renderDepartmentUtilizationChart(deptUtil);
        renderAssetStatusChart(statusCounts);
    }, 100);
}

function renderDepartmentUtilizationChart(data) {
    const canvas = document.getElementById("deptUtilChart");
    if (!canvas) return;

    const labels = data.map(d => d.name);
    const values = data.map(d => d.pct);
    const colors = values.map(v => v > 75 ? "#10b981" : v > 40 ? "#3b82f6" : "#f59e0b");

    new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Utilization %",
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
                        label: ctx => ` ${ctx.raw}% utilized`
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
                    max: 100,
                    ticks: {
                        callback: v => v + "%",
                        color: "#9ca3af",
                        font: { size: 11 }
                    },
                    grid: { color: "rgba(0,0,0,0.04)" }
                },
                x: {
                    ticks: { color: "#6b7280", font: { size: 11, weight: "600" } },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderAssetStatusChart(data) {
    const canvas = document.getElementById("assetStatusChart");
    if (!canvas) return;

    const labels = Object.keys(data);
    const values = Object.values(data);
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#e5e7eb"];

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
            cutout: "70%",
            plugins: {
                legend: {
                    display: true,
                    position: "bottom",
                    labels: {
                        color: "#6b7280",
                        font: { size: 12, weight: "600" },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: "circle"
                    }
                },
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
