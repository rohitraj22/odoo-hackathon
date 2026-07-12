/* ======================================================
   AssetFlow - Reports & Analytics (Wireframe: Screen 9)
   ====================================================== */

import { Store } from "../store.js";

export async function renderReports(container, user) {
    container.innerHTML = `
        <div class="loading-state">
            <i data-lucide="loader-2" class="spin-icon"></i>
            <div>Loading reports...</div>
        </div>
    `;
    lucide.createIcons();

    const [assets, allocations, maintenance, depts, employees] = await Promise.all([
        Store.fetchAssets(),
        Store.fetchAllocations(),
        Store.fetchMaintenance(),
        Store.fetchDepartments(),
        Store.fetchEmployees()
    ]);

    // Compute per-department utilization %
    const deptUtil = depts.map(d => {
        const emps = employees.filter(e => e.departmentId === d.id);
        const empIds = new Set(emps.map(e => e.id));
        const deptAssets = allocations.filter(a => empIds.has(a.employeeId || a.holderId) && a.status === "Active").length;
        const totalDeptAssets = emps.length > 0 ? Math.max(deptAssets, 1) : 1;
        const pct = Math.min(Math.round((deptAssets / Math.max(emps.length * 2, 1)) * 100), 100);
        return { name: d.name, pct, count: deptAssets };
    });

    // Most used assets (by history events)
    const usedAssets = [...assets]
        .sort((a, b) => (b.history || []).length - (a.history || []).length)
        .slice(0, 5);

    // Idle assets (Available for a long time, no allocations)
    const idleAssets = assets
        .filter(a => a.status === "Available")
        .slice(0, 5);

    // Near retirement — assets older than 3 years
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const nearRetirement = assets
        .filter(a => a.acquisitionDate && new Date(a.acquisitionDate) < threeYearsAgo)
        .slice(0, 5);

    // Maintenance frequency by asset (how many tickets per asset)
    const maintByAsset = {};
    maintenance.forEach(m => {
        maintByAsset[m.assetId] = (maintByAsset[m.assetId] || 0) + 1;
    });
    const maintAssets = Object.entries(maintByAsset)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    container.innerHTML = `
        <div class="reports-wrapper">
            <h3 style="font-size:1.25rem; font-weight:700; margin-bottom:20px;">Reports & Analytics</h3>

            <!-- Department Utilization Bar Charts -->
            <div class="action-card" style="margin-bottom:20px;">
                <h4 style="font-size:0.925rem; font-weight:700; margin-bottom:16px;">Department Asset Utilization</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${deptUtil.map(d => `
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <span style="font-size:0.85rem; font-weight:600; color:var(--color-gray-700);">${d.name}</span>
                                <span style="font-size:0.8rem; color:var(--color-gray-500);">${d.pct}% · ${d.count} assets</span>
                            </div>
                            <div style="background:var(--color-gray-200); border-radius:9999px; height:10px; overflow:hidden;">
                                <div style="background:${d.pct > 75 ? '#10b981' : d.pct > 40 ? '#3b82f6' : '#f59e0b'}; height:100%; border-radius:9999px; width:${d.pct}%; transition:width 0.6s ease;"></div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>

            <!-- Maintenance Frequency -->
            <div class="action-card" style="margin-bottom:20px;">
                <h4 style="font-size:0.925rem; font-weight:700; margin-bottom:14px;">Maintenance Frequency (Top Assets)</h4>
                ${maintAssets.length === 0
                    ? `<p style="text-align:center; color:var(--color-gray-400); padding:20px;">No maintenance data yet.</p>`
                    : `<div style="display:flex; flex-direction:column; gap:10px;">
                        ${maintAssets.map(([assetId, count]) => {
                            const asset = assets.find(a => a.id === assetId);
                            const maxCount = maintAssets[0][1];
                            const pct = Math.round((count / maxCount) * 100);
                            return `
                                <div>
                                    <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.85rem;">
                                        <span style="font-weight:600;">${asset ? asset.name : assetId} <span style="font-family:monospace; color:var(--color-gray-400); font-size:0.8rem;">(${assetId})</span></span>
                                        <span style="color:var(--color-gray-500);">${count} ticket${count > 1 ? 's' : ''}</span>
                                    </div>
                                    <div style="background:var(--color-gray-200); border-radius:9999px; height:8px; overflow:hidden;">
                                        <div style="background:#f43f5e; height:100%; border-radius:9999px; width:${pct}%;"></div>
                                    </div>
                                </div>
                            `;
                        }).join("")}
                    </div>`
                }
            </div>

            <!-- 3-column bottom lists -->
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
                <!-- Most Used -->
                <div class="action-card">
                    <h4 style="font-size:0.875rem; font-weight:700; margin-bottom:12px; color:var(--color-gray-700);">Most Used Assets</h4>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${usedAssets.map((a, i) => `
                            <div style="display:flex; align-items:center; gap:10px; font-size:0.8rem;">
                                <span style="font-size:0.75rem; font-weight:800; color:var(--color-gray-400); min-width:16px;">${i + 1}.</span>
                                <div>
                                    <div style="font-weight:700; color:var(--color-gray-800);">${a.name}</div>
                                    <div style="color:var(--color-gray-400); font-family:monospace; font-size:0.75rem;">${a.id}</div>
                                </div>
                            </div>
                        `).join("")}
                        ${usedAssets.length === 0 ? `<p style="color:var(--color-gray-400); font-size:0.8rem; text-align:center; padding:12px;">No data</p>` : ''}
                    </div>
                </div>

                <!-- Idle Assets -->
                <div class="action-card">
                    <h4 style="font-size:0.875rem; font-weight:700; margin-bottom:12px; color:var(--color-gray-700);">Idle Assets</h4>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${idleAssets.map(a => `
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; padding:6px 8px; background:var(--color-gray-50); border-radius:var(--radius-sm); border:1px solid var(--color-gray-100);">
                                <div>
                                    <div style="font-weight:700; color:var(--color-gray-800);">${a.name}</div>
                                    <div style="color:var(--color-gray-400); font-family:monospace; font-size:0.75rem;">${a.id}</div>
                                </div>
                                <span class="badge badge-available" style="font-size:0.65rem;">Free</span>
                            </div>
                        `).join("")}
                        ${idleAssets.length === 0 ? `<p style="color:var(--color-gray-400); font-size:0.8rem; text-align:center; padding:12px;">None</p>` : ''}
                    </div>
                </div>

                <!-- Near Retirement -->
                <div class="action-card">
                    <h4 style="font-size:0.875rem; font-weight:700; margin-bottom:12px; color:var(--color-gray-700);">Near Retirement (3+ yrs)</h4>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${nearRetirement.map(a => `
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; padding:6px 8px; background:#fff7ed; border-radius:var(--radius-sm); border:1px solid #fed7aa;">
                                <div>
                                    <div style="font-weight:700; color:var(--color-gray-800);">${a.name}</div>
                                    <div style="color:var(--color-gray-400); font-size:0.75rem;">${a.acquisitionDate}</div>
                                </div>
                                <span style="font-size:0.7rem; font-weight:700; color:#c2410c;">⚠ Old</span>
                            </div>
                        `).join("")}
                        ${nearRetirement.length === 0 ? `<p style="color:var(--color-gray-400); font-size:0.8rem; text-align:center; padding:12px;">None flagged</p>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}
