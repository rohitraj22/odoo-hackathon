/* ==========================================================
   AssetFlow - Asset Directory Screen (Wireframe Aligned: Screen 4)
   ========================================================== */

import { Store } from "../store.js";
import { openDrawer, openModal, showToast } from "../app.js";

export function renderAssets(container, user) {
    const categories = Store.getCategories();

    container.innerHTML = `
        <div class="assets-view-wrapper">
            <!-- Filter bar + Register button -->
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px; flex-wrap:wrap;">
                <div class="search-input-wrapper" style="flex:1; min-width:200px; position:relative;">
                    <i data-lucide="search" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); width:16px; height:16px; color:var(--color-gray-400);"></i>
                    <input type="text" id="asset-search" class="form-control" placeholder="Search by tag, serial, or QR code..." style="padding-left:36px;">
                </div>
                <select id="filter-category" class="form-control" style="width:auto; min-width:130px;">
                    <option value="">Category</option>
                    ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
                </select>
                <select id="filter-status" class="form-control" style="width:auto; min-width:130px;">
                    <option value="">Status</option>
                    <option value="Available">Available</option>
                    <option value="Allocated">Allocated</option>
                    <option value="Under Maintenance">Maintenance</option>
                    <option value="Lost">Lost</option>
                    <option value="Retired">Retired</option>
                </select>
                <select id="filter-dept" class="form-control" style="width:auto; min-width:130px;">
                    <option value="">Department</option>
                    ${Store.getDepartments().map(d => `<option value="${d.id}">${d.name}</option>`).join("")}
                </select>
                ${(user.role === 'Admin' || user.role === 'Asset Manager') ? `
                    <button class="btn" id="trigger-register-btn" style="border:2px solid var(--color-gray-900); background-color:#e2f2e9; color:#065f46; font-weight:700; white-space:nowrap; padding:10px 16px;">
                        + Register asset
                    </button>
                ` : ''}
            </div>

            <!-- Assets Table - Wireframe: Tag | Name | Category | Status | Location -->
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

    filterAssets();
    container.querySelector("#asset-search").addEventListener("input", filterAssets);
    container.querySelector("#filter-category").addEventListener("change", filterAssets);
    container.querySelector("#filter-status").addEventListener("change", filterAssets);
    container.querySelector("#filter-dept").addEventListener("change", filterAssets);

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

    const assets = Store.getAssets();
    const categories = Store.getCategories();

    const filtered = assets.filter(a => {
        const matchQ = !query || a.name.toLowerCase().includes(query) || a.id.toLowerCase().includes(query) || (a.serialNumber || "").toLowerCase().includes(query);
        const matchC = !catId || a.categoryId === catId;
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
        const cat = categories.find(c => c.id === a.categoryId);
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
    const categories = Store.getCategories();
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
                    ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
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
                <input type="text" id="reg-location" class="form-control" placeholder="e.g. bengaluru" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="reg-date">Acquisition Date</label>
                <input type="date" id="reg-date" class="form-control" value="${new Date().toISOString().split("T")[0]}">
            </div>
            <div class="form-group">
                <label for="reg-cost">Cost ($)</label>
                <input type="number" id="reg-cost" class="form-control" placeholder="0" min="0">
            </div>
        </div>
        <div class="form-group" style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" id="reg-shared" style="width:16px; height:16px;">
            <label for="reg-shared" style="margin-bottom:0; cursor:pointer;">Shared / Bookable resource</label>
        </div>
        <div id="dynamic-specs-container" style="display:none; background-color:var(--color-gray-50); border:1px dashed var(--color-gray-300); border-radius:var(--radius-md); padding:14px; margin-top:12px;">
            <div style="font-size:0.85rem; font-weight:600; margin-bottom:8px; color:var(--color-gray-700);">Category Attributes:</div>
            <div id="dynamic-specs-inputs"></div>
        </div>
    `;

    openModal("Register New Asset", modalHtml, () => {
        const name = document.getElementById("reg-name").value.trim();
        const catId = document.getElementById("reg-category").value;
        const serial = document.getElementById("reg-serial").value.trim();
        const location = document.getElementById("reg-location").value.trim();
        const date = document.getElementById("reg-date").value;
        const cost = parseFloat(document.getElementById("reg-cost").value || "0");
        const shared = document.getElementById("reg-shared").checked;

        if (!name || !catId || !serial || !location) {
            showToast("Please fill in all required fields.", "danger");
            return false;
        }

        const assets = Store.getAssets();
        if (assets.some(a => a.serialNumber === serial)) {
            showToast("Serial number already registered.", "danger");
            return false;
        }

        // Auto-generate tag
        const nums = assets.map(a => parseInt(a.id.replace("AF-", "")) || 0);
        const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
        const tag = `AF-${nextNum.toString().padStart(4, "0")}`;

        const targetCat = categories.find(c => c.id === catId);
        const customData = {};
        if (targetCat) {
            targetCat.customFields.forEach(f => {
                const el = document.getElementById(`spec-${f.name}`);
                if (el) customData[f.name] = el.value;
            });
        }

        assets.push({
            id: tag,
            name,
            categoryId: catId,
            serialNumber: serial,
            acquisitionDate: date,
            acquisitionCost: cost,
            condition: "Good",
            location,
            bookable: shared,
            status: "Available",
            currentHolderId: "",
            currentHolderName: "",
            isShared: shared,
            customData,
            history: [{ date, action: "Registration", user: user.name, details: `Registered as ${tag}` }]
        });
        Store.saveAssets(assets);

        Store.logActivity(user.name, "Asset Registration", `Registered ${name} (${tag})`);
        showToast(`Asset "${name}" registered as ${tag}.`, "success");
        filterAssets();
        return true;
    }, "Register");

    // Dynamic specs based on category
    const catSelect = document.getElementById("reg-category");
    catSelect.addEventListener("change", () => {
        const cat = categories.find(c => c.id === catSelect.value);
        const specsContainer = document.getElementById("dynamic-specs-container");
        const specsInputs = document.getElementById("dynamic-specs-inputs");
        if (!cat || cat.customFields.length === 0) {
            specsContainer.style.display = "none";
            return;
        }
        specsContainer.style.display = "block";
        specsInputs.innerHTML = cat.customFields.map(f => `
            <div class="form-group">
                <label for="spec-${f.name}">${f.name}</label>
                <input type="${f.type}" id="spec-${f.name}" class="form-control" placeholder="${f.value || ''}">
            </div>
        `).join("");
    });
}

function openAssetDrawer(assetId) {
    const assets = Store.getAssets();
    const a = assets.find(x => x.id === assetId);
    if (!a) return;

    const cats = Store.getCategories();
    const cat = cats.find(c => c.id === a.categoryId);

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
            <div>Serial: <strong style="font-family:monospace;">${a.serialNumber || '—'}</strong></div>
            <div>Condition: <strong>${a.condition}</strong></div>
            <div>Acquired: <strong>${a.acquisitionDate || '—'}</strong></div>
            <div>Cost: <strong>$${(a.acquisitionCost || 0).toLocaleString()}</strong></div>
            <div style="grid-column:span 2">Shared: <strong>${a.isShared ? 'Yes' : 'No'}</strong></div>
        </div>

        <div style="margin-bottom:20px;">
            <h4 style="font-size:0.825rem; text-transform:uppercase; font-weight:700; color:var(--color-gray-500); margin-bottom:8px;">Current Holder</h4>
            <div style="background:var(--color-gray-50); border:1px solid var(--color-gray-200); padding:12px; border-radius:var(--radius-md); font-size:0.875rem;">
                ${a.currentHolderName ? `<strong>${a.currentHolderName}</strong> <span style="color:var(--color-gray-400);">(${a.currentHolderId})</span>` : '<span style="color:var(--color-gray-400);">No holder — in stock</span>'}
            </div>
        </div>

        <div>
            <h4 style="font-size:0.825rem; text-transform:uppercase; font-weight:700; color:var(--color-gray-500); margin-bottom:10px;">Lifecycle History</h4>
            <div style="position:relative; padding-left:22px; border-left:2px solid var(--color-gray-200);">
                ${(a.history || []).map(h => `
                    <div style="margin-bottom:14px;">
                        <div style="font-size:0.85rem; font-weight:700; color:var(--color-gray-900);">${h.action}</div>
                        <div style="font-size:0.775rem; color:var(--color-gray-600);">${h.details}</div>
                        <div style="font-size:0.7rem; color:var(--color-gray-400); margin-top:2px;">${h.date} · ${h.user}</div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;

    openDrawer(`Asset Details: ${a.id}`, html);
}
