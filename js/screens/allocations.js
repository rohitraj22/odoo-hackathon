/* =============================================================
   AssetFlow - Allocations & Transfer Screen (Wireframe Aligned: Screen 5)
   ============================================================= */

import { Store } from "../store.js";
import { showToast, openModal } from "../app.js";

export function renderAllocations(container, user) {
    container.innerHTML = `
        <div class="allocations-wrapper">
            <h3 style="font-size:1.25rem; font-weight:700; margin-bottom:18px;">Asset Allocation</h3>

            <!-- Asset search for allocation -->
            <div class="action-card" style="margin-bottom:18px;">
                <h4 style="font-size:0.925rem; font-weight:700; margin-bottom:12px;">Allocate or transfer an asset</h4>
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
                    <div class="form-group" style="flex:1; min-width:160px; margin-bottom:0;">
                        <label for="alloc-asset-search">Asset Tag</label>
                        <input type="text" id="alloc-asset-search" class="form-control" placeholder="e.g. AF-0114" autocomplete="off">
                    </div>
                    <button class="btn btn-primary" id="alloc-lookup-btn">Look up</button>
                </div>
                <!-- Conflict banner injected here dynamically -->
                <div id="alloc-conflict-banner" style="display:none; margin-top:14px;"></div>
                <!-- Allocation form injected here dynamically -->
                <div id="alloc-form" style="display:none; margin-top:14px;"></div>
            </div>

            <!-- My Allocations List -->
            <div class="action-card" style="margin-bottom:18px;">
                <h4 style="font-size:0.925rem; font-weight:700; margin-bottom:12px;">My Current Allocations</h4>
                <div id="my-allocations-list"></div>
            </div>

            <!-- Transfer History -->
            <div class="action-card">
                <h4 style="font-size:0.925rem; font-weight:700; margin-bottom:12px;">Transfer History</h4>
                <div id="transfer-history-list"></div>
            </div>
        </div>
    `;

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
        el.innerHTML = `<p style="text-align:center; color:var(--color-gray-400); padding:20px;">No allocations found.</p>`;
        return;
    }

    el.innerHTML = `
        <table class="table">
            <thead>
                <tr><th>Asset Tag</th><th>Asset Name</th><th>Holder</th><th>Dept</th><th>Since</th><th>Status</th><th style="text-align:right;">Actions</th></tr>
            </thead>
            <tbody>
                ${list.slice(0, 10).map(a => `
                    <tr>
                        <td style="font-family:monospace; font-weight:700;">${a.assetId}</td>
                        <td>${a.assetName}</td>
                        <td>${a.holderName}</td>
                        <td>${a.department || '—'}</td>
                        <td style="font-size:0.8rem; color:var(--color-gray-500);">${a.date}</td>
                        <td><span class="badge badge-available">${a.status}</span></td>
                        <td style="text-align:right;">
                            ${(user.role === 'Admin' || user.role === 'Asset Manager') ? `
                                <button class="btn btn-secondary btn-sm revoke-btn" data-id="${a.id}">Revoke</button>
                            ` : ''}
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    el.querySelectorAll(".revoke-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const allocId = btn.dataset.id;
            const allocs = Store.getAllocations();
            const alloc = allocs.find(a => a.id === allocId);
            if (!alloc) return;

            openModal("Revoke Allocation", `<p>Revoke allocation of <strong>${alloc.assetName}</strong> from <strong>${alloc.holderName}</strong>?</p>`, () => {
                const assets = Store.getAssets();
                const asset = assets.find(a => a.id === alloc.assetId);
                if (asset) {
                    asset.status = "Available";
                    asset.currentHolderId = "";
                    asset.currentHolderName = "";
                    asset.history.push({ date: new Date().toISOString().split("T")[0], action: "Revocation", user: user.name, details: `Revoked from ${alloc.holderName}` });
                    Store.saveAssets(assets);
                }

                alloc.status = "Revoked";
                Store.saveAllocations(allocs);
                Store.logActivity(user.name, "Allocation Revoked", `${alloc.assetName} revoked from ${alloc.holderName}`);
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
        el.innerHTML = `<p style="text-align:center; color:var(--color-gray-400); padding:20px;">No transfers recorded.</p>`;
        return;
    }

    el.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
            ${history.map(t => `
                <div style="padding:10px 14px; border:1px solid var(--color-gray-200); border-radius:var(--radius-md); font-size:0.85rem; background:var(--color-gray-50);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-weight:700;">${t.assetId} · ${t.assetName}</span>
                        <span class="badge ${t.status === 'Completed' ? 'badge-available' : 'badge-allocated'}">${t.status}</span>
                    </div>
                    <div style="color:var(--color-gray-600);">
                        <i data-lucide="arrow-right-left" style="width:12px; height:12px;"></i>
                        From <strong>${t.fromName}</strong> → <strong>${t.toName}</strong>
                    </div>
                    <div style="color:var(--color-gray-400); font-size:0.775rem; margin-top:3px;">${t.date} · Reason: ${t.reason || '—'}</div>
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
        <div style="border:1px solid var(--color-gray-200); border-radius:var(--radius-md); padding:16px; background:var(--color-gray-50);">
            <div style="font-size:0.9rem; font-weight:700; margin-bottom:12px; color:var(--color-gray-700);">
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
            <button class="btn btn-primary" id="submit-alloc-btn">Confirm Allocation</button>
        </div>
    `;

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
        <div style="border:1px solid var(--color-orange-200,#fed7aa); border-radius:var(--radius-md); padding:16px; background:#fff7ed;">
            <div style="font-size:0.9rem; font-weight:700; margin-bottom:12px; color:var(--color-gray-700);">
                Transfer Request: <span style="color:var(--color-primary);">${asset.id}</span>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>From</label>
                    <input type="text" class="form-control" value="${asset.currentHolderName}" readonly style="background:var(--color-gray-100);">
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
            <button class="btn btn-primary" id="submit-transfer-btn">Submit Transfer Request</button>
        </div>
    `;

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
