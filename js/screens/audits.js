/* ==========================================================
   AssetFlow - Verification & Audits Screen Component
   ========================================================== */

import { Store } from "../store.js";
import { openModal, showToast } from "../app.js";

let selectedAuditId = null; // Currently inspecting audit details

export function renderAudits(container, user) {
    const audits = Store.getAudits();

    if (selectedAuditId) {
        renderAuditDetail(container, selectedAuditId, user);
        return;
    }

    container.innerHTML = `
        <div class="audits-wrapper">
            <!-- Action bar -->
            <div class="page-action-bar">
                <h3>Verification Audit Cycles</h3>
                ${(user.role === 'Admin') ? `
                    <button class="btn btn-primary" id="launch-audit-btn">
                        <i data-lucide="plus"></i> New Audit Cycle
                    </button>
                ` : ''}
            </div>

            <!-- Audit Cycles List -->
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
                ${audits.length === 0 ? `
                    <div class="action-card" style="grid-column: 1/-1; text-align:center; padding: 48px; border: 1px dashed var(--color-gray-300);">
                        <p style="color:var(--color-gray-500);">No audit cycles launched yet.</p>
                    </div>
                ` : audits.map(au => {
                    const progress = calculateProgress(au);
                    return `
                        <div class="action-card" style="display:flex; flex-direction:column; justify-content:space-between;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                    <span class="badge ${au.status === 'Open' ? 'badge-available' : 'badge-completed'}">${au.status}</span>
                                    <span style="font-size:0.75rem; color:var(--color-gray-400);">ID: ${au.id}</span>
                                </div>
                                <h4 style="font-size:1.1rem; font-weight:700; margin-bottom:4px; color:var(--color-gray-900);">${au.name}</h4>
                                <p style="font-size:0.8rem; color:var(--color-gray-500); margin-bottom:12px;">Scope: ${au.scopeType} (${au.scopeValue})</p>
                                
                                <div style="font-size:0.8rem; margin-bottom:14px; color:var(--color-gray-700);">
                                    <div>Auditor: <strong>${au.auditorNames}</strong></div>
                                    <div>Started: <strong>${au.startDate}</strong></div>
                                    ${au.endDate ? `<div>Completed: <strong>${au.endDate}</strong></div>` : ''}
                                </div>

                                <!-- Progress bar -->
                                <div style="margin-bottom:12px;">
                                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px; color:var(--color-gray-500);">
                                        <span>Checklist progress</span>
                                        <span>${progress.percent}% (${progress.done}/${progress.total})</span>
                                    </div>
                                    <div style="height:6px; background-color:var(--color-gray-200); border-radius:var(--radius-full); overflow:hidden;">
                                        <div style="height:100%; width:${progress.percent}%; background-color:var(--color-primary); transition: width 0.3s;"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <button class="btn btn-secondary btn-sm inspect-audit-btn" data-id="${au.id}" style="width:100%;">
                                ${au.status === 'Open' ? 'Perform Verification Checklist' : 'View Audit Report & Flags'}
                            </button>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;

    if (user.role === 'Admin') {
        container.querySelector("#launch-audit-btn").addEventListener("click", () => openLaunchAuditModal(user));
    }

    container.querySelectorAll(".inspect-audit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            selectedAuditId = btn.dataset.id;
            renderAudits(container, user);
        });
    });

    lucide.createIcons();
}

function calculateProgress(audit) {
    const total = audit.items.length;
    if (total === 0) return { percent: 0, done: 0, total: 0 };
    const done = audit.items.filter(i => i.status !== "Pending").length;
    return {
        percent: Math.round((done / total) * 100),
        done,
        total
    };
}

/* ==========================================================
   Audit Detailed Checklist & Verification Workspace
   ========================================================== */
function renderAuditDetail(container, auditId, user) {
    const audits = Store.getAudits();
    const audit = audits.find(a => a.id === auditId);
    
    if (!audit) {
        selectedAuditId = null;
        renderAudits(container, user);
        return;
    }

    // Check if current user is the assigned auditor
    const isAuditor = audit.auditorIds.includes(user.id) || user.role === "Admin";
    const isOpen = audit.status === "Open";

    container.innerHTML = `
        <div class="audit-details-view">
            <!-- Back trigger -->
            <button class="btn btn-secondary btn-sm" id="back-audits-list-btn" style="margin-bottom:20px;">
                <i data-lucide="arrow-left" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"></i> Back to Cycles
            </button>

            <!-- Summary header -->
            <div class="action-card" style="margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h2 style="font-weight:800; font-size:1.4rem;">${audit.name}</h2>
                        <p style="color:var(--color-gray-500); font-size:0.875rem;">Scope: ${audit.scopeType} (${audit.scopeValue}) • Assigned Auditor: <strong>${audit.auditorNames}</strong></p>
                    </div>
                    ${(isOpen && user.role === 'Admin') ? `
                        <button class="btn btn-danger" id="close-audit-btn">
                            <i data-lucide="lock"></i> Close Cycle & Generate Report
                        </button>
                    ` : ''}
                </div>

                ${!isOpen ? `
                    <div style="background-color: var(--color-danger-light); padding:14px; border-radius:var(--radius-md); border:1px solid #fecaca; margin-top:14px;">
                        <h4 style="font-size:0.9rem; font-weight:700; color:#991b1b; display:flex; align-items:center; gap:6px; margin-bottom:6px;">
                            <i data-lucide="alert-triangle"></i> Closed Audit Cycle Discrepancy Report
                        </h4>
                        ${audit.discrepancies.length === 0 ? `
                            <p style="font-size:0.8rem; color:#991b1b;">Audit completed with zero discrepancies. All physical assets verified in stock.</p>
                        ` : `
                            <ul style="font-size:0.8rem; color:#991b1b; list-style:inside; padding-left:4px;">
                                ${audit.discrepancies.map(d => `
                                    <li style="margin-bottom:4px;">
                                        <strong>Asset ${d.assetId} (${d.assetName}):</strong> ${d.issue}. Details: ${d.notes || 'No description notes'}
                                    </li>
                                `).join("")}
                            </ul>
                        `}
                    </div>
                ` : ''}
            </div>

            <!-- Verification Items table -->
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Asset Tag</th>
                            <th>Asset Name</th>
                            <th>Current Registered Location</th>
                            <th>Verification Status</th>
                            <th>Verification Notes</th>
                            ${(isOpen && isAuditor) ? `<th style="text-align:right;">Verify Actions</th>` : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${audit.items.map(item => {
                            let sClass = "badge-pending";
                            if (item.status === "Verified") sClass = "badge-available";
                            else if (item.status === "Missing") sClass = "badge-lost";
                            else if (item.status === "Damaged") sClass = "badge-undermaintenance";

                            return `
                                <tr>
                                    <td><strong>${item.assetId}</strong></td>
                                    <td style="font-weight:600;">${item.assetName}</td>
                                    <td>${item.location}</td>
                                    <td><span class="badge ${sClass}">${item.status}</span></td>
                                    <td>
                                        ${isOpen && isAuditor ? `
                                            <input type="text" class="form-control item-notes-input" data-id="${item.assetId}" value="${item.notes || ''}" placeholder="Add check observations..." style="padding:6px; font-size:0.8rem;">
                                        ` : `
                                            <span style="font-size:0.85rem; color:var(--color-gray-600);">${item.notes || '<span class="color-gray-400">—</span>'}</span>
                                        `}
                                    </td>
                                    ${(isOpen && isAuditor) ? `
                                        <td style="text-align:right; white-space:nowrap;">
                                            <button class="btn btn-secondary btn-sm mark-item-btn" data-id="${item.assetId}" data-status="Verified" style="border-color:var(--color-success); color:var(--color-success);">Verify</button>
                                            <button class="btn btn-secondary btn-sm mark-item-btn" data-id="${item.assetId}" data-status="Missing" style="border-color:var(--color-danger); color:var(--color-danger);">Missing</button>
                                            <button class="btn btn-secondary btn-sm mark-item-btn" data-id="${item.assetId}" data-status="Damaged" style="border-color:var(--color-warning); color:var(--color-warning);">Damaged</button>
                                        </td>
                                    ` : ''}
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Back listener
    container.querySelector("#back-audits-list-btn").addEventListener("click", () => {
        selectedAuditId = null;
        renderAudits(container, user);
    });

    if (isOpen && isAuditor) {
        // Mark actions
        container.querySelectorAll(".mark-item-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const assetId = btn.dataset.id;
                const status = btn.dataset.status;
                const notesInput = container.querySelector(`.item-notes-input[data-id="${assetId}"]`);
                const notes = notesInput ? notesInput.value.trim() : "";

                const res = Store.updateAuditItem(auditId, assetId, status, notes, user.name);
                if (res.success) {
                    showToast(`Marked ${assetId} as ${status}.`, "success");
                    renderAuditDetail(container, auditId, user);
                } else {
                    showToast(res.message, "danger");
                }
            });
        });

        // Notes change listener (auto-saves note locally when typing ends)
        container.querySelectorAll(".item-notes-input").forEach(input => {
            input.addEventListener("blur", () => {
                const assetId = input.dataset.id;
                const notes = input.value.trim();
                const item = audit.items.find(i => i.assetId === assetId);
                
                const res = Store.updateAuditItem(auditId, assetId, item.status, notes, user.name);
                if (res.success) {
                    showToast(`Notes saved for ${assetId}.`, "info");
                }
            });
        });
    }

    if (isOpen && user.role === "Admin") {
        // Close audit cycle listener
        container.querySelector("#close-audit-btn").addEventListener("click", () => {
            const checklist = calculateProgress(audit);
            const isFinished = checklist.done === checklist.total;

            const confirmHtml = `
                <div style="text-align:center; padding:10px 0;">
                    <p style="font-weight:600; font-size:1.05rem; margin-bottom:8px;">Are you sure you want to close this audit cycle?</p>
                    ${!isFinished ? `
                        <p style="font-size:0.85rem; color:var(--color-danger); margin-bottom:12px; font-weight:500;">
                            Warning: ${checklist.total - checklist.done} items are still PENDING verification.
                            Closing the cycle now will freeze it and auto-generate the discrepancy logs.
                        </p>
                    ` : `
                        <p style="font-size:0.85rem; color:var(--color-gray-600); margin-bottom:12px;">
                            All ${checklist.total} items checked. Closing will freeze changes and resolve discrepancy states.
                        </p>
                    `}
                </div>
            `;

            openModal("Confirm Audit Freeze", confirmHtml, () => {
                const res = Store.closeAuditCycle(auditId, user.name);
                if (res.success) {
                    showToast(`Audit cycle closed. Discrepancy reports locked.`, "success");
                    renderAuditDetail(container, auditId, user);
                    return true;
                } else {
                    showToast(res.message, "danger");
                    return false;
                }
            });
        });
    }

    lucide.createIcons();
}

function openLaunchAuditModal(user) {
    const employees = Store.getEmployees().filter(e => e.status === "Active");
    const departments = Store.getDepartments().filter(d => d.status === "Active");
    const assets = Store.getAssets();

    // Group locations
    const locations = [...new Set(assets.map(a => a.location).filter(Boolean))];

    const modalHtml = `
        <div class="form-group">
            <label for="aud-name">Audit Cycle Name</label>
            <input type="text" id="aud-name" class="form-control" placeholder="e.g. 2026 IT Lab Equipment Inventory" required>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="aud-scope-type">Audit Scope Scope Type</label>
                <select id="aud-scope-type" class="form-control">
                    <option value="All">All Assets</option>
                    <option value="Department">By Department</option>
                    <option value="Location">By Physical Location</option>
                </select>
            </div>
            <div class="form-group">
                <label for="aud-scope-val">Scope Value</label>
                <select id="aud-scope-val" class="form-control" disabled>
                    <option value="">Select scope target...</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="aud-auditor">Assigned Auditor</label>
            <select id="aud-auditor" class="form-control" required>
                <option value="">Select Auditor Employee</option>
                ${employees.map(e => `<option value="${e.id}">${e.name} (${e.role})</option>`).join("")}
            </select>
        </div>
    `;

    openModal("Launch Master Verification Audit", modalHtml, () => {
        const name = document.getElementById("aud-name").value.trim();
        const type = document.getElementById("aud-scope-type").value;
        const val = document.getElementById("aud-scope-val").value;
        const auditorId = document.getElementById("aud-auditor").value;

        if (!name || !auditorId) {
            showToast("Audit Name and Auditor are required.", "danger");
            return false;
        }

        if (type !== "All" && !val) {
            showToast("Please choose a scope value matching selected type.", "danger");
            return false;
        }

        const res = Store.createAuditCycle(name, type, val, [auditorId], user.name);
        if (res.success) {
            showToast(`Audit cycle "${name}" launched successfully.`, "success");
            selectedAuditId = res.audit.id; // Focus on the new audit detail immediately
            renderAudits(document.getElementById("content-viewport"), user);
            return true;
        } else {
            showToast(res.message, "danger");
            return false;
        }
    });

    // Handle scope type dropdown change
    const scopeTypeSelect = document.getElementById("aud-scope-type");
    const scopeValSelect = document.getElementById("aud-scope-val");

    scopeTypeSelect.addEventListener("change", () => {
        const type = scopeTypeSelect.value;
        if (type === "All") {
            scopeValSelect.disabled = true;
            scopeValSelect.innerHTML = `<option value="">Entire Inventory</option>`;
            return;
        }

        scopeValSelect.disabled = false;
        if (type === "Department") {
            scopeValSelect.innerHTML = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join("");
        } else {
            scopeValSelect.innerHTML = locations.map(l => `<option value="${l}">${l}</option>`).join("");
        }
    });
}
