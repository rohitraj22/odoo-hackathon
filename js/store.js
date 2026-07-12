/* ===================================================
   AssetFlow Central Store - Local-first data layer
   =================================================== */

const API_BASE = "http://localhost:8000/api";
const USE_REMOTE_API = true;

const STORAGE_KEYS = {
    currentUser: "assetflow_current_user",
    employees: "assetflow_employees",
    departments: "assetflow_departments",
    categories: "assetflow_categories",
    assets: "assetflow_assets",
    allocations: "assetflow_allocations",
    bookings: "assetflow_bookings",
    maintenance: "assetflow_maintenance",
    audits: "assetflow_audits",
    logs: "assetflow_logs",
    notifications: "assetflow_notifications"
};

const DEFAULT_DATA = {
    departments: [
        { id: "dept-admin", name: "Administration", parentId: null, headId: "emp-admin", headName: "System Admin", status: "Active" },
        { id: "dept-it", name: "IT Services", parentId: "dept-admin", headId: "emp-head", headName: "Raj Patel", status: "Active" },
        { id: "dept-ops", name: "Operations", parentId: null, headId: "emp-manager", headName: "Priya Sharma", status: "Active" },
        { id: "dept-hr", name: "People & Culture", parentId: null, headId: null, headName: null, status: "Active" }
    ],
    employees: [
        { id: "emp-admin", name: "System Admin", email: "admin@assetflow.com", password: "password", departmentId: "dept-admin", role: "Admin", status: "Active" },
        { id: "emp-manager", name: "Priya Sharma", email: "manager@assetflow.com", password: "password", departmentId: "dept-ops", role: "Asset Manager", status: "Active" },
        { id: "emp-head", name: "Raj Patel", email: "head@assetflow.com", password: "password", departmentId: "dept-hr", role: "Department Head", status: "Active" },
        { id: "emp-employee", name: "John Doe", email: "employee@assetflow.com", password: "password", departmentId: "dept-it", role: "Employee", status: "Active" }
    ],
    categories: [
        { id: "cat-it", name: "IT Equipment", customFields: [{ name: "Warranty", type: "number" }] },
        { id: "cat-furniture", name: "Furniture", customFields: [{ name: "Material", type: "text" }] },
        { id: "cat-facility", name: "Facility", customFields: [] }
    ],
    assets: [
        { id: "AF-1001", name: "MacBook Pro 14", categoryId: "cat-it", serialNumber: "MBP-001", acquisitionDate: "2026-01-12", acquisitionCost: 2400, condition: "Good", location: "HQ - IT Storage", isShared: false, bookable: false, status: "Available", currentHolderId: null, customData: {} },
        { id: "AF-1002", name: "Conference Room Projector", categoryId: "cat-it", serialNumber: "PRJ-010", acquisitionDate: "2026-02-08", acquisitionCost: 1200, condition: "Good", location: "HQ - Meeting Room 2", isShared: true, bookable: true, status: "Available", currentHolderId: null, customData: {} },
        { id: "AF-1003", name: "Ergonomic Desk Chair", categoryId: "cat-furniture", serialNumber: "CHR-205", acquisitionDate: "2025-11-21", acquisitionCost: 180, condition: "Good", location: "HQ - Floor 3", isShared: false, bookable: false, status: "Allocated", currentHolderId: "emp-employee", customData: {} },
        { id: "AF-1004", name: "Main Lobby AC Unit", categoryId: "cat-facility", serialNumber: "FAC-044", acquisitionDate: "2025-09-10", acquisitionCost: 3200, condition: "Needs Service", location: "HQ - Lobby", isShared: false, bookable: false, status: "Under Maintenance", currentHolderId: null, customData: {} }
    ],
    allocations: [
        { id: "AL-1001", assetId: "AF-1003", employeeId: "emp-employee", departmentId: "dept-it", allocationDate: "2026-06-28", expectedReturnDate: null, actualReturnDate: null, conditionOnAllocation: "Good", returnNotes: null, status: "Active" }
    ],
    bookings: [
        { id: "BK-1001", resourceId: "AF-1002", employeeId: "emp-employee", date: "2026-07-18", startTime: "10:00", endTime: "11:00", status: "Upcoming" }
    ],
    maintenance: [
        { id: "MT-1001", assetId: "AF-1004", issueDescription: "Cooling output is unstable after routine inspection.", priority: "High", employeeId: "emp-manager", status: "Pending", technician: null, notes: null, createdAt: "2026-07-10" }
    ],
    audits: [
        { id: "AU-1001", name: "Q3 Asset Verification", scopeType: "Department", scopeValue: "dept-it", auditorIds: ["emp-head"], status: "Open", createdAt: "2026-07-01", items: [] }
    ],
    logs: [
        { id: "LG-1001", timestamp: "2026-07-11T09:00:00.000Z", user: "System Admin", action: "Seeded workspace", details: "Local starter data initialized.", type: "info" }
    ],
    notifications: [
        { id: "NT-1001", title: "Welcome", message: "Your local AssetFlow workspace is ready.", type: "info", read: false, userId: null, createdAt: "2026-07-11T09:00:00.000Z" }
    ]
};

function apiCall(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (body) options.body = JSON.stringify(body);

    return fetch(`${API_BASE}${endpoint}`, options)
        .then(async (response) => {
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                return { success: false, status: response.status, message: data.detail || "API Error" };
            }
            return { success: true, data };
        })
        .catch((error) => {
            console.error(`API Call failed (${method} ${endpoint}):`, error);
            return { success: false, message: "Network error connecting to the server." };
        });
}

function safeParseList(value, fallback) {
    try {
        const parsed = value ? JSON.parse(value) : null;
        return Array.isArray(parsed) ? parsed : structuredClone(fallback);
    } catch {
        return structuredClone(fallback);
    }
}

function safeParseObject(value, fallback = null) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function writeList(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function normalizeDepartment(dept) {
    if (!dept) return dept;
    return {
        id: dept.id,
        name: dept.name ?? dept.title ?? "",
        parentId: dept.parentId ?? dept.parent_id ?? null,
        headId: dept.headId ?? dept.head_id ?? null,
        headName: dept.headName ?? dept.head_name ?? null,
        status: dept.status ?? "Active"
    };
}

function normalizeEmployee(employee) {
    if (!employee) return employee;
    return {
        id: employee.id,
        name: employee.name ?? "",
        email: employee.email ?? "",
        password: employee.password ?? employee.hashed_password ?? "",
        departmentId: employee.departmentId ?? employee.department_id ?? null,
        role: employee.role ?? "Employee",
        status: employee.status ?? "Active"
    };
}

function normalizeCategory(category) {
    if (!category) return category;
    return {
        id: category.id,
        name: category.name ?? "",
        customFields: category.customFields ?? category.custom_fields ?? []
    };
}

function normalizeAsset(asset) {
    if (!asset) return asset;
    const isShared = asset.isShared ?? asset.is_shared ?? false;
    return {
        id: asset.id,
        name: asset.name ?? "",
        categoryId: asset.categoryId ?? asset.category_id ?? null,
        serialNumber: asset.serialNumber ?? asset.serial_number ?? "",
        acquisitionDate: asset.acquisitionDate ?? asset.acquisition_date ?? null,
        acquisitionCost: asset.acquisitionCost ?? asset.acquisition_cost ?? 0,
        condition: asset.condition ?? "Good",
        location: asset.location ?? "",
        isShared,
        bookable: asset.bookable ?? isShared,
        status: asset.status ?? "Available",
        currentHolderId: asset.currentHolderId ?? asset.current_holder_id ?? null,
        customData: asset.customData ?? asset.custom_data ?? {}
    };
}

function normalizeAllocation(allocation) {
    if (!allocation) return allocation;
    return {
        id: allocation.id,
        assetId: allocation.assetId ?? allocation.asset_id ?? null,
        employeeId: allocation.employeeId ?? allocation.employee_id ?? null,
        departmentId: allocation.departmentId ?? allocation.department_id ?? null,
        allocationDate: allocation.allocationDate ?? allocation.allocation_date ?? null,
        expectedReturnDate: allocation.expectedReturnDate ?? allocation.expected_return_date ?? null,
        actualReturnDate: allocation.actualReturnDate ?? allocation.actual_return_date ?? null,
        conditionOnAllocation: allocation.conditionOnAllocation ?? allocation.condition_on_allocation ?? "Good",
        returnNotes: allocation.returnNotes ?? allocation.return_notes ?? null,
        status: allocation.status ?? "Active"
    };
}

function normalizeBooking(booking) {
    if (!booking) return booking;
    return {
        id: booking.id,
        resourceId: booking.resourceId ?? booking.resource_id ?? null,
        employeeId: booking.employeeId ?? booking.employee_id ?? null,
        date: booking.date ?? null,
        startTime: booking.startTime ?? booking.start_time ?? null,
        endTime: booking.endTime ?? booking.end_time ?? null,
        status: booking.status ?? "Upcoming"
    };
}

function normalizeMaintenance(ticket) {
    if (!ticket) return ticket;
    return {
        id: ticket.id,
        assetId: ticket.assetId ?? ticket.asset_id ?? null,
        issueDescription: ticket.issueDescription ?? ticket.issue_description ?? "",
        priority: ticket.priority ?? "Medium",
        employeeId: ticket.employeeId ?? ticket.employee_id ?? null,
        status: ticket.status ?? "Pending",
        technician: ticket.technician ?? null,
        notes: ticket.notes ?? null,
        createdAt: ticket.createdAt ?? ticket.created_at ?? null
    };
}

function normalizeAudit(audit) {
    if (!audit) return audit;
    return {
        id: audit.id,
        name: audit.name ?? "",
        scopeType: audit.scopeType ?? audit.scope_type ?? "",
        scopeValue: audit.scopeValue ?? audit.scope_value ?? "",
        auditorIds: audit.auditorIds ?? audit.auditor_ids ?? [],
        status: audit.status ?? "Open",
        createdAt: audit.createdAt ?? audit.created_at ?? null,
        items: audit.items ?? []
    };
}

function normalizeLog(logEntry) {
    if (!logEntry) return logEntry;
    return {
        id: logEntry.id,
        timestamp: logEntry.timestamp ?? new Date().toISOString(),
        user: logEntry.user ?? "System",
        action: logEntry.action ?? "",
        details: logEntry.details ?? "",
        type: logEntry.type ?? "info"
    };
}

function normalizeNotification(notification) {
    if (!notification) return notification;
    return {
        id: notification.id,
        title: notification.title ?? "",
        message: notification.message ?? "",
        type: notification.type ?? "info",
        read: Boolean(notification.read),
        userId: notification.userId ?? notification.user_id ?? null,
        createdAt: notification.createdAt ?? notification.created_at ?? new Date().toISOString()
    };
}

function toDepartmentPayload(department) {
    return {
        id: department.id,
        name: department.name,
        parent_id: department.parentId ?? department.parent_id ?? null,
        head_id: department.headId ?? department.head_id ?? null,
        head_name: department.headName ?? department.head_name ?? null,
        status: department.status ?? "Active"
    };
}

function toEmployeePayload(employee) {
    return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        password: employee.password,
        department_id: employee.departmentId ?? employee.department_id ?? null,
        role: employee.role ?? "Employee",
        status: employee.status ?? "Active"
    };
}

function toCategoryPayload(category) {
    return {
        id: category.id,
        name: category.name,
        custom_fields: category.customFields ?? category.custom_fields ?? []
    };
}

function toAssetPayload(asset) {
    return {
        id: asset.id,
        name: asset.name,
        category_id: asset.categoryId ?? asset.category_id,
        serial_number: asset.serialNumber ?? asset.serial_number,
        acquisition_date: asset.acquisitionDate ?? asset.acquisition_date ?? null,
        acquisition_cost: asset.acquisitionCost ?? asset.acquisition_cost ?? 0,
        condition: asset.condition ?? "Good",
        location: asset.location,
        is_shared: asset.isShared ?? asset.is_shared ?? false,
        bookable: asset.bookable ?? false,
        status: asset.status ?? "Available",
        current_holder_id: asset.currentHolderId ?? asset.current_holder_id ?? null,
        current_holder_name: asset.currentHolderName ?? asset.current_holder_name ?? null,
        expected_return_date: asset.expectedReturnDate ?? asset.expected_return_date ?? null,
        custom_data: asset.customData ?? asset.custom_data ?? {},
        history: asset.history ?? []
    };
}

function toAllocationPayload(allocation) {
    return {
        id: allocation.id,
        asset_id: allocation.assetId ?? allocation.asset_id,
        asset_name: allocation.assetName ?? allocation.asset_name ?? null,
        employee_id: allocation.employeeId ?? allocation.employee_id,
        holder_name: allocation.holderName ?? allocation.holder_name ?? null,
        department_id: allocation.departmentId ?? allocation.department_id ?? null,
        department: allocation.department ?? null,
        allocation_date: allocation.allocationDate ?? allocation.allocation_date ?? null,
        expected_return_date: allocation.expectedReturnDate ?? allocation.expected_return_date ?? null,
        actual_return_date: allocation.actualReturnDate ?? allocation.actual_return_date ?? null,
        condition_on_allocation: allocation.conditionOnAllocation ?? allocation.condition_on_allocation ?? "Good",
        return_notes: allocation.returnNotes ?? allocation.return_notes ?? null,
        status: allocation.status ?? "Active"
    };
}

function toTransferPayload(transfer) {
    return {
        id: transfer.id,
        asset_id: transfer.assetId ?? transfer.asset_id,
        asset_name: transfer.assetName ?? transfer.asset_name ?? null,
        from_id: transfer.fromId ?? transfer.from_id ?? null,
        from_name: transfer.fromName ?? transfer.from_name ?? null,
        to_id: transfer.toId ?? transfer.to_id ?? null,
        to_name: transfer.toName ?? transfer.to_name ?? null,
        reason: transfer.reason ?? null,
        date: transfer.date ?? null,
        status: transfer.status ?? "Pending"
    };
}

function toBookingPayload(booking) {
    return {
        id: booking.id,
        resource_id: booking.resourceId ?? booking.resource_id,
        asset_name: booking.assetName ?? booking.asset_name ?? null,
        employee_id: booking.employeeId ?? booking.employee_id,
        booked_by_name: booking.bookedByName ?? booking.booked_by_name ?? null,
        date: booking.date,
        start_time: booking.startTime ?? booking.start_time,
        end_time: booking.endTime ?? booking.end_time,
        notes: booking.notes ?? null,
        status: booking.status ?? "Upcoming"
    };
}

function toMaintenancePayload(ticket) {
    return {
        id: ticket.id,
        asset_id: ticket.assetId ?? ticket.asset_id,
        asset_name: ticket.assetName ?? ticket.asset_name ?? null,
        issue_description: ticket.issueDescription ?? ticket.issue_description,
        priority: ticket.priority ?? "Medium",
        employee_id: ticket.employeeId ?? ticket.employee_id ?? null,
        reported_by_name: ticket.reportedByName ?? ticket.reported_by_name ?? null,
        reported_date: ticket.reportedDate ?? ticket.reported_date ?? null,
        status: ticket.status ?? "Pending",
        technician_id: ticket.technicianId ?? ticket.technician_id ?? null,
        technician_name: ticket.technicianName ?? ticket.technician_name ?? null,
        notes: ticket.notes ?? [],
        resolved_date: ticket.resolvedDate ?? ticket.resolved_date ?? null
    };
}

function toAuditPayload(audit) {
    return {
        id: audit.id,
        name: audit.name,
        scope_type: audit.scopeType ?? audit.scope_type,
        scope_value: audit.scopeValue ?? audit.scope_value,
        auditor_ids: audit.auditorIds ?? audit.auditor_ids ?? [],
        status: audit.status ?? "Open",
        created_at: audit.createdAt ?? audit.created_at ?? null,
        items: audit.items ?? []
    };
}

function toLogPayload(entry) {
    return {
        id: entry.id,
        timestamp: entry.timestamp,
        user: entry.user,
        action: entry.action,
        details: entry.details,
        type: entry.type ?? "info"
    };
}

function toNotificationPayload(entry) {
    return {
        id: entry.id,
        title: entry.title,
        message: entry.message,
        type: entry.type ?? "info",
        read: Boolean(entry.read),
        user_id: entry.userId ?? entry.user_id ?? null,
        created_at: entry.createdAt ?? entry.created_at ?? null
    };
}

function bootstrapLocalData() {
    const seedMap = {
        [STORAGE_KEYS.departments]: DEFAULT_DATA.departments,
        [STORAGE_KEYS.employees]: DEFAULT_DATA.employees,
        [STORAGE_KEYS.categories]: DEFAULT_DATA.categories,
        [STORAGE_KEYS.assets]: DEFAULT_DATA.assets,
        [STORAGE_KEYS.allocations]: DEFAULT_DATA.allocations,
        [STORAGE_KEYS.bookings]: DEFAULT_DATA.bookings,
        [STORAGE_KEYS.maintenance]: DEFAULT_DATA.maintenance,
        [STORAGE_KEYS.audits]: DEFAULT_DATA.audits,
        [STORAGE_KEYS.logs]: DEFAULT_DATA.logs,
        [STORAGE_KEYS.notifications]: DEFAULT_DATA.notifications
    };

    Object.entries(seedMap).forEach(([key, value]) => {
        if (localStorage.getItem(key) === null) {
            localStorage.setItem(key, JSON.stringify(value));
        }
    });
}

bootstrapLocalData();

export const Store = {
    getCurrentUser() {
        return normalizeEmployee(safeParseObject(localStorage.getItem(STORAGE_KEYS.currentUser), null));
    },

    setCurrentUser(user) {
        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(normalizeEmployee(user)));
    },

    async login(email, password) {
        // Try API first
        const res = await apiCall("/login", "POST", { email, password });
        if (res.success) {
            const user = res.data.user || res.data;
            if (user) this.setCurrentUser(user);
            return { success: true, data: res.data };
        }

        // Fallback: check local employees
        const employees = this.getEmployees();
        const user = employees.find(emp => emp.email === email && emp.password === password && emp.status === "Active");
        if (user) {
            this.setCurrentUser(user);
            return { success: true, data: { user, access_token: "local", token_type: "bearer" } };
        }

        return { success: false, message: "Invalid email or password. Please try again." };
    },

    async signup(payload) {
        // Try API first
        const res = await apiCall("/signup", "POST", payload);
        if (res.success) {
            const employee = normalizeEmployee(res.data);
            const employees = this.getEmployees();
            if (!employees.some(item => item.id === employee.id)) {
                employees.push({ ...employee, password: payload.password });
                this.saveEmployees(employees);
            }
            return { success: true, data: employee };
        }

        // Fallback: save locally if API is unreachable
        if (!res.success && res.message === "Network error connecting to the server.") {
            const employees = this.getEmployees();
            const existing = employees.find(emp => emp.email === payload.email);
            if (existing) {
                return { success: false, message: "Email address already registered." };
            }
            const empId = `emp-${Date.now()}`;
            const newEmployee = normalizeEmployee({
                id: empId,
                name: payload.name,
                email: payload.email,
                password: payload.password,
                departmentId: payload.department_id,
                role: "Employee",
                status: "Active"
            });
            employees.push(newEmployee);
            this.saveEmployees(employees);
            return { success: true, data: newEmployee };
        }

        return res;
    },

    async resetPassword(email, password) {
        // Try API first
        const res = await apiCall("/reset-password", "POST", { email, password });
        if (res.success) return res;

        // Fallback: update locally if API is unreachable
        if (!res.success && res.message === "Network error connecting to the server.") {
            const employees = this.getEmployees();
            const user = employees.find(emp => emp.email === email);
            if (!user) {
                return { success: false, message: "User not found" };
            }
            user.password = password;
            this.saveEmployees(employees);
            return { success: true, message: "Password updated locally." };
        }

        return res;
    },

    getDepartments() {
        return safeParseList(localStorage.getItem(STORAGE_KEYS.departments), DEFAULT_DATA.departments).map(normalizeDepartment);
    },

    async saveDepartments(list) {
        const normalized = list.map(normalizeDepartment);
        writeList(STORAGE_KEYS.departments, normalized);
        await apiCall("/departments", "PUT", normalized.map(toDepartmentPayload));
    },

    getEmployees() {
        return safeParseList(localStorage.getItem(STORAGE_KEYS.employees), DEFAULT_DATA.employees).map(normalizeEmployee);
    },

    async saveEmployees(list) {
        const normalized = list.map(normalizeEmployee);
        writeList(STORAGE_KEYS.employees, normalized);
        await apiCall("/employees", "PUT", normalized.map(toEmployeePayload));
    },

    getCategories() {
        return safeParseList(localStorage.getItem(STORAGE_KEYS.categories), DEFAULT_DATA.categories).map(normalizeCategory);
    },

    async saveCategories(list) {
        const normalized = list.map(normalizeCategory);
        writeList(STORAGE_KEYS.categories, normalized);
        await apiCall("/categories", "PUT", normalized.map(toCategoryPayload));
    },

    getAssets() {
        return safeParseList(localStorage.getItem(STORAGE_KEYS.assets), DEFAULT_DATA.assets).map(normalizeAsset);
    },

    async saveAssets(list) {
        const normalized = list.map(normalizeAsset);
        writeList(STORAGE_KEYS.assets, normalized);
        await apiCall("/assets", "PUT", normalized.map(toAssetPayload));
    },

    getAllocations() {
        return safeParseList(localStorage.getItem(STORAGE_KEYS.allocations), DEFAULT_DATA.allocations).map(normalizeAllocation);
    },

    async saveAllocations(list) {
        const normalized = list.map(normalizeAllocation);
        writeList(STORAGE_KEYS.allocations, normalized);
        await apiCall("/allocations", "PUT", normalized.map(toAllocationPayload));
    },

    getBookings() {
        return safeParseList(localStorage.getItem(STORAGE_KEYS.bookings), DEFAULT_DATA.bookings).map(normalizeBooking);
    },

    async saveBookings(list) {
        const normalized = list.map(normalizeBooking);
        writeList(STORAGE_KEYS.bookings, normalized);
        await apiCall("/bookings", "PUT", normalized.map(toBookingPayload));
    },

    getMaintenance() {
        return safeParseList(localStorage.getItem(STORAGE_KEYS.maintenance), DEFAULT_DATA.maintenance).map(normalizeMaintenance);
    },

    async saveMaintenance(list) {
        const normalized = list.map(normalizeMaintenance);
        writeList(STORAGE_KEYS.maintenance, normalized);
        await apiCall("/maintenance", "PUT", normalized.map(toMaintenancePayload));
    },

    getAudits() {
        return safeParseList(localStorage.getItem(STORAGE_KEYS.audits), DEFAULT_DATA.audits).map(normalizeAudit);
    },

    async saveAudits(list) {
        const normalized = list.map(normalizeAudit);
        writeList(STORAGE_KEYS.audits, normalized);
        await apiCall("/audits", "PUT", normalized.map(toAuditPayload));
    },

    getLogs() {
        return safeParseList(localStorage.getItem(STORAGE_KEYS.logs), DEFAULT_DATA.logs).map(normalizeLog);
    },

    async saveLogs(list) {
        const normalized = list.map(normalizeLog);
        writeList(STORAGE_KEYS.logs, normalized);
        await apiCall("/logs", "PUT", normalized.map(toLogPayload));
    },

    getNotifications() {
        return safeParseList(localStorage.getItem(STORAGE_KEYS.notifications), DEFAULT_DATA.notifications).map(normalizeNotification);
    },

    async saveNotifications(list) {
        const normalized = list.map(normalizeNotification);
        writeList(STORAGE_KEYS.notifications, normalized);
        await apiCall("/notifications", "PUT", normalized.map(toNotificationPayload));
    },

    async fetchEmployees() {
        const res = await apiCall("/employees");
        return res.success && Array.isArray(res.data) && res.data.length > 0 ? res.data.map(normalizeEmployee) : this.getEmployees();
    },

    async fetchDepartments() {
        const res = await apiCall("/departments");
        return res.success && Array.isArray(res.data) && res.data.length > 0 ? res.data.map(normalizeDepartment) : this.getDepartments();
    },

    async fetchCategories() {
        const res = await apiCall("/categories");
        return res.success && Array.isArray(res.data) && res.data.length > 0 ? res.data.map(normalizeCategory) : this.getCategories();
    },

    async fetchAssets() {
        const res = await apiCall("/assets");
        return res.success && Array.isArray(res.data) && res.data.length > 0 ? res.data.map(normalizeAsset) : this.getAssets();
    },

    async fetchAllocations() {
        const res = await apiCall("/allocations");
        return res.success && Array.isArray(res.data) && res.data.length > 0 ? res.data.map(normalizeAllocation) : this.getAllocations();
    },

    async fetchTransfers() {
        const res = await apiCall("/transfers");
        return res.success ? res.data : [];
    },

    async fetchBookings() {
        const res = await apiCall("/bookings");
        return res.success && Array.isArray(res.data) && res.data.length > 0 ? res.data.map(normalizeBooking) : this.getBookings();
    },

    async fetchMaintenance() {
        const res = await apiCall("/maintenance");
        return res.success && Array.isArray(res.data) && res.data.length > 0 ? res.data.map(normalizeMaintenance) : this.getMaintenance();
    },

    async fetchAudits() {
        const res = await apiCall("/audits");
        return res.success && Array.isArray(res.data) && res.data.length > 0 ? res.data.map(normalizeAudit) : this.getAudits();
    },

    async fetchLogs() {
        const res = await apiCall("/logs");
        return res.success && Array.isArray(res.data) && res.data.length > 0 ? res.data.map(normalizeLog) : this.getLogs();
    },

    async fetchNotifications(userId) {
        const res = await apiCall(`/notifications?user_id=${userId}`);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const items = res.data.map(normalizeNotification);
            return userId ? items.filter(notification => !notification.userId || notification.userId === userId) : items;
        }
        return this.getNotifications().filter(notification => !userId || !notification.userId || notification.userId === userId);
    },

    async getActivity() {
        return this.fetchLogs();
    },

    async logActivity(user, action, details) {
        const logs = this.getLogs();
        const entry = normalizeLog({
            id: `LG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: typeof user === "string" ? user : user?.name ?? "System",
            action,
            details,
            type: "info"
        });
        this.saveLogs([entry, ...logs]);
        return apiCall("/logs", "POST", { user, action, details });
    },

    async addNotification(title, message, type = "info", userId = null) {
        const notifications = this.getNotifications();
        const entry = normalizeNotification({
            id: `NT-${Date.now()}`,
            title,
            message,
            type,
            read: false,
            userId,
            createdAt: new Date().toISOString()
        });
        this.saveNotifications([entry, ...notifications]);
        await apiCall("/notifications", "POST", toNotificationPayload(entry));
        window.dispatchEvent(new Event("new-notification"));
        return entry;
    },

    async allocateAsset(assetId, employeeId, departmentId, expectedReturnDate, conditionOnAllocation, actionUser) {
        const res = await apiCall("/allocations/allocate", "POST", {
            asset_id: assetId,
            employee_id: employeeId,
            department_id: departmentId,
            expected_return_date: expectedReturnDate,
            condition: conditionOnAllocation,
            action_user: actionUser
        });

        if (!res.success && res.status === 409) {
            return { success: false, conflict: true, message: res.message };
        }
        return res;
    },

    async returnAsset(assetId, conditionOnReturn, returnNotes, actionUser) {
        return apiCall("/allocations/return", "POST", {
            asset_id: assetId,
            condition: conditionOnReturn,
            notes: returnNotes,
            action_user: actionUser
        });
    },

    async requestTransfer(assetId, targetEmployeeId, actionUser) {
        return apiCall("/transfers/request", "POST", {
            asset_id: assetId,
            target_employee_id: targetEmployeeId,
            action_user: actionUser
        });
    },

    async approveTransfer(transferId, actionUser) {
        return apiCall(`/transfers/${transferId}/approve`, "POST", { action_user: actionUser });
    },

    async rejectTransfer(transferId, actionUser) {
        return apiCall(`/transfers/${transferId}/reject`, "POST", { action_user: actionUser });
    },

    async bookResource(resourceId, employeeId, date, startTime, endTime, actionUser) {
        const res = await apiCall("/bookings", "POST", {
            resource_id: resourceId,
            employee_id: employeeId,
            date,
            start_time: startTime,
            end_time: endTime,
            action_user: actionUser
        });

        if (!res.success && res.status === 409) {
            return { success: false, overlap: true, message: res.message };
        }
        return res;
    },

    async cancelBooking(bookingId, actionUser) {
        return apiCall(`/bookings/${bookingId}/cancel`, "POST", { action_user: actionUser });
    },

    async raiseMaintenance(assetId, issueDescription, priority, employeeId, actionUser) {
        return apiCall("/maintenance", "POST", {
            asset_id: assetId,
            issue_description: issueDescription,
            priority,
            employee_id: employeeId,
            action_user: actionUser
        });
    },

    async updateMaintenanceStatus(maintenanceId, status, technician, resolutionNotes, actionUser) {
        return apiCall(`/maintenance/${maintenanceId}`, "PUT", {
            status,
            technician,
            notes: resolutionNotes,
            action_user: actionUser
        });
    },

    async createAuditCycle(name, scopeType, scopeValue, auditorIds, actionUser) {
        return apiCall("/audits", "POST", {
            name,
            scope_type: scopeType,
            scope_value: scopeValue,
            auditor_ids: auditorIds,
            action_user: actionUser
        });
    },

    async updateAuditItem(auditId, assetId, status, notes, actionUser) {
        return apiCall(`/audits/${auditId}/items/${assetId}`, "PUT", {
            status,
            notes,
            action_user: actionUser
        });
    },

    async closeAuditCycle(auditId, actionUser) {
        return apiCall(`/audits/${auditId}/close`, "POST", { action_user: actionUser });
    }
};