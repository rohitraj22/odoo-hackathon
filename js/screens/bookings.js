/* =============================================================
   AssetFlow - Resource Booking (Enhanced Professional)
   ============================================================= */

import { Store } from "../store.js";
import { showToast, openModal } from "../app.js";

let pageAssets = [];
let pageBookings = [];

export async function renderBookings(container, user) {
    const today = new Date().toISOString().split("T")[0];

    container.innerHTML = `<div class="loading-state"><i data-lucide="loader-2" class="spin-icon"></i><div style="color:var(--color-gray-500); font-weight:600;">Loading bookings...</div></div>`;
    safeCreateIcons();

    [pageAssets, pageBookings] = await Promise.all([
        Store.fetchAssets(),
        Store.fetchBookings()
    ]);

    const bookableAssets = pageAssets.filter(a => a.isShared || a.bookable);

    // Summary stats
    const todayBookings = pageBookings.filter(b => b.date === today && b.status !== "Cancelled");
    const upcomingBookings = pageBookings.filter(b => b.date > today && b.status !== "Cancelled");
    const userBookings = pageBookings.filter(b => b.employeeId === user.id && b.status !== "Cancelled");

    container.innerHTML = `
        <div class="bookings-wrapper page-shell">
            <div class="page-hero compact">
                <div>
                    <p class="page-eyebrow">Shared resources</p>
                    <h2 class="page-title">Resource Booking</h2>
                    <p class="page-subtitle">Reserve shared assets and rooms. Overlap-safe scheduling with real-time conflict detection.</p>
                </div>
                <button class="btn btn-primary" id="trigger-booking-btn">
                    <i data-lucide="calendar-plus"></i> New Booking
                </button>
            </div>

            <!-- Booking Summary Cards -->
            <div class="booking-stats-grid">
                <div class="booking-stat-card">
                    <div class="booking-stat-icon booking-stat-primary"><i data-lucide="calendar-check"></i></div>
                    <div>
                        <div class="booking-stat-value">${todayBookings.length}</div>
                        <div class="booking-stat-label">Bookings Today</div>
                    </div>
                </div>
                <div class="booking-stat-card">
                    <div class="booking-stat-icon booking-stat-info"><i data-lucide="calendar-clock"></i></div>
                    <div>
                        <div class="booking-stat-value">${upcomingBookings.length}</div>
                        <div class="booking-stat-label">Upcoming</div>
                    </div>
                </div>
                <div class="booking-stat-card">
                    <div class="booking-stat-icon booking-stat-success"><i data-lucide="layers"></i></div>
                    <div>
                        <div class="booking-stat-value">${bookableAssets.length}</div>
                        <div class="booking-stat-label">Bookable Resources</div>
                    </div>
                </div>
                <div class="booking-stat-card">
                    <div class="booking-stat-icon booking-stat-warning"><i data-lucide="user-check"></i></div>
                    <div>
                        <div class="booking-stat-value">${userBookings.length}</div>
                        <div class="booking-stat-label">My Bookings</div>
                    </div>
                </div>
            </div>

            <!-- Timeline Controls -->
            <div class="booking-controls">
                <div class="booking-controls-left">
                    <div class="form-group" style="margin-bottom:0; min-width:200px;">
                        <label for="booking-date" style="font-size:0.8rem; font-weight:700; color:var(--color-gray-600); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:6px;">Date</label>
                        <input type="date" id="booking-date" class="form-control" value="${today}" style="min-width:180px;">
                    </div>
                    <div class="form-group" style="margin-bottom:0; min-width:240px;">
                        <label for="booking-resource-filter" style="font-size:0.8rem; font-weight:700; color:var(--color-gray-600); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:6px;">Filter Resource</label>
                        <select id="booking-resource-filter" class="form-control">
                            <option value="">All bookable resources</option>
                            ${bookableAssets.map(a => `<option value="${a.id}">${a.name}</option>`).join("")}
                        </select>
                    </div>
                </div>
                <div class="booking-controls-right">
                    <button class="btn btn-secondary" id="prev-day-btn">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <span class="booking-date-label" id="booking-date-label">Today</span>
                    <button class="btn btn-secondary" id="next-day-btn">
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>
            </div>

            <!-- Timeline Scheduler -->
            <div id="booking-timeline-area"></div>

            <!-- All Bookings Table -->
            <div class="action-card" style="margin-top:24px;">
                <div class="card-title-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h4 class="card-title" style="margin-bottom:0;"><i data-lucide="list"></i> All Bookings</h4>
                    <div id="booking-tab-bar" style="display:flex; gap:6px; background:var(--color-gray-100); padding:4px; border-radius:var(--radius-md);">
                        <button class="booking-filter-pill active" data-filter="all">All</button>
                        <button class="booking-filter-pill" data-filter="Upcoming">Upcoming</button>
                        <button class="booking-filter-pill" data-filter="Ongoing">Ongoing</button>
                        <button class="booking-filter-pill" data-filter="Completed">Completed</button>
                        <button class="booking-filter-pill" data-filter="Cancelled">Cancelled</button>
                    </div>
                </div>
                <div id="booking-list-container"></div>
            </div>
        </div>
    `;

    let currentDate = today;

    const updateDateLabel = () => {
        const d = new Date(currentDate);
        const label = document.getElementById("booking-date-label");
        if (currentDate === today) label.textContent = "Today";
        else label.textContent = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    };

    const renderAll = () => {
        const resourceId = container.querySelector("#booking-resource-filter").value;
        updateDateLabel();
        renderTimelineScheduler(currentDate, resourceId, user, bookableAssets);
        renderAllBookingsList(user, "all");
    };

    container.querySelector("#booking-date").addEventListener("change", e => {
        currentDate = e.target.value;
        renderAll();
    });

    container.querySelector("#booking-resource-filter").addEventListener("change", renderAll);

    container.querySelector("#prev-day-btn").addEventListener("click", () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 1);
        currentDate = d.toISOString().split("T")[0];
        container.querySelector("#booking-date").value = currentDate;
        renderAll();
    });

    container.querySelector("#next-day-btn").addEventListener("click", () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 1);
        currentDate = d.toISOString().split("T")[0];
        container.querySelector("#booking-date").value = currentDate;
        renderAll();
    });

    container.querySelector("#trigger-booking-btn").addEventListener("click", () => {
        openNewBookingModal(currentDate, container.querySelector("#booking-resource-filter").value, bookableAssets, user);
    });

    container.querySelector("#booking-tab-bar").addEventListener("click", e => {
        const pill = e.target.closest(".booking-filter-pill");
        if (!pill) return;
        container.querySelectorAll(".booking-filter-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        renderAllBookingsList(user, pill.dataset.filter);
    });

    renderAll();
    safeCreateIcons();
}

function renderTimelineScheduler(date, filterResourceId, user, bookableAssets) {
    const timeline = document.getElementById("booking-timeline-area");
    if (!timeline) return;

    const resources = filterResourceId
        ? bookableAssets.filter(a => a.id === filterResourceId)
        : bookableAssets;

    const START_HOUR = 8;
    const END_HOUR = 19;
    const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

    if (resources.length === 0) {
        timeline.innerHTML = `
            <div class="action-card">
                <div class="empty-state">
                    <i data-lucide="calendar-x"></i>
                    <p>No bookable resources found. Register a shared asset first.</p>
                </div>
            </div>
        `;
        safeCreateIcons();
        return;
    }

    const dayBookings = pageBookings.filter(b => b.date === date && b.status !== "Cancelled");

    timeline.innerHTML = `
        <div class="action-card booking-timeline-card">
            <h4 class="card-title" style="margin-bottom:20px;"><i data-lucide="clock"></i> Schedule View</h4>
            <div class="timeline-scroll-wrapper">
                <div class="booking-grid" style="--resource-count: ${resources.length};">
                    <!-- Header: Time col + Resource headers -->
                    <div class="booking-grid-header">
                        <div class="booking-time-header">Time</div>
                        ${resources.map(r => `
                            <div class="booking-resource-header">
                                <div class="booking-resource-name">${r.name}</div>
                                <div class="booking-resource-id">${r.id}</div>
                            </div>
                        `).join("")}
                    </div>
                    <!-- Time slots -->
                    ${HOURS.map(hour => {
                        const timeLabel = `${String(hour).padStart(2, "0")}:00`;
                        return `
                            <div class="booking-grid-row">
                                <div class="booking-time-cell">${timeLabel}</div>
                                ${resources.map(r => {
                                    const slotBookings = dayBookings.filter(b => {
                                        if (b.resourceId !== r.id) return false;
                                        const bStart = parseInt((b.startTime || "0:00").split(":")[0], 10);
                                        const bEnd = parseInt((b.endTime || "0:00").split(":")[0], 10);
                                        return bStart <= hour && bEnd > hour;
                                    });

                                    if (!slotBookings.length) {
                                        return `<div class="booking-slot booking-slot-free" data-hour="${hour}" data-resource="${r.id}">
                                            <span class="slot-hint">+ Book</span>
                                        </div>`;
                                    }

                                    const isConflict = slotBookings.length > 1;
                                    return `
                                        <div class="booking-slot ${isConflict ? "booking-slot-conflict" : "booking-slot-booked"}" data-hour="${hour}" data-resource="${r.id}">
                                            ${slotBookings.map(b => `
                                                <div class="booking-slot-chip">
                                                    <span class="slot-time">${b.startTime}–${b.endTime}</span>
                                                    <span class="slot-person">${b.bookedByName || "—"}</span>
                                                </div>
                                            `).join("")}
                                            ${isConflict ? `<div class="slot-conflict-badge"><i data-lucide="alert-triangle"></i> Conflict</div>` : ""}
                                        </div>
                                    `;
                                }).join("")}
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        </div>
    `;

    timeline.querySelectorAll(".booking-slot-free").forEach(slot => {
        slot.addEventListener("click", () => {
            openNewBookingModal(date, slot.dataset.resource, bookableAssets, user, parseInt(slot.dataset.hour, 10));
        });
    });

    safeCreateIcons();
}

function renderAllBookingsList(user, filter) {
    const container = document.getElementById("booking-list-container");
    if (!container) return;

    let filtered = [...pageBookings];
    if (filter !== "all") {
        filtered = filtered.filter(b => b.status === filter);
    }

    if (user.role === "Employee") {
        // Show own + visible ones, but mark as read-only for others
    }

    filtered.sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return (a.startTime || "") < (b.startTime || "") ? -1 : 1;
    });

    if (!filtered.length) {
        container.innerHTML = `<div class="empty-state"><i data-lucide="calendar-off"></i><p>No bookings found.</p></div>`;
        safeCreateIcons();
        return;
    }

    container.innerHTML = `
        <div class="table-responsive" style="margin-bottom:0;">
            <table class="table">
                <thead>
                    <tr>
                        <th>Resource</th>
                        <th>Booked By</th>
                        <th>Date</th>
                        <th>Time Slot</th>
                        <th>Status</th>
                        <th style="text-align:right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(b => {
                        const statusMap = {
                            Upcoming: "badge-upcoming",
                            Ongoing: "badge-active",
                            Cancelled: "badge-cancelled",
                            Completed: "badge-completed"
                        };
                        const canCancel = (user.role === "Admin" || user.role === "Asset Manager" || b.employeeId === user.id) && b.status !== "Cancelled" && b.status !== "Completed";
                        return `
                        <tr>
                            <td>
                                <span class="asset-tag-chip">${b.resourceId}</span>
                                <span style="font-weight:600; margin-left:6px;">${b.assetName || ""}</span>
                            </td>
                            <td>${b.bookedByName || "—"}</td>
                            <td style="font-weight:600;">${b.date}</td>
                            <td>
                                <span class="time-slot-badge">
                                    <i data-lucide="clock" style="width:12px; height:12px;"></i>
                                    ${b.startTime} – ${b.endTime}
                                </span>
                            </td>
                            <td><span class="badge ${statusMap[b.status] || "badge-completed"}">${b.status}</span></td>
                            <td style="text-align:right;">
                                ${canCancel ? `<button class="btn btn-secondary btn-sm cancel-booking-btn" data-id="${b.id}">Cancel</button>` : ""}
                            </td>
                        </tr>`;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;

    container.querySelectorAll(".cancel-booking-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const res = await Store.cancelBooking(btn.dataset.id, user.name);
            if (res.success) {
                showToast("Booking cancelled.", "success");
                pageBookings = await Store.fetchBookings();
                const currentFilter = document.querySelector(".booking-filter-pill.active")?.dataset.filter || "all";
                renderAllBookingsList(user, currentFilter);
                const date = document.getElementById("booking-date")?.value;
                const resourceId = document.getElementById("booking-resource-filter")?.value || "";
                const bookableAssets = pageAssets.filter(a => a.isShared || a.bookable);
                renderTimelineScheduler(date, resourceId, user, bookableAssets);
            } else {
                showToast(res.message || "Could not cancel booking.", "danger");
            }
        });
    });

    safeCreateIcons();
}

function openNewBookingModal(date, resourceId, assets, user, prefillHour) {
    openModal("New Resource Booking", `
        <div class="form-row">
            <div class="form-group">
                <label for="book-asset">Resource</label>
                <select id="book-asset" class="form-control">
                    <option value="">Select resource...</option>
                    ${assets.map(a => `<option value="${a.id}" ${a.id === resourceId ? "selected" : ""}>${a.name} (${a.id})</option>`).join("")}
                </select>
            </div>
            <div class="form-group">
                <label for="book-date">Date</label>
                <input type="date" id="book-date" class="form-control" value="${date || new Date().toISOString().split("T")[0]}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="book-start">Start Time</label>
                <input type="time" id="book-start" class="form-control" value="${prefillHour !== undefined ? String(prefillHour).padStart(2, "0") + ":00" : "09:00"}">
            </div>
            <div class="form-group">
                <label for="book-end">End Time</label>
                <input type="time" id="book-end" class="form-control" value="${prefillHour !== undefined ? String(prefillHour + 1).padStart(2, "0") + ":00" : "10:00"}">
            </div>
        </div>
        <div class="form-group">
            <label for="book-notes">Purpose / Notes <span style="color:var(--color-gray-400); font-weight:400;">(optional)</span></label>
            <textarea id="book-notes" class="form-control" rows="2" placeholder="e.g. Weekly team standup, Q3 review..."></textarea>
        </div>
    `, async () => {
        const assetId = document.getElementById("book-asset").value;
        const bookDate = document.getElementById("book-date").value;
        const start = document.getElementById("book-start").value;
        const end = document.getElementById("book-end").value;

        if (!assetId || !bookDate || !start || !end) {
            showToast("Please fill in all required fields.", "warning");
            return false;
        }
        if (start >= end) {
            showToast("End time must be after start time.", "warning");
            return false;
        }

        const res = await Store.bookResource(assetId, user.id, bookDate, start, end, user.name);
        if (res.overlap) {
            showToast(res.message || "This time slot overlaps with an existing booking.", "danger");
            return false;
        }
        if (!res.success) {
            showToast(res.message || "Booking failed.", "danger");
            return false;
        }

        await Store.addNotification("Booking Confirmed", `${assetId} booked on ${bookDate} ${start}–${end}.`, "info", user.id);
        showToast("Booking confirmed.", "success");
        pageBookings = await Store.fetchBookings();

        const filterDate = document.getElementById("booking-date")?.value || bookDate;
        const filterRes = document.getElementById("booking-resource-filter")?.value || "";
        renderTimelineScheduler(filterDate, filterRes, user, assets);
        renderAllBookingsList(user, document.querySelector(".booking-filter-pill.active")?.dataset.filter || "all");
        return true;
    }, "Confirm Booking");
}
