/* =============================================================
   AssetFlow - Allocations & Transfer Screen
   ============================================================= */

import { Store } from "../store.js";
import { showToast, openModal } from "../app.js";

let pageAssets = [];
let pageAllocations = [];
let pageTransfers = [];
let pageEmployees = [];
let pageDepts = [];

export async function renderAllocations(container, user) {
    container.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height: 50vh; flex-direction:column; gap:16px;">
            <i data-lucide="loader-2" style="width:40px; height:40px; color:var(--color-primary); animation: spin 1s linear infinite;"></i>
            <div style="color:var(--color-gray-500); font-weight:600;">Loading allocations...</div>
        </div>
        <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;
    safeCreateIcons();

    [pageAssets, pageAllocations, pageTransfers, pageEmployees, pageDepts] = await Promise.all([
        Store.fetchAssets(),
        Store.fetchAllocations(),
        Store.fetchTransfers(),
        Store.fetchEmployees(),
        Store.fetchDepartments()
    ]);

    container.innerHTML = `
        <div class="allocations-wrapper page-shell">
            <div class="page-hero">
                <div>
                    <p class="page-eyebrow">Allocation & transfer</p>
                    <h2 class="page-title">Asset Allocation</h2>
                    <p class="page-subtitle">Allocate, transfer, or return assets with conflict-safe workflows.</p>
                </div>
            </div>

            <div class="action-card">
                <h4 class="card-title"><i data-lucide="search"></i> Allocate or Transfer an Asset</h4>
                <div class="inline-form-row">
                    <div class="form-group" style="flex:1; margin-bottom:0;">
                        <label for="alloc-asset-search">Asset Tag</label>
                        <input type="text" id="alloc-asset-search" class="form-control" placeholder="e.g. AF-1003" autocomplete="off">
                    </div>
                    <button class="btn btn-primary" id="alloc-lookup-btn">
                        <i data-lucide="search"></i> Look Up
                    </button>
                </div>
                <div id="alloc-conflict-banner" style="display:none; margin-top:14px;"></div>
                <div id="alloc-form" style="display:none; margin-top:14px;"></div>
            </div>

            <div class="action-card">
                <h4 class="card-title"><i data-lucide="clipboard-list"></i> Current Allocations</h4>
                <div id="my-allocations-list"></div>
            </div>

            <div class="action-card">
                <h4 class="card-title"><i data-lucide="arrow-right-left"></i> Transfer History</h4>
                <div id="transfer-history-list"></div>
            </div>
        </div>
    `;

    safeCreateIcons();
    renderMyAllocations(user);
    renderTransferHistory(user);

    container.querySelector("#alloc-lookup-btn").addEventListener("click", () => {
        const tag = document.getElementById("alloc-asset-search").value.trim().toUpperCase();
        if (!tag) {
            showToast("Please enter an asset tag.", "warning");
            return;
        }
        lookupAssetForAllocation(tag, user);
    });

    container.querySelector("#alloc-asset-search").addEventListener("keydown", e => {
        if (e.key === "Enter") container.querySelector("#alloc-lookup-btn").click();
    });
}

function renderMyAllocations(user) {
    const list = pageAllocations.filter(a => {
        if (a.status !== "Active") return false;
        if (user.role === "Admin" || user.role === "Asset Manager") return true;
        return a.holderId === user.id || a.employeeId === user.id;
    });

    const el = document.getElementById("my-allocations-list");
    if (!el) return;

    if (!list.length) {
        el.innerHTML = `<div class="empty-state"><i data-lucide="inbox"></i><p>No active allocations found.</p></div>`;
        safeCreateIcons();
        return;
    }

    const today = new Date().toISOString().split("T")[0];

    el.innerHTML = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Asset Tag</th>
                        <th>Asset Name</th>
                        <th>Holder</th>
                        <th>Department</th>
                        <th>Since</th>
                        <th>Expected Return</th>
                        <th style="text-align:right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.map(a => {
                        const overdue = a.expectedReturnDate && a.expectedReturnDate < today;
                        return `
                        <tr class="${overdue ? "row-overdue" : ""}">
                            <td><span class="asset-tag-chip">${a.assetId}</span></td>
                            <td style="font-weight:600;">${a.assetName || "—"}</td>
                            <td>${a.holderName || "—"}</td>
                            <td>${a.department || "—"}</td>
                            <td>${a.date || a.allocationDate || "—"}</td>
                            <td>${a.expectedReturnDate ? `<span class="${overdue ? "text-danger" : ""}">${a.expectedReturnDate}${overdue ? " (Overdue)" : ""}</span>` : "—"}</td>
                            <td style="text-align:right;">
                                ${(user.role === "Admin" || user.role === "Asset Manager" || a.holderId === user.id) ? `
                                    <button class="btn btn-secondary btn-sm return-btn" data-asset="${a.assetId}">Return</button>
                                ` : ""}
                            </td>
                        </tr>`;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;

    el.querySelectorAll(".return-btn").forEach(btn => {
        btn.addEventListener("click", () => openReturnModal(btn.dataset.asset, user));
    });

    safeCreateIcons();
}

function renderTransferHistory(user) {
    const el = document.getElementById("transfer-history-list");
    if (!el) return;

    if (!pageTransfers.length) {
        el.innerHTML = `<div class="empty-state"><i data-lucide="file-clock"></i><p>No transfers recorded.</p></div>`;
        safeCreateIcons();
        return;
    }

    el.innerHTML = `
        <div class="transfer-list">
            ${pageTransfers.slice(0, 10).map(t => `
                <div class="transfer-card">
                    <div class="transfer-icon"><i data-lucide="arrow-right-left"></i></div>
                    <div class="transfer-body">
                        <strong>${t.assetId} · ${t.assetName}</strong>
                        <p>${t.fromName} → ${t.toName}</p>
                        <small>${t.date} · ${t.reason || "—"}</small>
                    </div>
                    <div class="transfer-actions">
                        <span class="badge ${t.status === "Approved" || t.status === "Completed" ? "badge-available" : t.status === "Rejected" ? "badge-cancelled" : "badge-pending"}">${t.status}</span>
                        ${(user.role === "Admin" || user.role === "Asset Manager") && t.status === "Pending" ? `
                            <button class="btn btn-success btn-sm approve-transfer-btn" data-id="${t.id}">Approve</button>
                            <button class="btn btn-danger btn-sm reject-transfer-btn" data-id="${t.id}">Reject</button>
                        ` : ""}
                    </div>
                </div>
            `).join("")}
        </div>
    `;

    el.querySelectorAll(".approve-transfer-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const res = await Store.approveTransfer(btn.dataset.id, user.name);
            if (res.success) {
                showToast("Transfer approved.", "success");
                await refreshAndRerender(user);
            } else {
                showToast(res.message || "Could not approve transfer.", "danger");
            }
        });
    });

    el.querySelectorAll(".reject-transfer-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const res = await Store.rejectTransfer(btn.dataset.id, user.name);
            if (res.success) {
                showToast("Transfer rejected.", "info");
                await refreshAndRerender(user);
            }
        });
    });

    safeCreateIcons();
}

async function refreshAndRerender(user) {
    [pageAssets, pageAllocations, pageTransfers] = await Promise.all([
        Store.fetchAssets(),
        Store.fetchAllocations(),
        Store.fetchTransfers()
    ]);
    renderMyAllocations(user);
    renderTransferHistory(user);
}

function lookupAssetForAllocation(tag, user) {
    const asset = pageAssets.find(a => a.id === tag);
    const conflictBanner = document.getElementById("alloc-conflict-banner");
    const formEl = document.getElementById("alloc-form");

    if (!asset) {
        showToast(`Asset "${tag}" not found.`, "danger");
        conflictBanner.style.display = "none";
        formEl.style.display = "none";
        return;
    }

    if (asset.status === "Allocated" && (asset.currentHolderName || asset.currentHolderId)) {
        const holderName = asset.currentHolderName || pageEmployees.find(e => e.id === asset.currentHolderId)?.name || "another employee";
        conflictBanner.style.display = "block";
        conflictBanner.innerHTML = `
            <div class="banner-alert-red">
                <i data-lucide="alert-circle"></i>
                <div><strong>Already allocated to ${holderName}.</strong> Submit a transfer request to reassign this asset.</div>
            </div>
        `;
        safeCreateIcons();
        renderTransferForm(asset, user, formEl);
    } else if (asset.status !== "Available") {
        showToast(`Asset is currently ${asset.status} and cannot be allocated.`, "warning");
        conflictBanner.style.display = "none";
        formEl.style.display = "none";
    } else {
        conflictBanner.style.display = "none";
        renderAllocateForm(asset, user, formEl);
    }
}

function renderAllocateForm(asset, user, formEl) {
    formEl.style.display = "block";
    formEl.innerHTML = `
        <div class="form-panel form-panel-success">
            <h5><i data-lucide="package-check"></i> Allocate ${asset.id} · ${asset.name}</h5>
            <div class="form-row">
                <div class="form-group">
                    <label for="alloc-to-emp">Allocate To</label>
                    <select id="alloc-to-emp" class="form-control">
                        <option value="">Select employee...</option>
                        ${pageEmployees.filter(e => e.status === "Active").map(e => `<option value="${e.id}">${e.name}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="alloc-return-date">Expected Return</label>
                    <input type="date" id="alloc-return-date" class="form-control">
                </div>
            </div>
            <button class="btn btn-primary" id="submit-alloc-btn"><i data-lucide="check"></i> Confirm Allocation</button>
        </div>
    `;
    safeCreateIcons();

    formEl.querySelector("#submit-alloc-btn").addEventListener("click", async () => {
        const empId = formEl.querySelector("#alloc-to-emp").value;
        const returnDate = formEl.querySelector("#alloc-return-date").value || null;
        if (!empId) {
            showToast("Please select an employee.", "warning");
            return;
        }

        const emp = pageEmployees.find(e => e.id === empId);
        const res = await Store.allocateAsset(asset.id, empId, emp?.departmentId, returnDate, "Good", user.name);

        if (res.conflict) {
            showToast(res.message || "Asset already allocated.", "danger");
            return;
        }
        if (!res.success) {
            showToast(res.message || "Allocation failed.", "danger");
            return;
        }

        await Store.addNotification("Asset Assigned", `${asset.name} allocated to ${emp.name}.`, "info", empId);
        showToast(`${asset.name} allocated to ${emp.name}.`, "success");
        document.getElementById("alloc-asset-search").value = "";
        formEl.style.display = "none";
        await refreshAndRerender(user);
    });
}

function renderTransferForm(asset, user, formEl) {
    formEl.style.display = "block";
    const holderName = asset.currentHolderName || pageEmployees.find(e => e.id === asset.currentHolderId)?.name || "";
    formEl.innerHTML = `
        <div class="form-panel form-panel-warning">
            <h5><i data-lucide="arrow-right-left"></i> Transfer Request · ${asset.id}</h5>
            <div class="form-row">
                <div class="form-group">
                    <label>From</label>
                    <input type="text" class="form-control" value="${holderName}" readonly>
                </div>
                <div class="form-group">
                    <label for="transfer-to-emp">To</label>
                    <select id="transfer-to-emp" class="form-control">
                        <option value="">Select employee...</option>
                        ${pageEmployees.filter(e => e.status === "Active" && e.id !== asset.currentHolderId).map(e => `<option value="${e.id}">${e.name}</option>`).join("")}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label for="transfer-reason">Reason</label>
                <textarea id="transfer-reason" class="form-control" rows="2" placeholder="State reason for transfer..."></textarea>
            </div>
            <button class="btn btn-primary" id="submit-transfer-btn"><i data-lucide="send"></i> Submit Transfer Request</button>
        </div>
    `;
    safeCreateIcons();

    formEl.querySelector("#submit-transfer-btn").addEventListener("click", async () => {
        const toEmpId = formEl.querySelector("#transfer-to-emp").value;
        const reason = formEl.querySelector("#transfer-reason").value.trim();
        if (!toEmpId) {
            showToast("Please select a recipient.", "warning");
            return;
        }
        if (!reason) {
            showToast("Please provide a reason.", "warning");
            return;
        }

        const res = await Store.requestTransfer(asset.id, toEmpId, user.name, reason);
        if (!res.success) {
            showToast(res.message || "Transfer request failed.", "danger");
            return;
        }

        showToast("Transfer request submitted.", "success");
        document.getElementById("alloc-asset-search").value = "";
        formEl.style.display = "none";
        document.getElementById("alloc-conflict-banner").style.display = "none";
        await refreshAndRerender(user);
    });
}

function openReturnModal(assetId, user) {
    const asset = pageAssets.find(a => a.id === assetId);
    openModal("Return Asset", `
        <p>Mark <strong>${asset?.name || assetId}</strong> as returned?</p>
        <div class="form-group">
            <label for="return-condition">Condition on Return</label>
            <select id="return-condition" class="form-control">
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
            </select>
        </div>
        <div class="form-group">
            <label for="return-notes">Notes</label>
            <textarea id="return-notes" class="form-control" rows="2" placeholder="Optional check-in notes..."></textarea>
        </div>
    `, async () => {
        const condition = document.getElementById("return-condition").value;
        const notes = document.getElementById("return-notes").value.trim();
        const res = await Store.returnAsset(assetId, condition, notes || `Returned in ${condition} condition`, user.name);
        if (!res.success) {
            showToast(res.message || "Return failed.", "danger");
            return false;
        }
        showToast("Asset returned successfully.", "success");
        await refreshAndRerender(user);
        return true;
    }, "Confirm Return");
}
