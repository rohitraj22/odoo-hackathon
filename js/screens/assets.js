/* ==========================================================
   AssetFlow - Asset Directory Screen (Backend Connected)
   ========================================================== */

import { Store } from "../store.js";
import { openDrawer, openModal, showToast } from "../app.js";

let pageAssets = [];
let pageCategories = [];
let pageDepts = [];

export async function renderAssets(container, user) {
    container.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height: 60vh; flex-direction:column; gap:16px;">
            <i data-lucide="loader-2" style="width:40px; height:40px; color:var(--color-primary); animation: spin 1s linear infinite;"></i>
            <div style="color:var(--color-gray-500); font-weight:600;">Loading Central Directory...</div>
        </div>
        <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;
    safeCreateIcons();

    [pageAssets, pageCategories, pageDepts] = await Promise.all([
        Store.fetchAssets(),
        Store.fetchCategories(),
        Store.fetchDepartments()
    ]);

    container.innerHTML = `
        <div class="assets-view-wrapper page-shell">
            <div class="page-hero">
                <div>
                    <p class="page-eyebrow">Central directory</p>
                    <h2 class="page-title">Asset Registration & Tracking</h2>
                    <p class="page-subtitle">Search, filter, and manage assets across their full lifecycle.</p>
                </div>
                ${(user.role === "Admin" || user.role === "Asset Manager") ? `
                    <button class="btn btn-primary" id="trigger-register-btn">
                        <i data-lucide="plus"></i> Register Asset
                    </button>
                ` : ""}
            </div>

            <div class="filter-bar">
                <div class="search-input-wrapper">
                    <i data-lucide="search"></i>
                    <input type="text" id="asset-search" class="form-control" placeholder="Search by tag, serial, or name...">
                </div>
                <select id="filter-category" class="form-control filter-select">
                    <option value="">All Categories</option>
                    ${pageCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
                </select>
                <select id="filter-status" class="form-control filter-select">
                    <option value="">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="Allocated">Allocated</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Lost">Lost</option>
                    <option value="Retired">Retired</option>
                    <option value="Disposed">Disposed</option>
                </select>
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
                    <tbody id="assets-table-body"></tbody>
                </table>
            </div>
        </div>
    `;

    filterAssets();

    container.querySelector("#asset-search").addEventListener("input", filterAssets);
    container.querySelector("#filter-category").addEventListener("change", filterAssets);
    container.querySelector("#filter-status").addEventListener("change", filterAssets);

    const registerBtn = container.querySelector("#trigger-register-btn");
    if (registerBtn) {
        registerBtn.addEventListener("click", () => openRegisterModal(user));
    }

    container.querySelector("#assets-table-body").addEventListener("click", e => {
        const btn = e.target.closest(".view-asset-btn");
        if (btn) openAssetDrawer(btn.dataset.id);
    });

    safeCreateIcons();
}

function statusBadgeClass(status) {
    const map = {
        Available: "badge-available",
        Allocated: "badge-allocated",
        Reserved: "badge-reserved",
        "Under Maintenance": "badge-undermaintenance",
        Lost: "badge-lost",
        Retired: "badge-retired",
        Disposed: "badge-disposed"
    };
    return map[status] || "badge-retired";
}

function filterAssets() {
    const query = (document.getElementById("asset-search")?.value || "").trim().toLowerCase();
    const catId = document.getElementById("filter-category")?.value || "";
    const status = document.getElementById("filter-status")?.value || "";

    const filtered = pageAssets.filter(a => {
        const matchQ = !query ||
            a.name.toLowerCase().includes(query) ||
            a.id.toLowerCase().includes(query) ||
            (a.serialNumber || "").toLowerCase().includes(query);
        const matchC = !catId || a.categoryId === catId;
        const matchS = !status || a.status === status;
        return matchQ && matchC && matchS;
    });

    const tbody = document.getElementById("assets-table-body");
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i data-lucide="package-search"></i><p>No assets match your filters.</p></div></td></tr>`;
        safeCreateIcons();
        return;
    }

    tbody.innerHTML = filtered.map(a => {
        const cat = pageCategories.find(c => c.id === a.categoryId);
        return `
            <tr>
                <td><span class="asset-tag-chip">${a.id}</span></td>
                <td style="font-weight:600;">${a.name}</td>
                <td>${cat ? cat.name : "—"}</td>
                <td><span class="badge ${statusBadgeClass(a.status)}">${a.status}</span></td>
                <td>${a.location || "—"}</td>
                <td style="text-align:right;">
                    <button class="btn btn-secondary btn-sm view-asset-btn" data-id="${a.id}">View Details</button>
                </td>
            </tr>
        `;
    }).join("");

    safeCreateIcons();
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
        <div class="form-group checkbox-row">
            <input type="checkbox" id="reg-shared">
            <label for="reg-shared">Shared / Bookable resource</label>
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

        const confirmBtn = document.getElementById("modal-confirm-btn-action");
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Saving...";

        const result = await Store.createAsset({
            name,
            categoryId: catId,
            serialNumber: serial,
            location,
            isShared,
            bookable: isShared
        });

        if (!result.success) {
            showToast(result.message || "Failed to register asset.", "danger");
            confirmBtn.disabled = false;
            confirmBtn.textContent = "Register";
            return false;
        }

        await Store.logActivity(user.name, "Asset Registered", `${name} (${result.data.id}) added to directory.`);
        showToast(`Asset "${name}" registered as ${result.data.id}.`, "success");
        await renderAssets(document.getElementById("content-viewport"), user);
        return true;
    }, "Register");
}

function openAssetDrawer(assetId) {
    const a = pageAssets.find(x => x.id === assetId);
    if (!a) return;

    const cat = pageCategories.find(c => c.id === a.categoryId);
    const history = (a.history || []).slice(-5).reverse();

    const html = `
        <div class="drawer-asset-header">
            <span class="badge ${statusBadgeClass(a.status)}">${a.status}</span>
            <span class="asset-tag-chip">${a.id}</span>
        </div>
        <h2 class="drawer-asset-title">${a.name}</h2>
        <p class="drawer-asset-meta">${a.location || "—"} · ${cat ? cat.name : "—"}</p>

        <div class="detail-grid">
            <div><span>Serial</span><strong>${a.serialNumber || "—"}</strong></div>
            <div><span>Condition</span><strong>${a.condition}</strong></div>
            <div><span>Holder</span><strong>${a.currentHolderName || "—"}</strong></div>
            <div><span>Shared</span><strong>${a.isShared ? "Yes" : "No"}</strong></div>
        </div>

        <div class="drawer-section">
            <h4>Recent History</h4>
            ${history.length ? `
                <div class="timeline-list">
                    ${history.map(h => `
                        <div class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div>
                                <strong>${h.action}</strong>
                                <p>${h.details || ""}</p>
                                <small>${h.date} · ${h.user || "System"}</small>
                            </div>
                        </div>
                    `).join("")}
                </div>
            ` : `<p class="muted-text">No history recorded yet.</p>`}
        </div>
    `;

    openDrawer(`Asset Details: ${a.id}`, html);
}
