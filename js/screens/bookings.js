/* =============================================================
   AssetFlow - Resource Booking Timeline Scheduler (Wireframe: Screen 6)
   ============================================================= */

import { Store } from "../store.js";
import { showToast, openModal } from "../app.js";

export function renderBookings(container, user) {
    // Default to today
    const today = new Date().toISOString().split("T")[0];

    container.innerHTML = `
        <div class="bookings-wrapper">
            <h3 style="font-size:1.25rem; font-weight:700; margin-bottom:18px;">Resource Booking</h3>

            <!-- Filters row -->
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
                <div class="form-group" style="margin-bottom:0;">
                    <label for="booking-date" style="margin-bottom:4px; font-size:0.8rem; font-weight:600; color:var(--color-gray-500);">Date</label>
                    <input type="date" id="booking-date" class="form-control" value="${today}" style="min-width:160px;">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label for="booking-resource-filter" style="margin-bottom:4px; font-size:0.8rem; font-weight:600; color:var(--color-gray-500);">Resource</label>
                    <select id="booking-resource-filter" class="form-control" style="min-width:180px;">
                        <option value="">All bookable resources</option>
                    </select>
                </div>
                <div style="margin-top:20px;">
                    <button class="btn btn-primary" id="trigger-booking-btn" style="border:2px solid var(--color-gray-900); background-color:#e2f2e9; color:#065f46; font-weight:700;">
                        + New Booking
                    </button>
                </div>
            </div>

            <!-- Timeline Scheduler - Vertical hourly axis -->
            <div id="booking-timeline-area"></div>
        </div>
    `;

    const bookableAssets = Store.getAssets().filter(a => a.isShared || a.bookable);
    const resourceSelect = container.querySelector("#booking-resource-filter");
    bookableAssets.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.id;
        opt.textContent = `${a.id} · ${a.name}`;
        resourceSelect.appendChild(opt);
    });

    const renderTimeline = () => {
        const date = container.querySelector("#booking-date").value;
        const resourceId = container.querySelector("#booking-resource-filter").value;
        renderTimelineScheduler(date, resourceId, user);
    };

    container.querySelector("#booking-date").addEventListener("change", renderTimeline);
    container.querySelector("#booking-resource-filter").addEventListener("change", renderTimeline);
    container.querySelector("#trigger-booking-btn").addEventListener("click", () => {
        const date = container.querySelector("#booking-date").value;
        const resourceId = container.querySelector("#booking-resource-filter").value;
        openNewBookingModal(date, resourceId, bookableAssets, user);
    });

    renderTimeline();
}

/* Wireframe: vertical time axis from 9:00 to 17:00 with booked/conflict blocks */
function renderTimelineScheduler(date, filterResourceId, user) {
    const timeline = document.getElementById("booking-timeline-area");
    if (!timeline) return;

    const allBookings = Store.getBookings();
    const assets = Store.getAssets().filter(a => a.isShared || a.bookable);

    const resources = filterResourceId
        ? assets.filter(a => a.id === filterResourceId)
        : assets;

    const START_HOUR = 8;
    const END_HOUR = 18;
    const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

    if (resources.length === 0) {
        timeline.innerHTML = `<p style="text-align:center; color:var(--color-gray-400); padding:40px;">No bookable resources found. Register a shared asset first.</p>`;
        return;
    }

    timeline.innerHTML = `
        <div style="overflow-x:auto;">
            <div class="timeline-scheduler" style="min-width: ${Math.max(600, 120 + resources.length * 160)}px;">
                <!-- Header row: resource names -->
                <div style="display:grid; grid-template-columns: 70px ${resources.map(() => '1fr').join(' ')}; background:var(--color-gray-50); border:1px solid var(--color-gray-200); border-radius:var(--radius-md) var(--radius-md) 0 0;">
                    <div style="padding:10px 8px; font-size:0.8rem; font-weight:600; color:var(--color-gray-500); border-right:1px solid var(--color-gray-200);">Time</div>
                    ${resources.map(r => `
                        <div style="padding:10px 12px; font-size:0.85rem; font-weight:700; color:var(--color-gray-800); text-align:center; border-right:1px solid var(--color-gray-100);">
                            <div>${r.name}</div>
                            <div style="font-family:monospace; font-size:0.75rem; color:var(--color-gray-400);">${r.id}</div>
                        </div>
                    `).join("")}
                </div>

                <!-- Hour rows -->
                ${HOURS.map(hour => {
                    const timeLabel = `${hour}:00`;
                    return `
                        <div class="timeline-row" style="display:grid; grid-template-columns: 70px ${resources.map(() => '1fr').join(' ')}; border:1px solid var(--color-gray-200); border-top:none;">
                            <div style="padding:8px; font-size:0.8rem; font-weight:600; color:var(--color-gray-500); border-right:1px solid var(--color-gray-200); text-align:right; min-height:52px; display:flex; align-items:flex-start; justify-content:flex-end; padding-top:8px;">
                                ${timeLabel}
                            </div>
                            ${resources.map(r => {
                                const cellBookings = allBookings.filter(b => {
                                    if (b.assetId !== r.id || b.date !== date) return false;
                                    const bStart = parseInt(b.startTime.split(":")[0], 10);
                                    const bEnd = parseInt(b.endTime.split(":")[0], 10);
                                    return bStart === hour;
                                });

                                if (cellBookings.length === 0) {
                                    return `<div class="timeline-cell" style="border-right:1px solid var(--color-gray-100); min-height:52px; cursor:pointer; transition:background 0.15s;" data-hour="${hour}" data-resource="${r.id}"></div>`;
                                }

                                const isConflict = cellBookings.length > 1;

                                return `
                                    <div class="timeline-cell ${isConflict ? 'conflict' : 'booked'}" style="
                                        border-right:1px solid var(--color-gray-100);
                                        min-height:52px;
                                        padding:6px 8px;
                                        background:${isConflict ? '#fff1f2' : '#e0f0ff'};
                                        border-left:3px solid ${isConflict ? '#ef4444' : '#3b82f6'};
                                        ${isConflict ? 'border-style:dashed;' : ''}
                                    " data-hour="${hour}" data-resource="${r.id}">
                                        ${cellBookings.map(b => `
                                            <div style="font-size:0.75rem; font-weight:600; color:${isConflict ? '#dc2626' : '#1d4ed8'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;">
                                                ${b.startTime}–${b.endTime} ${b.bookedByName || b.bookedBy || ''}
                                            </div>
                                        `).join("")}
                                        ${isConflict ? '<div style="font-size:0.7rem; color:#dc2626; font-weight:700;">⚠ Conflict</div>' : ''}
                                    </div>
                                `;
                            }).join("")}
                        </div>
                    `;
                }).join("")}
            </div>
        </div>

        <!-- Bookings list below timeline -->
        <div style="margin-top:24px;">
            <h4 style="font-size:0.925rem; font-weight:700; margin-bottom:12px;">Bookings for ${date}</h4>
            ${renderBookingsList(date, filterResourceId, user)}
        </div>
    `;

    // Hook empty cell click → pre-fill booking modal
    timeline.querySelectorAll(".timeline-cell").forEach(cell => {
        cell.addEventListener("click", () => {
            const hour = parseInt(cell.dataset.hour, 10);
            const resourceId = cell.dataset.resource;
            const assets = Store.getAssets().filter(a => a.isShared || a.bookable);
            openNewBookingModal(date, resourceId, assets, user, hour);
        });
    });

    // Hook revoke buttons
    timeline.querySelectorAll(".revoke-booking-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const bId = btn.dataset.id;
            const bookings = Store.getBookings();
            const b = bookings.find(x => x.id === bId);
            if (!b) return;

            openModal("Cancel Booking", `<p>Cancel booking for <strong>${b.assetName}</strong> on ${b.date} (${b.startTime}–${b.endTime})?</p>`, () => {
                b.status = "Cancelled";
                Store.saveBookings(bookings);
                Store.logActivity(user.name, "Booking Cancelled", `${b.assetName} on ${b.date} ${b.startTime}–${b.endTime}`);
                showToast("Booking cancelled.", "success");
                renderTimelineScheduler(date, filterResourceId, user);
                return true;
            }, "Cancel Booking");
        });
    });
}

function renderBookingsList(date, filterResourceId, user) {
    const allBookings = Store.getBookings().filter(b => {
        const matchDate = !date || b.date === date;
        const matchRes = !filterResourceId || b.assetId === filterResourceId;
        return matchDate && matchRes;
    });

    if (allBookings.length === 0) {
        return `<p style="text-align:center; color:var(--color-gray-400); padding:20px;">No bookings on this date.</p>`;
    }

    return `
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${allBookings.map(b => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border:1px solid var(--color-gray-200); border-radius:var(--radius-md); font-size:0.85rem; background:var(--color-gray-50);">
                    <div>
                        <span style="font-family:monospace; font-weight:700;">${b.assetId}</span>
                        <span style="color:var(--color-gray-600);"> · ${b.assetName || '—'}</span>
                        <span style="margin-left:10px; color:var(--color-gray-500);">${b.startTime} – ${b.endTime}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="color:var(--color-gray-500);">${b.bookedByName || b.bookedBy || '—'}</span>
                        <span class="badge ${b.status === 'Upcoming' ? 'badge-available' : b.status === 'Ongoing' ? 'badge-allocated' : 'badge-cancelled'}">${b.status}</span>
                        ${(user.role === 'Admin' || user.role === 'Asset Manager' || b.bookedBy === user.id) && b.status !== 'Cancelled' ? `
                            <button class="btn btn-secondary btn-sm revoke-booking-btn" data-id="${b.id}">Cancel</button>
                        ` : ''}
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function openNewBookingModal(date, resourceId, assets, user, prefillHour) {
    const formHtml = `
        <div class="form-row">
            <div class="form-group">
                <label for="book-asset">Resource</label>
                <select id="book-asset" class="form-control">
                    <option value="">Select resource...</option>
                    ${assets.map(a => `<option value="${a.id}" ${a.id === resourceId ? 'selected' : ''}>${a.id} · ${a.name}</option>`).join("")}
                </select>
            </div>
            <div class="form-group">
                <label for="book-date">Date</label>
                <input type="date" id="book-date" class="form-control" value="${date || new Date().toISOString().split('T')[0]}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="book-start">Start Time</label>
                <input type="time" id="book-start" class="form-control" value="${prefillHour !== undefined ? String(prefillHour).padStart(2,'0') + ':00' : '09:00'}">
            </div>
            <div class="form-group">
                <label for="book-end">End Time</label>
                <input type="time" id="book-end" class="form-control" value="${prefillHour !== undefined ? String(prefillHour + 1).padStart(2,'0') + ':00' : '10:00'}">
            </div>
        </div>
        <div class="form-group">
            <label for="book-notes">Purpose / Notes</label>
            <textarea id="book-notes" class="form-control" rows="2" placeholder="e.g. Department meeting, training session..."></textarea>
        </div>
        <div id="booking-conflict-warning" style="display:none; margin-top:8px;"></div>
    `;

    openModal("New Booking", formHtml, () => {
        const assetId = document.getElementById("book-asset").value;
        const bookDate = document.getElementById("book-date").value;
        const start = document.getElementById("book-start").value;
        const end = document.getElementById("book-end").value;
        const notes = document.getElementById("book-notes").value;

        if (!assetId || !bookDate || !start || !end) {
            showToast("Please fill in all required fields.", "warning");
            return false;
        }
        if (start >= end) {
            showToast("End time must be after start time.", "warning");
            return false;
        }

        const bookings = Store.getBookings();
        // Conflict check
        const conflict = bookings.find(b =>
            b.assetId === assetId &&
            b.date === bookDate &&
            b.status !== "Cancelled" &&
            start < b.endTime && end > b.startTime
        );

        if (conflict) {
            showToast(`Booking conflict: already booked by ${conflict.bookedByName || conflict.bookedBy} (${conflict.startTime}–${conflict.endTime}).`, "danger");
            return false;
        }

        const asset = assets.find(a => a.id === assetId);
        bookings.push({
            id: `BK-${Date.now()}`,
            assetId,
            assetName: asset ? asset.name : assetId,
            bookedBy: user.id,
            bookedByName: user.name,
            date: bookDate,
            startTime: start,
            endTime: end,
            notes,
            status: "Upcoming"
        });
        Store.saveBookings(bookings);
        Store.logActivity(user.name, "Booking Created", `${assetId} booked on ${bookDate} ${start}–${end}`);
        showToast(`Booking confirmed.`, "success");

        // Re-render the timeline
        const filterDate = document.getElementById("booking-date")?.value || bookDate;
        const filterRes = document.getElementById("booking-resource-filter")?.value || "";
        renderTimelineScheduler(filterDate, filterRes, user);
        return true;
    }, "Confirm Booking");
}
