/* ============================================================
   AssetFlow - Notifications Log Center (Wireframe: Screen 10)
   ============================================================ */

import { Store } from "../store.js";

const TABS = [
    { id: "all",       label: "All" },
    { id: "alerts",    label: "Alerts" },
    { id: "approvals", label: "Approvals" },
    { id: "bookings",  label: "Bookings" }
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
            <div>Loading notifications...</div>
        </div>
    `;
    lucide.createIcons();

    [pageLogs, pageTransfers, pageBookings, pageMaintenance] = await Promise.all([
        Store.fetchLogs(),
        Store.fetchTransfers(),
        Store.fetchBookings(),
        Store.fetchMaintenance()
    ]);

    container.innerHTML = `
        <div class="logs-wrapper">
            <h3 style="font-size:1.25rem; font-weight:700; margin-bottom:18px;">Notifications</h3>

            <!-- Sub-navigation tabs -->
            <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
                ${TABS.map(tab => `
                    <button class="sub-nav-pill ${activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">${tab.label}</button>
                `).join("")}
            </div>

            <!-- Notification list -->
            <div class="action-card" id="notification-list-container">
            </div>
        </div>
    `;

    container.querySelectorAll(".sub-nav-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            container.querySelectorAll(".sub-nav-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            activeTab = pill.dataset.tab;
            renderNotificationList(user);
        });
    });

    renderNotificationList(user);
}

function renderNotificationList(user) {
    const listContainer = document.getElementById("notification-list-container");
    if (!listContainer) return;

    const logs = buildNotifications(user);
    const filtered = activeTab === "all"
        ? logs
        : logs.filter(n => n.category === activeTab);

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:48px; color:var(--color-gray-400);">
                <i data-lucide="bell-off" style="width:36px; height:36px; margin-bottom:12px; opacity:0.4;"></i>
                <p>No ${activeTab === 'all' ? '' : activeTab + ' '}notifications.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    listContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0;">
            ${filtered.map((n, i) => `
                <div style="
                    padding:14px 16px;
                    ${i < filtered.length - 1 ? 'border-bottom:1px solid var(--color-gray-100);' : ''}
                    display:flex; align-items:flex-start; gap:12px;
                    ${n.unread ? 'background:#f0fdf4;' : ''}
                    transition:background 0.15s;
                " onmouseenter="this.style.background='var(--color-gray-50)';" onmouseleave="this.style.background='${n.unread ? '#f0fdf4' : 'transparent'}';">
                    <div style="
                        width:36px; height:36px; border-radius:50%; flex-shrink:0;
                        display:flex; align-items:center; justify-content:center;
                        background:${categoryColor(n.category).bg}; color:${categoryColor(n.category).text};
                    ">
                        ${categoryIcon(n.category)}
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:3px;">
                            <span style="font-size:0.875rem; font-weight:${n.unread ? '700' : '600'}; color:var(--color-gray-900); line-height:1.35;">${n.title}</span>
                            <span style="font-size:0.75rem; color:var(--color-gray-400); white-space:nowrap; flex-shrink:0;">${n.time}</span>
                        </div>
                        <div style="font-size:0.8rem; color:var(--color-gray-500); line-height:1.4;">${n.body}</div>
                        <div style="margin-top:4px;">
                            <span style="
                                display:inline-block;
                                padding:2px 8px;
                                border-radius:9999px;
                                font-size:0.7rem; font-weight:600;
                                background:${categoryColor(n.category).bg};
                                color:${categoryColor(n.category).text};
                                text-transform:capitalize;
                            ">${n.category}</span>
                            ${n.unread ? '<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981; margin-left:6px; vertical-align:middle;"></span>' : ''}
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function buildNotifications(user) {
    const activity = pageLogs.length ? pageLogs : Store.getActivitySync();
    const transfers = pageTransfers.length ? pageTransfers : Store.getTransfers();
    const bookings = pageBookings.length ? pageBookings : Store.getBookings();
    const maintenance = pageMaintenance.length ? pageMaintenance : Store.getMaintenance();

    const notifications = [];

    // Activity-based alerts
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

    // Pending transfer alerts
    transfers.filter(t => t.status === "Pending").forEach((t, i) => {
        notifications.push({
            id: `trf-${i}`,
            title: "Transfer Pending Approval",
            body: `${t.assetName} — from ${t.fromName} to ${t.toName}. Reason: ${t.reason}`,
            time: formatRelativeTime(t.date),
            category: "approvals",
            unread: true
        });
    });

    // Upcoming bookings
    const today = new Date().toISOString().split("T")[0];
    bookings.filter(b => b.status === "Upcoming" && b.date >= today).slice(0, 5).forEach((b, i) => {
        notifications.push({
            id: `bk-${i}`,
            title: "Booking Confirmed",
            body: `${b.assetName} on ${b.date} from ${b.startTime} to ${b.endTime}`,
            time: formatRelativeTime(b.date),
            category: "bookings",
            unread: false
        });
    });

    // Maintenance alerts
    maintenance.filter(m => m.status === "Pending" || m.priority === "Critical").slice(0, 5).forEach((m, i) => {
        notifications.push({
            id: `mnt-${i}`,
            title: m.priority === "Critical" ? "⚠ Critical Maintenance" : "Maintenance Pending",
            body: `${m.assetName}: ${m.issueDescription}`,
            time: formatRelativeTime(m.reportedDate),
            category: "alerts",
            unread: m.priority === "Critical"
        });
    });

    // Sort by unread first, then most recent
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
    return dateStr;
}

function categoryColor(cat) {
    switch (cat) {
        case "alerts":    return { bg: "#fee2e2", text: "#dc2626" };
        case "approvals": return { bg: "#dbeafe", text: "#1d4ed8" };
        case "bookings":  return { bg: "#d1fae5", text: "#065f46" };
        default:          return { bg: "#f3f4f6", text: "#374151" };
    }
}

function categoryIcon(cat) {
    switch (cat) {
        case "alerts":    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        case "approvals": return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        case "bookings":  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
        default:          return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
    }
}
