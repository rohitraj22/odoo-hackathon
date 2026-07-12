/* ==========================================================
   AssetFlow - Reports & Analytics Screen Component
   ========================================================== */

import { Store } from "../store.js";
import { showToast } from "../app.js";

export function renderReports(container, user) {
    container.innerHTML = `
        <div class="reports-wrapper">
            <div class="page-action-bar">
                <h3>Actionable Asset & Resource Analytics</h3>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-secondary" id="print-reports-btn">
                        <i data-lucide="printer"></i> Print View
                    </button>
                    <button class="btn btn-primary" id="export-reports-btn">
                        <i data-lucide="download"></i> Export Data (CSV)
                    </button>
                </div>
            </div>

            <!-- Charts Grid -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px;">
                <!-- Card 1: Asset Condition Distribution -->
                <div class="analytics-chart-card">
                    <h4 style="margin-bottom:16px; font-weight:700; font-size:0.95rem; text-transform:uppercase; color:var(--color-gray-500);">Inventory Condition Analysis</h4>
                    <div class="chart-container">
                        <canvas id="chart-conditions"></canvas>
                    </div>
                </div>

                <!-- Card 2: Department-wise Asset Allocations -->
                <div class="analytics-chart-card">
                    <h4 style="margin-bottom:16px; font-weight:700; font-size:0.95rem; text-transform:uppercase; color:var(--color-gray-500);">Department Allocation Summary</h4>
                    <div class="chart-container">
                        <canvas id="chart-allocations"></canvas>
                    </div>
                </div>

                <!-- Card 3: Maintenance Tickets count by Category -->
                <div class="analytics-chart-card">
                    <h4 style="margin-bottom:16px; font-weight:700; font-size:0.95rem; text-transform:uppercase; color:var(--color-gray-500);">Maintenance Frequency by Category</h4>
                    <div class="chart-container">
                        <canvas id="chart-maintenance"></canvas>
                    </div>
                </div>

                <!-- Card 4: Resource Booking Slots distribution -->
                <div class="analytics-chart-card">
                    <h4 style="margin-bottom:16px; font-weight:700; font-size:0.95rem; text-transform:uppercase; color:var(--color-gray-500);">Peak Resource Booking Windows (Hours)</h4>
                    <div class="chart-container">
                        <canvas id="chart-bookings"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize Charts after DOM injection
    setTimeout(() => {
        buildConditionChart();
        buildAllocationChart();
        buildMaintenanceChart();
        buildBookingChart();
    }, 100);

    // Export listener
    container.querySelector("#export-reports-btn").addEventListener("click", () => {
        exportCSV();
    });

    // Print listener
    container.querySelector("#print-reports-btn").addEventListener("click", () => {
        window.print();
    });

    lucide.createIcons();
}

function buildConditionChart() {
    const assets = Store.getAssets();
    
    // Count conditions
    const condCounts = { Excellent: 0, Good: 0, Fair: 0, Poor: 0 };
    assets.forEach(a => {
        if (condCounts[a.condition] !== undefined) {
            condCounts[a.condition]++;
        }
    });

    const ctx = document.getElementById("chart-conditions").getContext("2d");
    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Excellent", "Good", "Fair", "Poor"],
            datasets: [{
                data: [condCounts.Excellent, condCounts.Good, condCounts.Fair, condCounts.Poor],
                backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "right" }
            }
        }
    });
}

function buildAllocationChart() {
    const allocations = Store.getAllocations().filter(a => a.status === "Active");
    const depts = Store.getDepartments();

    // Map department id to names & counts
    const counts = {};
    depts.forEach(d => counts[d.name] = 0);

    allocations.forEach(alloc => {
        const dept = depts.find(d => d.id === alloc.departmentId);
        if (dept) {
            counts[dept.name] = (counts[dept.name] || 0) + 1;
        }
    });

    const ctx = document.getElementById("chart-allocations").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: "Active Allocations",
                data: Object.values(counts),
                backgroundColor: "#714B67",
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

function buildMaintenanceChart() {
    const maintenance = Store.getMaintenance();
    const assets = Store.getAssets();
    const categories = Store.getCategories();

    // Map Category to counts
    const catCounts = {};
    categories.forEach(c => catCounts[c.name] = 0);

    maintenance.forEach(m => {
        const asset = assets.find(a => a.id === m.assetId);
        if (asset) {
            const cat = categories.find(c => c.id === asset.categoryId);
            if (cat) {
                catCounts[cat.name] = (catCounts[cat.name] || 0) + 1;
            }
        }
    });

    const ctx = document.getElementById("chart-maintenance").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(catCounts),
            datasets: [{
                label: "Maintenance Incidents",
                data: Object.values(catCounts),
                backgroundColor: "#f59e0b",
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            scales: {
                x: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

function buildBookingChart() {
    const bookings = Store.getBookings().filter(b => b.status === "Upcoming" || b.status === "Completed" || b.status === "Ongoing");
    
    // Group slots by hour range
    const times = { "08:00 - 10:00": 0, "10:00 - 12:00": 0, "12:00 - 14:00": 0, "14:00 - 16:00": 0, "16:00 - 18:00": 0 };

    bookings.forEach(b => {
        const startHour = parseInt(b.startTime.split(":")[0]);
        if (startHour >= 8 && startHour < 10) times["08:00 - 10:00"]++;
        else if (startHour >= 10 && startHour < 12) times["10:00 - 12:00"]++;
        else if (startHour >= 12 && startHour < 14) times["12:00 - 14:00"]++;
        else if (startHour >= 14 && startHour < 16) times["14:00 - 16:00"]++;
        else if (startHour >= 16 && startHour < 18) times["16:00 - 18:00"]++;
    });

    const ctx = document.getElementById("chart-bookings").getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: Object.keys(times),
            datasets: [{
                label: "Booked Slots",
                data: Object.values(times),
                borderColor: "#a855f7",
                backgroundColor: "rgba(168, 85, 247, 0.1)",
                tension: 0.3,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

function exportCSV() {
    const assets = Store.getAssets();
    
    // Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Asset Tag,Asset Name,Serial Number,Location,Condition,Status,Shared/Bookable,Current Holder\r\n";
    
    // Rows
    assets.forEach(a => {
        const row = [
            a.id,
            `"${a.name.replace(/"/g, '""')}"`,
            a.serialNumber,
            `"${a.location.replace(/"/g, '""')}"`,
            a.condition,
            a.status,
            a.isShared ? "Yes" : "No",
            a.currentHolderName || "None"
        ].join(",");
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "AssetFlow_Directory_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("CSV data export started.", "success");
}
