/* =============================================================
   AssetFlow - Resource Booking Timeline Scheduler
   ============================================================= */

import { Store } from "../store.js";
import { showToast, openModal } from "../app.js";

let pageAssets = [];
let pageBookings = [];

export async function renderBookings(container, user) {
    const today = new Date().toISOString().split("T")[0];

    container.innerHTML = `<div class="loading-state"><i data-lucide="loader-2" class="spin-icon"></i><div>Loading bookings...</div></div>`;
    lucide.createIcons();

    [pageAssets, pageBookings] = await Promise.all([
        Store.fetchAssets(),
        Store.fetchBookings()
    ]);

    const bookableAssets = pageAssets.filter(a => a.isShared || a.bookable);

    container.innerHTML = `
        <div class="bookings-wrapper page-shell">
            <div class="page-hero compact">
                <div>
                    <p class="page-eyebrow">Shared resources</p>
                    <h2 class="page-title">Resource Booking</h2>
                    <p class="page-subtitle">Book rooms and equipment with overlap-safe time slots.</p>
                </div>
                <button class="btn btn-primary" id="trigger-booking-btn">
                    <i data-lucide="plus"></i> New Booking
                </button>
            </div>

            <div class="filter-bar">
                <div class="form-group" style="margin-bottom:0;">
                    <label for="booking-date">Date</label>
                    <input type="date" id="booking-date" class="form-control" value="${today}">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label for="booking-resource-filter">Resource</label>
                    <select id="booking-resource-filter" class="form-control filter-select">
                        <option value="">All bookable resources</option>
                        ${bookableAssets.map(a => `<option value="${a.id}">${a.id} · ${a.name}</option>`).join("")}
                    </select>
                </div>
            </div>

            <div id="booking-timeline-area"></div>
        </div>
    `;

    const renderTimeline = () => {
        const date = container.querySelector("#booking-date").value;
        const resourceId = container.querySelector("#booking-resource-filter").value;
        renderTimelineScheduler(date, resourceId, user, bookableAssets);
    };

    container.querySelector("#booking-date").addEventListener("change", renderTimeline);
    container.querySelector("#booking-resource-filter").addEventListener("change", renderTimeline);
    container.querySelector("#trigger-booking-btn").addEventListener("click", () => {
        openNewBookingModal(
            container.querySelector("#booking-date").value,
            container.querySelector("#booking-resource-filter").value,
            bookableAssets,
            user
        );
    });

    renderTimeline();
    lucide.createIcons();
}

function renderTimelineScheduler(date, filterResourceId, user, bookableAssets) {
    const timeline = document.getElementById("booking-timeline-area");
    if (!timeline) return;

    const resources = filterResourceId
        ? bookableAssets.filter(a => a.id === filterResourceId)
        : bookableAssets;

    const START_HOUR = 8;
    const END_HOUR = 18;
    const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

    if (resources.length === 0) {
        timeline.innerHTML = `<div class="empty-state"><i data-lucide="calendar-x"></i><p>No bookable resources found. Register a shared asset first.</p></div>`;
        lucide.createIcons();
        return;
    }

    timeline.innerHTML = `
        <div class="timeline-scroll">
            <div class="timeline-scheduler" style="min-width:${Math.max(640, 120 + resources.length * 160)}px;">
                <div class="timeline-header-row" style="grid-template-columns:70px ${resources.map(() => "1fr").join(" ")};">
                    <div class="timeline-time-col">Time</div>
                    ${resources.map(r => `
                        <div class="timeline-resource-col">
                            <div>${r.name}</div>
                            <small>${r.id}</small>
                        </div>
                    `).join("")}
                </div>
                ${HOURS.map(hour => `
                    <div class="timeline-row" style="grid-template-columns:70px ${resources.map(() => "1fr").join(" ")};">
                        <div class="scheduler-time-cell">${hour}:00</div>
                        ${resources.map(r => {
                            const cellBookings = pageBookings.filter(b => {
                                if (b.resourceId !== r.id || b.date !== date || b.status === "Cancelled") return false;
                                const bStart = parseInt((b.startTime || "0").split(":")[0], 10);
                                return bStart === hour;
                            });
                            if (!cellBookings.length) {
                                return `<div class="timeline-cell" data-hour="${hour}" data-resource="${r.id}"></div>`;
                            }
                            const isConflict = cellBookings.length > 1;
                            return `
                                <div class="timeline-cell ${isConflict ? "conflict" : "booked"}" data-hour="${hour}" data-resource="${r.id}">
                                    ${cellBookings.map(b => `<div class="booking-chip">${b.startTime}–${b.endTime} ${b.bookedByName || ""}</div>`).join("")}
                                    ${isConflict ? `<div class="conflict-label">Conflict</div>` : ""}
                                </div>
                            `;
                        }).join("")}
                    </div>
                `).join("")}
            </div>
        </div>
        <div class="action-card" style="margin-top:20px;">
            <h4 class="card-title"><i data-lucide="list"></i> Bookings for ${date}</h4>
            ${renderBookingsList(date, filterResourceId, user)}
        </div>
    `;

    timeline.querySelectorAll(".timeline-cell").forEach(cell => {
        cell.addEventListener("click", () => {
            openNewBookingModal(date, cell.dataset.resource, bookableAssets, user, parseInt(cell.dataset.hour, 10));
        });
    });

    timeline.querySelectorAll(".cancel-booking-btn").forEach(btn => {
        btn.addEventListener("click", async e => {
            e.stopPropagation();
            const res = await Store.cancelBooking(btn.dataset.id, user.name);
            if (res.success) {
                showToast("Booking cancelled.", "success");
                pageBookings = await Store.fetchBookings();
                renderTimelineScheduler(date, filterResourceId, user, bookableAssets);
            }
        });
    });

    lucide.createIcons();
}

function renderBookingsList(date, filterResourceId, user) {
    const filtered = pageBookings.filter(b => {
        const matchDate = !date || b.date === date;
        const matchRes = !filterResourceId || b.resourceId === filterResourceId;
        return matchDate && matchRes;
    });

    if (!filtered.length) {
        return `<p class="muted-text" style="text-align:center; padding:20px;">No bookings on this date.</p>`;
    }

    return `
        <div class="booking-list">
            ${filtered.map(b => `
                <div class="booking-row">
                    <div>
                        <span class="asset-tag-chip">${b.resourceId}</span>
                        <strong>${b.assetName || ""}</strong>
                        <span class="muted-text">${b.startTime} – ${b.endTime}</span>
                    </div>
                    <div class="booking-row-actions">
                        <span class="muted-text">${b.bookedByName || "—"}</span>
                        <span class="badge ${b.status === "Upcoming" ? "badge-upcoming" : b.status === "Ongoing" ? "badge-active" : b.status === "Cancelled" ? "badge-cancelled" : "badge-completed"}">${b.status}</span>
                        ${(user.role === "Admin" || user.role === "Asset Manager" || b.employeeId === user.id) && b.status !== "Cancelled" ? `
                            <button class="btn btn-secondary btn-sm cancel-booking-btn" data-id="${b.id}">Cancel</button>
                        ` : ""}
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function openNewBookingModal(date, resourceId, assets, user, prefillHour) {
    openModal("New Booking", `
        <div class="form-row">
            <div class="form-group">
                <label for="book-asset">Resource</label>
                <select id="book-asset" class="form-control">
                    <option value="">Select resource...</option>
                    ${assets.map(a => `<option value="${a.id}" ${a.id === resourceId ? "selected" : ""}>${a.id} · ${a.name}</option>`).join("")}
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
            <label for="book-notes">Purpose / Notes</label>
            <textarea id="book-notes" class="form-control" rows="2" placeholder="e.g. Team meeting"></textarea>
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
            showToast(res.message || "Time slot overlaps with an existing booking.", "danger");
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
        return true;
    }, "Confirm Booking");
}
