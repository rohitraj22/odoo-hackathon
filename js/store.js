/* ===================================================
   AssetFlow Central Store & State Management (Wireframe Data Aligned)
   =================================================== */

// Seeded Data matching the wireframe mockups
const INITIAL_DEPARTMENTS = [
    { id: "D-001", name: "Engineering", parentId: "", headId: "EMP-003", headName: "aditi sen", status: "Active" },
    { id: "D-002", name: "Facilities", parentId: "", headId: "EMP-004", headName: "rohan mehta", status: "Active" },
    { id: "D-003", name: "Field ops (cust)", parentId: "Field Ops", headId: "", headName: "—", status: "Inactive" }
];

const INITIAL_CATEGORIES = [
    { id: "CAT-001", name: "Electronics", customFields: [{ name: "Warranty Period (Months)", type: "number", value: "24" }, { name: "Brand", type: "text", value: "Apple" }] },
    { id: "CAT-002", name: "Furniture", customFields: [{ name: "Material", type: "text", value: "Wood" }] },
    { id: "CAT-003", name: "Vehicles", customFields: [{ name: "License Plate", type: "text", value: "" }] }
];

const INITIAL_EMPLOYEES = [
    { id: "EMP-001", name: "System Admin", email: "admin@assetflow.com", password: "password", departmentId: "D-001", role: "Admin", status: "Active" },
    { id: "EMP-002", name: "Priya Shah", email: "manager@assetflow.com", password: "password", departmentId: "D-001", role: "Asset Manager", status: "Active" },
    { id: "EMP-003", name: "Aditi Sen", email: "head@assetflow.com", password: "password", departmentId: "D-001", role: "Department Head", status: "Active" },
    { id: "EMP-004", name: "Rohan Mehta", email: "head-facilities@assetflow.com", password: "password", departmentId: "D-002", role: "Department Head", status: "Active" },
    { id: "EMP-005", name: "John Doe", email: "employee@assetflow.com", password: "password", departmentId: "D-001", role: "Employee", status: "Active" },
    { id: "EMP-006", name: "Sarah Jenkins", email: "sarah@assetflow.com", password: "password", departmentId: "D-002", role: "Employee", status: "Active" }
];

const INITIAL_ASSETS = [
    { id: "AF-0114", name: "Dell laptop", categoryId: "CAT-001", serialNumber: "DL-0114", acquisitionDate: "2025-01-10", acquisitionCost: 1200, condition: "Good", location: "bengaluru", bookable: false, status: "Allocated", currentHolderId: "EMP-002", currentHolderName: "Priya Shah", isShared: false, customData: { "Brand": "Dell" }, history: [
        { date: "2026-03-12", action: "Allocation", user: "Priya Shah", details: "Allocated to Priya Shah - Engineering" },
        { date: "2026-01-04", action: "Return Checked-In", user: "Priya Shah", details: "Returned by Arjun Dev - condition good" }
    ]},
    { id: "AF-0012", name: "Dell Laptop", categoryId: "CAT-001", serialNumber: "DL-0012", acquisitionDate: "2025-03-15", acquisitionCost: 1000, condition: "Excellent", location: "bengaluru", bookable: false, status: "Allocated", currentHolderId: "EMP-003", currentHolderName: "Aditi Sen", isShared: false, customData: { "Brand": "Dell" }, history: [
        { date: "2025-03-15", action: "Registration", user: "Priya Shah", details: "Laptop registered." }
    ]},
    { id: "AF-0062", name: "Projector", categoryId: "CAT-001", serialNumber: "PJ-0062", acquisitionDate: "2024-08-01", acquisitionCost: 800, condition: "Fair", location: "HQ floor 2", bookable: false, status: "Under Maintenance", currentHolderId: "", currentHolderName: "", isShared: false, customData: { "Brand": "Epson" }, history: [
        { date: "2024-08-01", action: "Registration", user: "System Admin", details: "Projector configured." }
    ]},
    { id: "AF-0201", name: "Office chair", categoryId: "CAT-002", serialNumber: "OC-0201", acquisitionDate: "2025-03-20", acquisitionCost: 200, condition: "Good", location: "Warehouse", bookable: false, status: "Available", currentHolderId: "", currentHolderName: "", isShared: false, customData: { "Material": "Fabric" }, history: [
        { date: "2025-03-20", action: "Registration", user: "Priya Shah", details: "Office chair registered." }
    ]},
    { id: "AF-0003", name: "Conference Room B2", categoryId: "CAT-001", serialNumber: "ROOM-B2", acquisitionDate: "2024-01-01", acquisitionCost: 0, condition: "Excellent", location: "bengaluru", bookable: true, status: "Available", currentHolderId: "", currentHolderName: "", isShared: true, customData: {}, history: [] }
];

const INITIAL_ALLOCATIONS = [
    { id: "AL-001", assetId: "AF-0114", assetName: "Dell laptop", holderId: "EMP-002", holderName: "Priya Shah", employeeId: "EMP-002", employeeName: "Priya Shah", department: "Engineering", departmentId: "D-001", date: "2026-03-12", allocationDate: "2026-03-12", expectedReturnDate: "2026-07-01", actualReturnDate: "", status: "Active", conditionOnAllocation: "Good", returnNotes: "" },
    { id: "AL-002", assetId: "AF-0012", assetName: "Dell Laptop", holderId: "EMP-003", holderName: "Aditi Sen", employeeId: "EMP-003", employeeName: "Aditi Sen", department: "Engineering", departmentId: "D-001", date: "2026-06-01", allocationDate: "2026-06-01", expectedReturnDate: "2026-08-01", actualReturnDate: "", status: "Active", conditionOnAllocation: "Excellent", returnNotes: "" }
];

const INITIAL_TRANSFERS = [];

const INITIAL_BOOKINGS = [
    { id: "BK-001", assetId: "AF-0003", assetName: "Conference Room B2", resourceId: "AF-0003", resourceName: "Conference Room B2", bookedBy: "EMP-005", bookedByName: "Procurement Team", employeeId: "EMP-005", employeeName: "Procurement Team", date: new Date().toISOString().split("T")[0], startTime: "09:00", endTime: "10:00", status: "Upcoming" }
];

const INITIAL_MAINTENANCE = [
    { id: "MT-001", assetId: "AF-0062", assetName: "Projector", issueDescription: "bulb not turning on", priority: "High", raisedBy: "EMP-003", raisedByName: "aditi sen", dateRaised: "2026-07-10", status: "Pending", technician: "", dateResolved: "", notes: "" },
    { id: "MT-002", assetId: "AF-0211", assetName: "AC unit", issueDescription: "noisy compressor", priority: "Medium", raisedBy: "EMP-005", raisedByName: "John Doe", dateRaised: "2026-07-08", status: "Approved", technician: "", dateResolved: "", notes: "" },
    { id: "MT-003", assetId: "AF-0078", assetName: "Forklift", issueDescription: "tech: M varma", priority: "High", raisedBy: "EMP-004", raisedByName: "Rohan Mehta", dateRaised: "2026-07-05", status: "Technician assigned", technician: "M varma", dateResolved: "", notes: "" },
    { id: "MT-004", assetId: "AF-897", assetName: "Printer", issueDescription: "jam parts ordered", priority: "Low", raisedBy: "EMP-005", raisedByName: "John Doe", dateRaised: "2026-07-02", status: "In progress", technician: "IT Support", dateResolved: "", notes: "" },
    { id: "MT-005", assetId: "AF-893", assetName: "Chair", issueDescription: "repair resolved 3 Jul", priority: "Low", raisedBy: "EMP-002", raisedByName: "Priya Shah", dateRaised: "2026-07-01", status: "Resolved", technician: "Carpenter Dept", dateResolved: "2026-07-03", notes: "Leg structural repairs completed." }
];

const INITIAL_AUDITS = [
    { id: "AU-001", name: "Q3 audit: Engineering Dept", scope: "Engineering", scopeType: "Department", scopeValue: "D-001", startDate: "2026-07-01", endDate: "", auditorIds: ["EMP-002"], auditorNames: "A. Rao, R. Iqbal", status: "Active", createdBy: "System Admin", checklist: [
        { assetId: "AF-008", expectedHolder: "Aditi Sen", status: "Verified", verifiedBy: "A. Rao", verifiedDate: "2026-07-02" },
        { assetId: "AF-9921", expectedHolder: "John Doe", status: "Missing", verifiedBy: "R. Iqbal", verifiedDate: "2026-07-02" },
        { assetId: "AF-9838", expectedHolder: "Sarah Jenkins", status: "Damaged", verifiedBy: "A. Rao", verifiedDate: "2026-07-02" }
    ], items: [
        { assetId: "AF-008", assetName: "Dell laptop", tag: "AF-008", location: "Desk #12", status: "Verified", notes: "" },
        { assetId: "AF-9921", assetName: "Office chair", tag: "AF-9921", location: "Desk #14", status: "Missing", notes: "Not found at workstation" },
        { assetId: "AF-9838", assetName: "Monitor", tag: "AF-9838", location: "Desk #15", status: "Damaged", notes: "Defective ports" }
    ], discrepancies: [] }
];

const INITIAL_LOGS = [
    { timestamp: new Date(Date.now() - 120000).toISOString(), user: "Priya Shah", action: "Allocation", details: "Laptop AF-0014 allocated to Priya shah - Engineering" },
    { timestamp: new Date(Date.now() - 1080000).toISOString(), user: "Priya Shah", action: "Maintenance Approval", details: "Maintenance request AF-0055 approved" },
    { timestamp: new Date(Date.now() - 3600000).toISOString(), user: "Procurement Team", action: "Resource Booking", details: "Booking confirmed - Room B2 - 2:00 to 3:00 PM" },
    { timestamp: new Date(Date.now() - 10800000).toISOString(), user: "System Admin", action: "Transfer Approval", details: "Transfer approved - AF-0033 to facilities dept" }
];

const INITIAL_NOTIFICATIONS = [
    { id: "N-001", timestamp: new Date(Date.now() - 120000).toISOString(), title: "Asset Assigned", message: "Laptop AF-0014 assigned to Priya shah", type: "success", read: false },
    { id: "N-002", timestamp: new Date(Date.now() - 1080000).toISOString(), title: "Maintenance Request Approved", message: "Maintenance request AF-0055 approved", type: "success", read: false },
    { id: "N-003", timestamp: new Date(Date.now() - 3600000).toISOString(), title: "Booking Confirmed", message: "Booking confirmed - Room B2 - 2:00 to 3:00 PM", type: "info", read: false },
    { id: "N-004", timestamp: new Date(Date.now() - 10800000).toISOString(), title: "Transfer Approved", message: "Transfer approved - AF-0033 to facilities dept", type: "success", read: false },
    { id: "N-005", timestamp: new Date(Date.now() - 86400000).toISOString(), title: "Overdue Return Alert", message: "Overdue return: AF-0021 was due 3 days ago", type: "warning", read: false },
    { id: "N-006", timestamp: new Date(Date.now() - 172800000).toISOString(), title: "Audit Discrepancy Flagged", message: "audit discrepancy flagged - AF-0088 damaged", type: "danger", read: false }
];

export const Store = {
    get(key, initialData) {
        const val = localStorage.getItem(`assetflow_${key}`);
        if (!val) {
            this.set(key, initialData);
            return initialData;
        }
        return JSON.parse(val);
    },

    set(key, data) {
        localStorage.setItem(`assetflow_${key}`, JSON.stringify(data));
    },

    // Session Management
    getCurrentUser() {
        return this.get("current_user", INITIAL_EMPLOYEES[0]); // Default to Admin for testing setup easily
    },

    setCurrentUser(user) {
        this.set("current_user", user);
    },

    // Core Repositories
    getEmployees() { return this.get("employees", INITIAL_EMPLOYEES); },
    saveEmployees(data) { this.set("employees", data); },

    getDepartments() { return this.get("departments", INITIAL_DEPARTMENTS); },
    saveDepartments(data) { this.set("departments", data); },

    getCategories() { return this.get("categories", INITIAL_CATEGORIES); },
    saveCategories(data) { this.set("categories", data); },

    getAssets() { return this.get("assets", INITIAL_ASSETS); },
    saveAssets(data) { this.set("assets", data); },

    getAllocations() { return this.get("allocations", INITIAL_ALLOCATIONS); },
    saveAllocations(data) { this.set("allocations", data); },

    getTransfers() { return this.get("transfers", INITIAL_TRANSFERS); },
    saveTransfers(data) { this.set("transfers", data); },

    getBookings() { return this.get("bookings", INITIAL_BOOKINGS); },
    saveBookings(data) { this.set("bookings", data); },

    getMaintenance() { return this.get("maintenance", INITIAL_MAINTENANCE); },
    saveMaintenance(data) { this.set("maintenance", data); },

    getAudits() { return this.get("audits", INITIAL_AUDITS); },
    saveAudits(data) { this.set("audits", data); },

    getLogs() { return this.get("logs", INITIAL_LOGS); },
    saveLogs(data) { this.set("logs", data); },

    getNotifications() { return this.get("notifications", INITIAL_NOTIFICATIONS); },
    saveNotifications(data) { this.set("notifications", data); },

    // Alias for logs (used by Notifications screen)
    getActivity() { return this.getLogs(); },

    // Core Helpers
    logActivity(user, action, details) {
        const logs = this.getLogs();
        const timestamp = new Date().toISOString();
        logs.unshift({ timestamp, user, action, details });
        this.saveLogs(logs);
    },

    addNotification(title, message, type = "info") {
        const notis = this.getNotifications();
        const id = `N-${Date.now()}`;
        const timestamp = new Date().toISOString();
        notis.unshift({ id, timestamp, title, message, type, read: false });
        this.saveNotifications(notis);
        window.dispatchEvent(new CustomEvent("new-notification"));
    },

    // Business Logic Actions
    allocateAsset(assetId, employeeId, departmentId, expectedReturnDate, conditionOnAllocation, actionUser) {
        const assets = this.getAssets();
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return { success: false, message: "Asset not found." };

        if (asset.status !== "Available") {
            const currentHolder = asset.currentHolderName || "another employee";
            return { 
                success: false, 
                conflict: true,
                currentHolder: currentHolder,
                message: `Already Allocated to ${currentHolder} (${asset.location || 'Engineering'})` 
            };
        }

        const employees = this.getEmployees();
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) return { success: false, message: "Employee not found." };

        // Create Allocation
        const allocations = this.getAllocations();
        const newAllocation = {
            id: `AL-${Date.now().toString().slice(-4)}`,
            assetId: assetId,
            assetName: asset.name,
            employeeId: employeeId,
            employeeName: employee.name,
            departmentId: departmentId || employee.departmentId,
            allocationDate: new Date().toISOString().split("T")[0],
            expectedReturnDate: expectedReturnDate || "",
            actualReturnDate: "",
            status: "Active",
            conditionOnAllocation: conditionOnAllocation || "Good",
            returnNotes: ""
        };
        allocations.unshift(newAllocation);
        this.saveAllocations(allocations);

        // Update Asset
        asset.status = "Allocated";
        asset.currentHolderId = employeeId;
        asset.currentHolderName = employee.name;
        asset.history.unshift({
            date: new Date().toISOString().split("T")[0],
            action: "Allocation",
            user: actionUser,
            details: `Allocated to ${employee.name}`
        });
        this.saveAssets(assets);

        this.logActivity(actionUser, "Allocation", `Laptop ${assetId} assigned to ${employee.name}`);
        this.addNotification("Asset Assigned", `Laptop ${assetId} assigned to ${employee.name}`, "success");

        return { success: true, allocation: newAllocation };
    },

    returnAsset(assetId, conditionOnReturn, returnNotes, actionUser) {
        const assets = this.getAssets();
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return { success: false, message: "Asset not found." };

        const allocations = this.getAllocations();
        const activeAlloc = allocations.find(al => al.assetId === assetId && al.status === "Active");
        if (activeAlloc) {
            activeAlloc.status = "Returned";
            activeAlloc.actualReturnDate = new Date().toISOString().split("T")[0];
            activeAlloc.returnNotes = returnNotes;
            this.saveAllocations(allocations);
        }

        const prevHolder = asset.currentHolderName;
        asset.status = "Available";
        asset.currentHolderId = "";
        asset.currentHolderName = "";
        asset.condition = conditionOnReturn || asset.condition;
        asset.history.unshift({
            date: new Date().toISOString().split("T")[0],
            action: "Return Checked-In",
            user: actionUser,
            details: `Returned by ${prevHolder || 'holder'}`
        });
        this.saveAssets(assets);

        this.logActivity(actionUser, "Return Checked-In", `Returned ${asset.name} previously held by ${prevHolder}`);
        return { success: true };
    },

    requestTransfer(assetId, targetEmployeeId, actionUser) {
        const assets = this.getAssets();
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return { success: false, message: "Asset not found." };

        const employees = this.getEmployees();
        const targetEmp = employees.find(e => e.id === targetEmployeeId);
        if (!targetEmp) return { success: false, message: "Target employee not found." };

        const transfers = this.getTransfers();
        const transferId = `TR-${Date.now().toString().slice(-4)}`;
        const newTransfer = {
            id: transferId,
            assetId: asset.id,
            assetName: asset.name,
            fromEmployeeId: asset.currentHolderId,
            fromEmployeeName: asset.currentHolderName || "Unknown",
            toEmployeeId: targetEmployeeId,
            toEmployeeName: targetEmp.name,
            requestDate: new Date().toISOString().split("T")[0],
            status: "Pending",
            approvedBy: ""
        };
        transfers.unshift(newTransfer);
        this.saveTransfers(transfers);

        this.logActivity(actionUser, "Transfer Request", `Requested transfer of ${asset.name} to ${targetEmp.name}`);
        this.addNotification("Transfer Requested", `Requested transfer of ${asset.id} to ${targetEmp.name}`, "info");

        return { success: true, transfer: newTransfer };
    },

    approveTransfer(transferId, actionUser) {
        const transfers = this.getTransfers();
        const transfer = transfers.find(t => t.id === transferId);
        if (!transfer || transfer.status !== "Pending") return { success: false, message: "Transfer request not valid." };

        const assets = this.getAssets();
        const asset = assets.find(a => a.id === transfer.assetId);
        if (!asset) return { success: false, message: "Asset not found." };

        // End old allocation
        const allocations = this.getAllocations();
        const activeAlloc = allocations.find(al => al.assetId === transfer.assetId && al.status === "Active");
        if (activeAlloc) {
            activeAlloc.status = "Transferred";
            activeAlloc.actualReturnDate = new Date().toISOString().split("T")[0];
        }

        // New allocation
        const newAllocation = {
            id: `AL-${Date.now().toString().slice(-4)}`,
            assetId: transfer.assetId,
            assetName: asset.name,
            employeeId: transfer.toEmployeeId,
            employeeName: transfer.toEmployeeName,
            departmentId: asset.departmentId || "",
            allocationDate: new Date().toISOString().split("T")[0],
            expectedReturnDate: "",
            actualReturnDate: "",
            status: "Active",
            conditionOnAllocation: asset.condition,
            returnNotes: ""
        };
        allocations.unshift(newAllocation);
        this.saveAllocations(allocations);

        // Update Transfer
        transfer.status = "Approved";
        transfer.approvedBy = actionUser;
        this.saveTransfers(transfers);

        // Update Asset
        asset.currentHolderId = transfer.toEmployeeId;
        asset.currentHolderName = transfer.toEmployeeName;
        asset.history.unshift({
            date: new Date().toISOString().split("T")[0],
            action: "Transfer Approved",
            user: actionUser,
            details: `Transferred from ${transfer.fromEmployeeName} to ${transfer.toEmployeeName}`
        });
        this.saveAssets(assets);

        this.logActivity(actionUser, "Transfer Approval", `Transfer approved - ${asset.id} to ${transfer.toEmployeeName}`);
        this.addNotification("Transfer Approved", `Transfer approved - ${asset.id} to ${transfer.toEmployeeName}`, "success");

        return { success: true };
    },

    rejectTransfer(transferId, actionUser) {
        const transfers = this.getTransfers();
        const transfer = transfers.find(t => t.id === transferId);
        if (!transfer || transfer.status !== "Pending") return { success: false, message: "Transfer request not valid." };

        transfer.status = "Rejected";
        transfer.approvedBy = actionUser;
        this.saveTransfers(transfers);

        this.logActivity(actionUser, "Transfer Rejected", `Declined transfer of ${transfer.assetName}`);
        return { success: true };
    },

    bookResource(resourceId, employeeId, date, startTime, endTime, actionUser) {
        const assets = this.getAssets();
        const asset = assets.find(a => a.id === resourceId);
        if (!asset || !asset.isShared) return { success: false, message: "Resource not available for booking." };

        const employees = this.getEmployees();
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) return { success: false, message: "Employee not found." };

        // Overlap validation
        const bookings = this.getBookings();
        const hasOverlap = bookings.some(b => {
            if (b.resourceId !== resourceId || b.date !== date || b.status === "Cancelled") return false;
            return (startTime < b.endTime) && (endTime > b.startTime);
        });

        if (hasOverlap) {
            return { 
                success: false, 
                overlap: true, 
                message: `Requested ${startTime} to ${endTime} - conflict - slot is unavailable` 
            };
        }

        const newBooking = {
            id: `BK-${Date.now().toString().slice(-4)}`,
            resourceId: resourceId,
            resourceName: asset.name,
            employeeId: employeeId,
            employeeName: employee.name,
            date: date,
            startTime: startTime,
            endTime: endTime,
            status: "Upcoming"
        };
        bookings.unshift(newBooking);
        this.saveBookings(bookings);

        this.logActivity(actionUser, "Resource Booking", `Booking confirmed - Room B2 - ${startTime} to ${endTime}`);
        this.addNotification("Booking Confirmed", `Booking confirmed - Room B2 - ${startTime} to ${endTime}`, "info");

        return { success: true, booking: newBooking };
    },

    cancelBooking(bookingId, actionUser) {
        const bookings = this.getBookings();
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return { success: false, message: "Booking not found." };

        booking.status = "Cancelled";
        this.saveBookings(bookings);

        this.logActivity(actionUser, "Booking Cancelled", `Cancelled booking for ${booking.resourceName}`);
        return { success: true };
    },

    raiseMaintenance(assetId, issueDescription, priority, employeeId, actionUser) {
        const assets = this.getAssets();
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return { success: false, message: "Asset not found." };

        const employees = this.getEmployees();
        const employee = employees.find(e => e.id === employeeId);

        const maintenanceList = this.getMaintenance();
        const newMaintenance = {
            id: `MT-${Date.now().toString().slice(-4)}`,
            assetId: assetId,
            assetName: asset.name,
            issueDescription: issueDescription,
            priority: priority,
            raisedBy: employeeId,
            raisedByName: employee ? employee.name : actionUser,
            dateRaised: new Date().toISOString().split("T")[0],
            status: "Pending",
            technician: "",
            dateResolved: "",
            notes: ""
        };
        maintenanceList.unshift(newMaintenance);
        this.saveMaintenance(maintenanceList);

        this.logActivity(actionUser, "Maintenance Raised", `Raised maintenance for ${asset.name}`);
        return { success: true, maintenance: newMaintenance };
    },

    updateMaintenanceStatus(maintenanceId, status, technician, resolutionNotes, actionUser) {
        const list = this.getMaintenance();
        const m = list.find(x => x.id === maintenanceId);
        if (!m) return { success: false, message: "Ticket not found." };

        m.status = status;
        if (technician) m.technician = technician;
        if (resolutionNotes) {
            m.notes = resolutionNotes;
            m.dateResolved = new Date().toISOString().split("T")[0];
        }
        this.saveMaintenance(list);

        // Update asset status
        const assets = this.getAssets();
        const asset = assets.find(a => a.id === m.assetId);
        if (asset) {
            if (status === "Approved" || status === "Technician assigned" || status === "In progress") {
                asset.status = "Under Maintenance";
            } else if (status === "Resolved") {
                // Revert to Allocated if active allocation exists, else Available
                const allocations = this.getAllocations();
                const activeAlloc = allocations.find(al => al.assetId === m.assetId && al.status === "Active");
                asset.status = activeAlloc ? "Allocated" : "Available";
            }
            asset.history.unshift({
                date: new Date().toISOString().split("T")[0],
                action: `Maintenance Status: ${status}`,
                user: actionUser,
                details: `Updated ticket ${maintenanceId} to: ${status}`
            });
            this.saveAssets(assets);
        }

        this.logActivity(actionUser, "Maintenance Update", `Maintenance ticket ${maintenanceId} marked as ${status}`);
        return { success: true };
    },

    createAuditCycle(name, scopeType, scopeValue, auditorIds, actionUser) {
        const employees = this.getEmployees();
        const auditors = employees.filter(e => auditorIds.includes(e.id));
        const auditorNames = auditors.map(e => e.name).join(", ") || "A. Rao, R. Iqbal";

        const audits = this.getAudits();
        const newAudit = {
            id: `AU-${Date.now().toString().slice(-4)}`,
            name: name,
            scopeType: scopeType,
            scopeValue: scopeValue,
            startDate: new Date().toISOString().split("T")[0],
            endDate: "",
            auditorIds: auditorIds,
            auditorNames: auditorNames,
            status: "Open",
            items: [
                { assetId: "AF-008", assetName: "Dell laptop", tag: "AF-008", location: "Desk #12", status: "Verified", notes: "" },
                { assetId: "AF-9921", assetName: "Office chair", tag: "AF-9921", location: "Desk #14", status: "Pending", notes: "" },
                { assetId: "AF-9838", assetName: "Monitor", tag: "AF-9838", location: "Desk #15", status: "Pending", notes: "" }
            ],
            discrepancies: []
        };
        audits.unshift(newAudit);
        this.saveAudits(audits);

        this.logActivity(actionUser, "Audit Created", `Created audit cycle ${name}`);
        return { success: true, audit: newAudit };
    },

    updateAuditItem(auditId, assetId, status, notes, actionUser) {
        const audits = this.getAudits();
        const audit = audits.find(a => a.id === auditId);
        if (!audit || audit.status !== "Open") return { success: false, message: "Audit cycle not open." };

        const item = audit.items.find(i => i.assetId === assetId);
        if (!item) return { success: false, message: "Item not found." };

        item.status = status;
        item.notes = notes;
        this.saveAudits(audits);
        return { success: true };
    },

    closeAuditCycle(auditId, actionUser) {
        const audits = this.getAudits();
        const audit = audits.find(a => a.id === auditId);
        if (!audit || audit.status !== "Open") return { success: false, message: "Audit cycle not open." };

        audit.status = "Closed";
        audit.endDate = new Date().toISOString().split("T")[0];

        const discrepancies = [];
        const assets = this.getAssets();

        audit.items.forEach(item => {
            const asset = assets.find(a => a.id === item.assetId);
            if (item.status === "Missing") {
                discrepancies.push({ assetId: item.assetId, assetName: item.assetName, issue: "Missing asset", notes: item.notes });
                if (asset) {
                    asset.status = "Lost";
                    asset.history.unshift({
                        date: new Date().toISOString().split("T")[0],
                        action: "Audit Lost",
                        user: "System",
                        details: `Flagged as Missing in Audit ${auditId}`
                    });
                }
            } else if (item.status === "Damaged") {
                discrepancies.push({ assetId: item.assetId, assetName: item.assetName, issue: "Damaged asset", notes: item.notes });
                if (asset) {
                    asset.condition = "Fair";
                }
            }
        });

        audit.discrepancies = discrepancies;
        this.saveAudits(audits);
        this.saveAssets(assets);

        this.logActivity(actionUser, "Audit Closed", `Closed audit cycle ${audit.name}`);
        this.addNotification("Audit Cycle Closed", `Audit discrepancy flagged - ${audit.id} closed`, "danger");

        return { success: true, discrepancies };
    }
};
