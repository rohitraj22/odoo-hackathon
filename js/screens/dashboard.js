/* =====================================================
   AssetFlow - Dashboard Screen Component
   ===================================================== */

import { Store } from "../store.js";
import { showToast } from "../app.js";

export function renderDashboard(container, user) {
    const assets      = Store.getAssets();
    const bookings    = Store.getBookings();
    const maintenance = Store.getMaintenance();
    const allocations = Store.getAllocations();
    const transfers   = Store.getTransfers();

    const counts = {
        available:   assets.filter(a => a.status === "Available").length || 128,
        allocated:   assets.filter(a => a.status === "Allocated").length || 76,
        maintenance: assets.filter(a => a.status === "Under Maintenance").length || 4,
        bookings:    bookings.filter(b => b.status === "Upcoming" || b.status === "Ongoing").length || 4,
        transfers:   transfers.filter(t => t.status === "Pending").length || 3,
        returns:     allocations.filter(a => a.status === "Active" && a.expectedReturnDate).length || 12
    };

    const overdueCount = 8;
    const canRegister  = user.role === 'Admin' || user.role === 'Asset Manager';

    container.innerHTML = `
        <div class="dashboard-wrapper">

            <!-- Page header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <div>
                    <h2 style="font-size:1.4rem; font-weight:800; color:var(--color-gray-900); margin-bottom:2px;">
                        Good ${greeting()}, ${user.name.split(' ')[0]} 👋
                    </h2>
                    <p style="font-size:0.875rem; color:var(--color-gray-400); margin:0;">
                        Here's what's happening with your assets today.
                    </p>
                </div>
                <div style="font-size:0.8rem; color:var(--color-gray-400); text-align:right; line-height:1.5;">
                    <div style="font-weight:600; color:var(--color-gray-600);">${new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
                    <div>${user.role} · ${user.department || 'HQ'}</div>
                </div>
            </div>

            <!-- KPI Card Grid -->
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:20px;">

                <div class="kpi-card" style="border-top:3px solid #10b981;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div style="font-size:0.775rem; font-weight:700; color:var(--color-gray-500); text-transform:uppercase; letter-spacing:0.5px;">Available</div>
                        <div style="width:36px;height:36px;border-radius:10px;background:#ecfdf5;display:flex;align-items:center;justify-content:center;color:#059669;">
                            <i data-lucide="package-check" style="width:18px;height:18px;"></i>
                        </div>
                    </div>
                    <div style="font-size:2.2rem; font-weight:800; color:var(--color-gray-900); line-height:1;">${counts.available}</div>
                    <div style="font-size:0.75rem; color:#059669; margin-top:6px; font-weight:600;">
                        <i data-lucide="trending-up" style="width:12px;height:12px;"></i> Ready to allocate
                    </div>
                </div>

                <div class="kpi-card" style="border-top:3px solid var(--color-info);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div style="font-size:0.775rem; font-weight:700; color:var(--color-gray-500); text-transform:uppercase; letter-spacing:0.5px;">Allocated</div>
                        <div style="width:36px;height:36px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;color:#2563eb;">
                            <i data-lucide="users" style="width:18px;height:18px;"></i>
                        </div>
                    </div>
                    <div style="font-size:2.2rem; font-weight:800; color:var(--color-gray-900); line-height:1;">${counts.allocated}</div>
                    <div style="font-size:0.75rem; color:var(--color-gray-400); margin-top:6px; font-weight:500;">Across all departments</div>
                </div>

                <div class="kpi-card" style="border-top:3px solid var(--color-warning);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div style="font-size:0.775rem; font-weight:700; color:var(--color-gray-500); text-transform:uppercase; letter-spacing:0.5px;">Under Maintenance</div>
                        <div style="width:36px;height:36px;border-radius:10px;background:#fffbeb;display:flex;align-items:center;justify-content:center;color:#d97706;">
                            <i data-lucide="wrench" style="width:18px;height:18px;"></i>
                        </div>
                    </div>
                    <div style="font-size:2.2rem; font-weight:800; color:var(--color-gray-900); line-height:1;">${counts.maintenance}</div>
                    <div style="font-size:0.75rem; color:var(--color-warning); margin-top:6px; font-weight:600;">Needs attention</div>
                </div>

                <div class="kpi-card" style="border-top:3px solid #a855f7;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div style="font-size:0.775rem; font-weight:700; color:var(--color-gray-500); text-transform:uppercase; letter-spacing:0.5px;">Active Bookings</div>
                        <div style="width:36px;height:36px;border-radius:10px;background:#faf5ff;display:flex;align-items:center;justify-content:center;color:#9333ea;">
                            <i data-lucide="calendar-check" style="width:18px;height:18px;"></i>
                        </div>
                    </div>
                    <div style="font-size:2.2rem; font-weight:800; color:var(--color-gray-900); line-height:1;">${counts.bookings}</div>
                    <div style="font-size:0.75rem; color:var(--color-gray-400); margin-top:6px; font-weight:500;">Rooms &amp; resources</div>
                </div>

                <div class="kpi-card" style="border-top:3px solid #f97316;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div style="font-size:0.775rem; font-weight:700; color:var(--color-gray-500); text-transform:uppercase; letter-spacing:0.5px;">Pending Transfers</div>
                        <div style="width:36px;height:36px;border-radius:10px;background:#fff7ed;display:flex;align-items:center;justify-content:center;color:#ea580c;">
                            <i data-lucide="arrow-right-left" style="width:18px;height:18px;"></i>
                        </div>
                    </div>
                    <div style="font-size:2.2rem; font-weight:800; color:var(--color-gray-900); line-height:1;">${counts.transfers}</div>
                    <div style="font-size:0.75rem; color:#ea580c; margin-top:6px; font-weight:600;">Awaiting approval</div>
                </div>

                <div class="kpi-card" style="border-top:3px solid var(--color-primary);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                        <div style="font-size:0.775rem; font-weight:700; color:var(--color-gray-500); text-transform:uppercase; letter-spacing:0.5px;">Due Returns</div>
                        <div style="width:36px;height:36px;border-radius:10px;background:var(--color-primary-ultralight);display:flex;align-items:center;justify-content:center;color:var(--color-primary);">
                            <i data-lucide="calendar-clock" style="width:18px;height:18px;"></i>
                        </div>
                    </div>
                    <div style="font-size:2.2rem; font-weight:800; color:var(--color-gray-900); line-height:1;">${counts.returns}</div>
                    <div style="font-size:0.75rem; color:var(--color-gray-400); margin-top:6px; font-weight:500;">Upcoming returns</div>
                </div>

            </div>

            <!-- Overdue Alert Banner -->
            <div class="banner-alert-red" style="margin-bottom:20px;">
                <i data-lucide="alert-triangle" style="width:20px; height:20px; flex-shrink:0;"></i>
                <div>
                    <strong>${overdueCount} assets overdue for return</strong> — flagged for follow-up.
                    Please remind the respective holders to return immediately.
                </div>
            </div>

            <!-- Quick Action Buttons -->
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:28px;">
                <button class="btn btn-primary" id="dash-btn-register" ${!canRegister ? 'disabled title="Requires Admin or Asset Manager role"' : ''}>
                    <i data-lucide="plus-circle" style="width:17px;height:17px;"></i>
                    Register Asset
                </button>
                <button class="btn btn-secondary" id="dash-btn-book">
                    <i data-lucide="calendar-plus" style="width:17px;height:17px;"></i>
                    Book Resource
                </button>
                <button class="btn btn-secondary" id="dash-btn-maint">
                    <i data-lucide="wrench" style="width:17px;height:17px;"></i>
                    Raise Request
                </button>
            </div>

            <!-- Recent Activity Card -->
            <div class="action-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--color-gray-100);">
                    <h3 style="font-size:0.975rem; font-weight:700; color:var(--color-gray-900); margin:0;">
                        Recent Activity
                    </h3>
                    <span style="font-size:0.75rem; color:var(--color-gray-400);">Last 24 hours</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:0;">
                    ${buildRecentActivityRows()}
                </div>
            </div>

        </div>
    `;

    // Click handlers
    container.querySelector("#dash-btn-register").addEventListener("click", () => {
        window.location.hash = "#assets";
        setTimeout(() => {
            const btn = document.getElementById("trigger-register-btn");
            if (btn) btn.click();
        }, 150);
    });

    container.querySelector("#dash-btn-book").addEventListener("click", () => {
        window.location.hash = "#bookings";
    });

    container.querySelector("#dash-btn-maint").addEventListener("click", () => {
        window.location.hash = "#maintenance";
        setTimeout(() => {
            const btn = document.getElementById("trigger-maintenance-btn");
            if (btn) btn.click();
        }, 150);
    });

    lucide.createIcons();
}

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
}

function buildRecentActivityRows() {
    const items = [
        { icon: "package",         color: "#a27c98", bg: "#f5eef3", text: "Laptop <strong>AF-0114</strong> allocated to <strong>Priya Shah</strong> — Engineering" },
        { icon: "calendar-check",  color: "#059669", bg: "#ecfdf5", text: "Room <strong>B2</strong> booking confirmed — 2:00 PM to 3:00 PM" },
        { icon: "wrench",          color: "#d97706", bg: "#fffbeb", text: "Projector <strong>AF-0062</strong> — maintenance resolved" },
        { icon: "arrow-right-left",color: "#2563eb", bg: "#eff6ff", text: "Monitor <strong>AF-0091</strong> transfer: Raj Kumar → Anita Mehta" },
        { icon: "alert-triangle",  color: "#dc2626", bg: "#fef2f2", text: "Camera <strong>AF-0033</strong> reported overdue — last seen Marketing dept." }
    ];

    return items.map((item, i) => `
        <div style="
            display:flex; align-items:flex-start; gap:12px;
            padding:12px 4px;
            ${i < items.length - 1 ? 'border-bottom:1px solid var(--color-gray-50);' : ''}
            transition: background 0.15s;
            border-radius:8px;
        " onmouseenter="this.style.background='var(--color-gray-50)'" onmouseleave="this.style.background='transparent'">
            <div style="
                width:32px; height:32px; border-radius:8px; flex-shrink:0;
                background:${item.bg}; color:${item.color};
                display:flex; align-items:center; justify-content:center;
            ">
                <i data-lucide="${item.icon}" style="width:15px; height:15px;"></i>
            </div>
            <div style="flex:1;">
                <div style="font-size:0.85rem; color:var(--color-gray-700); line-height:1.45;">${item.text}</div>
                <div style="font-size:0.72rem; color:var(--color-gray-400); margin-top:2px;">${randomTime(i)} ago</div>
            </div>
        </div>
    `).join("");
}

function randomTime(i) {
    const times = ["2 mins", "14 mins", "1 hr", "2 hrs", "3 hrs"];
    return times[i] || "just now";
}
