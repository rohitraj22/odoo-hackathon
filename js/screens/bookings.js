/* ====================================================
   AssetFlow - Resource Bookings Screen Component
   ==================================================== */

import { Store } from "../store.js";
import { openModal, showToast } from "../app.js";

let selectedResourceId = "AF-0003"; // Defaults to Conference Room B2
let calendarDate = new Date(); // Current calendar date pivot

export function renderBookings(container, user) {
    const resources = Store.getAssets().filter(a => a.isShared && a.status !== "Retired" && a.status !== "Disposed");
    
    if (resources.length === 0) {
        container.innerHTML = `
            <div class="action-card" style="text-align:center; padding: 48px;">
                <p style="color:var(--color-gray-500);">No bookable shared resources configured in directory.</p>
            </div>
        `;
        return;
    }

    // Main layout
    container.innerHTML = `
        <div class="bookings-grid-layout" style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
            <!-- Left: Calendar & Selection -->
            <div class="action-card" style="display:flex; flex-direction:column; height:fit-content;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
                    <div class="form-group" style="margin-bottom:0; flex:1; min-width:200px;">
                        <label for="resource-selector" style="font-size:0.8rem; font-weight:600; text-transform:uppercase; color:var(--color-gray-500);">Select Resource</label>
                        <select id="resource-selector" class="form-control">
                            ${resources.map(r => `<option value="${r.id}" ${r.id === selectedResourceId ? 'selected' : ''}>${r.name} (${r.location})</option>`).join("")}
                        </select>
                    </div>
                    <button class="btn btn-primary" id="trigger-booking-btn" style="margin-top:20px;">
                        <i data-lucide="plus"></i> Book Time Slot
                    </button>
                </div>

                <div id="calendar-viewport">
                    <!-- Calendar injected here -->
                </div>
            </div>

            <!-- Right: Bookings list on selected date & resource -->
            <div class="action-card" style="display:flex; flex-direction:column;">
                <h3 class="section-title">
                    <span>Bookings Schedule</span>
                    <span id="schedule-subtitle" style="font-size:0.85rem; font-weight:500; color:var(--color-gray-500);">Selected: Today</span>
                </h3>

                <div class="table-responsive" style="margin-bottom:0; flex:1;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time Slot</th>
                                <th>Booked By</th>
                                <th>Status</th>
                                <th style="text-align:right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="bookings-list-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Resource selector change listener
    const selector = container.querySelector("#resource-selector");
    selector.addEventListener("change", () => {
        selectedResourceId = selector.value;
        renderCalendarAndList(user);
    });

    // Book Button click
    container.querySelector("#trigger-booking-btn").addEventListener("click", () => openBookingModal(user));

    renderCalendarAndList(user);
}

function renderCalendarAndList(user) {
    const listBody = document.getElementById("bookings-list-body");
    const calendarViewport = document.getElementById("calendar-viewport");
    
    const resource = Store.getAssets().find(a => a.id === selectedResourceId);
    if (!resource) return;

    // Subtitle text
    const dateStr = calendarDate.toISOString().split("T")[0];
    document.getElementById("schedule-subtitle").textContent = `${resource.name} schedule for ${dateStr}`;

    // 1. Fetch bookings
    const bookings = Store.getBookings().filter(b => b.resourceId === selectedResourceId && b.status !== "Cancelled");
    
    // Sort bookings by date and time
    bookings.sort((a,b) => {
        if(a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
    });

    // Bookings for selected date
    const dateBookings = bookings.filter(b => b.date === dateStr);

    if (dateBookings.length === 0) {
        listBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color: var(--color-gray-400); padding: 32px;">No active bookings for this date.</td>
            </tr>
        `;
    } else {
        listBody.innerHTML = dateBookings.map(b => {
            let statusBadge = "badge-upcoming";
            if (b.status === "Completed") statusBadge = "badge-completed";
            else if (b.status === "Ongoing") statusBadge = "badge-ongoing";
            
            // Allow cancel if booking is upcoming/ongoing AND user owns it or user is Admin/Manager
            const canCancel = (user.role === "Admin" || user.role === "Asset Manager" || b.employeeId === user.id);

            return `
                <tr>
                    <td><strong>${b.date}</strong></td>
                    <td style="font-weight:600;">${b.startTime} – ${b.endTime}</td>
                    <td>${b.employeeName}</td>
                    <td><span class="badge ${statusBadge}">${b.status}</span></td>
                    <td style="text-align:right;">
                        ${(b.status === 'Upcoming' && canCancel) ? `
                            <button class="btn btn-secondary btn-sm cancel-booking-btn" data-id="${b.id}" style="border-color:var(--color-danger); color:var(--color-danger);">Cancel</button>
                        ` : `
                            <span style="font-size:0.8rem; color:var(--color-gray-400);">None</span>
                        `}
                    </td>
                </tr>
            `;
        }).join("");

        // Cancel click listeners
        listBody.querySelectorAll(".cancel-booking-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                const res = Store.cancelBooking(id, user.name);
                if (res.success) {
                    showToast("Booking cancelled successfully.", "info");
                    renderCalendarAndList(user);
                } else {
                    showToast(res.message, "danger");
                }
            });
        });
    }

    // 2. Render Calendar Widget
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // First day of month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Days in month
    const totalDays = new Date(year, month + 1, 0).getDate();

    calendarViewport.innerHTML = `
        <div class="calendar-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <button class="btn-icon-sm" id="prev-month-btn"><i data-lucide="chevron-left"></i></button>
            <h4 style="font-weight:700;">${monthNames[month]} ${year}</h4>
            <button class="btn-icon-sm" id="next-month-btn"><i data-lucide="chevron-right"></i></button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-header">Sun</div>
            <div class="calendar-day-header">Mon</div>
            <div class="calendar-day-header">Tue</div>
            <div class="calendar-day-header">Wed</div>
            <div class="calendar-day-header">Thu</div>
            <div class="calendar-day-header">Fri</div>
            <div class="calendar-day-header">Sat</div>
            
            <!-- Calendar Days -->
            ${Array(firstDayIndex).fill(0).map(() => `<div class="calendar-day empty"></div>`).join("")}
            
            ${Array(totalDays).fill(0).map((_, i) => {
                const day = i + 1;
                const thisDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                
                // Bookings count on this day
                const dayBookings = bookings.filter(b => b.date === thisDateStr);
                const isSelected = thisDateStr === dateStr;
                
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                return `
                    <div class="calendar-day ${isSelected ? 'today' : 'active'}" data-date="${thisDateStr}" style="border: ${isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-gray-200)'}">
                        <div class="calendar-day-number" style="font-weight: ${isToday ? '800' : 'normal'}; color: ${isToday ? 'var(--color-primary)' : 'inherit'};">${day}</div>
                        <div class="calendar-day-bookings">
                            ${dayBookings.slice(0, 2).map(db => `
                                <div class="calendar-booking-badge" title="${db.startTime} - ${db.employeeName}">${db.startTime} ${db.employeeName.split(" ")[0]}</div>
                            `).join("")}
                            ${dayBookings.length > 2 ? `<div class="calendar-booking-badge" style="background-color:var(--color-gray-200); color:var(--color-gray-600);">+${dayBookings.length - 2} more</div>` : ''}
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;

    // Calendar buttons listeners
    calendarViewport.querySelector("#prev-month-btn").addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendarAndList(user);
    });
    calendarViewport.querySelector("#next-month-btn").addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendarAndList(user);
    });

    // Day grid selection listeners
    calendarViewport.querySelectorAll(".calendar-day.active").forEach(dayEl => {
        dayEl.addEventListener("click", () => {
            const dateVal = dayEl.dataset.date;
            if (dateVal) {
                calendarDate = new Date(dateVal);
                renderCalendarAndList(user);
            }
        });
    });

    lucide.createIcons();
}

/* ====================================================
   Book Slot Modal Dialog & Overlap checks
   ==================================================== */
function openBookingModal(user) {
    const resources = Store.getAssets().filter(a => a.isShared && a.status !== "Retired" && a.status !== "Disposed");
    const activeRes = resources.find(r => r.id === selectedResourceId) || resources[0];

    const modalHtml = `
        <div class="form-group">
            <label for="book-res">Shared Resource</label>
            <select id="book-res" class="form-control" required>
                ${resources.map(r => `<option value="${r.id}" ${r.id === activeRes.id ? 'selected' : ''}>${r.name} (${r.location})</option>`).join("")}
            </select>
        </div>
        <div class="form-group">
            <label for="book-date">Booking Date</label>
            <input type="date" id="book-date" class="form-control" required value="${calendarDate.toISOString().split("T")[0]}" min="${new Date().toISOString().split("T")[0]}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="book-start">Start Time</label>
                <input type="time" id="book-start" class="form-control" required value="09:00">
            </div>
            <div class="form-group">
                <label for="book-end">End Time</label>
                <input type="time" id="book-end" class="form-control" required value="10:00">
            </div>
        </div>
        <!-- Internal error alerts inside the modal -->
        <div id="booking-modal-error" class="alert-item danger hidden" style="margin-top:12px;">
            <i data-lucide="alert-circle"></i>
            <div class="alert-details" id="booking-modal-error-text">Overlap Error: The selected resource is already booked.</div>
        </div>
    `;

    openModal("Book Resource Slot", modalHtml, () => {
        const resId = document.getElementById("book-res").value;
        const dateVal = document.getElementById("book-date").value;
        const startVal = document.getElementById("book-start").value;
        const endVal = document.getElementById("book-end").value;

        if (!resId || !dateVal || !startVal || !endVal) {
            showToast("Please fill in all inputs.", "danger");
            return false;
        }

        if (startVal >= endVal) {
            const errDiv = document.getElementById("booking-modal-error");
            const errText = document.getElementById("booking-modal-error-text");
            errText.textContent = "Time Error: End Time must be strictly after Start Time.";
            errDiv.classList.remove("hidden");
            lucide.createIcons();
            return false;
        }

        const res = Store.bookResource(resId, user.id, dateVal, startVal, endVal, user.name);

        if (res.success) {
            showToast("Resource booked successfully.", "success");
            selectedResourceId = resId;
            calendarDate = new Date(dateVal);
            renderCalendarAndList(user);
            return true;
        } else if (res.overlap) {
            // Overlap error displays inside modal, does not close modal
            const errDiv = document.getElementById("booking-modal-error");
            const errText = document.getElementById("booking-modal-error-text");
            errText.textContent = res.message;
            errDiv.classList.remove("hidden");
            lucide.createIcons();
            return false;
        } else {
            showToast(res.message, "danger");
            return false;
        }
    }, "Confirm Booking");
}
