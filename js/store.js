/* ===================================================
   AssetFlow Central Store & State Management
   =================================================== */

// Mock Data Definitions
const INITIAL_DEPARTMENTS = [
    { id: "D-001", name: "Information Technology", parentId: "", headId: "EMP-002", headName: "Priya Sharma", status: "Active" },
    { id: "D-002", name: "Human Resources", parentId: "", headId: "EMP-004", headName: "Sarah Jenkins", status: "Active" },
    { id: "D-003", name: "Engineering", parentId: "D-001", headId: "EMP-003", headName: "Raj Patel", status: "Active" },
    { id: "D-004", name: "Facilities & Operations", parentId: "", headId: "", headName: "Unassigned", status: "Active" }
];

const INITIAL_CATEGORIES = [
    { id: "CAT-001", name: "Electronics", customFields: [{ name: "Warranty Period (Months)", type: "number", value: "24" }, { name: "Brand", type: "text", value: "Apple" }] },
    { id: "CAT-002", name: "Furniture", customFields: [{ name: "Material", type: "text", value: "Wood" }] },
    { id: "CAT-003", name: "Vehicles", customFields: [{ name: "License Plate", type: "text", value: "" }, { name: "Insurance Expiry", type: "date", value: "" }] },
    { id: "CAT-004", name: "Office Equipment", customFields: [{ name: "Maintenance Interval (Days)", type: "number", value: "180" }] }
];

const INITIAL_EMPLOYEES = [
    { id: "EMP-001", name: "System Admin", email: "admin@assetflow.com", password: "password", departmentId: "D-001", role: "Admin", status: "Active" },
    { id: "EMP-002", name: "Priya Sharma", email: "manager@assetflow.com", password: "password", departmentId: "D-001", role: "Asset Manager", status: "Active" },
    { id: "EMP-003", name: "Raj Patel", email: "head@assetflow.com", password: "password", departmentId: "D-003", role: "Department Head", status: "Active" },
    { id: "EMP-004", name: "Sarah Jenkins", email: "head-hr@assetflow.com", password: "password", departmentId: "D-002", role: "Department Head", status: "Active" },
    { id: "EMP-005", name: "John Doe", email: "employee@assetflow.com", password: "password", departmentId: "D-003", role: "Employee", status: "Active" }
];

const INITIAL_ASSETS = [
    { id: "AF-0001", name: "MacBook Pro 16\"", categoryId: "CAT-001", serialNumber: "MBP16-8924", acquisitionDate: "2025-01-10", acquisitionCost: 2500, condition: "Excellent", location: "Main Office - Floor 2", bookable: false, status: "Allocated", currentHolderId: "EMP-005", currentHolderName: "John Doe", isShared: false, customData: { "Warranty Period (Months)": "24", "Brand": "Apple" }, history: [
        { date: "2025-01-10", action: "Registration", user: "Priya Sharma", details: "Asset registered in system." },
        { date: "2026-06-01", action: "Allocation", user: "Priya Sharma", details: "Allocated to John Doe." }
    ]},
    { id: "AF-0002", name: "Standing Desk", categoryId: "CAT-002", serialNumber: "SD-9011", acquisitionDate: "2025-03-15", acquisitionCost: 600, condition: "Good", location: "Main Office - Floor 2", bookable: false, status: "Available", currentHolderId: "", currentHolderName: "", isShared: false, customData: { "Material": "Oak/Steel" }, history: [
        { date: "2025-03-15", action: "Registration", user: "Priya Sharma", details: "Desk registered." }
    ]},
    { id: "AF-0003", name: "Conference Room B2", categoryId: "CAT-004", serialNumber: "CONF-B2", acquisitionDate: "2024-08-01", acquisitionCost: 0, condition: "Excellent", location: "Building B - Floor 1", bookable: true, status: "Available", currentHolderId: "", currentHolderName: "", isShared: true, customData: { "Maintenance Interval (Days)": "360" }, history: [
        { date: "2024-08-01", action: "Registration", user: "System Admin", details: "Room configured as shared resource." }
    ]},
    { id: "AF-0004", name: "Toyota Prius (Fleet-03)", categoryId: "CAT-003", serialNumber: "TP-2023-A", acquisitionDate: "2024-11-20", acquisitionCost: 28000, condition: "Good", location: "Basement Parking", bookable: true, status: "Available", currentHolderId: "", currentHolderName: "", isShared: true, customData: { "License Plate": "987-XYZ", "Insurance Expiry": "2026-11-20" }, history: [
        { date: "2024-11-20", action: "Registration", user: "Priya Sharma", details: "Fleet vehicle registered." }
    ]},
    { id: "AF-0005", name: "iPhone 15 Pro", categoryId: "CAT-001", serialNumber: "IP15-7731", acquisitionDate: "2025-02-14", acquisitionCost: 1000, condition: "Fair", location: "IT Lab", bookable: false, status: "Under Maintenance", currentHolderId: "EMP-003", currentHolderName: "Raj Patel", isShared: false, customData: { "Warranty Period (Months)": "12", "Brand": "Apple" }, history: [
        { date: "2025-02-14", action: "Registration", user: "Priya Sharma", details: "iPhone registered." },
        { date: "2026-07-10", action: "Maintenance Raised", user: "Raj Patel", details: "Reported: Battery swelling." },
        { date: "2026-07-11", action: "Status Change", user: "Priya Sharma", details: "Approved. Moved to Under Maintenance." }
    ]},
    { id: "AF-0006", name: "Ergonomic Office Chair", categoryId: "CAT-002", serialNumber: "EC-4022", acquisitionDate: "2025-03-20", acquisitionCost: 350, condition: "Excellent", location: "Main Office - Floor 2", bookable: false, status: "Allocated", currentHolderId: "EMP-004", currentHolderName: "Sarah Jenkins", isShared: false, customData: { "Material": "Mesh" }, history: [
        { date: "2025-03-20", action: "Registration", user: "Priya Sharma", details: "Chair registered." },
        { date: "2026-07-01", action: "Allocation", user: "Priya Sharma", details: "Allocated to Sarah Jenkins." }
    ]}
];

const INITIAL_ALLOCATIONS = [
    { id: "AL-001", assetId: "AF-0001", assetName: "MacBook Pro 16\"", employeeId: "EMP-005", employeeName: "John Doe", departmentId: "D-003", allocationDate: "2026-06-01", expectedReturnDate: "2026-07-01", actualReturnDate: "", status: "Active", conditionOnAllocation: "Excellent", returnNotes: "" },
    { id: "AL-002", assetId: "AF-0006", assetName: "Ergonomic Office Chair", employeeId: "EMP-004", employeeName: "Sarah Jenkins", departmentId: "D-002", allocationDate: "2026-07-01", expectedReturnDate: "2026-08-01", actualReturnDate: "", status: "Active", conditionOnAllocation: "Excellent", returnNotes: "" }
];

const INITIAL_TRANSFERS = [];

const INITIAL_BOOKINGS = [
    { id: "BK-001", resourceId: "AF-0003", resourceName: "Conference Room B2", employeeId: "EMP-005", employeeName: "John Doe", date: "2026-07-12", startTime: "09:00", endTime: "10:00", status: "Completed" },
    { id: "BK-002", resourceId: "AF-0003", resourceName: "Conference Room B2", employeeId: "EMP-004", employeeName: "Sarah Jenkins", date: "2026-07-12", startTime: "13:00", endTime: "14:30", status: "Upcoming" },
    { id: "BK-003", resourceId: "AF-0004", resourceName: "Toyota Prius (Fleet-03)", employeeId: "EMP-003", employeeName: "Raj Patel", date: "2026-07-13", startTime: "10:00", endTime: "16:00", status: "Upcoming" }
];

const INITIAL_MAINTENANCE = [
    { id: "MT-001", assetId: "AF-0005", assetName: "iPhone 15 Pro", issueDescription: "Battery swelling, screen slightly lifting.", priority: "High", raisedBy: "EMP-003", raisedByName: "Raj Patel", dateRaised: "2026-07-10", status: "In Progress", technician: "David (In-house IT)", dateResolved: "", photoUrl: "", notes: "Battery replacement parts ordered." }
];

const INITIAL_AUDITS = [
    { id: "AU-001", name: "Q3 Floor 2 Asset Check", scopeType: "Location", scopeValue: "Main Office - Floor 2", startDate: "2026-07-05", endDate: "2026-07-15", auditorIds: ["EMP-002"], auditorNames: "Priya Sharma", status: "Open", items: [
        { assetId: "AF-0001", assetName: "MacBook Pro 16\"", tag: "AF-0001", location: "Main Office - Floor 2", status: "Verified", notes: "Verified in possession of John Doe." },
        { assetId: "AF-0002", assetName: "Standing Desk", tag: "AF-0002", location: "Main Office - Floor 2", status: "Verified", notes: "Located at Workstation 2B." },
        { assetId: "AF-0006", assetName: "Ergonomic Office Chair", tag: "AF-0006", location: "Main Office - Floor 2", status: "Pending", notes: "" }
    ], discrepancies: [] }
];

const INITIAL_LOGS = [
    { timestamp: "2026-07-12T09:00:00+05:30", user: "John Doe", action: "Resource Booking", details: "Booked Conference Room B2 for 2026-07-12 09:00-10:00" },
    { timestamp: "2026-07-11T16:45:00+05:30", user: "Priya Sharma", action: "Maintenance Approval", details: "Approved maintenance request MT-001 for iPhone 15 Pro" },
    { timestamp: "2026-07-10T11:20:00+05:30", user: "Raj Patel", action: "Maintenance Raised", details: "Raised maintenance request for iPhone 15 Pro" }
];

const INITIAL_NOTIFICATIONS = [
    { id: "N-001", timestamp: "2026-07-12T10:00:00+05:30", title: "Overdue Return Alert", message: "MacBook Pro 16\" (AF-0001) allocated to John Doe is past its expected return date (2026-07-01).", type: "warning", read: false },
    { id: "N-002", timestamp: "2026-07-11T16:45:00+05:30", title: "Maintenance Approved", message: "Maintenance request for iPhone 15 Pro has been approved and marked In Progress.", type: "info", read: false }
];

export const Store = {
    // Get state or initialize from LocalStorage
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
        return this.get("current_user", INITIAL_EMPLOYEES[4]); // Default to Employee (John Doe) for testing initial load
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

    // Helpers
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
        // Trigger a custom event for real-time notification badge updates
        window.dispatchEvent(new CustomEvent("new-notification"));
    },

    // Business Rules
    
    // 1. Allocate asset with conflict validation
    allocateAsset(assetId, employeeId, departmentId, expectedReturnDate, conditionOnAllocation, actionUser) {
        const assets = this.getAssets();
        const assetIndex = assets.findIndex(a => a.id === assetId);
        
        if (assetIndex === -1) return { success: false, message: "Asset not found." };
        const asset = assets[assetIndex];

        // Conflict check: is asset available?
        if (asset.status !== "Available") {
            const currentHolder = asset.currentHolderName || "another employee";
            return { 
                success: false, 
                conflict: true,
                currentHolder: currentHolder,
                message: `Conflict: Asset ${assetId} is already allocated. It is currently held by ${currentHolder}.` 
            };
        }

        const employees = this.getEmployees();
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) return { success: false, message: "Employee not found." };

        // Create Allocation Record
        const allocations = this.getAllocations();
        const allocationId = `AL-${Date.now().toString().slice(-4)}`;
        const newAllocation = {
            id: allocationId,
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

        // Update Asset Status
        asset.status = "Allocated";
        asset.currentHolderId = employeeId;
        asset.currentHolderName = employee.name;
        asset.history.unshift({
            date: new Date().toISOString().split("T")[0],
            action: "Allocation",
            user: actionUser,
            details: `Allocated to ${employee.name}. Expected return: ${expectedReturnDate || "Indefinite"}`
        });
        this.saveAssets(assets);

        this.logActivity(actionUser, "Asset Allocation", `Allocated ${asset.name} (${asset.id}) to ${employee.name}`);
        this.addNotification("Asset Allocated", `Asset ${asset.name} has been allocated to ${employee.name}.`, "success");

        return { success: true, allocation: newAllocation };
    },

    // 2. Asset Return flow
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

        // Update Asset
        const prevHolder = asset.currentHolderName;
        asset.status = "Available";
        asset.currentHolderId = "";
        asset.currentHolderName = "";
        asset.condition = conditionOnReturn || asset.condition;
        asset.history.unshift({
            date: new Date().toISOString().split("T")[0],
            action: "Return Checked-In",
            user: actionUser,
            details: `Returned by ${prevHolder || "holder"}. Condition: ${conditionOnReturn}. Notes: ${returnNotes}`
        });
        this.saveAssets(assets);

        this.logActivity(actionUser, "Asset Return", `Returned ${asset.name} (${asset.id}) previously held by ${prevHolder}`);
        this.addNotification("Asset Returned", `${asset.name} was returned and is now Available.`, "success");

        return { success: true };
    },

    // 3. Asset Transfer request
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
            status: "Pending", // Pending -> Approved / Rejected
            approvedBy: ""
        };
        transfers.unshift(newTransfer);
        this.saveTransfers(transfers);

        this.logActivity(actionUser, "Transfer Request", `Requested transfer of ${asset.name} to ${targetEmp.name}`);
        this.addNotification("Transfer Requested", `Transfer of ${asset.name} to ${targetEmp.name} is pending approval.`, "info");

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
            activeAlloc.returnNotes = `Transferred to ${transfer.toEmployeeName} via request ${transferId}`;
        }

        // Create new allocation
        const newAllocationId = `AL-${Date.now().toString().slice(-4)}`;
        const newAllocation = {
            id: newAllocationId,
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

        // Update Transfer request
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
            details: `Transferred from ${transfer.fromEmployeeName} to ${transfer.toEmployeeName}.`
        });
        this.saveAssets(assets);

        this.logActivity(actionUser, "Transfer Approved", `Approved transfer of ${asset.name} to ${transfer.toEmployeeName}`);
        this.addNotification("Transfer Approved", `${asset.name} has been successfully transferred to ${transfer.toEmployeeName}.`, "success");

        return { success: true };
    },

    rejectTransfer(transferId, actionUser) {
        const transfers = this.getTransfers();
        const transfer = transfers.find(t => t.id === transferId);
        if (!transfer || transfer.status !== "Pending") return { success: false, message: "Transfer request not valid." };

        transfer.status = "Rejected";
        transfer.approvedBy = actionUser;
        this.saveTransfers(transfers);

        this.logActivity(actionUser, "Transfer Rejected", `Rejected transfer of ${transfer.assetName} to ${transfer.toEmployeeName}`);
        this.addNotification("Transfer Rejected", `Transfer request for ${transfer.assetName} was declined.`, "danger");

        return { success: true };
    },

    // 4. Overlap booking validation
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
            
            // Check overlaps
            // (StartA < EndB) and (EndA > StartB)
            return (startTime < b.endTime) && (endTime > b.startTime);
        });

        if (hasOverlap) {
            return { 
                success: false, 
                overlap: true, 
                message: "Overlap Error: The selected resource is already booked during this time slot." 
            };
        }

        // Add Booking
        const bookingId = `BK-${Date.now().toString().slice(-4)}`;
        const newBooking = {
            id: bookingId,
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

        this.logActivity(actionUser, "Resource Booking", `Booked ${asset.name} on ${date} (${startTime}-${endTime})`);
        this.addNotification("Booking Confirmed", `${asset.name} is booked for you on ${date} at ${startTime}.`, "success");

        return { success: true, booking: newBooking };
    },

    cancelBooking(bookingId, actionUser) {
        const bookings = this.getBookings();
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return { success: false, message: "Booking not found." };

        booking.status = "Cancelled";
        this.saveBookings(bookings);

        this.logActivity(actionUser, "Booking Cancelled", `Cancelled booking for ${booking.resourceName} on ${booking.date}`);
        this.addNotification("Booking Cancelled", `Booking for ${booking.resourceName} was cancelled.`, "info");

        return { success: true };
    },

    // 5. Maintenance management approval workflow
    raiseMaintenance(assetId, issueDescription, priority, employeeId, actionUser) {
        const assets = this.getAssets();
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return { success: false, message: "Asset not found." };

        const employees = this.getEmployees();
        const employee = employees.find(e => e.id === employeeId);

        const maintenanceList = this.getMaintenance();
        const maintenanceId = `MT-${Date.now().toString().slice(-4)}`;
        const newMaintenance = {
            id: maintenanceId,
            assetId: assetId,
            assetName: asset.name,
            issueDescription: issueDescription,
            priority: priority,
            raisedBy: employeeId,
            raisedByName: employee ? employee.name : actionUser,
            dateRaised: new Date().toISOString().split("T")[0],
            status: "Pending", // Pending -> Approved / Rejected -> In Progress -> Resolved
            technician: "",
            dateResolved: "",
            notes: ""
        };
        maintenanceList.unshift(newMaintenance);
        this.saveMaintenance(maintenanceList);

        // Add history to asset
        asset.history.unshift({
            date: new Date().toISOString().split("T")[0],
            action: "Maintenance Raised",
            user: actionUser,
            details: `Issue: ${issueDescription}. Priority: ${priority}`
        });
        this.saveAssets(assets);

        this.logActivity(actionUser, "Maintenance Raised", `Raised maintenance for ${asset.name} (${asset.id})`);
        this.addNotification("Maintenance Requested", `Maintenance ticket ${maintenanceId} raised for ${asset.name}.`, "warning");

        return { success: true, maintenance: newMaintenance };
    },

    approveMaintenance(maintenanceId, actionUser) {
        const maintenanceList = this.getMaintenance();
        const m = maintenanceList.find(x => x.id === maintenanceId);
        if (!m || m.status !== "Pending") return { success: false, message: "Ticket not eligible for approval." };

        m.status = "Approved";
        this.saveMaintenance(maintenanceList);

        // Update asset status to Under Maintenance
        const assets = this.getAssets();
        const asset = assets.find(a => a.id === m.assetId);
        if (asset) {
            asset.status = "Under Maintenance";
            asset.history.unshift({
                date: new Date().toISOString().split("T")[0],
                action: "Maintenance Approved",
                user: actionUser,
                details: `Ticket ${maintenanceId} approved. Status changed to Under Maintenance.`
            });
            this.saveAssets(assets);
        }

        this.logActivity(actionUser, "Maintenance Approved", `Approved maintenance request for ${m.assetName}`);
        this.addNotification("Maintenance Approved", `Maintenance request ${maintenanceId} approved.`, "info");

        return { success: true };
    },

    rejectMaintenance(maintenanceId, actionUser) {
        const maintenanceList = this.getMaintenance();
        const m = maintenanceList.find(x => x.id === maintenanceId);
        if (!m || m.status !== "Pending") return { success: false, message: "Ticket not eligible for rejection." };

        m.status = "Rejected";
        this.saveMaintenance(maintenanceList);

        const assets = this.getAssets();
        const asset = assets.find(a => a.id === m.assetId);
        if (asset) {
            asset.history.unshift({
                date: new Date().toISOString().split("T")[0],
                action: "Maintenance Rejected",
                user: actionUser,
                details: `Ticket ${maintenanceId} was rejected by manager.`
            });
            this.saveAssets(assets);
        }

        this.logActivity(actionUser, "Maintenance Rejected", `Rejected maintenance request for ${m.assetName}`);
        this.addNotification("Maintenance Rejected", `Maintenance request ${maintenanceId} was rejected.`, "danger");

        return { success: true };
    },

    assignMaintenanceTechnician(maintenanceId, technicianName, actionUser) {
        const maintenanceList = this.getMaintenance();
        const m = maintenanceList.find(x => x.id === maintenanceId);
        if (!m || (m.status !== "Approved" && m.status !== "In Progress")) {
            return { success: false, message: "Cannot assign technician to this ticket status." };
        }

        m.status = "In Progress";
        m.technician = technicianName;
        this.saveMaintenance(maintenanceList);

        this.logActivity(actionUser, "Technician Assigned", `Assigned technician ${technicianName} to maintenance ${maintenanceId}`);
        return { success: true };
    },

    resolveMaintenance(maintenanceId, notes, actionUser) {
        const maintenanceList = this.getMaintenance();
        const m = maintenanceList.find(x => x.id === maintenanceId);
        if (!m || m.status !== "In Progress") return { success: false, message: "Ticket must be In Progress to resolve." };

        m.status = "Resolved";
        m.dateResolved = new Date().toISOString().split("T")[0];
        m.notes = notes;
        this.saveMaintenance(maintenanceList);

        // Update asset back to Available or check current allocations
        const assets = this.getAssets();
        const asset = assets.find(a => a.id === m.assetId);
        if (asset) {
            asset.status = "Available";
            // Check if there is still a current active holder
            const allocations = this.getAllocations();
            const activeAlloc = allocations.find(al => al.assetId === m.assetId && al.status === "Active");
            if (activeAlloc) {
                asset.status = "Allocated";
            }
            asset.history.unshift({
                date: new Date().toISOString().split("T")[0],
                action: "Maintenance Resolved",
                user: actionUser,
                details: `Resolved by ${m.technician || "technician"}. Notes: ${notes}`
            });
            this.saveAssets(assets);
        }

        this.logActivity(actionUser, "Maintenance Resolved", `Resolved maintenance request ${maintenanceId} for ${m.assetName}`);
        this.addNotification("Maintenance Resolved", `Asset ${m.assetName} maintenance complete.`, "success");

        return { success: true };
    },

    // 6. Audit cycle handling
    createAuditCycle(name, scopeType, scopeValue, auditorIds, actionUser) {
        const employees = this.getEmployees();
        const auditors = employees.filter(e => auditorIds.includes(e.id));
        const auditorNames = auditors.map(e => e.name).join(", ") || "Unassigned";

        const assets = this.getAssets();
        let scopeAssets = [];
        if (scopeType === "Department") {
            // Find employee IDs in the department
            const deptEmps = employees.filter(e => e.departmentId === scopeValue).map(e => e.id);
            scopeAssets = assets.filter(a => deptEmps.includes(a.currentHolderId));
        } else if (scopeType === "Location") {
            scopeAssets = assets.filter(a => a.location === scopeValue);
        } else {
            scopeAssets = [...assets];
        }

        const auditItems = scopeAssets.map(a => ({
            assetId: a.id,
            assetName: a.name,
            tag: a.id,
            location: a.location,
            status: "Pending", // Pending, Verified, Missing, Damaged
            notes: ""
        }));

        const audits = this.getAudits();
        const auditId = `AU-${Date.now().toString().slice(-4)}`;
        const newAudit = {
            id: auditId,
            name: name,
            scopeType: scopeType,
            scopeValue: scopeValue,
            startDate: new Date().toISOString().split("T")[0],
            endDate: "",
            auditorIds: auditorIds,
            auditorNames: auditorNames,
            status: "Open", // Open -> Closed
            items: auditItems,
            discrepancies: []
        };
        audits.unshift(newAudit);
        this.saveAudits(audits);

        this.logActivity(actionUser, "Audit Created", `Created audit cycle ${name} (${auditId})`);
        this.addNotification("Audit Cycle Created", `New audit cycle ${name} is open.`, "info");

        return { success: true, audit: newAudit };
    },

    updateAuditItem(auditId, assetId, status, notes, actionUser) {
        const audits = this.getAudits();
        const audit = audits.find(a => a.id === auditId);
        if (!audit || audit.status !== "Open") return { success: false, message: "Audit cycle not open." };

        const item = audit.items.find(i => i.assetId === assetId);
        if (!item) return { success: false, message: "Asset item not found in this audit." };

        item.status = status;
        item.notes = notes;
        this.saveAudits(audits);

        this.logActivity(actionUser, "Audit Item Updated", `Audit ${auditId}: Marked ${item.assetName} as ${status}`);
        return { success: true };
    },

    closeAuditCycle(auditId, actionUser) {
        const audits = this.getAudits();
        const auditIndex = audits.findIndex(a => a.id === auditId);
        if (auditIndex === -1 || audits[auditIndex].status !== "Open") return { success: false, message: "Audit cycle not open." };

        const audit = audits[auditIndex];
        audit.status = "Closed";
        audit.endDate = new Date().toISOString().split("T")[0];

        // System auto-generates discrepancy report for flagged items
        // Also updates affected asset statuses (e.g. Lost for missing items, or Damaged note)
        const assets = this.getAssets();
        const discrepancies = [];

        audit.items.forEach(item => {
            const asset = assets.find(a => a.id === item.assetId);
            if (item.status === "Missing") {
                discrepancies.push({
                    assetId: item.assetId,
                    assetName: item.assetName,
                    issue: "Missing asset",
                    notes: item.notes
                });

                if (asset) {
                    asset.status = "Lost";
                    asset.history.unshift({
                        date: new Date().toISOString().split("T")[0],
                        action: "Audit Lost Flag",
                        user: "System",
                        details: `Flagged as Missing during Audit ${auditId}. Asset status updated to Lost.`
                    });
                }
            } else if (item.status === "Damaged") {
                discrepancies.push({
                    assetId: item.assetId,
                    assetName: item.assetName,
                    issue: "Damaged asset",
                    notes: item.notes
                });

                if (asset) {
                    asset.condition = "Fair";
                    asset.history.unshift({
                        date: new Date().toISOString().split("T")[0],
                        action: "Audit Condition Flag",
                        user: "System",
                        details: `Flagged as Damaged during Audit ${auditId}. Details: ${item.notes}`
                    });
                }
            }
        });

        audit.discrepancies = discrepancies;
        this.saveAudits(audits);
        this.saveAssets(assets);

        this.logActivity(actionUser, "Audit Closed", `Closed audit cycle ${audit.name}. Flags: ${discrepancies.length} discrepancies.`);
        
        if (discrepancies.length > 0) {
            this.addNotification("Audit Discrepancies Flagged", `Audit ${audit.name} closed with ${discrepancies.length} discrepancy issues flagged.`, "danger");
        } else {
            this.addNotification("Audit Cycle Closed", `Audit ${audit.name} completed successfully with no discrepancies.`, "success");
        }

        return { success: true, discrepancies };
    }
};
