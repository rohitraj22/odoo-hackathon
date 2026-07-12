/* ==========================================================
   AssetFlow - Asset Directory & Registration Screen Component
   ========================================================== */

import { Store } from "../store.js";
import { openDrawer, openModal, showToast } from "../app.js";

export function renderAssets(container, user) {
    const categories = Store.getCategories();
    const assets = Store.getAssets();

    // Render page framework
    container.innerHTML = `
        <div class="assets-view-wrapper">
            <!-- Filter Action Bar -->
            <div class="page-action-bar">
                <div class="search-filter-group">
                    <div class="search-input-wrapper">
                        <i data-lucide="search"></i>
                        <input type="text" id="asset-search" class="form-control" placeholder="Search by name, tag, or serial...">
                    </div>
                    
                    <select id="filter-category" class="form-control" style="width: auto; min-width: 140px;">
                        <option value="">All Categories</option>
                        ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
                    </select>

                    <select id="filter-status" class="form-control" style="width: auto; min-width: 140px;">
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

                ${(user.role === 'Admin' || user.role === 'Asset Manager') ? `
                    <button class="btn btn-primary" id="trigger-register-btn">
                        <i data-lucide="plus"></i> Register Asset
                    </button>
                ` : ''}
            </div>

            <!-- Assets Grid / List -->
            <div class="table-responsive">
                <table class="table" id="assets-table">
                    <thead>
                        <tr>
                            <th>Asset Tag</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Serial Number</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Shared/Bookable</th>
                            <th>Current Holder</th>
                            <th style="text-align:right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="assets-table-body">
                        <!-- Populated by search/filter logic -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Initialize list and event listeners
    filterAssets();

    container.querySelector("#asset-search").addEventListener("input", filterAssets);
    container.querySelector("#filter-category").addEventListener("change", filterAssets);
    container.querySelector("#filter-status").addEventListener("change", filterAssets);

    if (user.role === 'Admin' || user.role === 'Asset Manager') {
        container.querySelector("#trigger-register-btn").addEventListener("click", () => openRegisterModal(user));
    }

    // Bind item action clicks
    container.querySelector("#assets-table-body").addEventListener("click", (e) => {
        const viewBtn = e.target.closest(".view-asset-details");
        if (viewBtn) {
            const assetId = viewBtn.dataset.id;
            openAssetDetailsDrawer(assetId);
        }
    });
}

function filterAssets() {
    const query = document.getElementById("asset-search").value.trim().toLowerCase();
    const catId = document.getElementById("filter-category").value;
    const status = document.getElementById("filter-status").value;

    const assets = Store.getAssets();
    const categories = Store.getCategories();

    const filtered = assets.filter(a => {
        const matchesQuery = a.name.toLowerCase().includes(query) || 
                             a.id.toLowerCase().includes(query) || 
                             a.serialNumber.toLowerCase().includes(query) ||
                             a.location.toLowerCase().includes(query);
        const matchesCat = !catId || a.categoryId === catId;
        const matchesStatus = !status || a.status === status;

        return matchesQuery && matchesCat && matchesStatus;
    });

    const tbody = document.getElementById("assets-table-body");
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; color: var(--color-gray-400); padding: 32px;">No assets match current filters.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(a => {
        const cat = categories.find(c => c.id === a.categoryId);
        
        let badgeClass = "badge-retired";
        if (a.status === "Available") badgeClass = "badge-available";
        else if (a.status === "Allocated") badgeClass = "badge-allocated";
        else if (a.status === "Reserved") badgeClass = "badge-reserved";
        else if (a.status === "Under Maintenance") badgeClass = "badge-undermaintenance";
        else if (a.status === "Lost") badgeClass = "badge-lost";
        else if (a.status === "Disposed") badgeClass = "badge-disposed";

        return `
            <tr>
                <td><strong>${a.id}</strong></td>
                <td style="font-weight:600;">${a.name}</td>
                <td>${cat ? cat.name : 'Uncategorized'}</td>
                <td style="font-family:monospace; font-size:0.825rem;">${a.serialNumber || '—'}</td>
                <td>${a.location || '—'}</td>
                <td><span class="badge ${badgeClass}">${a.status}</span></td>
                <td>
                    <span style="color: ${a.isShared ? 'var(--color-success)' : 'var(--color-gray-400)'}">
                        ${a.isShared ? '<i data-lucide="check-circle" style="width:16px; height:16px; vertical-align:middle;"></i> Yes' : 'No'}
                    </span>
                </td>
                <td>${a.currentHolderName || '<span style="color:var(--color-gray-400);">None</span>'}</td>
                <td style="text-align:right;">
                    <button class="btn btn-secondary btn-sm view-asset-details" data-id="${a.id}">View Details</button>
                </td>
            </tr>
        `;
    }).join("");

    lucide.createIcons();
}

/* ==========================================================
   Register Asset Dialog (handles dynamic spec inputs)
   ========================================================== */
function openRegisterModal(user) {
    const categories = Store.getCategories();
    
    const modalHtml = `
        <div class="form-row">
            <div class="form-group">
                <label for="reg-name">Asset Name</label>
                <input type="text" id="reg-name" class="form-control" placeholder="MacBook Pro M3 Max" required>
            </div>
            <div class="form-group">
                <label for="reg-category">Asset Category</label>
                <select id="reg-category" class="form-control" required>
                    <option value="">Select Category</option>
                    ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
                </select>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="reg-serial">Serial / Model Number</label>
                <input type="text" id="reg-serial" class="form-control" placeholder="e.g. SN-89241" required>
            </div>
            <div class="form-group">
                <label for="reg-location">Initial Location</label>
                <input type="text" id="reg-location" class="form-control" placeholder="e.g. Server Room B" required>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="reg-date">Acquisition Date</label>
                <input type="date" id="reg-date" class="form-control" required value="${new Date().toISOString().split("T")[0]}">
            </div>
            <div class="form-group">
                <label for="reg-cost">Acquisition Cost ($)</label>
                <input type="number" id="reg-cost" class="form-control" placeholder="e.g. 1500" min="0">
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="reg-condition">Initial Condition</label>
                <select id="reg-condition" class="form-control">
                    <option value="Excellent">Excellent</option>
                    <option value="Good" selected>Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                </select>
            </div>
            <div class="form-group" style="display:flex; align-items:center; gap:8px; margin-top:28px;">
                <input type="checkbox" id="reg-shared" style="width:18px; height:18px; cursor:pointer;">
                <label for="reg-shared" style="margin-bottom:0; cursor:pointer;">Make Shared / Bookable resource</label>
            </div>
        </div>

        <!-- Dynamic specs injection zone -->
        <div id="dynamic-specs-container" style="background-color:var(--color-gray-50); border-radius:var(--radius-md); padding:14px; display:none; margin-top:10px; border: 1px dashed var(--color-gray-300);">
            <h4 style="font-size:0.85rem; margin-bottom:10px; color:var(--color-gray-700);">Category-specific Attributes:</h4>
            <div id="dynamic-specs-inputs"></div>
        </div>
    `;

    openModal("Register New Asset Tag", modalHtml, () => {
        const name = document.getElementById("reg-name").value.trim();
        const catId = document.getElementById("reg-category").value;
        const serial = document.getElementById("reg-serial").value.trim();
        const location = document.getElementById("reg-location").value.trim();
        const date = document.getElementById("reg-date").value;
        const cost = parseFloat(document.getElementById("reg-cost").value || "0");
        const cond = document.getElementById("reg-condition").value;
        const shared = document.getElementById("reg-shared").checked;

        if (!name || !catId || !serial || !location || !date) {
            showToast("Please fill in all required fields.", "danger");
            return false;
        }

        const assets = Store.getAssets();
        
        // Validation: unique serial
        if (assets.some(a => a.serialNumber === serial)) {
            showToast("An asset with this Serial Number already exists.", "danger");
            return false;
        }

        // Collect custom specs
        const targetCat = categories.find(c => c.id === catId);
        const customData = {};
        if (targetCat) {
            targetCat.customFields.forEach(f => {
                const el = document.getElementById(`spec-${f.name}`);
                if (el) {
                    customData[f.name] = el.value;
                }
            });
        }

        // Auto generate Asset Tag e.g. AF-0007
        const lastNum = assets.length > 0 ? parseInt(assets[assets.length - 1].id.replace("AF-", "")) : 0;
        const tagStr = `AF-${(lastNum + 1).toString().padStart(4, "0")}`;

        const newAsset = {
            id: tagStr,
            name: name,
            categoryId: catId,
            serialNumber: serial,
            acquisitionDate: date,
            acquisitionCost: cost,
            condition: cond,
            location: location,
            bookable: shared,
            status: "Available",
            currentHolderId: "",
            currentHolderName: "",
            isShared: shared,
            customData: customData,
            history: [
                { date: date, action: "Registration", user: user.name, details: `Registered in system under ${targetCat ? targetCat.name : 'uncategorized'}.` }
            ]
        };

        assets.push(newAsset);
        Store.saveAssets(assets);

        Store.logActivity(user.name, "Asset Registration", `Registered new asset ${name} (${tagStr})`);
        showToast(`Asset "${name}" registered successfully as ${tagStr}.`, "success");
        filterAssets();
        return true;
    }, "Register");

    // Dynamic Specifications display based on Category Selection
    const catSelect = document.getElementById("reg-category");
    const specsContainer = document.getElementById("dynamic-specs-container");
    const specsInputs = document.getElementById("dynamic-specs-inputs");

    catSelect.addEventListener("change", () => {
        const catId = catSelect.value;
        const targetCat = categories.find(c => c.id === catId);

        if (!targetCat || targetCat.customFields.length === 0) {
            specsContainer.style.display = "none";
            specsInputs.innerHTML = "";
            return;
        }

        specsContainer.style.display = "block";
        specsInputs.innerHTML = targetCat.customFields.map(f => `
            <div class="form-group">
                <label for="spec-${f.name}">${f.name}</label>
                <input type="${f.type}" id="spec-${f.name}" class="form-control" placeholder="e.g. ${f.value || 'Attribute value'}">
            </div>
        `).join("");
    });
}

/* ==========================================================
   Asset Details Drawer & History Timeline
   ========================================================== */
function openAssetDetailsDrawer(assetId) {
    const assets = Store.getAssets();
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const categories = Store.getCategories();
    const cat = categories.find(c => c.id === asset.categoryId);

    // Build specs list
    const specsList = Object.entries(asset.customData || {});

    const drawerHtml = `
        <div style="padding-bottom:16px; border-bottom:1px solid var(--color-gray-200); margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <span class="badge badge-allocated" style="font-size:0.7rem; text-transform:uppercase;">${cat ? cat.name : 'Hardware'}</span>
                <span style="font-size:0.8rem; font-weight:600; color:var(--color-gray-400);">Tag: ${asset.id}</span>
            </div>
            <h2 style="font-size:1.4rem; font-weight:700; margin-bottom:4px;">${asset.name}</h2>
            <div style="font-size:0.875rem; color:var(--color-gray-600);"><i data-lucide="map-pin" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;"></i>${asset.location}</div>
        </div>

        <div style="margin-bottom:24px;">
            <h4 style="font-size:0.875rem; color:var(--color-gray-500); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Core Specifications</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.85rem; background-color:var(--color-gray-50); padding:14px; border-radius:var(--radius-md); border:1px solid var(--color-gray-200);">
                <div>Status: <strong style="color:var(--color-primary);">${asset.status}</strong></div>
                <div>Condition: <strong>${asset.condition}</strong></div>
                <div>Serial Number: <strong style="font-family:monospace;">${asset.serialNumber}</strong></div>
                <div>Shared Resource: <strong>${asset.isShared ? 'Yes' : 'No'}</strong></div>
                <div>Acquisition Date: <strong>${asset.acquisitionDate}</strong></div>
                <div>Acquisition Value: <strong>$${asset.acquisitionCost.toLocaleString()}</strong></div>
                
                ${specsList.map(([key, val]) => `
                    <div style="grid-column: span 2; border-top: 1px solid var(--color-gray-200); padding-top:6px; margin-top:4px;">
                        ${key}: <strong>${val || '—'}</strong>
                    </div>
                `).join("")}
            </div>
        </div>

        <div style="margin-bottom:24px;">
            <h4 style="font-size:0.875rem; color:var(--color-gray-500); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Current Assignment</h4>
            <div style="font-size:0.85rem; background-color:var(--color-gray-50); padding:14px; border-radius:var(--radius-md); border:1px solid var(--color-gray-200); display:flex; align-items:center; gap:10px;">
                <div class="user-avatar" style="width:32px; height:32px; font-size:0.8rem; background-color:var(--color-primary-light);">
                    ${asset.currentHolderName ? asset.currentHolderName.charAt(0) : '?'}
                </div>
                <div>
                    <div><strong>${asset.currentHolderName || 'Not Assigned (In Stock)'}</strong></div>
                    <div style="font-size:0.75rem; color:var(--color-gray-400);">${asset.currentHolderId ? `Employee ID: ${asset.currentHolderId}` : 'Available for allocation'}</div>
                </div>
            </div>
        </div>

        <div>
            <h4 style="font-size:0.875rem; color:var(--color-gray-500); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Asset Lifecycle History</h4>
            <div class="history-timeline">
                ${asset.history.map(h => `
                    <div class="timeline-item">
                        <span class="timeline-marker ${h.action === 'Registration' ? 'success' : h.action === 'Allocation' ? 'info' : h.action === 'Return Checked-In' ? 'primary' : 'warning'}"></span>
                        <div class="timeline-content">
                            <div class="timeline-meta">
                                <span class="timeline-title">${h.action}</span>
                                <span class="timeline-date">${h.date}</span>
                            </div>
                            <div class="timeline-desc">${h.details}</div>
                            <div style="font-size:0.7rem; color:var(--color-gray-400); margin-top:2px;">Logged by: ${h.user}</div>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;

    openDrawer("Asset History Details", drawerHtml);
}
