/* =====================================================
   AssetFlow - Dashboard Screen Component
   ===================================================== */

import { Store } from "../store.js";
import { showToast } from "../app.js";

export function renderDashboard(container, user) {
    // 1. Gather counts
    const assets = Store.getAssets();
    const bookings = Store.getBookings();
    const maintenance = Store.getMaintenance();
    const allocations = Store.getAllocations();
    const transfers = Store.getTransfers();

    const counts = {
        available: assets.filter(a => a.status === "Available").length,
        allocated: assets.filter(a => a.status === "Allocated").length,
        maintenance: maintenance.filter(m => m.status === "In Progress" || m.status === "Pending").length,
        bookings: bookings.filter(b => b.status === "Upcoming" || b.status === "Ongoing").length,
        transfers: transfers.filter(t => t.status === "Pending").length,
        returns: 0
    };

    // Calculate overdue vs upcoming allocations
    const todayStr = new Date().toISOString().split("T")[0];
    const overdueAllocations = [];
    const upcomingAllocations = [];

    allocations.forEach(alloc => {
        if (alloc.status === "Active" && alloc.expectedReturnDate) {
            if (alloc.expectedReturnDate < todayStr) {
                overdueAllocations.push(alloc);
            } else {
                upcomingAllocations.push(alloc);
                counts.returns++;
            }
        }
    });

    // Check user-scoped limits for Employee view
    let scopedOverdue = [...overdueAllocations];
    let scopedUpcoming = [...upcomingAllocations];
    
    if (user.role === "Employee") {
        scopedOverdue = overdueAllocations.filter(a => a.employeeId === user.id);
        scopedUpcoming = upcomingAllocations.filter(a => a.employeeId === user.id);
    } else if (user.role === "Department Head") {
        // Find employees in department
        const employees = Store.getEmployees();
        const deptEmpIds = employees.filter(e => e.departmentId === user.departmentId).map(e => e.id);
        scopedOverdue = overdueAllocations.filter(a => deptEmpIds.includes(a.employeeId));
        scopedUpcoming = upcomingAllocations.filter(a => deptEmpIds.includes(a.employeeId));
    }

    // Register button disable logic
    const canRegisterAsset = (user.role === "Admin" || user.role === "Asset Manager");

    container.innerHTML = `
        <div class="dashboard-wrapper">
            <!-- KPI Cards Grid -->
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">Assets Available</span>
                        <span class="kpi-icon available"><i data-lucide="check"></i></span>
                    </div>
                    <span class="kpi-value">${counts.available}</span>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">Assets Allocated</span>
                        <span class="kpi-icon allocated"><i data-lucide="package"></i></span>
                    </div>
                    <span class="kpi-value">${counts.allocated}</span>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">Maintenance Today</span>
                        <span class="kpi-icon maintenance"><i data-lucide="wrench"></i></span>
                    </div>
                    <span class="kpi-value">${counts.maintenance}</span>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">Active Bookings</span>
                        <span class="kpi-icon bookings"><i data-lucide="calendar"></i></span>
                    </div>
                    <span class="kpi-value">${counts.bookings}</span>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">Pending Transfers</span>
                        <span class="kpi-icon transfers"><i data-lucide="repeat"></i></span>
                    </div>
                    <span class="kpi-value">${counts.transfers}</span>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">Upcoming Returns</span>
                        <span class="kpi-icon returns"><i data-lucide="clock"></i></span>
                    </div>
                    <span class="kpi-value">${counts.returns}</span>
                </div>
            </div>

            <!-- Action panel + Overdue alerts -->
            <div class="dashboard-actions-grid">
                <!-- Left: Quick Actions -->
                <div class="action-card">
                    <h3 class="section-title">Quick Operational Actions</h3>
                    <div class="card-grid">
                        <button class="quick-action-btn" id="qa-register" ${!canRegisterAsset ? 'disabled' : ''} title="${!canRegisterAsset ? 'Requires Asset Manager or Admin role' : 'Add new asset to registry'}">
                            <i data-lucide="plus-circle"></i>
                            <div>
                                <h4>Register Asset</h4>
                                <p>${canRegisterAsset ? 'Register a new equipment, vehicle, or room' : 'Disabled for Employees'}</p>
                            </div>
                        </button>

                        <button class="quick-action-btn" id="qa-book">
                            <i data-lucide="calendar-plus"></i>
                            <div>
                                <h4>Book Resource</h4>
                                <p>Book shared meeting rooms, vehicles, or equipment slots</p>
                            </div>
                        </button>

                        <button class="quick-action-btn" id="qa-maintenance">
                            <i data-lucide="tool"></i>
                            <div>
                                <h4>Raise Repair Request</h4>
                                <p>Report a damaged or malfunctioning asset for servicing</p>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Right: Overdue Return Alerts -->
                <div class="action-card" style="display:flex; flex-direction:column;">
                    <h3 class="section-title" style="color: var(--color-danger);">
                        <span><i data-lucide="alert-circle" style="vertical-align:middle; width:18px; height:18px; margin-right:4px;"></i> Overdue Returns</span>
                        <span class="badge badge-high">${scopedOverdue.length}</span>
                    </h3>
                    
                    <div class="alert-list" style="flex:1; overflow-y:auto; max-height:220px;">
                        ${scopedOverdue.length === 0 ? `
                            <div style="text-align:center; padding: 24px 0; color: var(--color-gray-400); font-size: 0.85rem;">
                                <i data-lucide="check-circle-2" style="width:32px; height:32px; color: var(--color-success); margin-bottom:8px;"></i>
                                <p>All allocations are on schedule.</p>
                            </div>
                        ` : scopedOverdue.map(alloc => `
                            <div class="alert-item danger">
                                <i data-lucide="clock"></i>
                                <div class="alert-details">
                                    <strong>${alloc.assetName}</strong> (${alloc.assetId})
                                    <div class="alert-meta">
                                        Held by ${alloc.employeeName} • Due: <span style="font-weight:700;">${alloc.expectedReturnDate}</span>
                                    </div>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>

            <!-- Bottom: Allocation Snapshot -->
            <div class="action-card">
                <h3 class="section-title">Active Allocations & Upcoming Returns</h3>
                <div class="table-responsive" style="margin-bottom:0;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Asset Tag</th>
                                <th>Asset Name</th>
                                <th>Assigned To</th>
                                <th>Allocation Date</th>
                                <th>Expected Return</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${scopedUpcoming.length === 0 ? `
                                <tr>
                                    <td colspan="6" style="text-align:center; color: var(--color-gray-400); padding: 24px;">No upcoming returns scheduled.</td>
                                </tr>
                            ` : scopedUpcoming.slice(0, 5).map(alloc => `
                                <tr>
                                    <td><strong>${alloc.assetId}</strong></td>
                                    <td>${alloc.assetName}</td>
                                    <td>${alloc.employeeName}</td>
                                    <td>${alloc.allocationDate}</td>
                                    <td>${alloc.expectedReturnDate || 'Indefinite'}</td>
                                    <td><span class="badge badge-allocated">On Schedule</span></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Hook up button redirects
    container.querySelector("#qa-register").addEventListener("click", () => {
        window.location.hash = "#assets";
        // Delay slightly to allow screen to render, then open modal
        setTimeout(() => {
            const btn = document.getElementById("trigger-register-btn");
            if (btn) btn.click();
        }, 150);
    });

    container.querySelector("#qa-book").addEventListener("click", () => {
        window.location.hash = "#bookings";
        setTimeout(() => {
            const btn = document.getElementById("trigger-booking-btn");
            if (btn) btn.click();
        }, 150);
    });

    container.querySelector("#qa-maintenance").addEventListener("click", () => {
        window.location.hash = "#maintenance";
        setTimeout(() => {
            const btn = document.getElementById("trigger-maintenance-btn");
            if (btn) btn.click();
        }, 150);
    });
}
