/* ======================================================
   AssetFlow - Asset Audit Cycle Checklist (Wireframe: Screen 8)
   ====================================================== */

import { Store } from "../store.js";
import { showToast, openModal } from "../app.js";

export function renderAudits(container, user) {
    const audits = Store.getAudits();
    const activeAudit = audits.find(a => a.status === "Active");

    container.innerHTML = `
        <div class="audits-wrapper">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                <h3 style="font-size:1.25rem; font-weight:700;">Audit & Verification</h3>
                ${(user.role === 'Admin' || user.role === 'Asset Manager') ? `
                    <button class="btn" id="start-audit-btn" style="border:2px solid var(--color-gray-900); background-color:#e2f2e9; color:#065f46; font-weight:700;">
                        + Start Audit Cycle
                    </button>
                ` : ''}
            </div>

            ${activeAudit ? renderActiveAudit(activeAudit, user) : renderNoAudit()}

            <!-- Discrepancy banner -->
            <div id="discrepancy-banner" style="display:none; margin-bottom:18px;"></div>

            <!-- Past Audits -->
            <div class="action-card" style="margin-top:24px;">
                <h4 style="font-size:0.925rem; font-weight:700; margin-bottom:12px;">Past Audit Cycles</h4>
                ${renderPastAudits(audits.filter(a => a.status !== "Active"), user)}
            </div>
        </div>
    `;

    if (user.role === 'Admin' || user.role === 'Asset Manager') {
        const startBtn = container.querySelector("#start-audit-btn");
        if (startBtn) {
            startBtn.addEventListener("click", () => openStartAuditModal(user));
        }
    }

    // Hook verification buttons
    container.querySelectorAll(".verify-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            handleVerify(btn.dataset.assetId, btn.dataset.result, activeAudit, user);
        });
    });

    updateDiscrepancyBanner(activeAudit);
}

function renderActiveAudit(audit, user) {
    const assets = Store.getAssets();
    const checklist = audit.checklist || [];

    const verified = checklist.filter(c => c.status === "Verified").length;
    const missing  = checklist.filter(c => c.status === "Missing").length;
    const damaged  = checklist.filter(c => c.status === "Damaged").length;
    const pending  = checklist.filter(c => !c.status || c.status === "Pending").length;
    const total = checklist.length;

    const progressPct = total > 0 ? Math.round(((verified + missing + damaged) / total) * 100) : 0;

    return `
        <div class="action-card" style="margin-bottom:18px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                <div>
                    <div style="font-size:1rem; font-weight:700; color:var(--color-gray-900);">${audit.name}</div>
                    <div style="font-size:0.8rem; color:var(--color-gray-500); margin-top:2px;">Started ${audit.startDate} · ${audit.scope || "All assets"}</div>
                </div>
                <span class="badge badge-allocated" style="font-size:0.75rem;">Active</span>
            </div>

            <!-- Progress bar -->
            <div style="background:var(--color-gray-200); border-radius:9999px; height:8px; margin-bottom:10px; overflow:hidden;">
                <div style="background:var(--color-primary); height:100%; border-radius:9999px; width:${progressPct}%; transition:width 0.4s;"></div>
            </div>
            <div style="display:flex; gap:18px; font-size:0.8rem; margin-bottom:18px;">
                <span style="color:#10b981; font-weight:700;">✓ ${verified} Verified</span>
                <span style="color:#ef4444; font-weight:700;">✗ ${missing} Missing</span>
                <span style="color:#f59e0b; font-weight:700;">⚠ ${damaged} Damaged</span>
                <span style="color:var(--color-gray-400);">○ ${pending} Pending</span>
            </div>

            <!-- Verification Checklist Table -->
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Asset Tag</th>
                            <th>Name</th>
                            <th>Expected Holder</th>
                            <th>Verification</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${checklist.map(item => {
                            const asset = assets.find(a => a.id === item.assetId);
                            const isDone = item.status && item.status !== "Pending";
                            return `
                                <tr style="${isDone ? 'opacity:0.7;' : ''}">
                                    <td style="font-family:monospace; font-weight:700;">${item.assetId}</td>
                                    <td>${asset ? asset.name : item.assetId}</td>
                                    <td>${item.expectedHolder || (asset ? asset.currentHolderName || '—' : '—')}</td>
                                    <td>
                                        ${!isDone ? `
                                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                                <button class="btn btn-sm verify-btn" data-asset-id="${item.assetId}" data-result="Verified" style="background:#dcfce7; color:#15803d; border:1px solid #86efac; font-size:0.75rem; font-weight:700;">✓ Verified</button>
                                                <button class="btn btn-sm verify-btn" data-asset-id="${item.assetId}" data-result="Missing"  style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; font-size:0.75rem; font-weight:700;">✗ Missing</button>
                                                <button class="btn btn-sm verify-btn" data-asset-id="${item.assetId}" data-result="Damaged"  style="background:#fef3c7; color:#b45309; border:1px solid #fcd34d; font-size:0.75rem; font-weight:700;">⚠ Damaged</button>
                                            </div>
                                        ` : `<span style="font-size:0.8rem; color:var(--color-gray-400); font-style:italic;">Already recorded</span>`}
                                    </td>
                                    <td>
                                        ${item.status && item.status !== "Pending"
                                            ? `<span class="badge ${item.status === 'Verified' ? 'badge-available' : item.status === 'Missing' ? 'badge-cancelled' : 'badge-allocated'}">${item.status}</span>`
                                            : `<span class="badge" style="background:var(--color-gray-200); color:var(--color-gray-500);">Pending</span>`
                                        }
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>

            ${(user.role === 'Admin' || user.role === 'Asset Manager') && pending === 0 ? `
                <div style="margin-top:16px; text-align:right;">
                    <button id="close-audit-btn" class="btn btn-primary" style="background:var(--color-gray-900); color:white;">Close & Archive Audit</button>
                </div>
            ` : ''}
        </div>
    `;
}

function renderNoAudit() {
    return `
        <div class="action-card" style="text-align:center; padding:48px; background:var(--color-gray-50);">
            <i data-lucide="clipboard-check" style="width:48px; height:48px; color:var(--color-gray-300); margin-bottom:12px;"></i>
            <h4 style="color:var(--color-gray-500); font-weight:600;">No Active Audit Cycle</h4>
            <p style="color:var(--color-gray-400); font-size:0.875rem; margin-top:8px;">Start an audit cycle to begin verifying assets across your organization.</p>
        </div>
    `;
}

function renderPastAudits(pastAudits, user) {
    if (!pastAudits.length) {
        return `<p style="text-align:center; color:var(--color-gray-400); padding:20px;">No completed audits yet.</p>`;
    }

    return `
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${pastAudits.map(a => {
                const checklist = a.checklist || [];
                const verified = checklist.filter(c => c.status === "Verified").length;
                const missing  = checklist.filter(c => c.status === "Missing").length;
                const damaged  = checklist.filter(c => c.status === "Damaged").length;
                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border:1px solid var(--color-gray-200); border-radius:var(--radius-md); font-size:0.875rem;">
                        <div>
                            <div style="font-weight:700; color:var(--color-gray-900);">${a.name}</div>
                            <div style="color:var(--color-gray-500); font-size:0.8rem;">${a.startDate} → ${a.endDate || 'Ongoing'} · ${checklist.length} assets</div>
                        </div>
                        <div style="display:flex; gap:16px; font-size:0.8rem; font-weight:700;">
                            <span style="color:#10b981;">✓ ${verified}</span>
                            <span style="color:#ef4444;">✗ ${missing}</span>
                            <span style="color:#f59e0b;">⚠ ${damaged}</span>
                        </div>
                        <span class="badge ${a.status === 'Completed' ? 'badge-available' : 'badge-cancelled'}">${a.status}</span>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function handleVerify(assetId, result, audit, user) {
    const audits = Store.getAudits();
    const targetAudit = audits.find(a => a.id === audit.id);
    const item = targetAudit.checklist.find(c => c.assetId === assetId);
    if (!item) return;

    item.status = result;
    item.verifiedBy = user.name;
    item.verifiedDate = new Date().toISOString().split("T")[0];
    Store.saveAudits(audits);

    Store.logActivity(user.name, `Asset ${result}`, `${assetId} marked ${result} in audit ${audit.name}`);
    showToast(`${assetId} marked as ${result}.`, result === "Verified" ? "success" : "warning");

    // Re-render
    renderAudits(document.querySelector(".audits-wrapper")?.closest(".screen-content") || document.querySelector("[id^='screen-']"), user);
}

function updateDiscrepancyBanner(audit) {
    const banner = document.getElementById("discrepancy-banner");
    if (!banner || !audit) return;

    const checklist = audit.checklist || [];
    const discrepancies = checklist.filter(c => c.status === "Missing" || c.status === "Damaged");

    if (discrepancies.length > 0) {
        banner.style.display = "block";
        banner.innerHTML = `
            <div style="background:#fefce8; border:1px solid #fde047; border-radius:var(--radius-md); padding:12px 16px; display:flex; gap:10px; align-items:flex-start; font-size:0.875rem;">
                <i data-lucide="alert-triangle" style="width:18px; height:18px; color:#b45309; flex-shrink:0; margin-top:1px;"></i>
                <div>
                    <strong style="color:#92400e;">Discrepancy Report:</strong>
                    <span style="color:#78350f; margin-left:6px;">${discrepancies.length} asset${discrepancies.length !== 1 ? 's' : ''} flagged — ${discrepancies.filter(d => d.status === 'Missing').length} missing, ${discrepancies.filter(d => d.status === 'Damaged').length} damaged</span>
                </div>
            </div>
        `;
        lucide.createIcons();
    }
}

function openStartAuditModal(user) {
    const assets = Store.getAssets();
    const departments = Store.getDepartments();

    const modalHtml = `
        <div class="form-group">
            <label for="audit-name">Audit Name</label>
            <input type="text" id="audit-name" class="form-control" placeholder="e.g. Q3 2025 Physical Audit">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="audit-scope-dept">Scope by Department (optional)</label>
                <select id="audit-scope-dept" class="form-control">
                    <option value="">All Departments</option>
                    ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join("")}
                </select>
            </div>
            <div class="form-group">
                <label for="audit-start">Start Date</label>
                <input type="date" id="audit-start" class="form-control" value="${new Date().toISOString().split('T')[0]}">
            </div>
        </div>
        <div style="font-size:0.8rem; color:var(--color-gray-500); margin-top:4px;">
            A checklist will be generated for all matching assets.
        </div>
    `;

    openModal("Start Audit Cycle", modalHtml, () => {
        const name = document.getElementById("audit-name").value.trim();
        const deptId = document.getElementById("audit-scope-dept").value;
        const startDate = document.getElementById("audit-start").value;

        if (!name) {
            showToast("Please provide an audit name.", "warning");
            return false;
        }

        const scopeAssets = deptId
            ? assets.filter(a => {
                const emps = Store.getEmployees();
                const holder = emps.find(e => e.id === a.currentHolderId);
                return holder && holder.departmentId === deptId;
              })
            : assets;

        if (scopeAssets.length === 0) {
            showToast("No assets in scope. Add assets first.", "warning");
            return false;
        }

        const audits = Store.getAudits();
        audits.push({
            id: `AUD-${Date.now().toString().slice(-5)}`,
            name,
            scope: deptId ? departments.find(d => d.id === deptId)?.name : "All assets",
            startDate,
            endDate: null,
            status: "Active",
            createdBy: user.name,
            checklist: scopeAssets.map(a => ({
                assetId: a.id,
                expectedHolder: a.currentHolderName || "—",
                status: "Pending",
                verifiedBy: null,
                verifiedDate: null
            }))
        });
        Store.saveAudits(audits);

        Store.logActivity(user.name, "Audit Started", `${name} — ${scopeAssets.length} assets in scope`);
        showToast(`Audit "${name}" started with ${scopeAssets.length} assets.`, "success");

        const mainEl = document.querySelector(".audits-wrapper")?.closest("[class*='screen']") || document.querySelector("main > div");
        if (mainEl) renderAudits(mainEl, user);
        return true;
    }, "Start Audit");
}
