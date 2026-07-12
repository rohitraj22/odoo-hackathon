/* ====================================================
   AssetFlow - Asset Allocations & Transfers Screen
   ==================================================== */

import { Store } from "../store.js";
import { openModal, showToast } from "../app.js";

let activeTab = "active"; // active, transfers

export function renderAllocations(container, user) {
    container.innerHTML = `
        <div class="tab-container">
            <div class="page-action-bar">
                <nav class="tab-nav" style="border-bottom:none; gap:16px;">
                    <button class="tab-btn ${activeTab === 'active' ? 'active' : ''}" data-tab="active">
                        Active Allocations & Returns
                    </button>
                    <button class="tab-btn ${activeTab === 'transfers' ? 'active' : ''}" data-tab="transfers">
                        Asset Transfer Requests
                    </button>
                </nav>

                ${(user.role === 'Admin' || user.role === 'Asset Manager') ? `
                    <button class="btn btn-primary" id="trigger-allocate-btn">
                        <i data-lucide="plus"></i> Create Allocation
                    </button>
                ` : ''}
            </div>

            <div class="tab-panel" id="allocation-tab-content">
                <!-- Tab specific items populated dynamically -->
            </div>
        </div>
    `;

    // Hook up tab buttons
    container.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            container.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeTab = btn.dataset.tab;
            renderTabContent(user);
        });
    });

    if (user.role === 'Admin' || user.role === 'Asset Manager') {
        container.querySelector("#trigger-allocate-btn").addEventListener("click", () => openAllocateModal(user));
    }

    renderTabContent(user);
}

function renderTabContent(user) {
    const contentPanel = document.getElementById("allocation-tab-content");
    if (activeTab === "active") {
        renderActiveAllocations(contentPanel, user);
    } else {
        renderTransfersList(contentPanel, user);
    }
    lucide.createIcons();
}

/* ====================================================
   Tab 1: Active Allocations & Returns
   ==================================================== */
function renderActiveAllocations(container, user) {
    const allocations = Store.getAllocations();
    const activeAllocations = allocations.filter(a => a.status === "Active");
    const todayStr = new Date().toISOString().split("T")[0];

    // Filter allocations by role permissions
    // Employees can only see their own active allocations
    // Department Heads can see allocations in their department
    // Admins and Asset Managers can see all allocations
    let viewAllocations = [...activeAllocations];
    if (user.role === "Employee") {
        viewAllocations = activeAllocations.filter(a => a.employeeId === user.id);
    } else if (user.role === "Department Head") {
        const employees = Store.getEmployees();
        const deptEmpIds = employees.filter(e => e.departmentId === user.departmentId).map(e => e.id);
        viewAllocations = activeAllocations.filter(a => deptEmpIds.includes(a.employeeId));
    }

    if (viewAllocations.length === 0) {
        container.innerHTML = `
            <div class="action-card" style="text-align:center; padding: 48px; border:1px dashed var(--color-gray-300);">
                <i data-lucide="package-open" style="width:48px; height:48px; color:var(--color-gray-400); margin-bottom:12px;"></i>
                <p style="color:var(--color-gray-500);">No active asset allocations found.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Allocation ID</th>
                        <th>Asset Tag</th>
                        <th>Asset Name</th>
                        <th>Assigned Employee</th>
                        <th>Allocation Date</th>
                        <th>Expected Return Date</th>
                        <th>Status</th>
                        <th style="text-align:right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${viewAllocations.map(a => {
                        const isOverdue = a.expectedReturnDate && a.expectedReturnDate < todayStr;
                        return `
                            <tr>
                                <td><strong>${a.id}</strong></td>
                                <td><strong>${a.assetId}</strong></td>
                                <td>${a.assetName}</td>
                                <td>${a.employeeName}</td>
                                <td>${a.allocationDate}</td>
                                <td style="color: ${isOverdue ? 'var(--color-danger)' : 'inherit'}; font-weight: ${isOverdue ? '600' : 'normal'};">
                                    ${a.expectedReturnDate || '<span class="color-gray-400">Indefinite</span>'}
                                </td>
                                <td>
                                    <span class="badge ${isOverdue ? 'badge-lost' : 'badge-allocated'}">
                                        ${isOverdue ? 'Overdue' : 'Active'}
                                    </span>
                                </td>
                                <td style="text-align:right;">
                                    ${(user.role === 'Admin' || user.role === 'Asset Manager') ? `
                                        <button class="btn btn-secondary btn-sm return-asset-action" data-asset="${a.assetId}" data-name="${a.assetName}">Check-In Return</button>
                                    ` : `
                                        <span style="font-size:0.8rem; color:var(--color-gray-400);">Read-only</span>
                                    `}
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;

    // Hook up Check-In action
    container.querySelectorAll(".return-asset-action").forEach(btn => {
        btn.addEventListener("click", () => {
            const assetId = btn.dataset.asset;
            const assetName = btn.dataset.name;

            const modalHtml = `
                <div class="form-group">
                    <label>Returning Asset</label>
                    <input type="text" class="form-control" value="${assetName} (${assetId})" disabled>
                </div>
                <div class="form-group">
                    <label for="ret-condition">Verified Asset Condition</label>
                    <select id="ret-condition" class="form-control">
                        <option value="Excellent">Excellent</option>
                        <option value="Good" selected>Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="ret-notes">Check-In Return Notes</label>
                    <textarea id="ret-notes" class="form-control" rows="3" placeholder="Identify any issues or wear and tear..."></textarea>
                </div>
            `;

            openModal("Check-In Asset Return", modalHtml, () => {
                const cond = document.getElementById("ret-condition").value;
                const notes = document.getElementById("ret-notes").value.trim();

                const res = Store.returnAsset(assetId, cond, notes, user.name);
                if (res.success) {
                    showToast(`Asset ${assetId} returned and checked in.`, "success");
                    renderTabContent(user);
                    return true;
                } else {
                    showToast(res.message, "danger");
                    return false;
                }
            }, "Check-In");
        });
    });
}

/* ====================================================
   Tab 2: Asset Transfer Requests
   ==================================================== */
function renderTransfersList(container, user) {
    const transfers = Store.getTransfers();
    
    // Authorization filter:
    // Employee: see transfers involving them (as sender or receiver)
    // Dept Head: see transfers involving employees in their department
    // Admin / Asset Manager: see all transfers
    let viewTransfers = [...transfers];
    if (user.role === "Employee") {
        viewTransfers = transfers.filter(t => t.fromEmployeeId === user.id || t.toEmployeeId === user.id);
    } else if (user.role === "Department Head") {
        const employees = Store.getEmployees();
        const deptEmpIds = employees.filter(e => e.departmentId === user.departmentId).map(e => e.id);
        viewTransfers = transfers.filter(t => deptEmpIds.includes(t.fromEmployeeId) || deptEmpIds.includes(t.toEmployeeId));
    }

    if (viewTransfers.length === 0) {
        container.innerHTML = `
            <div class="action-card" style="text-align:center; padding: 48px; border:1px dashed var(--color-gray-300);">
                <i data-lucide="repeat" style="width:48px; height:48px; color:var(--color-gray-400); margin-bottom:12px;"></i>
                <p style="color:var(--color-gray-500);">No asset transfer requests found.</p>
            </div>
        `;
        return;
    }

    // Role eligibility check for action buttons
    const canApprove = (user.role === "Admin" || user.role === "Asset Manager" || user.role === "Department Head");

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Request ID</th>
                        <th>Asset ID</th>
                        <th>Asset Name</th>
                        <th>Current Holder</th>
                        <th>Target Holder</th>
                        <th>Request Date</th>
                        <th>Status</th>
                        <th style="text-align:right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${viewTransfers.map(t => {
                        let statusClass = "badge-pending";
                        if (t.status === "Approved") statusClass = "badge-approved";
                        else if (t.status === "Rejected") statusClass = "badge-rejected";

                        return `
                            <tr>
                                <td><strong>${t.id}</strong></td>
                                <td><strong>${t.assetId}</strong></td>
                                <td>${t.assetName}</td>
                                <td>${t.fromEmployeeName}</td>
                                <td><strong>${t.toEmployeeName}</strong></td>
                                <td>${t.requestDate}</td>
                                <td><span class="badge ${statusClass}">${t.status}</span></td>
                                <td style="text-align:right;">
                                    ${(t.status === 'Pending' && canApprove) ? `
                                        <button class="btn btn-secondary btn-sm approve-transfer-btn" data-id="${t.id}" style="border-color:var(--color-success); color:var(--color-success);">Approve</button>
                                        <button class="btn btn-secondary btn-sm reject-transfer-btn" data-id="${t.id}" style="border-color:var(--color-danger); color:var(--color-danger);">Decline</button>
                                    ` : `
                                        <span style="font-size:0.8rem; color:var(--color-gray-400);">${t.status !== 'Pending' ? 'Completed' : 'No Action Access'}</span>
                                    `}
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;

    // Hook up Approve Action
    container.querySelectorAll(".approve-transfer-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const res = Store.approveTransfer(id, user.name);
            if (res.success) {
                showToast("Transfer approved and asset successfully re-allocated.", "success");
                renderTabContent(user);
            } else {
                showToast(res.message, "danger");
            }
        });
    });

    // Hook up Reject Action
    container.querySelectorAll(".reject-transfer-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const res = Store.rejectTransfer(id, user.name);
            if (res.success) {
                showToast("Transfer request declined.", "warning");
                renderTabContent(user);
            } else {
                showToast(res.message, "danger");
            }
        });
    });
}

/* ====================================================
   Allocate Asset Form & Conflict Handling Dialogs
   ==================================================== */
function openAllocateModal(user) {
    const assets = Store.getAssets().filter(a => !a.isShared && a.status !== "Retired" && a.status !== "Disposed");
    const employees = Store.getEmployees().filter(e => e.status === "Active");
    const departments = Store.getDepartments().filter(d => d.status === "Active");

    const modalHtml = `
        <div class="form-group">
            <label for="alloc-asset">Select Asset to Allocate</label>
            <select id="alloc-asset" class="form-control" required>
                <option value="">Select Asset (Hardware/Furniture)</option>
                ${assets.map(a => `<option value="${a.id}">${a.id} - ${a.name} [Status: ${a.status}]</option>`).join("")}
            </select>
        </div>
        <div class="form-group">
            <label for="alloc-emp">Assign to Employee</label>
            <select id="alloc-emp" class="form-control" required>
                <option value="">Select Employee</option>
                ${employees.map(e => `<option value="${e.id}">${e.name} (${e.role})</option>`).join("")}
            </select>
        </div>
        <div class="form-group">
            <label for="alloc-expected-date">Expected Return Date (Optional)</label>
            <input type="date" id="alloc-expected-date" class="form-control" min="${new Date().toISOString().split("T")[0]}">
        </div>
        <div class="form-group">
            <label for="alloc-condition">Condition on Hand-out</label>
            <select id="alloc-condition" class="form-control">
                <option value="Excellent">Excellent</option>
                <option value="Good" selected>Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
            </select>
        </div>
    `;

    openModal("New Asset Allocation", modalHtml, () => {
        const assetId = document.getElementById("alloc-asset").value;
        const employeeId = document.getElementById("alloc-emp").value;
        const expectedDate = document.getElementById("alloc-expected-date").value;
        const condition = document.getElementById("alloc-condition").value;

        if (!assetId || !employeeId) {
            showToast("Please choose both an Asset and an Employee.", "danger");
            return false;
        }

        const res = Store.allocateAsset(assetId, employeeId, "", expectedDate, condition, user.name);

        if (res.success) {
            showToast("Asset allocated successfully.", "success");
            renderTabContent(user);
            return true;
        } else if (res.conflict) {
            // Trigger CONFLICT DIALOG prompt
            // Offer to raise a transfer request instead
            closeModal();
            setTimeout(() => {
                const promptHtml = `
                    <div style="text-align:center; padding:10px 0;">
                        <i data-lucide="help-circle" style="width:48px; height:48px; color:var(--color-warning); margin-bottom:12px;"></i>
                        <p style="font-weight:600; font-size:1.05rem; margin-bottom:8px;">Asset Already Allocated</p>
                        <p style="font-size:0.875rem; color:var(--color-gray-600); margin-bottom:16px;">
                            This asset is currently held by <strong>${res.currentHolder}</strong>.
                            Would you like to initiate a Transfer Request from them to the new assignee instead?
                        </p>
                    </div>
                `;

                openModal("Initiate Asset Transfer?", promptHtml, () => {
                    const transRes = Store.requestTransfer(assetId, employeeId, user.name);
                    if (transRes.success) {
                        showToast(`Transfer request successfully initiated.`, "info");
                        activeTab = "transfers"; // Swap to transfers view
                        renderTabContent(user);
                        return true;
                    } else {
                        showToast(transRes.message, "danger");
                        return false;
                    }
                }, "Yes, Request Transfer", "Cancel");
            }, 300);
            return false;
        } else {
            showToast(res.message, "danger");
            return false;
        }
    }, "Allocate");
}
