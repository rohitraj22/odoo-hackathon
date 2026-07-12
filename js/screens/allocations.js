/* =============================================================
   AssetFlow - Allocations & Transfer Screen (Wireframe Aligned: Screen 5)
   ============================================================= */

import { Store } from "../store.js";
import { showToast, openModal } from "../app.js";

export function renderAllocations(container, user) {
    container.innerHTML = `
        <div class="allocations-wrapper">

            <!-- Page header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:22px;">
                <div>
                    <h2 style="font-size:1.3rem; font-weight:800; color:var(--color-gray-900); margin-bottom:2px;">Asset Allocation</h2>
                    <p style="font-size:0.82rem; color:var(--color-gray-400); margin:0;">Allocate, transfer or revoke assets across the organisation.</p>
                </div>
            </div>

            <!-- Asset search for allocation -->
            <div class="action-card" style="margin-bottom:18px;">
                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:14px; color:var(--color-gray-800); display:flex; align-items:center; gap:8px;">
                    <i data-lucide="search" style="width:15px;height:15px;color:var(--color-primary);"></i>
                    Allocate or Transfer an Asset
                </h4>
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
                    <div class="form-group" style="flex:1; min-width:160px; margin-bottom:0;">
                        <label for="alloc-asset-search">Asset Tag</label>
                        <input type="text" id="alloc-asset-search" class="form-control" placeholder="e.g. AF-0114" autocomplete="off">
                    </div>
                    <button class="btn btn-primary" id="alloc-lookup-btn">
                        <i data-lucide="search" style="width:16px;height:16px;"></i>
                        Look Up
                    </button>
                </div>
                <!-- Conflict banner injected here dynamically -->
                <div id="alloc-conflict-banner" style="display:none; margin-top:14px;"></div>
                <!-- Allocation form injected here dynamically -->
                <div id="alloc-form" style="display:none; margin-top:14px;"></div>
            </div>

            <!-- My Allocations List -->
            <div class="action-card" style="margin-bottom:18px;">
                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:14px; color:var(--color-gray-800); display:flex; align-items:center; gap:8px;">
                    <i data-lucide="clipboard-list" style="width:15px;height:15px;color:var(--color-primary);"></i>
                    My Current Allocations
                </h4>
                <div id="my-allocations-list"></div>
            </div>

            <!-- Transfer History -->
            <div class="action-card">
                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:14px; color:var(--color-gray-800); display:flex; align-items:center; gap:8px;">
                    <i data-lucide="arrow-right-left" style="width:15px;height:15px;color:var(--color-primary);"></i>
                    Transfer History
                </h4>
                <div id="transfer-history-list"></div>
            </div>
        </div>
    `;

    lucide.createIcons();
    renderMyAllocations(user);
    renderTransferHistory(user);

    document.getElementById("alloc-lookup-btn").addEventListener("click", () => {
        const tag = document.getElementById("alloc-asset-search").value.trim().toUpperCase();
        if (!tag) { showToast("Please enter an asset tag.", "warning"); return; }
        lookupAssetForAllocation(tag, user);
    });

    document.getElementById("alloc-asset-search").addEventListener("keydown", e => {
        if (e.key === "Enter") document.getElementById("alloc-lookup-btn").click();
    });
}

function renderMyAllocations(user) {
    const list = Store.getAllocations().filter(a => {
        if (user.role === 'Admin' || user.role === 'Asset Manager') return true;
        return a.holderId === user.id;
    });

    const el = document.getElementById("my-allocations-list");
    if (!el) return;

    if (!list.length) {
        el.innerHTML = `
            <div style="text-align:center; padding:32px; color:var(--color-gray-400);">
                <i data-lucide="inbox" style="width:32px;height:32px;opacity:0.35;margin-bottom:10px;"></i>
                <p style="font-size:0.875rem;">No allocations found.</p>
            </div>`;
        lucide.createIcons();
        return;
    }

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
                    <th>Status</th>
                    <th style="text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${list.slice(0, 10).map(a => {
                    // Support both schema versions
                    const holderName = a.holderName || a.employeeName || '—';
                    const dateVal    = a.date || a.allocationDate || '—';
                    const statusKey  = (a.status || 'active').toLowerCase();
                    return `
                    <tr>
                        <td><span style="font-family:monospace; font-weight:700; color:var(--color-primary); background:var(--color-primary-ultralight); padding:3px 8px; border-radius:4px;">${a.assetId}</span></td>
                        <td style="font-weight:600; color:var(--color-gray-900);">${a.assetName}</td>
                        <td style="color:var(--color-gray-700);">${holderName}</td>
                        <td style="color:var(--color-gray-500);">${a.department || '—'}</td>
                        <td style="font-size:0.8rem; color:var(--color-gray-400);">${dateVal}</td>
                        <td><span class="badge badge-${statusKey}">${a.status}</span></td>
                        <td style="text-align:right;">
                            ${(user.role === 'Admin' || user.role === 'Asset Manager') ? `
                                <button class="btn btn-secondary btn-sm revoke-btn" data-id="${a.id}">Revoke</button>
                            ` : '<span style="color:var(--color-gray-400);font-size:0.78rem;">—</span>'}
                        </td>
                    </tr>`;
                }).join("")}
            </tbody>
        </table>
        </div>
    `;

    el.querySelectorAll(".revoke-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const allocId = btn.dataset.id;
            const allocs  = Store.getAllocations();
            const alloc   = allocs.find(a => a.id === allocId);
            if (!alloc) return;

            const displayName = alloc.holderName || alloc.employeeName || 'unknown';

            openModal("Revoke Allocation", `<p>Revoke allocation of <strong>${alloc.assetName}</strong> from <strong>${displayName}</strong>?</p>`, () => {
                const assets = Store.getAssets();
                const asset  = assets.find(a => a.id === alloc.assetId);
                if (asset) {
                    asset.status = "Available";
                    asset.currentHolderId   = "";
                    asset.currentHolderName = "";
                    asset.history.push({ date: new Date().toISOString().split("T")[0], action: "Revocation", user: user.name, details: `Revoked from ${displayName}` });
                    Store.saveAssets(assets);
                }

                alloc.status = "Revoked";
                Store.saveAllocations(allocs);
                Store.logActivity(user.name, "Allocation Revoked", `${alloc.assetName} revoked from ${displayName}`);
                showToast(`Allocation revoked for ${alloc.assetName}.`, "success");
                renderMyAllocations(user);
                return true;
            }, "Revoke");
        });
    });
}

function renderTransferHistory(user) {
    const history = Store.getTransfers().slice(0, 8);
    const el = document.getElementById("transfer-history-list");
    if (!el) return;

    if (!history.length) {
        el.innerHTML = `
            <div style="text-align:center; padding:32px; color:var(--color-gray-400);">
                <i data-lucide="file-clock" style="width:32px;height:32px;opacity:0.35;margin-bottom:10px;"></i>
                <p style="font-size:0.875rem;">No transfers recorded.</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    el.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${history.map(t => `
                <div style="
                    padding:13px 16px;
                    border:1px solid var(--color-gray-100);
                    border-radius:var(--radius-md);
                    font-size:0.85rem;
                    background:var(--color-white);
                    display:flex; justify-content:space-between; align-items:center;
                    gap:12px;
                    transition: box-shadow 0.15s;
                " onmouseenter="this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.boxShadow='none'">
                    <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                        <div style="width:36px; height:36px; border-radius:9px; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            <i data-lucide="arrow-right-left" style="width:16px;height:16px;"></i>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-weight:700; color:var(--color-gray-900); margin-bottom:2px;">${t.assetId} · ${t.assetName}</div>
                            <div style="color:var(--color-gray-500); font-size:0.8rem;">
                                <strong style="color:var(--color-gray-700);">${t.fromName}</strong>
                                <span style="margin:0 6px; color:var(--color-gray-300);">→</span>
                                <strong style="color:var(--color-gray-700);">${t.toName}</strong>
                            </div>
                            <div style="color:var(--color-gray-400); font-size:0.75rem; margin-top:2px;">${t.date} · ${t.reason || '—'}</div>
                        </div>
                    </div>
                    <span class="badge ${t.status === 'Completed' ? 'badge-available' : 'badge-pending'}">${t.status}</span>
                </div>
            `).join("")}
        </div>
    `;
    lucide.createIcons();
}

/* Wireframe: Inline double-allocation conflict warning banner */
function lookupAssetForAllocation(tag, user) {
    const assets = Store.getAssets();
    const employees = Store.getEmployees();
    const depts = Store.getDepartments();

    const asset = assets.find(a => a.id === tag);
    const conflictBanner = document.getElementById("alloc-conflict-banner");
    const formEl = document.getElementById("alloc-form");

    if (!asset) {
        showToast(`Asset "${tag}" not found.`, "danger");
        conflictBanner.style.display = "none";
        formEl.style.display = "none";
        return;
    }

    // Determine if already allocated — wireframe shows red inline banner
    if (asset.status === "Allocated" && asset.currentHolderName) {
        conflictBanner.style.display = "block";
        conflictBanner.innerHTML = `
            <div class="banner-alert-red" style="border-radius:var(--radius-md); padding:12px 16px; font-size:0.875rem; gap:10px;">
                <i data-lucide="alert-circle" style="width:18px; height:18px; flex-shrink:0;"></i>
                <div>
                    <strong>Already Allocated to ${asset.currentHolderName}.</strong>
                    To proceed, submit a transfer request below.
                </div>
            </div>
        `;
        lucide.createIcons();
        renderTransferForm(asset, employees, depts, user, formEl, true);
    } else {
        conflictBanner.style.display = "none";
        renderAllocateForm(asset, employees, depts, user, formEl);
    }
}

function renderAllocateForm(asset, employees, depts, user, formEl) {
    formEl.style.display = "block";
    formEl.innerHTML = `
        <div style="border:1px solid var(--color-gray-100); border-radius:var(--radius-md); padding:18px; background:#fafbfc; border-top:3px solid var(--color-success);">
            <div style="font-size:0.9rem; font-weight:700; margin-bottom:14px; color:var(--color-gray-700); display:flex; align-items:center; gap:8px;">
                <i data-lucide="package-check" style="width:15px;height:15px;color:var(--color-success);"></i>
                Allocate: <span style="color:var(--color-primary);">${asset.id}</span> · ${asset.name}
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="alloc-to-emp">Allocate To</label>
                    <select id="alloc-to-emp" class="form-control">
                        <option value="">Select employee...</option>
                        ${employees.filter(e => e.status === 'Active').map(e => `<option value="${e.id}">${e.name}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="alloc-return-date">Expected Return</label>
                    <input type="date" id="alloc-return-date" class="form-control">
                </div>
            </div>
            <div class="form-group">
                <label for="alloc-notes">Notes</label>
                <textarea id="alloc-notes" class="form-control" rows="2" placeholder="Optional notes..."></textarea>
            </div>
            <button class="btn btn-primary" id="submit-alloc-btn">
                <i data-lucide="check" style="width:16px;height:16px;"></i>
                Confirm Allocation
            </button>
        </div>
    `;
    lucide.createIcons();

    formEl.querySelector("#submit-alloc-btn").addEventListener("click", () => {
        const empId = formEl.querySelector("#alloc-to-emp").value;
        const returnDate = formEl.querySelector("#alloc-return-date").value;
        const notes = formEl.querySelector("#alloc-notes").value;

        if (!empId) { showToast("Please select an employee.", "warning"); return; }

        const emp = employees.find(e => e.id === empId);
        const dept = depts.find(d => d.id === emp.departmentId);

        const assets = Store.getAssets();
        const target = assets.find(a => a.id === asset.id);
        target.status = "Allocated";
        target.currentHolderId = emp.id;
        target.currentHolderName = emp.name;
        target.expectedReturnDate = returnDate;
        target.history.push({ date: new Date().toISOString().split("T")[0], action: "Allocation", user: user.name, details: `Allocated to ${emp.name} (${dept ? dept.name : ''})` });
        Store.saveAssets(assets);

        const allocs = Store.getAllocations();
        allocs.push({
            id: `ALLOC-${Date.now()}`,
            assetId: asset.id,
            assetName: asset.name,
            holderId: emp.id,
            holderName: emp.name,
            department: dept ? dept.name : "",
            departmentId: emp.departmentId,
            expectedReturnDate: returnDate,
            date: new Date().toISOString().split("T")[0],
            notes,
            status: "Active"
        });
        Store.saveAllocations(allocs);
        Store.logActivity(user.name, "Asset Allocated", `${asset.name} allocated to ${emp.name}`);
        showToast(`${asset.name} allocated to ${emp.name}.`, "success");

        formEl.style.display = "none";
        document.getElementById("alloc-conflict-banner").style.display = "none";
        document.getElementById("alloc-asset-search").value = "";
        renderMyAllocations(user);
    });
}

function renderTransferForm(asset, employees, depts, user, formEl, isConflict) {
    formEl.style.display = "block";
    formEl.innerHTML = `
        <div style="border:1px solid #fde68a; border-radius:var(--radius-md); padding:18px; background:#fffbeb; border-top:3px solid var(--color-warning);">
            <div style="font-size:0.9rem; font-weight:700; margin-bottom:14px; color:var(--color-gray-700); display:flex; align-items:center; gap:8px;">
                <i data-lucide="arrow-right-left" style="width:15px;height:15px;color:var(--color-warning);"></i>
                Transfer Request: <span style="color:var(--color-primary);">${asset.id}</span>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>From</label>
                    <input type="text" class="form-control" value="${asset.currentHolderName}" readonly style="background:var(--color-gray-100); color:var(--color-gray-500);">
                </div>
                <div class="form-group">
                    <label for="transfer-to-emp">To</label>
                    <select id="transfer-to-emp" class="form-control">
                        <option value="">Select employee...</option>
                        ${employees.filter(e => e.status === 'Active' && e.id !== asset.currentHolderId).map(e => `<option value="${e.id}">${e.name}</option>`).join("")}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label for="transfer-reason">Reason</label>
                <textarea id="transfer-reason" class="form-control" rows="2" placeholder="State reason for transfer..."></textarea>
            </div>
            <button class="btn btn-primary" id="submit-transfer-btn">
                <i data-lucide="send" style="width:16px;height:16px;"></i>
                Submit Transfer Request
            </button>
        </div>
    `;
    lucide.createIcons();

    formEl.querySelector("#submit-transfer-btn").addEventListener("click", () => {
        const toEmpId = formEl.querySelector("#transfer-to-emp").value;
        const reason = formEl.querySelector("#transfer-reason").value.trim();

        if (!toEmpId) { showToast("Please select a recipient employee.", "warning"); return; }
        if (!reason) { showToast("Please provide a reason.", "warning"); return; }

        const toEmp = employees.find(e => e.id === toEmpId);
        const transfers = Store.getTransfers();
        transfers.push({
            id: `TRF-${Date.now()}`,
            assetId: asset.id,
            assetName: asset.name,
            fromId: asset.currentHolderId,
            fromName: asset.currentHolderName,
            toId: toEmp.id,
            toName: toEmp.name,
            reason,
            date: new Date().toISOString().split("T")[0],
            status: "Pending"
        });
        Store.saveTransfers(transfers);
        Store.logActivity(user.name, "Transfer Requested", `${asset.name}: ${asset.currentHolderName} → ${toEmp.name}`);
        showToast(`Transfer request submitted.`, "success");

        formEl.style.display = "none";
        document.getElementById("alloc-conflict-banner").style.display = "none";
        document.getElementById("alloc-asset-search").value = "";
        renderTransferHistory(user);
    });
}
