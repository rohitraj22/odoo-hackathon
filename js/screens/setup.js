/* ====================================================
   AssetFlow - Organization Master Setup Screen (Admin-only)
   ==================================================== */

import { Store } from "../store.js";
import { openModal, showToast } from "../app.js";

let activeTab = "departments"; // departments, categories, employees

export function renderSetup(container, user) {
    if (user.role !== "Admin") {
        container.innerHTML = `<div class="empty-state">Access Denied. Admin only.</div>`;
        return;
    }

    container.innerHTML = `
        <div class="tab-container">
            <nav class="tab-nav">
                <button class="tab-btn ${activeTab === 'departments' ? 'active' : ''}" data-tab="departments">
                    <i data-lucide="network" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"></i> Department Management
                </button>
                <button class="tab-btn ${activeTab === 'categories' ? 'active' : ''}" data-tab="categories">
                    <i data-lucide="tag" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"></i> Asset Category Management
                </button>
                <button class="tab-btn ${activeTab === 'employees' ? 'active' : ''}" data-tab="employees">
                    <i data-lucide="users" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"></i> Employee Directory
                </button>
            </nav>

            <div class="tab-panel" id="setup-tab-content">
                <!-- Selected tab content rendered here -->
            </div>
        </div>
    `;

    // Hook up tab buttons
    container.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            container.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeTab = btn.dataset.tab;
            renderActiveTabContent(user);
        });
    });

    renderActiveTabContent(user);
}

function renderActiveTabContent(user) {
    const tabContent = document.getElementById("setup-tab-content");
    if (activeTab === "departments") {
        renderDepartments(tabContent, user);
    } else if (activeTab === "categories") {
        renderCategories(tabContent, user);
    } else if (activeTab === "employees") {
        renderEmployees(tabContent, user);
    }
    lucide.createIcons();
}

/* ====================================================
   TAB A - Department Management
   ==================================================== */
function renderDepartments(container, user) {
    const depts = Store.getDepartments();
    const emps = Store.getEmployees();

    container.innerHTML = `
        <div class="page-action-bar">
            <h3>Departments Overview</h3>
            <button class="btn btn-primary" id="add-dept-btn">
                <i data-lucide="plus"></i> Add Department
            </button>
        </div>

        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Dept ID</th>
                        <th>Department Name</th>
                        <th>Parent Department</th>
                        <th>Department Head</th>
                        <th>Status</th>
                        <th style="text-align:right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${depts.map(d => {
                        const parent = depts.find(p => p.id === d.parentId);
                        return `
                            <tr>
                                <td><strong>${d.id}</strong></td>
                                <td>${d.name}</td>
                                <td>${parent ? parent.name : '<span class="color-gray-400">—</span>'}</td>
                                <td>${d.headName || '<span class="color-gray-400">Unassigned</span>'}</td>
                                <td>
                                    <span class="badge ${d.status === 'Active' ? 'badge-available' : 'badge-cancelled'}">
                                        ${d.status}
                                    </span>
                                </td>
                                <td style="text-align:right;">
                                    <button class="btn btn-secondary btn-sm edit-dept-action" data-id="${d.id}">Edit</button>
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;

    // Add Department Handler
    container.querySelector("#add-dept-btn").addEventListener("click", () => {
        const potentialHeads = emps.filter(e => e.status === "Active");
        const potentialParents = depts.filter(d => d.status === "Active");

        const modalHtml = `
            <div class="form-group">
                <label for="new-dept-name">Department Name</label>
                <input type="text" id="new-dept-name" class="form-control" placeholder="e.g. Finance & Accounting" required>
            </div>
            <div class="form-group">
                <label for="new-dept-parent">Parent Department (Optional)</label>
                <select id="new-dept-parent" class="form-control">
                    <option value="">None (Top Level)</option>
                    ${potentialParents.map(d => `<option value="${d.id}">${d.name}</option>`).join("")}
                </select>
            </div>
            <div class="form-group">
                <label for="new-dept-head">Department Head</label>
                <select id="new-dept-head" class="form-control">
                    <option value="">Unassigned</option>
                    ${potentialHeads.map(e => `<option value="${e.id}">${e.name} (${e.role})</option>`).join("")}
                </select>
            </div>
        `;

        openModal("Create New Department", modalHtml, () => {
            const name = document.getElementById("new-dept-name").value.trim();
            const parentId = document.getElementById("new-dept-parent").value;
            const headId = document.getElementById("new-dept-head").value;

            if (!name) {
                showToast("Department name is required.", "danger");
                return false;
            }

            const head = emps.find(e => e.id === headId);
            const newId = `D-${Date.now().toString().slice(-3)}`;
            const list = Store.getDepartments();
            
            const newDept = {
                id: newId,
                name: name,
                parentId: parentId,
                headId: headId,
                headName: head ? head.name : "Unassigned",
                status: "Active"
            };

            list.push(newDept);
            Store.saveDepartments(list);

            // If head is assigned, automatically promote them to Department Head role if they are just Employee
            if (head && head.role === "Employee") {
                head.role = "Department Head";
                Store.saveEmployees(emps);
            }

            Store.logActivity(user.name, "Create Department", `Created department ${name} (${newId})`);
            showToast(`Department "${name}" created.`, "success");
            renderActiveTabContent(user);
            return true;
        });
    });

    // Edit Department Handler
    container.querySelectorAll(".edit-dept-action").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const currentDept = depts.find(d => d.id === id);
            if (!currentDept) return;

            const potentialHeads = emps.filter(e => e.status === "Active");
            const potentialParents = depts.filter(d => d.id !== id && d.status === "Active");

            const modalHtml = `
                <div class="form-group">
                    <label for="edit-dept-name">Department Name</label>
                    <input type="text" id="edit-dept-name" class="form-control" value="${currentDept.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-dept-parent">Parent Department</label>
                    <select id="edit-dept-parent" class="form-control">
                        <option value="">None (Top Level)</option>
                        ${potentialParents.map(d => `<option value="${d.id}" ${d.id === currentDept.parentId ? 'selected' : ''}>${d.name}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-dept-head">Department Head</label>
                    <select id="edit-dept-head" class="form-control">
                        <option value="">Unassigned</option>
                        ${potentialHeads.map(e => `<option value="${e.id}" ${e.id === currentDept.headId ? 'selected' : ''}>${e.name} (${e.role})</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-dept-status">Status</label>
                    <select id="edit-dept-status" class="form-control">
                        <option value="Active" ${currentDept.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${currentDept.status === 'Inactive' ? 'selected' : ''}>Inactive (Deactivate)</option>
                    </select>
                </div>
            `;

            openModal("Edit Department", modalHtml, () => {
                const name = document.getElementById("edit-dept-name").value.trim();
                const parentId = document.getElementById("edit-dept-parent").value;
                const headId = document.getElementById("edit-dept-head").value;
                const status = document.getElementById("edit-dept-status").value;

                if (!name) {
                    showToast("Department name is required.", "danger");
                    return false;
                }

                const head = emps.find(e => e.id === headId);
                const list = Store.getDepartments();
                const target = list.find(d => d.id === id);

                target.name = name;
                target.parentId = parentId;
                target.headId = headId;
                target.headName = head ? head.name : "Unassigned";
                target.status = status;
                Store.saveDepartments(list);

                if (head && head.role === "Employee") {
                    head.role = "Department Head";
                    Store.saveEmployees(emps);
                }

                Store.logActivity(user.name, "Edit Department", `Edited department ${name} (${id})`);
                showToast(`Department "${name}" updated.`, "success");
                renderActiveTabContent(user);
                return true;
            });
        });
    });
}

/* ====================================================
   TAB B - Asset Category Management
   ==================================================== */
function renderCategories(container, user) {
    const categories = Store.getCategories();

    container.innerHTML = `
        <div class="page-action-bar">
            <h3>Asset Categories</h3>
            <button class="btn btn-primary" id="add-cat-btn">
                <i data-lucide="plus"></i> Add Category
            </button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
            ${categories.map(cat => `
                <div class="action-card" style="display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <h4 style="font-size:1.1rem; color:var(--color-primary); margin-bottom:8px; border-bottom: 2px solid var(--color-gray-100); padding-bottom:6px;">${cat.name}</h4>
                        <span style="font-size:0.75rem; text-transform:uppercase; font-weight:600; color:var(--color-gray-400);">Custom Attributes:</span>
                        <ul style="list-style:none; margin-top:6px; font-size:0.85rem; color:var(--color-gray-600);">
                            ${cat.customFields.length === 0 ? '<li style="color:var(--color-gray-400);">None</li>' : cat.customFields.map(f => `
                                <li style="margin-bottom:4px; display:flex; justify-content:space-between;">
                                    <span>${f.name}</span> <strong style="font-size:0.75rem; color:var(--color-gray-400);">${f.type}</strong>
                                </li>
                            `).join("")}
                        </ul>
                    </div>
                    <button class="btn btn-secondary btn-sm edit-cat-action" data-id="${cat.id}" style="margin-top:16px; align-self:flex-end;">Edit Fields</button>
                </div>
            `).join("")}
        </div>
    `;

    // Add Category Handler
    container.querySelector("#add-cat-btn").addEventListener("click", () => {
        let fieldCounter = 0;
        const modalHtml = `
            <div class="form-group">
                <label for="new-cat-name">Category Name</label>
                <input type="text" id="new-cat-name" class="form-control" placeholder="e.g. Heavy Vehicles" required>
            </div>
            <div style="border-top:1px solid var(--color-gray-200); padding-top:14px; margin-top:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span style="font-weight:600; font-size:0.875rem;">Custom Specification Fields</span>
                    <button type="button" class="btn btn-secondary btn-sm" id="add-field-row-btn">+ Add Field</button>
                </div>
                <div id="custom-fields-rows-container">
                    <!-- Dynamic field rows inserted here -->
                </div>
            </div>
        `;

        openModal("Create New Asset Category", modalHtml, () => {
            const name = document.getElementById("new-cat-name").value.trim();
            if (!name) {
                showToast("Category name is required.", "danger");
                return false;
            }

            // Gather fields
            const fields = [];
            const rows = document.querySelectorAll(".custom-field-row");
            rows.forEach(row => {
                const fname = row.querySelector(".field-name-input").value.trim();
                const ftype = row.querySelector(".field-type-select").value;
                if (fname) {
                    fields.push({ name: fname, type: ftype, value: "" });
                }
            });

            const list = Store.getCategories();
            const newId = `CAT-${Date.now().toString().slice(-3)}`;
            list.push({
                id: newId,
                name: name,
                customFields: fields
            });
            Store.saveCategories(list);

            Store.logActivity(user.name, "Create Category", `Created asset category ${name}`);
            showToast(`Category "${name}" created.`, "success");
            renderActiveTabContent(user);
            return true;
        }, "Create");

        // Dynamic Add Field row action
        const rowsContainer = document.getElementById("custom-fields-rows-container");
        document.getElementById("add-field-row-btn").addEventListener("click", () => {
            fieldCounter++;
            const row = document.createElement("div");
            row.className = "custom-field-row form-row";
            row.style.marginBottom = "8px";
            row.innerHTML = `
                <input type="text" class="form-control field-name-input" placeholder="Field Label (e.g. Serial)">
                <div style="display:flex; gap:6px;">
                    <select class="form-control field-type-select">
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                    </select>
                    <button type="button" class="btn btn-danger btn-sm remove-field-row-btn" style="padding:0 10px;">X</button>
                </div>
            `;
            rowsContainer.appendChild(row);
            row.querySelector(".remove-field-row-btn").addEventListener("click", () => row.remove());
        });
    });

    // Edit Category Handler
    container.querySelectorAll(".edit-cat-action").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const currentCat = categories.find(c => c.id === id);
            if (!currentCat) return;

            const modalHtml = `
                <div class="form-group">
                    <label for="edit-cat-name">Category Name</label>
                    <input type="text" id="edit-cat-name" class="form-control" value="${currentCat.name}" required>
                </div>
                <div style="border-top:1px solid var(--color-gray-200); padding-top:14px; margin-top:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-weight:600; font-size:0.875rem;">Custom Specification Fields</span>
                        <button type="button" class="btn btn-secondary btn-sm" id="edit-add-field-row-btn">+ Add Field</button>
                    </div>
                    <div id="edit-custom-fields-rows-container">
                        ${currentCat.customFields.map((f, i) => `
                            <div class="custom-field-row form-row" style="margin-bottom:8px;">
                                <input type="text" class="form-control field-name-input" value="${f.name}">
                                <div style="display:flex; gap:6px;">
                                    <select class="form-control field-type-select">
                                        <option value="text" ${f.type === 'text' ? 'selected' : ''}>Text</option>
                                        <option value="number" ${f.type === 'number' ? 'selected' : ''}>Number</option>
                                        <option value="date" ${f.type === 'date' ? 'selected' : ''}>Date</option>
                                    </select>
                                    <button type="button" class="btn btn-danger btn-sm remove-field-row-btn" style="padding:0 10px;">X</button>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;

            openModal("Edit Asset Category Specifications", modalHtml, () => {
                const name = document.getElementById("edit-cat-name").value.trim();
                if (!name) {
                    showToast("Category name is required.", "danger");
                    return false;
                }

                const fields = [];
                const rows = document.querySelectorAll(".custom-field-row");
                rows.forEach(row => {
                    const fname = row.querySelector(".field-name-input").value.trim();
                    const ftype = row.querySelector(".field-type-select").value;
                    if (fname) {
                        fields.push({ name: fname, type: ftype, value: "" });
                    }
                });

                const list = Store.getCategories();
                const target = list.find(c => c.id === id);
                target.name = name;
                target.customFields = fields;
                Store.saveCategories(list);

                Store.logActivity(user.name, "Edit Category", `Updated fields on category ${name}`);
                showToast(`Category "${name}" updated.`, "success");
                renderActiveTabContent(user);
                return true;
            });

            // Remove action on preloaded rows
            document.querySelectorAll(".remove-field-row-btn").forEach(rb => {
                rb.addEventListener("click", () => rb.closest(".custom-field-row").remove());
            });

            // Add dynamic action on edit modal
            const rowsContainer = document.getElementById("edit-custom-fields-rows-container");
            document.getElementById("edit-add-field-row-btn").addEventListener("click", () => {
                const row = document.createElement("div");
                row.className = "custom-field-row form-row";
                row.style.marginBottom = "8px";
                row.innerHTML = `
                    <input type="text" class="form-control field-name-input" placeholder="Field Label">
                    <div style="display:flex; gap:6px;">
                        <select class="form-control field-type-select">
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                        </select>
                        <button type="button" class="btn btn-danger btn-sm remove-field-row-btn" style="padding:0 10px;">X</button>
                    </div>
                `;
                rowsContainer.appendChild(row);
                row.querySelector(".remove-field-row-btn").addEventListener("click", () => row.remove());
            });
        });
    });
}

/* ====================================================
   TAB C - Employee Directory
   ==================================================== */
function renderEmployees(container, user) {
    const emps = Store.getEmployees();
    const depts = Store.getDepartments();

    container.innerHTML = `
        <div class="page-action-bar">
            <h3>Employee Master Directory</h3>
            <button class="btn btn-primary" id="add-emp-btn">
                <i data-lucide="user-plus"></i> Add Employee
            </button>
        </div>

        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>System Role</th>
                        <th>Status</th>
                        <th style="text-align:right;">Actions (Promotions)</th>
                    </tr>
                </thead>
                <tbody>
                    ${emps.map(e => {
                        const dept = depts.find(d => d.id === e.departmentId);
                        
                        // Style badges for different roles
                        let roleClass = "badge-retired";
                        if (e.role === "Admin") roleClass = "badge-lost";
                        else if (e.role === "Asset Manager") roleClass = "badge-reserved";
                        else if (e.role === "Department Head") roleClass = "badge-allocated";

                        return `
                            <tr>
                                <td><strong>${e.id}</strong></td>
                                <td style="font-weight:600;">${e.name}</td>
                                <td>${e.email}</td>
                                <td>${dept ? dept.name : '<span class="color-gray-400">—</span>'}</td>
                                <td><span class="badge ${roleClass}">${e.role}</span></td>
                                <td>
                                    <span class="badge ${e.status === 'Active' ? 'badge-available' : 'badge-cancelled'}">
                                        ${e.status}
                                    </span>
                                </td>
                                <td style="text-align:right;">
                                    <button class="btn btn-secondary btn-sm edit-role-btn" data-id="${e.id}">Promote/Edit</button>
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;

    // Add Employee Handler
    container.querySelector("#add-emp-btn").addEventListener("click", () => {
        const modalHtml = `
            <div class="form-group">
                <label for="new-emp-name">Full Name</label>
                <input type="text" id="new-emp-name" class="form-control" placeholder="e.g. Alan Turing" required>
            </div>
            <div class="form-group">
                <label for="new-emp-email">Email Address</label>
                <input type="email" id="new-emp-email" class="form-control" placeholder="alan@company.com" required>
            </div>
            <div class="form-group">
                <label for="new-emp-dept">Department</label>
                <select id="new-emp-dept" class="form-control">
                    ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join("")}
                </select>
            </div>
            <div class="form-group">
                <label for="new-emp-role">Assigned System Role</label>
                <select id="new-emp-role" class="form-control">
                    <option value="Employee">Employee (Default)</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Asset Manager">Asset Manager</option>
                    <option value="Admin">Administrator</option>
                </select>
            </div>
            <div class="form-group">
                <label for="new-emp-pw">Access Password</label>
                <input type="password" id="new-emp-pw" class="form-control" placeholder="••••••••" required value="password">
            </div>
        `;

        openModal("Add Employee to Directory", modalHtml, () => {
            const name = document.getElementById("new-emp-name").value.trim();
            const email = document.getElementById("new-emp-email").value.trim().toLowerCase();
            const deptId = document.getElementById("new-emp-dept").value;
            const role = document.getElementById("new-emp-role").value;
            const password = document.getElementById("new-emp-pw").value;

            if (!name || !email) {
                showToast("Name and email are required.", "danger");
                return false;
            }

            const list = Store.getEmployees();
            if (list.some(e => e.email === email)) {
                showToast("Email address already registered.", "danger");
                return false;
            }

            const newId = `EMP-${Date.now().toString().slice(-3)}`;
            list.push({
                id: newId,
                name: name,
                email: email,
                password: password || "password",
                departmentId: deptId,
                role: role,
                status: "Active"
            });
            Store.saveEmployees(list);

            Store.logActivity(user.name, "Add Employee", `Registered employee ${name} (${newId}) with role: ${role}`);
            showToast(`Employee "${name}" registered successfully.`, "success");
            renderActiveTabContent(user);
            return true;
        });
    });

    // Edit Role/Promote Handler
    container.querySelectorAll(".edit-role-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const currentEmp = emps.find(e => e.id === id);
            if (!currentEmp) return;

            // Block self role changes
            const isSelf = currentEmp.id === user.id;

            const modalHtml = `
                <div class="form-group">
                    <label>Employee Name</label>
                    <input type="text" class="form-control" value="${currentEmp.name}" disabled>
                </div>
                <div class="form-group">
                    <label for="edit-emp-dept">Department</label>
                    <select id="edit-emp-dept" class="form-control">
                        ${depts.map(d => `<option value="${d.id}" ${d.id === currentEmp.departmentId ? 'selected' : ''}>${d.name}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-emp-role">System Role Promotion</label>
                    <select id="edit-emp-role" class="form-control" ${isSelf ? 'disabled' : ''}>
                        <option value="Employee" ${currentEmp.role === 'Employee' ? 'selected' : ''}>Employee</option>
                        <option value="Department Head" ${currentEmp.role === 'Department Head' ? 'selected' : ''}>Department Head</option>
                        <option value="Asset Manager" ${currentEmp.role === 'Asset Manager' ? 'selected' : ''}>Asset Manager</option>
                        <option value="Admin" ${currentEmp.role === 'Admin' ? 'selected' : ''}>Administrator</option>
                    </select>
                    ${isSelf ? '<small style="color:var(--color-warning);">You cannot modify your own administrative role.</small>' : ''}
                </div>
                <div class="form-group">
                    <label for="edit-emp-status">Status</label>
                    <select id="edit-emp-status" class="form-control" ${isSelf ? 'disabled' : ''}>
                        <option value="Active" ${currentEmp.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${currentEmp.status === 'Inactive' ? 'selected' : ''}>Inactive (Deactivate)</option>
                    </select>
                </div>
            `;

            openModal("Promote or Edit Employee Workspace", modalHtml, () => {
                const deptId = document.getElementById("edit-emp-dept").value;
                const role = document.getElementById("edit-emp-role").value;
                const status = document.getElementById("edit-emp-status").value;

                const list = Store.getEmployees();
                const target = list.find(e => e.id === id);

                target.departmentId = deptId;
                if (!isSelf) {
                    target.role = role;
                    target.status = status;
                }
                Store.saveEmployees(list);

                Store.logActivity(user.name, "Promote Employee", `Updated employee details for ${target.name} (${id})`);
                showToast(`Employee "${target.name}" workspace details updated.`, "success");
                renderActiveTabContent(user);
                return true;
            });
        });
    });
}
