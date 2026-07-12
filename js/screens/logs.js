/* ==========================================================
   AssetFlow - Activity Logs & Notifications Screen Component
   ========================================================== */

import { Store } from "../store.js";
import { showToast } from "../app.js";

export function renderLogs(container, user) {
    container.innerHTML = `
        <div class="logs-grid-layout" style="display:grid; grid-template-columns: 2fr 1.2fr; gap:24px;">
            <!-- Left Panel: Core System Audit Trail -->
            <div class="action-card" style="display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
                    <h3 class="section-title" style="margin-bottom:0;">System Audit Logs</h3>
                    <div class="search-input-wrapper" style="max-width:280px; flex:1;">
                        <i data-lucide="search"></i>
                        <input type="text" id="log-search" class="form-control" placeholder="Search activities...">
                    </div>
                </div>

                <div class="table-responsive" style="margin-bottom:0; flex:1; max-height: 520px; overflow-y:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Actor</th>
                                <th>Operation</th>
                                <th>Incident Details</th>
                            </tr>
                        </thead>
                        <tbody id="logs-table-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right Panel: Notifications Center Feed -->
            <div class="action-card" style="display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                    <h3 class="section-title" style="margin-bottom:0;">Notification History</h3>
                    <button class="btn btn-secondary btn-sm" id="clear-notifications-btn">Clear All</button>
                </div>

                <div id="notifications-feed-list" style="flex:1; overflow-y:auto; max-height:520px; display:flex; flex-direction:column; gap:12px;">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </div>
    `;

    renderAuditLogs();
    renderNotificationsFeed();

    // Hook search event
    container.querySelector("#log-search").addEventListener("input", renderAuditLogs);

    // Hook clear notifications
    container.querySelector("#clear-notifications-btn").addEventListener("click", () => {
        Store.saveNotifications([]);
        renderNotificationsFeed();
        // Update header count badge too
        const badge = document.getElementById("noti-badge-count");
        if (badge) badge.classList.add("hidden");
        showToast("Notifications cleared successfully.", "info");
    });

    lucide.createIcons();
}

function renderAuditLogs() {
    const query = document.getElementById("log-search").value.trim().toLowerCase();
    const tbody = document.getElementById("logs-table-body");
    const logs = Store.getLogs();

    const filtered = logs.filter(l => {
        return l.user.toLowerCase().includes(query) || 
               l.action.toLowerCase().includes(query) || 
               l.details.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; color: var(--color-gray-400); padding: 32px;">No matching log events.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(l => {
        const d = new Date(l.timestamp);
        const dateStr = d.toLocaleDateString();
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        return `
            <tr>
                <td style="font-size:0.8rem; color:var(--color-gray-500); white-space:nowrap;">
                    <strong>${dateStr}</strong> <span style="margin-left:4px; font-weight:300;">${timeStr}</span>
                </td>
                <td style="font-weight:600; font-size:0.85rem;">${l.user}</td>
                <td>
                    <span class="badge badge-allocated" style="background-color: var(--color-gray-100); color: var(--color-gray-700); border: 1px solid var(--color-gray-200);">
                        ${l.action}
                    </span>
                </td>
                <td style="font-size:0.825rem; color: var(--color-gray-600);">${l.details}</td>
            </tr>
        `;
    }).join("");
}

function renderNotificationsFeed() {
    const list = document.getElementById("notifications-feed-list");
    const notis = Store.getNotifications();

    if (notis.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding: 48px 0; color: var(--color-gray-400); font-size: 0.85rem;">
                <i data-lucide="bell-off" style="width:36px; height:36px; margin-bottom:8px; color:var(--color-gray-300); display:inline-block;"></i>
                <p>No notifications in log.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    list.innerHTML = notis.map(n => {
        let borderCol = "var(--color-info)";
        let iconName = "info";
        
        if (n.type === "warning") {
            borderCol = "var(--color-warning)";
            iconName = "alert-triangle";
        } else if (n.type === "danger") {
            borderCol = "var(--color-danger)";
            iconName = "x-circle";
        } else if (n.type === "success") {
            borderCol = "var(--color-success)";
            iconName = "check-circle";
        }

        const timeStr = new Date(n.timestamp).toLocaleString();

        return `
            <div class="alert-item" style="background-color:var(--color-gray-50); border: 1px solid var(--color-gray-200); border-left: 4px solid ${borderCol}; display:flex; gap:12px; padding:12px; border-radius:var(--radius-md);">
                <div style="color: ${borderCol}; margin-top:2px;">
                    <i data-lucide="${iconName}" style="width:18px; height:18px;"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-weight:600; font-size:0.875rem; color:var(--color-gray-900); margin-bottom:2px;">${n.title}</div>
                    <p style="font-size:0.8rem; color:var(--color-gray-600); line-height:1.4; margin-bottom:4px;">${n.message}</p>
                    <span style="font-size:0.7rem; color:var(--color-gray-400);">${timeStr}</span>
                </div>
            </div>
        `;
    }).join("");

    lucide.createIcons();
}
