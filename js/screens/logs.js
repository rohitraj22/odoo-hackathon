/* ============================================================
   AssetFlow - Notifications Log Center (Enhanced)
   ============================================================ */

import { Store } from "../store.js";

const TABS = [
    { id: "all",       label: "All",       icon: "bell" },
    { id: "alerts",    label: "Alerts",    icon: "alert-triangle" },
    { id: "approvals", label: "Approvals", icon: "check-square" },
    { id: "bookings",  label: "Bookings",  icon: "calendar" }
];

let activeTab = "all";
let pageLogs = [];
let pageTransfers = [];
let pageBookings = [];
let pageMaintenance = [];

export async function renderLogs(container, user) {
    container.innerHTML = `
        <div class="loading-state">
            <i data-lucide="loader-2" class="spin-icon"></i>
            <div style="color:var(--color-gray-500); font-weight:600;">Loading notifications...</div>
        </div>
    `;
    safeCreateIcons();

    [pageLogs, pageTransfers, pageBookings, pageMaintenance] = await Promise.all([
        Store.fetchLogs(),
        Store.fetchTransfers(),
        Store.fetchBookings(),
        Store.fetchMaintenance()
    ]);

    container.innerHTML = `
        <div class="logs-wrapper page-shell">
            <div class="page-hero compact">
                <div>
                    <p class="page-eyebrow">System activity</p>
                    <h2 class="page-title">Notifications & Activity</h2>
                    <p class="page-subtitle">Track alerts, approvals, bookings, and system events in one place.</p>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="noti-tab-bar">
                ${TABS.map(tab => `
                    <button class="noti-tab-btn ${activeTab === tab.id ? "active" : ""}" data-tab="${tab.id}">
                        <i data-lucide="${tab.icon}"></i>
                        <span>${tab.label}</span>
                        <span class="noti-tab-count" id="tab-count-${tab.id}">—</span>
                    </button>
                `).join("")}
            </div>

            <!-- Notification List Container -->
            <div class="noti-list-container" id="notification-list-container"></div>
        </div>
    `;

    safeCreateIcons();

    // Build all notifications and count per tab
    const allNotifications = buildNotifications(user);
    TABS.forEach(tab => {
        const count = tab.id === "all"
            ? allNotifications.length
            : allNotifications.filter(n => n.category === tab.id).length;
        const el = document.getElementById(`tab-count-${tab.id}`);
        if (el) el.textContent = count;
    });

    container.querySelectorAll(".noti-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            container.querySelectorAll(".noti-tab-btn").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            activeTab = btn.dataset.tab;
            renderNotificationList(user, allNotifications);
        });
    });

    renderNotificationList(user, allNotifications);
}

function renderNotificationList(user, allNotifications) {
    const listContainer = document.getElementById("notification-list-container");
    if (!listContainer) return;

    const filtered = activeTab === "all"
        ? allNotifications
        : allNotifications.filter(n => n.category === activeTab);

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="noti-empty-state">
                <div class="noti-empty-icon">
                    <i data-lucide="bell-off"></i>
                </div>
                <h4>Nothing here</h4>
                <p>No ${activeTab === "all" ? "" : activeTab + " "}notifications at the moment.</p>
            </div>
        `;
        safeCreateIcons();
        return;
    }

    listContainer.innerHTML = `
        <div class="noti-list">
            ${filtered.map(n => `
                <div class="noti-card ${n.unread ? "noti-card--unread" : ""}">
                    <div class="noti-card-icon noti-icon-${n.category}">
                        ${categoryIcon(n.category)}
                    </div>
                    <div class="noti-card-content">
                        <div class="noti-card-header">
                            <span class="noti-card-title">${n.title}</span>
                            <span class="noti-card-time">${n.time}</span>
                        </div>
                        <p class="noti-card-body">${n.body}</p>
                        <div class="noti-card-footer">
                            <span class="noti-category-pill noti-pill-${n.category}">${n.category}</span>
                            ${n.unread ? '<span class="noti-unread-dot"></span>' : ""}
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function buildNotifications(user) {
    const activity = pageLogs.length ? pageLogs : Store.getLogs();
    const transfers = pageTransfers.length ? pageTransfers : Store.getTransfers();
    const bookings = pageBookings.length ? pageBookings : Store.getBookings();
    const maintenance = pageMaintenance.length ? pageMaintenance : Store.getMaintenance();

    const notifications = [];

    activity.slice(0, 20).forEach((a, i) => {
        let category = "all";
        if (a.action?.includes("Maintenance") || a.action?.includes("Alert")) category = "alerts";
        else if (a.action?.includes("Transfer") || a.action?.includes("Alloc")) category = "approvals";
        else if (a.action?.includes("Booking")) category = "bookings";

        notifications.push({
            id: `act-${i}`,
            title: a.action,
            body: a.details,
            time: formatRelativeTime(a.timestamp || a.date),
            category,
            unread: i < 3
        });
    });

    transfers.filter(t => t.status === "Pending").forEach((t, i) => {
        notifications.push({
            id: `trf-${i}`,
            title: "Transfer Pending Approval",
            body: `${t.assetName || "Asset"} — from ${t.fromName} to ${t.toName}. Reason: ${t.reason || "—"}`,
            time: formatRelativeTime(t.date),
            category: "approvals",
            unread: true
        });
    });

    const today = new Date().toISOString().split("T")[0];
    bookings.filter(b => b.status === "Upcoming" && b.date >= today).slice(0, 5).forEach((b, i) => {
        notifications.push({
            id: `bk-${i}`,
            title: "Booking Confirmed",
            body: `${b.assetName || "Resource"} on ${b.date} from ${b.startTime} to ${b.endTime}`,
            time: formatRelativeTime(b.date),
            category: "bookings",
            unread: false
        });
    });

    maintenance.filter(m => m.status === "Pending" || m.priority === "Critical").slice(0, 5).forEach((m, i) => {
        notifications.push({
            id: `mnt-${i}`,
            title: m.priority === "Critical" ? "Critical Maintenance Alert" : "Maintenance Pending",
            body: `${m.assetName || "Asset"}: ${m.issueDescription}`,
            time: formatRelativeTime(m.reportedDate),
            category: "alerts",
            unread: m.priority === "Critical"
        });
    });

    return notifications.sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0));
}

function formatRelativeTime(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function categoryIcon(cat) {
    switch (cat) {
        case "alerts":
            return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        case "approvals":
            return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        case "bookings":
            return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
        default:
            return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
    }
}
