/* ========================================================
   AssetFlow - Maintenance Kanban Board (Wireframe: Screen 7)
   ======================================================== */

import { Store } from "../store.js";
import { showToast, openModal } from "../app.js";

const KANBAN_COLS = [
    { id: "Pending",             label: "Pending",              color: "#f59e0b", bg: "#fffbeb" },
    { id: "Approved",            label: "Approved",             color: "#3b82f6", bg: "#eff6ff" },
    { id: "Technician Assigned", label: "Technician assigned",  color: "#8b5cf6", bg: "#f5f3ff" },
    { id: "In Progress",         label: "In progress",          color: "#10b981", bg: "#ecfdf5" },
    { id: "Resolved",            label: "Resolved",             color: "#6b7280", bg: "#f9fafb" }
];

export function renderMaintenance(container, user) {
    container.innerHTML = `
        <div class="maintenance-wrapper">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                <h3 style="font-size:1.25rem; font-weight:700;">Maintenance Tracker</h3>
                <button class="btn" id="trigger-maintenance-btn" style="border:2px solid var(--color-gray-900); background-color:#e2f2e9; color:#065f46; font-weight:700;">
                    + Raise Request
                </button>
            </div>

            <!-- Kanban Board -->
            <div class="kanban-board" style="display:flex; gap:14px; overflow-x:auto; padding-bottom:12px;">
                ${KANBAN_COLS.map(col => `
                    <div class="kanban-column" data-col="${col.id}" style="
                        min-width:200px; max-width:220px; flex:1;
                        background:var(--color-gray-50);
                        border:1px solid var(--color-gray-200);
                        border-radius:var(--radius-md);
                        overflow:hidden;
                    ">
                        <div style="padding:10px 14px; border-bottom:1px solid var(--color-gray-200); background:${col.bg};">
                            <div style="display:flex; align-items:center; gap:6px;">
                                <div style="width:10px; height:10px; border-radius:50%; background:${col.color};"></div>
                                <span style="font-size:0.825rem; font-weight:700; color:var(--color-gray-800);">${col.label}</span>
                            </div>
                            <span class="kanban-col-count" id="col-count-${col.id.replace(/ /g,'-')}" style="font-size:0.75rem; color:var(--color-gray-500); margin-left:16px;"></span>
                        </div>
                        <div class="kanban-cards" id="kanban-col-${col.id.replace(/ /g,'-')}" style="padding:10px; min-height:100px; display:flex; flex-direction:column; gap:10px;">
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;

    container.querySelector("#trigger-maintenance-btn").addEventListener("click", () => {
        openMaintenanceModal(user);
    });

    renderKanbanCards(user);
}

function renderKanbanCards(user) {
    const tickets = Store.getMaintenance();

    KANBAN_COLS.forEach(col => {
        const colId = col.id.replace(/ /g, '-');
        const colCards = document.getElementById(`kanban-col-${colId}`);
        const colCount = document.getElementById(`col-count-${colId}`);
        if (!colCards || !colCount) return;

        const colTickets = tickets.filter(t => t.status === col.id);
        colCount.textContent = `${colTickets.length} ticket${colTickets.length !== 1 ? 's' : ''}`;

        if (colTickets.length === 0) {
            colCards.innerHTML = `<div style="font-size:0.8rem; color:var(--color-gray-400); text-align:center; padding:24px 8px; font-style:italic;">No tickets</div>`;
            return;
        }

        colCards.innerHTML = colTickets.map(t => `
            <div class="kanban-card" data-id="${t.id}" style="
                background:white;
                border:1px solid var(--color-gray-200);
                border-radius:var(--radius-md);
                padding:10px 12px;
                cursor:pointer;
                transition:box-shadow 0.15s, border-color 0.15s;
                border-left:3px solid ${col.color};
            " onmouseenter="this.style.boxShadow='var(--shadow-md)'; this.style.borderColor='${col.color}';"
               onmouseleave="this.style.boxShadow='none'; this.style.borderColor='var(--color-gray-200)'; this.style.borderLeftColor='${col.color}';">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                    <span style="font-family:monospace; font-size:0.75rem; font-weight:700; color:${col.color};">${t.id}</span>
                    <span class="badge ${priorityBadge(t.priority)}" style="font-size:0.65rem;">${t.priority}</span>
                </div>
                <div style="font-size:0.85rem; font-weight:700; color:var(--color-gray-900); margin-bottom:4px; line-height:1.3;">${t.assetName}</div>
                <div style="font-size:0.775rem; color:var(--color-gray-500); margin-bottom:6px; line-height:1.4;">${t.issueDescription}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--color-gray-400);">
                    <span>${t.reportedDate || t.dateRaised || '—'}</span>
                    ${t.technicianName || t.technician ? `<span style="color:var(--color-gray-600);">👨‍🔧 ${t.technicianName || t.technician}</span>` : ''}
                </div>
            </div>
        `).join("");

        // Hook card click → progression modal
        colCards.querySelectorAll(".kanban-card").forEach(card => {
            card.addEventListener("click", () => {
                const ticketId = card.dataset.id;
                openTicketModal(ticketId, user);
            });
        });
    });

    lucide.createIcons();
}

function priorityBadge(priority) {
    if (priority === "High" || priority === "Critical") return "badge-cancelled";
    if (priority === "Medium") return "badge-allocated";
    return "badge-available";
}

function openMaintenanceModal(user) {
    const assets = Store.getAssets();
    const modalHtml = `
        <div class="form-row">
            <div class="form-group">
                <label for="maint-asset">Asset</label>
                <select id="maint-asset" class="form-control">
                    <option value="">Select asset...</option>
                    ${assets.map(a => `<option value="${a.id}">${a.id} · ${a.name}</option>`).join("")}
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
    `;

    openModal("Raise Maintenance Request", modalHtml, () => {
        const assetId = document.getElementById("maint-asset").value;
        const issue = document.getElementById("maint-issue").value.trim();
        const priority = document.getElementById("maint-priority").value;

        if (!assetId || !issue) {
            showToast("Please select an asset and describe the issue.", "warning");
            return false;
        }

        const asset = assets.find(a => a.id === assetId);
        const tickets = Store.getMaintenance();
        const ticketId = `MNT-${(tickets.length + 1).toString().padStart(3,"0")}`;

        tickets.push({
            id: ticketId,
            assetId,
            assetName: asset ? asset.name : assetId,
            issueDescription: issue,
            priority,
            status: "Pending",
            reportedBy: user.id,
            reportedByName: user.name,
            reportedDate: new Date().toISOString().split("T")[0],
            technicianId: null,
            technicianName: null,
            notes: [],
            resolvedDate: null
        });
        Store.saveMaintenance(tickets);

        // Update asset status
        const assetList = Store.getAssets();
        const a = assetList.find(x => x.id === assetId);
        if (a) {
            a.status = "Under Maintenance";
            a.history.push({ date: new Date().toISOString().split("T")[0], action: "Maintenance Raised", user: user.name, details: issue });
            Store.saveAssets(assetList);
        }

        Store.logActivity(user.name, "Maintenance Request", `${asset?.name || assetId}: ${issue}`);
        showToast(`Maintenance ticket ${ticketId} raised.`, "success");
        renderKanbanCards(user);
        return true;
    }, "Submit");
}

function openTicketModal(ticketId, user) {
    const tickets = Store.getMaintenance();
    const t = tickets.find(x => x.id === ticketId);
    if (!t) return;

    const colIdx = KANBAN_COLS.findIndex(c => c.id === t.status);
    const nextCol = KANBAN_COLS[colIdx + 1];
    const employees = Store.getEmployees();

    const modalHtml = `
        <div style="background:var(--color-gray-50); border:1px solid var(--color-gray-200); border-radius:var(--radius-md); padding:14px; margin-bottom:16px; font-size:0.875rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <strong>${t.assetName}</strong>
                <span class="badge ${priorityBadge(t.priority)}">${t.priority}</span>
            </div>
            <div style="color:var(--color-gray-600); margin-bottom:6px;">${t.issueDescription}</div>
            <div style="color:var(--color-gray-400); font-size:0.8rem;">Reported by ${t.reportedByName || t.raisedByName || '—'} on ${t.reportedDate || t.dateRaised || '—'}</div>
        </div>

        ${t.status !== "Resolved" ? `
            ${nextCol ? `
                <div class="form-group">
                    <label>Move to: <strong>${nextCol.label}</strong></label>
                </div>
            ` : ''}
            ${t.status === "Approved" ? `
                <div class="form-group">
                    <label for="tech-assign">Assign Technician</label>
                    <select id="tech-assign" class="form-control">
                        <option value="">Select technician...</option>
                        ${employees.filter(e => e.status === 'Active').map(e => `<option value="${e.id}" ${e.id === t.technicianId ? 'selected' : ''}>${e.name}</option>`).join("")}
                    </select>
                </div>
            ` : ''}
            <div class="form-group">
                <label for="ticket-note">Add Note</label>
                <textarea id="ticket-note" class="form-control" rows="2" placeholder="Progress note..."></textarea>
            </div>
        ` : `<div style="color:var(--color-success); font-weight:700; text-align:center; padding:20px;">✓ This ticket has been resolved.</div>`}
    `;

    const confirmLabel = t.status !== "Resolved" && nextCol ? `Move to ${nextCol.label}` : "Close";

    openModal(`${t.id} — ${t.assetName}`, modalHtml, () => {
        if (t.status === "Resolved") return true;
        if (!nextCol) return true;

        const note = document.getElementById("ticket-note")?.value?.trim() || "";
        const techId = document.getElementById("tech-assign")?.value || t.technicianId;

        if (nextCol.id === "Technician Assigned" && !techId) {
            showToast("Please assign a technician.", "warning");
            return false;
        }

        if (techId) {
            const emp = employees.find(e => e.id === techId);
            t.technicianId = techId;
            t.technicianName = emp ? emp.name : techId;
        }

        if (note) {
            t.notes.push({ date: new Date().toISOString().split("T")[0], user: user.name, text: note });
        }

        t.status = nextCol.id;
        if (nextCol.id === "Resolved") {
            t.resolvedDate = new Date().toISOString().split("T")[0];
            // Update asset status back
            const assetList = Store.getAssets();
            const a = assetList.find(x => x.id === t.assetId);
            if (a && a.status === "Under Maintenance") {
                a.status = "Available";
                a.history.push({ date: t.resolvedDate, action: "Maintenance Resolved", user: user.name, details: note || "Resolved" });
                Store.saveAssets(assetList);
            }
        }

        Store.saveMaintenance(tickets);
        Store.logActivity(user.name, "Ticket Updated", `${t.id} moved to ${nextCol.label}`);
        showToast(`Ticket moved to ${nextCol.label}.`, "success");
        renderKanbanCards(user);
        return true;
    }, confirmLabel);
}
