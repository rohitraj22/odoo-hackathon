/* ===================================================
   AssetFlow Core App Router & Shell Orchestrator
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
export function checkAuthAndRoute() {
    const user = localStorage.getItem("assetflow_current_user");
    
    const authContainer = document.getElementById("auth-container");
    const mainShell = document.getElementById("main-shell");

    if (!user) {
        // Render login page
        authContainer.classList.remove("hidden");
        mainShell.classList.add("hidden");
        renderLogin(authContainer);
    } else {
        // User logged in, render main shell
        authContainer.classList.add("hidden");
        mainShell.classList.remove("hidden");
        
        const currentUser = Store.getCurrentUser();
        updateUIForUser(currentUser);
        
        // Match path/hash
        const hash = window.location.hash.replace("#", "") || "dashboard";
        routeTo(hash);
    }
    
    // Update notifications badge in header
    updateNotificationBadge();
}

export function routeTo(screenName) {
    const user = Store.getCurrentUser();
    if (!user) {
        checkAuthAndRoute();
        return;
    }

    // Role security check
    if (screenName === "setup" && user.role !== "Admin") {
        showToast("Access Denied: Only Administrators can access Setup.", "danger");
        window.location.hash = "#dashboard";
        return;
    }

    // Clear active links and set new one
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
        if (link.dataset.screen === screenName) {
            link.classList.add("active");
        }
    });

    // Update Page Title
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

    // Call Screen Render function
    const renderFn = routes[screenName] || renderDashboard;
    const viewport = document.getElementById("content-viewport");
    
    // Fade out effect
    viewport.style.opacity = 0;
    setTimeout(() => {
        renderFn(viewport, user);
        viewport.style.opacity = 1;
        lucide.createIcons();
    }, 100);
}

// 2. Shell Actions & Header Details
function updateUIForUser(user) {
    // Set Sidebar profile details
    document.getElementById("sidebar-user-name").textContent = user.name;
    document.getElementById("sidebar-user-role").textContent = user.role;
    
    const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2);
    document.getElementById("sidebar-user-avatar").textContent = initials;

    // Set Header profile details
    document.getElementById("header-user-name").textContent = user.name;
    document.getElementById("dropdown-full-name").textContent = user.name;
    document.getElementById("dropdown-email").textContent = user.email;
    
    const depts = Store.getDepartments();
    const userDept = depts.find(d => d.id === user.departmentId);
    document.getElementById("dropdown-dept").textContent = `Department: ${userDept ? userDept.name : "Unassigned"}`;

    // Admin constraints: hide Setup navigation tab for non-admins
    const adminNavItems = document.querySelectorAll(".admin-only");
    if (user.role === "Admin") {
        adminNavItems.forEach(item => item.classList.remove("hidden"));
    } else {
        adminNavItems.forEach(item => item.classList.add("hidden"));
    }
}

// 3. Global Interactions (Sidebar, Drawers, Modals, Toasts)
function setupGlobalDOMEvents() {
    // Hash Routing listener
    window.addEventListener("hashchange", () => {
        const hash = window.location.hash.replace("#", "") || "dashboard";
        routeTo(hash);
    });

    // Sidebar navigation clicks
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", (e) => {
            const screen = link.dataset.screen;
            if (screen) {
                e.preventDefault();
                window.location.hash = `#${screen}`;
            }
        });
    });

    // Profile Dropdown Toggle
    const profileBtn = document.getElementById("user-profile-btn");
    const userDropdown = document.getElementById("user-dropdown");
    profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("hidden");
        document.getElementById("notification-dropdown").classList.add("hidden");
    });

    // Notifications Dropdown Toggle
    const bellBtn = document.getElementById("notification-bell-btn");
    const notificationsDropdown = document.getElementById("notification-dropdown");
    bellBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        notificationsDropdown.classList.toggle("hidden");
        userDropdown.classList.add("hidden");
        renderNotificationsDropdown();
    });

    // Clear dropdowns when clicking outside
    document.addEventListener("click", () => {
        userDropdown.classList.add("hidden");
        notificationsDropdown.classList.add("hidden");
    });

    // Logout Action
    document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("assetflow_current_user");
        checkAuthAndRoute();
        showToast("Logged out successfully.", "info");
    });

    // Drawer Close
    document.getElementById("drawer-close-btn").addEventListener("click", closeDrawer);
    document.getElementById("drawer-overlay").addEventListener("click", closeDrawer);

    // Modal Close
    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
    document.getElementById("modal-overlay").addEventListener("click", closeModal);

    // Mobile Sidebar Toggle
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

    // Notification dropdown clear all button
    document.getElementById("noti-clear-all").addEventListener("click", (e) => {
        e.stopPropagation();
        Store.saveNotifications([]);
        updateNotificationBadge();
        renderNotificationsDropdown();
        showToast("Notifications cleared.", "info");
        
        // Re-render current viewport if it is the logs screen
        const hash = window.location.hash.replace("#", "") || "dashboard";
        if (hash === "logs") {
            routeTo("logs");
        }
    });

    // Listen for new notifications to update badge dynamically
    window.addEventListener("new-notification", () => {
        updateNotificationBadge();
    });
}

// 4. Notification Dropdown Helpers
function updateNotificationBadge() {
    const badge = document.getElementById("noti-badge-count");
    const notis = Store.getNotifications().filter(n => !n.read);
    
    if (notis.length > 0) {
        badge.textContent = notis.length;
        badge.classList.remove("hidden");
    } else {
        badge.classList.add("hidden");
    }
}

function renderNotificationsDropdown() {
    const list = document.getElementById("noti-dropdown-list");
    const notis = Store.getNotifications();
    
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
                <span style="font-size: 0.7rem; color: var(--color-gray-400); margin-top: 4px; display: inline-block;">${new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        </div>
    `).join("");
    
    // Mark as read when opening dropdown
    notis.forEach(n => n.read = true);
    Store.saveNotifications(notis);
    updateNotificationBadge();
    
    lucide.createIcons();
}

// 5. Drawer & Modal System Exports
export function openDrawer(title, htmlContent) {
    document.getElementById("drawer-title").textContent = title;
    document.getElementById("drawer-body").innerHTML = htmlContent;
    
    document.getElementById("drawer-overlay").classList.remove("hidden");
    document.getElementById("drawer-panel").classList.remove("hidden");
    
    lucide.createIcons();
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
    document.getElementById("modal-confirm-btn-action").addEventListener("click", () => {
        if (onConfirm()) {
            closeModal();
        }
    });
    
    lucide.createIcons();
}

export function closeModal() {
    document.getElementById("modal-overlay").classList.add("hidden");
    document.getElementById("modal-container").classList.add("hidden");
}

// 6. Global Toast Notifications
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
    lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// 7. Role Switcher for hackathon/testing
function setupRoleSwitcher() {
    const toggleBtn = document.getElementById("toggle-switcher-btn");
    const body = document.getElementById("switcher-body");
    const panel = document.getElementById("role-switcher-panel");

    toggleBtn.addEventListener("click", () => {
        panel.classList.toggle("collapsed");
        const isCollapsed = panel.classList.contains("collapsed");
        toggleBtn.innerHTML = `<i data-lucide="${isCollapsed ? 'chevron-up' : 'chevron-down'}"></i>`;
        lucide.createIcons();
    });

    const switcherBtns = document.querySelectorAll(".btn-switcher");
    switcherBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const role = btn.dataset.role;
            const employees = Store.getEmployees();
            
            // Find employee matching target role
            const targetUser = employees.find(e => e.role === role);
            if (!targetUser) return;

            // Update session
            Store.setCurrentUser(targetUser);
            
            // Visual Active States
            switcherBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById("switcher-active-role").textContent = role;

            showToast(`Switched active workspace view to: ${targetUser.name} (${role})`, "info");
            
            // Reload routing UI
            checkAuthAndRoute();
        });
    });

    // Make sure correct switcher button is active on load
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
