/* ==========================================================
   AssetFlow - Maintenance Workflow Screen Component
   ========================================================== */

import { Store } from "../store.js";
import { openModal, showToast } from "../app.js";

let currentFilter = "all"; // all, pending, active, resolved

export function renderMaintenance(container, user) {
    container.innerHTML = `
        <div class="maintenance-wrapper">
            <!-- Action Bar -->
            <div class="page-action-bar">
                <div class="search-filter-group">
                    <select id="filter-maintenance-status" class="form-control" style="width:auto; min-width:180px;">
                        <option value="all" ${currentFilter === 'all' ? 'selected' : ''}>All Tickets</option>
                        <option value="pending" ${currentFilter === 'pending' ? 'selected' : ''}>Pending Approval</option>
                        <option value="active" ${currentFilter === 'active' ? 'selected' : ''}>Approved & In Progress</option>
                        <option value="resolved" ${currentFilter === 'resolved' ? 'selected' : ''}>Resolved Tickets</option>
                    </select>
                </div>

                <button class="btn btn-primary" id="trigger-maintenance-btn">
                    <i data-lucide="plus"></i> Raise Repair Request
                </button>
            </div>

            <!-- Tickets List -->
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Asset Tag</th>
                            <th>Asset Name</th>
                            <th>Reported Issue</th>
                            <th>Priority</th>
                            <th>Date Raised</th>
                            <th>Reported By</th>
                            <th>Technician</th>
                            <th>Status</th>
                            <th style="text-align:right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="maintenance-table-body">
                        <!-- Populated dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    renderTickets(user);

    container.querySelector("#filter-maintenance-status").addEventListener("change", (e) => {
        currentFilter = e.target.value;
        renderTickets(user);
    });

    container.querySelector("#trigger-maintenance-btn").addEventListener("click", () => openRaiseMaintenanceModal(user));
}

function renderTickets(user) {
    const listBody = document.getElementById("maintenance-table-body");
    const tickets = Store.getMaintenance();

    // Filter tickets based on user role scope
    // Employees only see requests they raised
    // Asset Managers & Department Heads see all department / system-wide tickets
    let userTickets = [...tickets];
    if (user.role === "Employee") {
        userTickets = tickets.filter(t => t.raisedBy === user.id);
    }

    // Apply status filters
    const filtered = userTickets.filter(t => {
        if (currentFilter === "pending") return t.status === "Pending";
        if (currentFilter === "active") return t.status === "Approved" || t.status === "In Progress";
        if (currentFilter === "resolved") return t.status === "Resolved" || t.status === "Rejected";
        return true;
    });

    if (filtered.length === 0) {
        listBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center; color: var(--color-gray-400); padding: 32px;">No maintenance requests found.</td>
            </tr>
        `;
        return;
    }

    const isManager = (user.role === "Admin" || user.role === "Asset Manager");

    listBody.innerHTML = filtered.map(t => {
        let pClass = "badge-low";
        if (t.priority === "High") pClass = "badge-high";
        else if (t.priority === "Medium") pClass = "badge-medium";

        let sClass = "badge-pending";
        if (t.status === "Approved") sClass = "badge-allocated";
        else if (t.status === "In Progress") sClass = "badge-in-progress";
        else if (t.status === "Resolved") sClass = "badge-resolved";
        else if (t.status === "Rejected") sClass = "badge-rejected";

        return `
            <tr>
                <td><strong>${t.id}</strong></td>
                <td><strong>${t.assetId}</strong></td>
                <td>${t.assetName}</td>
                <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${t.issueDescription}">${t.issueDescription}</td>
                <td><span class="badge ${pClass}">${t.priority}</span></td>
                <td>${t.dateRaised}</td>
                <td>${t.raisedByName}</td>
                <td>${t.technician || '<span class="color-gray-400">Unassigned</span>'}</td>
                <td><span class="badge ${sClass}">${t.status}</span></td>
                <td style="text-align:right; white-space:nowrap;">
                    <!-- Manager approval flow buttons -->
                    ${(t.status === 'Pending' && isManager) ? `
                        <button class="btn btn-secondary btn-sm approve-ticket-btn" data-id="${t.id}" style="border-color:var(--color-success); color:var(--color-success);">Approve</button>
                        <button class="btn btn-secondary btn-sm reject-ticket-btn" data-id="${t.id}" style="border-color:var(--color-danger); color:var(--color-danger);">Reject</button>
                    ` : ''}

                    <!-- Assign Technician button -->
                    ${(t.status === 'Approved' && isManager) ? `
                        <button class="btn btn-secondary btn-sm assign-tech-btn" data-id="${t.id}">Assign Tech</button>
                    ` : ''}

                    <!-- Resolve request button -->
                    ${(t.status === 'In Progress' && isManager) ? `
                        <button class="btn btn-primary btn-sm resolve-ticket-btn" data-id="${t.id}">Resolve</button>
                    ` : ''}

                    ${(!isManager || t.status === 'Resolved' || t.status === 'Rejected') ? `
                        <span style="font-size:0.8rem; color:var(--color-gray-400);">No actions</span>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join("");

    // Bind Button actions
    listBody.querySelectorAll(".approve-ticket-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const res = Store.approveMaintenance(id, user.name);
            if (res.success) {
                showToast(`Ticket ${id} approved. Asset status set to Under Maintenance.`, "success");
                renderTickets(user);
            } else {
                showToast(res.message, "danger");
            }
        });
    });

    listBody.querySelectorAll(".reject-ticket-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const res = Store.rejectMaintenance(id, user.name);
            if (res.success) {
                showToast(`Ticket ${id} rejected.`, "warning");
                renderTickets(user);
            } else {
                showToast(res.message, "danger");
            }
        });
    });

    listBody.querySelectorAll(".assign-tech-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const ticket = tickets.find(x => x.id === id);

            const modalHtml = `
                <div class="form-group">
                    <label>Reporting Ticket</label>
                    <input type="text" class="form-control" value="${ticket.id} - ${ticket.assetName}" disabled>
                </div>
                <div class="form-group">
                    <label for="assignee-name">Technician / Servicing Vendor Name</label>
                    <input type="text" id="assignee-name" class="form-control" placeholder="e.g. David Jenkins (In-house IT)" required>
                </div>
            `;

            openModal("Assign Repair Technician", modalHtml, () => {
                const tech = document.getElementById("assignee-name").value.trim();
                if (!tech) {
                    showToast("Technician name is required.", "danger");
                    return false;
                }

                const res = Store.assignMaintenanceTechnician(id, tech, user.name);
                if (res.success) {
                    showToast("Technician assigned. Ticket status set to In Progress.", "success");
                    renderTickets(user);
                    return true;
                } else {
                    showToast(res.message, "danger");
                    return false;
                }
            });
        });
    });

    listBody.querySelectorAll(".resolve-ticket-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const ticket = tickets.find(x => x.id === id);

            const modalHtml = `
                <div class="form-group">
                    <label>Resolving Ticket</label>
                    <input type="text" class="form-control" value="${ticket.id} - ${ticket.assetName}" disabled>
                </div>
                <div class="form-group">
                    <label for="resolution-notes">Resolution Work Details</label>
                    <textarea id="resolution-notes" class="form-control" rows="3" placeholder="Explain what repairs were completed..." required></textarea>
                </div>
            `;

            openModal("Complete Maintenance Resolve", modalHtml, () => {
                const notes = document.getElementById("resolution-notes").value.trim();
                if (!notes) {
                    showToast("Resolution notes are required.", "danger");
                    return false;
                }

                const res = Store.resolveMaintenance(id, notes, user.name);
                if (res.success) {
                    showToast("Ticket resolved. Asset returned to inventory.", "success");
                    renderTickets(user);
                    return true;
                } else {
                    showToast(res.message, "danger");
                    return false;
                }
            });
        });
    });

    lucide.createIcons();
}

function openRaiseMaintenanceModal(user) {
    // Collect all assets (Employees can report their assigned assets, Managers can report any asset)
    const assets = Store.getAssets().filter(a => a.status !== "Retired" && a.status !== "Disposed");
    
    let reportableAssets = [...assets];
    if (user.role === "Employee") {
        // Report assets assigned to them, or shared bookable resources
        reportableAssets = assets.filter(a => a.currentHolderId === user.id || a.isShared);
    }

    const modalHtml = `
        <div class="form-group">
            <label for="maint-asset">Select Malfunctioning Asset</label>
            <select id="maint-asset" class="form-control" required>
                <option value="">Select Asset Tag</option>
                ${reportableAssets.map(a => `<option value="${a.id}">${a.id} - ${a.name} [Holder: ${a.currentHolderName || 'Inventory'}]</option>`).join("")}
            </select>
        </div>
        <div class="form-group">
            <label for="maint-priority">Urgency Priority</label>
            <select id="maint-priority" class="form-control">
                <option value="Low">Low (General Wear)</option>
                <option value="Medium" selected>Medium (Affects operations partially)</option>
                <option value="High">High (Blocked / Dangerous)</option>
            </select>
        </div>
        <div class="form-group">
            <label for="maint-desc">Describe Issue Details</label>
            <textarea id="maint-desc" class="form-control" rows="4" placeholder="Describe the physical state, malfunction symptoms, or errors..." required></textarea>
        </div>
        <div class="form-group">
            <label>Attach Evidence Photo (Simulation)</label>
            <div style="border: 2px dashed var(--color-gray-300); border-radius: var(--radius-md); padding: 14px; text-align: center; color: var(--color-gray-400); font-size: 0.8rem; cursor: pointer;">
                <i data-lucide="camera" style="width: 24px; height:24px; margin-bottom: 6px; display:inline-block;"></i>
                <p>Drag or upload a JPG/PNG snapshot of the defect</p>
            </div>
        </div>
    `;

    openModal("Raise Repair Request Ticket", modalHtml, () => {
        const assetId = document.getElementById("maint-asset").value;
        const priority = document.getElementById("maint-priority").value;
        const desc = document.getElementById("maint-desc").value.trim();

        if (!assetId || !desc) {
            showToast("Asset and issue details are required.", "danger");
            return false;
        }

        const res = Store.raiseMaintenance(assetId, desc, priority, user.id, user.name);
        if (res.success) {
            showToast("Repair ticket successfully registered for manager approval.", "success");
            renderTickets(user);
            return true;
        } else {
            showToast(res.message, "danger");
            return false;
        }
    }, "Raise Request");
}
