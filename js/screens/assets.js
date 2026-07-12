/* ==========================================================
   AssetFlow - Asset Directory Screen (Backend Connected)
   ========================================================== */

import { Store } from "../store.js";
import { openDrawer, openModal, showToast } from "../app.js";

// Local state to allow instant search filtering without spamming the API
let pageAssets = [];
let pageCategories = [];
let pageDepts = [];

export async function renderAssets(container, user) {
    // 1. Show Loading State
    container.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height: 60vh; flex-direction:column; gap:16px;">
            <i data-lucide="loader-2" style="width:40px; height:40px; color:var(--color-primary); animation: spin 1s linear infinite;"></i>
            <div style="color:var(--color-gray-500); font-weight:600;">Loading Central Directory...</div>
        </div>
        <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;
    lucide.createIcons();

    // 2. Fetch Data from FastAPI Backend
    [pageAssets, pageCategories, pageDepts] = await Promise.all([
        Store.fetchAssets(),
        Store.fetchCategories(),
        Store.fetchDepartments()
    ]);

    // 3. Render the UI Shell
    container.innerHTML = `
        <div class="assets-view-wrapper">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px; flex-wrap:wrap;">
                <div class="search-input-wrapper" style="flex:1; min-width:200px; position:relative;">
                    <i data-lucide="search" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); width:16px; height:16px; color:var(--color-gray-400);"></i>
                    <input type="text" id="asset-search" class="form-control" placeholder="Search by tag, serial, or name..." style="padding-left:36px;">
                </div>
                <select id="filter-category" class="form-control" style="width:auto; min-width:130px;">
                    <option value="">All Categories</option>
                    ${pageCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
                </select>
                <select id="filter-status" class="form-control" style="width:auto; min-width:130px;">
                    <option value="">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="Allocated">Allocated</option>
                    <option value="Under Maintenance">Maintenance</option>
                    <option value="Lost">Lost</option>
                    <option value="Retired">Retired</option>
                </select>
                ${(user.role === 'Admin' || user.role === 'Asset Manager') ? `
                    <button class="btn" id="trigger-register-btn" style="border:2px solid var(--color-gray-900); background-color:#e2f2e9; color:#065f46; font-weight:700; white-space:nowrap; padding:10px 16px;">
                        + Register asset
                    </button>
                ` : ''}
            </div>

            <div class="table-responsive">
                <table class="table" id="assets-table">
                    <thead>
                        <tr>
                            <th>Tag</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Location</th>
                            <th style="text-align:right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="assets-table-body">
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // 4. Initial Render & Event Listeners
    filterAssets();
    
    container.querySelector("#asset-search").addEventListener("input", filterAssets);
    container.querySelector("#filter-category").addEventListener("change", filterAssets);
    container.querySelector("#filter-status").addEventListener("change", filterAssets);

    if (user.role === 'Admin' || user.role === 'Asset Manager') {
        container.querySelector("#trigger-register-btn").addEventListener("click", () => openRegisterModal(user));
    }

    container.querySelector("#assets-table-body").addEventListener("click", e => {
        const btn = e.target.closest(".view-asset-btn");
        if (btn) openAssetDrawer(btn.dataset.id);
    });
}

function filterAssets() {
    const query = (document.getElementById("asset-search")?.value || "").trim().toLowerCase();
    const catId = document.getElementById("filter-category")?.value || "";
    const status = document.getElementById("filter-status")?.value || "";

    const filtered = pageAssets.filter(a => {
        const matchQ = !query || a.name.toLowerCase().includes(query) || a.id.toLowerCase().includes(query) || (a.serial_number || "").toLowerCase().includes(query);
        const matchC = !catId || a.category_id === catId;
        const matchS = !status || a.status === status;
        return matchQ && matchC && matchS;
    });

    const tbody = document.getElementById("assets-table-body");
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--color-gray-400); padding:32px;">No assets found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(a => {
        const cat = pageCategories.find(c => c.id === a.category_id);
        let badgeClass = "badge-retired";
        if (a.status === "Available") badgeClass = "badge-available";
        else if (a.status === "Allocated") badgeClass = "badge-allocated";
        else if (a.status === "Under Maintenance") badgeClass = "badge-undermaintenance";
        else if (a.status === "Lost") badgeClass = "badge-lost";

        return `
            <tr>
                <td style="font-weight:700; font-family:monospace; font-size:0.85rem;">${a.id}</td>
                <td style="font-weight:600;">${a.name}</td>
                <td>${cat ? cat.name : '—'}</td>
                <td><span class="badge ${badgeClass}">${a.status}</span></td>
                <td>${a.location || '—'}</td>
                <td style="text-align:right;">
                    <button class="btn btn-secondary btn-sm view-asset-btn" data-id="${a.id}">View Details</button>
                </td>
            </tr>
        `;
    }).join("");

    lucide.createIcons();
}

function openRegisterModal(user) {
    const modalHtml = `
        <div class="form-row">
            <div class="form-group">
                <label for="reg-name">Asset Name</label>
                <input type="text" id="reg-name" class="form-control" placeholder="e.g. Dell Laptop" required>
            </div>
            <div class="form-group">
                <label for="reg-category">Category</label>
                <select id="reg-category" class="form-control" required>
                    <option value="">Select...</option>
                    ${pageCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="reg-serial">Serial / Model No.</label>
                <input type="text" id="reg-serial" class="form-control" placeholder="e.g. SN-89241" required>
            </div>
            <div class="form-group">
                <label for="reg-location">Location</label>
                <input type="text" id="reg-location" class="form-control" placeholder="e.g. Server Room" required>
            </div>
        </div>
        <div class="form-group" style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" id="reg-shared" style="width:16px; height:16px;">
            <label for="reg-shared" style="margin-bottom:0; cursor:pointer;">Shared / Bookable resource</label>
        </div>
    `;

    openModal("Register New Asset", modalHtml, async () => {
        const name = document.getElementById("reg-name").value.trim();
        const catId = document.getElementById("reg-category").value;
        const serial = document.getElementById("reg-serial").value.trim();
        const location = document.getElementById("reg-location").value.trim();
        const isShared = document.getElementById("reg-shared").checked;

        if (!name || !catId || !serial || !location) {
            showToast("Please fill in all required fields.", "danger");
            return false;
        }

        // Disable button while saving to prevent double-clicks
        document.getElementById("modal-confirm-btn-action").disabled = true;
        document.getElementById("modal-confirm-btn-action").textContent = "Saving...";

        try {
            const response = await fetch("http://localhost:8000/api/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name,
                    category_id: catId,
                    serial_number: serial,
                    location: location,
                    is_shared: isShared
                })
            });

            if (!response.ok) throw new Error("Failed to register asset");

            showToast(`Asset "${name}" registered successfully.`, "success");
            
            // Re-render the screen to show the new data
            const viewport = document.getElementById("content-viewport");
            await renderAssets(viewport, user);
            
            return true; 
        } catch (error) {
            console.error(error);
            showToast("Error communicating with server.", "danger");
            document.getElementById("modal-confirm-btn-action").disabled = false;
            document.getElementById("modal-confirm-btn-action").textContent = "Register";
            return false;
        }
    }, "Register");
}

function openAssetDrawer(assetId) {
    const a = pageAssets.find(x => x.id === assetId);
    if (!a) return;

    const cat = pageCategories.find(c => c.id === a.category_id);

    let badgeClass = "badge-retired";
    if (a.status === "Available") badgeClass = "badge-available";
    else if (a.status === "Allocated") badgeClass = "badge-allocated";
    else if (a.status === "Under Maintenance") badgeClass = "badge-undermaintenance";
    else if (a.status === "Lost") badgeClass = "badge-lost";

    const html = `
        <div style="padding-bottom:16px; border-bottom:1px solid var(--color-gray-200); margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span class="badge ${badgeClass}">${a.status}</span>
                <span style="font-family:monospace; font-size:0.8rem; color:var(--color-gray-500);">${a.id}</span>
            </div>
            <h2 style="font-size:1.4rem; font-weight:800; margin-bottom:4px;">${a.name}</h2>
            <div style="font-size:0.875rem; color:var(--color-gray-500);">${a.location || '—'} · ${cat ? cat.name : '—'}</div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.85rem; background-color:var(--color-gray-50); padding:14px; border-radius:var(--radius-md); margin-bottom:20px;">
            <div>Serial: <strong style="font-family:monospace;">${a.serial_number || '—'}</strong></div>
            <div>Condition: <strong>${a.condition}</strong></div>
            <div style="grid-column:span 2">Shared Resource: <strong>${a.is_shared ? 'Yes' : 'No'}</strong></div>
        </div>
    `;

    openDrawer(`Asset Details: ${a.id}`, html);
}