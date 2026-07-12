/* ===================================================
   AssetFlow Core App Router & Shell Orchestrator (Async)
   =================================================== */

import { Store } from "./store.js";

// Screen module imports
import { renderLogin } from "./screens/login.js";
import { renderDashboard } from "./screens/dashboard.js";
import { renderSetup } from "./screens/setup.js";
import { renderAssets } from "./screens/assets.js";
import { renderAllocations } from "./screens/allocations.js";
import { renderBookings } from "./screens/bookings.js";
import { renderMaintenance } from "./screens/maintenance.js";
import { renderAudits } from "./screens/audits.js";
import { renderReports } from "./screens/reports.js";
import { renderLogs } from "./screens/logs.js";

const routes = {
    "dashboard": renderDashboard,
    "setup": renderSetup,
    "assets": renderAssets,
    "allocations": renderAllocations,
    "bookings": renderBookings,
    "maintenance": renderMaintenance,
    "audits": renderAudits,
    "reports": renderReports,
    "logs": renderLogs
};

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    setupGlobalDOMEvents();
    setupRoleSwitcher();
    checkAuthAndRoute();
}

// 1. Core Auth Routing
export async function checkAuthAndRoute() {
    const user = localStorage.getItem("assetflow_current_user");
    
    const authContainer = document.getElementById("auth-container");
    const mainShell = document.getElementById("main-shell");

    if (!user) {
        authContainer.classList.remove("hidden");
        mainShell.classList.add("hidden");
        renderLogin(authContainer);
    } else {
        authContainer.classList.add("hidden");
        mainShell.classList.remove("hidden");
        
        const currentUser = Store.getCurrentUser();
        await Store.refreshFromApi();
        await updateUIForUser(currentUser); 
        
        const hash = window.location.hash.replace("#", "") || "dashboard";
        routeTo(hash);
    }
    
    updateNotificationBadge();
}

export function routeTo(screenName) {
    const user = Store.getCurrentUser();
    if (!user) {
        checkAuthAndRoute();
        return;
    }

    if (screenName === "setup" && user.role !== "Admin") {
        showToast("Access Denied: Only Administrators can access Setup.", "danger");
        window.location.hash = "#dashboard";
        return;
    }

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
        if (link.dataset.screen === screenName) {
            link.classList.add("active");
        }
    });

    const titleMap = {
        "dashboard": "Dashboard",
        "setup": "Organization Master Setup",
        "assets": "Central Asset Directory",
        "allocations": "Allocations & Transfers",
        "bookings": "Shared Resource Bookings",
        "maintenance": "Maintenance Management",
        "audits": "Verification & Audits",
        "reports": "Reports & Analytics",
        "logs": "Activity Logs & Notification Panel"
    };
    document.getElementById("page-title").textContent = titleMap[screenName] || "AssetFlow";

    const renderFn = routes[screenName] || renderDashboard;
    const viewport = document.getElementById("content-viewport");
    
    viewport.style.opacity = 0;
    
    // ASYNC RENDER TIMEOUT
    setTimeout(async () => {
        try {
            await renderFn(viewport, user); 
            viewport.style.opacity = 1;
            safeCreateIcons();
        } catch (error) {
            console.error("Screen failed to render:", error);
            viewport.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--color-danger);">Failed to load module. Check console.</div>`;
            viewport.style.opacity = 1;
        }
    }, 100);
}

// 2. Shell Actions & Header Details
async function updateUIForUser(user) {
    document.getElementById("sidebar-user-name").textContent = user.name;
    document.getElementById("sidebar-user-role").textContent = user.role;
    
    const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2);
    document.getElementById("sidebar-user-avatar").textContent = initials;

    document.getElementById("header-user-name").textContent = user.name;
    document.getElementById("dropdown-full-name").textContent = user.name;
    document.getElementById("dropdown-email").textContent = user.email;
    
    // Update header avatar initials
    const initials2 = user.name.split(" ").map(n => n[0]).join("").slice(0, 2);
    const headerAvatar = document.getElementById("header-user-avatar");
    if (headerAvatar) headerAvatar.textContent = initials2;
    
    // FETCH DEPARTMENTS FROM BACKEND
    const depts = await Store.fetchDepartments();
    const userDept = depts.find(d => d.id === user.departmentId);
    document.getElementById("dropdown-dept").textContent = `Department: ${userDept ? userDept.name : "Unassigned"}`;

    const adminNavItems = document.querySelectorAll(".admin-only");
    if (user.role === "Admin") {
        adminNavItems.forEach(item => item.classList.remove("hidden"));
    } else {
        adminNavItems.forEach(item => item.classList.add("hidden"));
    }
}

// 3. Global Interactions (Sidebar, Drawers, Modals, Toasts)
function setupGlobalDOMEvents() {
    window.addEventListener("hashchange", () => {
        const hash = window.location.hash.replace("#", "") || "dashboard";
        routeTo(hash);
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", (e) => {
            const screen = link.dataset.screen;
            if (screen) {
                e.preventDefault();
                window.location.hash = `#${screen}`;
            }
        });
    });

    const profileBtn = document.getElementById("user-profile-btn");
    const userDropdown = document.getElementById("user-dropdown");
    profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("hidden");
        document.getElementById("notification-dropdown").classList.add("hidden");
    });

    const bellBtn = document.getElementById("notification-bell-btn");
    const notificationsDropdown = document.getElementById("notification-dropdown");
    bellBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        notificationsDropdown.classList.toggle("hidden");
        userDropdown.classList.add("hidden");
        renderNotificationsDropdown();
    });

    document.addEventListener("click", () => {
        userDropdown.classList.add("hidden");
        notificationsDropdown.classList.add("hidden");
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("assetflow_current_user");
        checkAuthAndRoute();
        showToast("Logged out successfully.", "info");
    });

    document.getElementById("drawer-close-btn").addEventListener("click", closeDrawer);
    document.getElementById("drawer-overlay").addEventListener("click", closeDrawer);

    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
    document.getElementById("modal-overlay").addEventListener("click", closeModal);

    const sidebarToggle = document.getElementById("sidebar-toggle-btn");
    const sidebar = document.querySelector(".sidebar");
    sidebarToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("open");
    });
    
    document.addEventListener("click", (e) => {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove("open");
        }
    });

    document.getElementById("noti-clear-all").addEventListener("click", (e) => {
        e.stopPropagation();
        // Skip backend migration for notifications for now, keep local
        Store.saveNotifications([]);
        updateNotificationBadge();
        renderNotificationsDropdown();
        showToast("Notifications cleared.", "info");
        
        const hash = window.location.hash.replace("#", "") || "dashboard";
        if (hash === "logs") routeTo("logs");
    });

    window.addEventListener("new-notification", () => {
        updateNotificationBadge();
    });
}

// 4. Notification Dropdown Helpers
async function updateNotificationBadge() {
    const badge = document.getElementById("noti-badge-count");
    const currentUser = Store.getCurrentUser();

    if (!badge || !currentUser) {
        if (badge) badge.classList.add("hidden");
        return;
    }

    const notis = (await Store.fetchNotifications ? await Store.fetchNotifications(currentUser.id) : []) || [];
    const unread = notis.filter(n => !n.read);
    
    if (unread.length > 0) {
        badge.textContent = unread.length;
        badge.classList.remove("hidden");
    } else {
        badge.classList.add("hidden");
    }
}

async function renderNotificationsDropdown() {
    const list = document.getElementById("noti-dropdown-list");
    const currentUser = Store.getCurrentUser();
    const notis = (await Store.fetchNotifications && currentUser ? await Store.fetchNotifications(currentUser.id) : []) || [];
    
    if (notis.length === 0) {
        list.innerHTML = `<div class="empty-state" style="padding: 24px; text-align: center; color: var(--color-gray-400); font-size: 0.85rem;">No new notifications</div>`;
        return;
    }

    list.innerHTML = notis.map(n => `
        <div class="noti-dropdown-item ${n.read ? 'read' : 'unread'}" style="padding: 12px 18px; border-bottom: 1px solid var(--color-gray-100); display: flex; gap: 10px; cursor: pointer; background-color: ${n.read ? 'transparent' : 'rgba(113, 75, 103, 0.04)'}">
            <div class="noti-icon" style="margin-top: 3px; color: ${n.type === 'warning' ? 'var(--color-warning)' : n.type === 'danger' ? 'var(--color-danger)' : 'var(--color-info)'}">
                <i data-lucide="${n.type === 'warning' ? 'alert-triangle' : n.type === 'danger' ? 'x-circle' : 'info'}" style="width:16px; height:16px;"></i>
            </div>
            <div class="noti-content" style="flex:1;">
                <h4 style="font-size: 0.85rem; font-weight: 600; margin-bottom: 2px;">${n.title}</h4>
                <p style="font-size: 0.775rem; color: var(--color-gray-600); line-height: 1.3;">${n.message}</p>
            </div>
        </div>
    `).join("");
    
    safeCreateIcons();
}

// 5. Drawer & Modal System Exports
export function openDrawer(title, htmlContent) {
    document.getElementById("drawer-title").textContent = title;
    document.getElementById("drawer-body").innerHTML = htmlContent;
    document.getElementById("drawer-overlay").classList.remove("hidden");
    document.getElementById("drawer-panel").classList.remove("hidden");
    safeCreateIcons();
}

export function closeDrawer() {
    document.getElementById("drawer-overlay").classList.add("hidden");
    document.getElementById("drawer-panel").classList.add("hidden");
}

export function openModal(title, htmlContent, onConfirm, confirmText = "Confirm", cancelText = "Cancel") {
    document.getElementById("modal-title").textContent = title;
    
    const body = document.getElementById("modal-body");
    body.innerHTML = `
        ${htmlContent}
        <div class="modal-footer" style="margin-top:24px; display:flex; justify-content:flex-end; gap:12px;">
            <button class="btn btn-secondary" id="modal-cancel-btn-action">${cancelText}</button>
            <button class="btn btn-primary" id="modal-confirm-btn-action">${confirmText}</button>
        </div>
    `;

    document.getElementById("modal-overlay").classList.remove("hidden");
    document.getElementById("modal-container").classList.remove("hidden");

    document.getElementById("modal-cancel-btn-action").addEventListener("click", closeModal);
    document.getElementById("modal-confirm-btn-action").addEventListener("click", async () => {
        // Now supports async confirmations
        const result = await onConfirm();
        if (result) {
            closeModal();
        }
    });
    
    safeCreateIcons();
}

export function closeModal() {
    document.getElementById("modal-overlay").classList.add("hidden");
    document.getElementById("modal-container").classList.add("hidden");
}

export function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const icons = {
        "success": "check-circle",
        "warning": "alert-triangle",
        "danger": "x-circle",
        "info": "info"
    };

    toast.innerHTML = `
        <i data-lucide="${icons[type] || 'check-circle'}" style="width: 20px; height: 20px; flex-shrink:0;"></i>
        <div style="flex:1;">${message}</div>
    `;
    
    container.appendChild(toast);
    safeCreateIcons();

    setTimeout(() => {
        toast.style.animation = "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// 7. Role Switcher (Async Updated)
function setupRoleSwitcher() {
    const toggleBtn = document.getElementById("toggle-switcher-btn");
    const panel = document.getElementById("role-switcher-panel");

    if (!toggleBtn || !panel) {
        return;
    }

    toggleBtn.addEventListener("click", () => {
        panel.classList.toggle("collapsed");
        const isCollapsed = panel.classList.contains("collapsed");
        toggleBtn.innerHTML = `<i data-lucide="${isCollapsed ? 'chevron-up' : 'chevron-down'}"></i>`;
        safeCreateIcons();
    });

    const switcherBtns = document.querySelectorAll(".btn-switcher");
    switcherBtns.forEach(btn => {
        btn.addEventListener("click", async () => {
            const role = btn.dataset.role;
            
            // FETCH EMPLOYEES FROM BACKEND
            const employees = await Store.fetchEmployees();
            
            const targetUser = employees.find(e => e.role === role);
            if (!targetUser) {
                showToast(`No mock user found for role: ${role}`, "warning");
                return;
            }

            Store.setCurrentUser(targetUser);
            
            switcherBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById("switcher-active-role").textContent = role;

            showToast(`Switched active workspace view to: ${targetUser.name} (${role})`, "info");
            checkAuthAndRoute();
        });
    });

    const activeUser = Store.getCurrentUser();
    if (activeUser) {
        switcherBtns.forEach(btn => {
            if (btn.dataset.role === activeUser.role) {
                btn.classList.add("active");
                document.getElementById("switcher-active-role").textContent = activeUser.role;
            } else {
                btn.classList.remove("active");
            }
        });
    }
}