/* ====================================================
   AssetFlow - Organization Master Setup Screen (Admin-only)
   ==================================================== */

import { Store } from "../store.js";
import { openModal, showToast } from "../app.js";

let activeTab = "departments"; // departments, categories, employees
let pageDepts = [];
let pageCategories = [];
let pageEmployees = [];

export async function renderSetup(container, user) {
    if (user.role !== "Admin") {
        container.innerHTML = `
            <div class="action-card" style="text-align:center; padding: 48px;">
                <i data-lucide="shield-alert" style="width:48px; height:48px; color:var(--color-danger); margin-bottom:12px;"></i>
                <h3>Access Denied</h3>
                <p style="color:var(--color-gray-500); margin-top:8px;">This screen is restricted to Administrators only.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="loading-state">
            <i data-lucide="loader-2" class="spin-icon"></i>
            <div>Loading organization setup...</div>
        </div>
    `;
    safeCreateIcons();

    [pageDepts, pageCategories, pageEmployees] = await Promise.all([
        Store.fetchDepartments(),
        Store.fetchCategories(),
        Store.fetchEmployees()
    ]);

    container.innerHTML = `
        <div class="setup-wrapper page-shell">
            <div class="page-hero compact">
                <div>
                    <p class="page-eyebrow">Admin only</p>
                    <h2 class="page-title">Organization Setup</h2>
                    <p class="page-subtitle">Manage departments, asset categories, and employee records.</p>
                </div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div class="sub-nav-pill-group">
                    <button class="sub-nav-pill ${activeTab === 'departments' ? 'active' : ''}" data-tab="departments">Departments</button>
                    <button class="sub-nav-pill ${activeTab === 'categories' ? 'active' : ''}" data-tab="categories">Categories</button>
                    <button class="sub-nav-pill ${activeTab === 'employees' ? 'active' : ''}" data-tab="employees">Employees</button>
                </div>
                <button class="btn btn-success" id="setup-add-btn">
                    <i data-lucide="plus"></i> Add
                </button>
            </div>

            <div class="tab-panel" id="setup-tab-content">
                <!-- Content gets injected dynamically -->
            </div>

            <div style="margin-top:30px; font-size:0.85rem; color:var(--color-gray-500); font-style:italic; border-top:1px solid var(--color-gray-200); padding-top:14px;">
                Editing a department here also drives the picklist in Allocation &amp; Booking screens.
            </div>
        </div>
    `;
        </div>
    `;

    // Hook pill clicks
    container.querySelectorAll(".sub-nav-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            container.querySelectorAll(".sub-nav-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            activeTab = pill.dataset.tab;
            renderTabContent(user);
        });
    });

    // Hook general Add button
    container.querySelector("#setup-add-btn").addEventListener("click", () => {
        triggerAddAction(user);
    });

    renderTabContent(user);
}

function renderTabContent(user) {
    const viewport = document.getElementById("setup-tab-content");
    if (activeTab === "departments") {
        renderDepartmentsList(viewport, user);
    } else if (activeTab === "categories") {
        renderCategoriesList(viewport, user);
    } else {
        renderEmployeesList(viewport, user);
    }
    safeCreateIcons();
}

function triggerAddAction(user) {
    if (activeTab === "departments") {
        triggerAddDepartment(user);
    } else if (activeTab === "categories") {
        triggerAddCategory(user);
    } else {
        triggerAddEmployee(user);
    }
}

/* ====================================================
   Departments View
   ==================================================== */
function renderDepartmentsList(container, user) {
    const depts = pageDepts.length ? pageDepts : Store.getDepartments();
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Department</th>
                        <th>Head</th>
                        <th>Parent Dept</th>
                        <th>Status</th>
                        <th style="text-align:right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${depts.map(d => `
                        <tr>
                            <td style="font-weight:700;">${d.name}</td>
                            <td>${d.headName || '—'}</td>
                            <td>${d.parentId || '—'}</td>
                            <td>
                                <span class="badge ${d.status === 'Active' ? 'badge-available' : 'badge-cancelled'}">
                                    ${d.status}
                                </span>
                            </td>
                            <td style="text-align:right;">
                                <button class="btn btn-secondary btn-sm edit-dept-btn" data-id="${d.id}">Edit</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;

    // Hook edits
    container.querySelectorAll(".edit-dept-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const dept = depts.find(d => d.id === id);
            const emps = pageEmployees.length ? pageEmployees : Store.getEmployees();

            const modalHtml = `
                <div class="form-group">
                    <label for="edit-dept-name">Department Name</label>
                    <input type="text" id="edit-dept-name" class="form-control" value="${dept.name}">
                </div>
                <div class="form-group">
                    <label for="edit-dept-parent">Parent Dept</label>
                    <input type="text" id="edit-dept-parent" class="form-control" value="${dept.parentId}">
                </div>
                <div class="form-group">
                    <label for="edit-dept-head">Department Head</label>
                    <select id="edit-dept-head" class="form-control">
                        <option value="">Unassigned</option>
                        ${emps.map(e => `<option value="${e.id}" ${e.name === dept.headName ? 'selected' : ''}>${e.name}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-dept-status">Status</label>
                    <select id="edit-dept-status" class="form-control">
                        <option value="Active" ${dept.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${dept.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
            `;

            openModal("Edit Department", modalHtml, () => {
                const name = document.getElementById("edit-dept-name").value.trim();
                const parentId = document.getElementById("edit-dept-parent").value.trim();
                const headId = document.getElementById("edit-dept-head").value;
                const status = document.getElementById("edit-dept-status").value;

                if (!name) return false;

                const head = emps.find(e => e.id === headId);
                const list = Store.getDepartments();
                const target = list.find(d => d.id === id);

                target.name = name;
                target.parentId = parentId;
                target.headName = head ? head.name : "—";
                target.headId = headId;
                target.status = status;
                Store.saveDepartments(list);
                pageDepts = list;

                showToast(`Department "${name}" updated.`, "success");
                renderTabContent(user);
                return true;
            });
        });
    });
}

function triggerAddDepartment(user) {
    const emps = pageEmployees.length ? pageEmployees : Store.getEmployees();
    const modalHtml = `
        <div class="form-group">
            <label for="new-dept-name">Department Name</label>
            <input type="text" id="new-dept-name" class="form-control" placeholder="e.g. Sales">
        </div>
        <div class="form-group">
            <label for="new-dept-parent">Parent Dept (Optional)</label>
            <input type="text" id="new-dept-parent" class="form-control" placeholder="e.g. Field Ops">
        </div>
        <div class="form-group">
            <label for="new-dept-head">Department Head</label>
            <select id="new-dept-head" class="form-control">
                <option value="">Unassigned</option>
                ${emps.map(e => `<option value="${e.id}">${e.name}</option>`).join("")}
            </select>
        </div>
    `;

    openModal("Add Department", modalHtml, () => {
        const name = document.getElementById("new-dept-name").value.trim();
        const parent = document.getElementById("new-dept-parent").value.trim();
        const headId = document.getElementById("new-dept-head").value;

        if (!name) return false;

        const head = emps.find(e => e.id === headId);
        const list = Store.getDepartments();

        list.push({
            id: `D-${Date.now().toString().slice(-3)}`,
            name: name,
            parentId: parent || "—",
            headId: headId,
            headName: head ? head.name : "—",
            status: "Active"
        });
        Store.saveDepartments(list);
        pageDepts = list;

        showToast(`Department "${name}" added.`, "success");
        renderTabContent(user);
        return true;
    });
}

/* ====================================================
   Categories View
   ==================================================== */
function renderCategoriesList(container, user) {
    const cats = pageCategories.length ? pageCategories : Store.getCategories();
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Category ID</th>
                        <th>Category Name</th>
                        <th>Specification Attributes</th>
                    </tr>
                </thead>
                <tbody>
                    ${cats.map(c => `
                        <tr>
                            <td><strong>${c.id}</strong></td>
                            <td style="font-weight:700;">${c.name}</td>
                            <td>${c.customFields.map(f => f.name).join(", ") || 'None'}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function triggerAddCategory(user) {
    const modalHtml = `
        <div class="form-group">
            <label for="new-cat-name">Category Name</label>
            <input type="text" id="new-cat-name" class="form-control" placeholder="e.g. Hardware">
        </div>
    `;
    openModal("Add Category", modalHtml, () => {
        const name = document.getElementById("new-cat-name").value.trim();
        if (!name) return false;

        const list = Store.getCategories();
        list.push({
            id: `CAT-${Date.now().toString().slice(-3)}`,
            name: name,
            customFields: []
        });
        Store.saveCategories(list);
        pageCategories = list;

        showToast(`Category "${name}" added.`, "success");
        renderTabContent(user);
        return true;
    });
}

/* ====================================================
   Employees View
   ==================================================== */
function renderEmployeesList(container, user) {
    const emps = pageEmployees.length ? pageEmployees : Store.getEmployees();
    const depts = pageDepts.length ? pageDepts : Store.getDepartments();

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${emps.map(e => {
                        const dept = depts.find(d => d.id === e.departmentId);
                        return `
                            <tr>
                                <td><strong>${e.id}</strong></td>
                                <td style="font-weight:700;">${e.name}</td>
                                <td>${e.email}</td>
                                <td>${dept ? dept.name : '—'}</td>
                                <td><span class="badge badge-allocated">${e.role}</span></td>
                                <td>
                                    <span class="badge ${e.status === 'Active' ? 'badge-available' : 'badge-cancelled'}">
                                        ${e.status}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function triggerAddEmployee(user) {
    const depts = pageDepts.length ? pageDepts : Store.getDepartments();
    const modalHtml = `
        <div class="form-group">
            <label for="new-emp-name">Employee Name</label>
            <input type="text" id="new-emp-name" class="form-control" placeholder="e.g. John Doe">
        </div>
        <div class="form-group">
            <label for="new-emp-email">Email</label>
            <input type="email" id="new-emp-email" class="form-control" placeholder="e.g. john@company.com">
        </div>
        <div class="form-group">
            <label for="new-emp-dept">Department</label>
            <select id="new-emp-dept" class="form-control">
                ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join("")}
            </select>
        </div>
    `;

    openModal("Add Employee", modalHtml, () => {
        const name = document.getElementById("new-emp-name").value.trim();
        const email = document.getElementById("new-emp-email").value.trim().toLowerCase();
        const deptId = document.getElementById("new-emp-dept").value;

        if (!name || !email) return false;

        const list = Store.getEmployees();
        list.push({
            id: `EMP-${Date.now().toString().slice(-3)}`,
            name: name,
            email: email,
            password: "password",
            departmentId: deptId,
            role: "Employee",
            status: "Active"
        });
        Store.saveEmployees(list);
        pageEmployees = list;

        showToast(`Employee "${name}" registered.`, "success");
        renderTabContent(user);
        return true;
    });
}
