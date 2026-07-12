/* ========================================================
   AssetFlow - Maintenance Kanban Board
   ======================================================== */

import { Store } from "../store.js";
import { showToast, openModal } from "../app.js";

const KANBAN_COLS = [
    { id: "Pending", label: "Pending", color: "#f59e0b" },
    { id: "Approved", label: "Approved", color: "#3b82f6" },
    { id: "Technician Assigned", label: "Technician Assigned", color: "#8b5cf6" },
    { id: "In Progress", label: "In Progress", color: "#10b981" },
    { id: "Resolved", label: "Resolved", color: "#6b7280" }
];

let pageTickets = [];
let pageAssets = [];
let pageEmployees = [];

export async function renderMaintenance(container, user) {
    container.innerHTML = `<div class="loading-state"><i data-lucide="loader-2" class="spin-icon"></i><div>Loading maintenance...</div></div>`;
    lucide.createIcons();

    [pageTickets, pageAssets, pageEmployees] = await Promise.all([
        Store.fetchMaintenance(),
        Store.fetchAssets(),
        Store.fetchEmployees()
    ]);

    container.innerHTML = `
        <div class="maintenance-wrapper page-shell">
            <div class="page-hero compact">
                <div>
                    <p class="page-eyebrow">Repairs & service</p>
                    <h2 class="page-title">Maintenance Tracker</h2>
                    <p class="page-subtitle">Route requests through approval before work begins.</p>
                </div>
                <button class="btn btn-primary" id="trigger-maintenance-btn">
                    <i data-lucide="plus"></i> Raise Request
                </button>
            </div>

            <div class="kanban-board">
                ${KANBAN_COLS.map(col => `
                    <div class="kanban-column">
                        <div class="kanban-column-header">
                            <span><span class="kanban-dot" style="background:${col.color}"></span> ${col.label}</span>
                            <span class="count-badge" id="col-count-${col.id.replace(/ /g, "-")}">0</span>
                        </div>
                        <div class="kanban-cards-list" id="kanban-col-${col.id.replace(/ /g, "-")}"></div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;

    container.querySelector("#trigger-maintenance-btn").addEventListener("click", () => openMaintenanceModal(user));
    renderKanbanCards(user);
    lucide.createIcons();
}

function renderKanbanCards(user) {
    KANBAN_COLS.forEach(col => {
        const colId = col.id.replace(/ /g, "-");
        const colCards = document.getElementById(`kanban-col-${colId}`);
        const colCount = document.getElementById(`col-count-${colId}`);
        if (!colCards || !colCount) return;

        const colTickets = pageTickets.filter(t => t.status === col.id);
        colCount.textContent = colTickets.length;

        if (!colTickets.length) {
            colCards.innerHTML = `<div class="kanban-empty">No tickets</div>`;
            return;
        }

        colCards.innerHTML = colTickets.map(t => `
            <div class="kanban-card ${col.id.toLowerCase().replace(/ /g, "-")}" data-id="${t.id}">
                <div class="kanban-card-title-row">
                    <span class="asset-tag-chip">${t.id}</span>
                    <span class="badge ${priorityBadge(t.priority)}">${t.priority}</span>
                </div>
                <div class="kanban-card-title">${t.assetName}</div>
                <div class="kanban-card-desc">${t.issueDescription}</div>
                <div class="kanban-card-meta">
                    <span>${t.reportedDate || "—"}</span>
                    ${t.technicianName ? `<span>${t.technicianName}</span>` : ""}
                </div>
            </div>
        `).join("");

        colCards.querySelectorAll(".kanban-card").forEach(card => {
            card.addEventListener("click", () => openTicketModal(card.dataset.id, user));
        });
    });
}

function priorityBadge(priority) {
    if (priority === "High" || priority === "Critical") return "badge-cancelled";
    if (priority === "Medium") return "badge-allocated";
    return "badge-available";
}

function openMaintenanceModal(user) {
    openModal("Raise Maintenance Request", `
        <div class="form-row">
            <div class="form-group">
                <label for="maint-asset">Asset</label>
                <select id="maint-asset" class="form-control">
                    <option value="">Select asset...</option>
                    ${pageAssets.map(a => `<option value="${a.id}">${a.id} · ${a.name}</option>`).join("")}
                </select>
            </div>
            <div class="form-group">
                <label for="maint-priority">Priority</label>
                <select id="maint-priority" class="form-control">
                    <option value="Low">Low</option>
                    <option value="Medium" selected>Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="maint-issue">Issue Description</label>
            <textarea id="maint-issue" class="form-control" rows="3" placeholder="Describe the problem..."></textarea>
        </div>
    `, async () => {
        const assetId = document.getElementById("maint-asset").value;
        const issue = document.getElementById("maint-issue").value.trim();
        const priority = document.getElementById("maint-priority").value;

        if (!assetId || !issue) {
            showToast("Please select an asset and describe the issue.", "warning");
            return false;
        }

        const res = await Store.raiseMaintenance(assetId, issue, priority, user.id, user.name);
        if (!res.success) {
            showToast(res.message || "Failed to raise request.", "danger");
            return false;
        }

        showToast("Maintenance request submitted.", "success");
        pageTickets = await Store.fetchMaintenance();
        renderKanbanCards(user);
        return true;
    }, "Submit");
}

function openTicketModal(ticketId, user) {
    const t = pageTickets.find(x => x.id === ticketId);
    if (!t) return;

    const colIdx = KANBAN_COLS.findIndex(c => c.id === t.status);
    const nextCol = KANBAN_COLS[colIdx + 1];
    const canManage = user.role === "Admin" || user.role === "Asset Manager";

    openModal(`${t.id} — ${t.assetName}`, `
        <div class="detail-panel">
            <div class="detail-panel-head">
                <strong>${t.assetName}</strong>
                <span class="badge ${priorityBadge(t.priority)}">${t.priority}</span>
            </div>
            <p>${t.issueDescription}</p>
            <small class="muted-text">Reported by ${t.reportedByName || "—"} on ${t.reportedDate || "—"}</small>
        </div>
        ${t.status !== "Resolved" && canManage && nextCol ? `
            <div class="form-group">
                <label>Next step: <strong>${nextCol.label}</strong></label>
            </div>
            ${nextCol.id === "Technician Assigned" ? `
                <div class="form-group">
                    <label for="tech-assign">Assign Technician</label>
                    <select id="tech-assign" class="form-control">
                        <option value="">Select technician...</option>
                        ${pageEmployees.filter(e => e.status === "Active").map(e => `<option value="${e.name}">${e.name}</option>`).join("")}
                    </select>
                </div>
            ` : ""}
            <div class="form-group">
                <label for="ticket-note">Add Note</label>
                <textarea id="ticket-note" class="form-control" rows="2" placeholder="Progress note..."></textarea>
            </div>
        ` : t.status === "Resolved" ? `<p class="success-text">This ticket has been resolved.</p>` : `<p class="muted-text">Awaiting manager action.</p>`}
    `, async () => {
        if (t.status === "Resolved" || !canManage || !nextCol) return true;

        const note = document.getElementById("ticket-note")?.value?.trim() || "";
        const technician = document.getElementById("tech-assign")?.value || t.technicianName;

        if (nextCol.id === "Technician Assigned" && !technician) {
            showToast("Please assign a technician.", "warning");
            return false;
        }

        const res = await Store.updateMaintenanceStatus(t.id, nextCol.id, technician, note, user.name);
        if (!res.success) {
            showToast(res.message || "Update failed.", "danger");
            return false;
        }

        showToast(`Ticket moved to ${nextCol.label}.`, "success");
        pageTickets = await Store.fetchMaintenance();
        pageAssets = await Store.fetchAssets();
        renderKanbanCards(user);
        return true;
    }, t.status !== "Resolved" && canManage && nextCol ? `Move to ${nextCol.label}` : "Close");
}
