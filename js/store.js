/* ===================================================
   AssetFlow Central Store - API Client (Backend Connected)
   =================================================== */

const API_BASE = "http://localhost:8000/api";

// Helper function for API requests
async function apiCall(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${localStorage.getItem("assetflow_token")}` // For future JWT auth
        }
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            return { success: false, status: response.status, message: data.detail || "API Error" };
        }
        return { success: true, data };
    } catch (error) {
        console.error(`API Call failed (${method} ${endpoint}):`, error);
        return { success: false, message: "Network error connecting to the server." };
    }
}

export const Store = {
    // ==========================================
    // Local Session Management (Kept in LocalStorage)
    // ==========================================
    getCurrentUser() {
        const val = localStorage.getItem("assetflow_current_user");
        return val ? JSON.parse(val) : null;
    },

    setCurrentUser(user) {
        localStorage.setItem("assetflow_current_user", JSON.stringify(user));
    },

    // ==========================================
    // Data Fetching (GET Requests)
    // ==========================================
    async fetchEmployees() {
        const res = await apiCall("/employees");
        return res.success ? res.data : [];
    },

    async fetchDepartments() {
        const res = await apiCall("/departments");
        return res.success ? res.data : [];
    },

    async fetchCategories() {
        const res = await apiCall("/categories");
        return res.success ? res.data : [];
    },

    async fetchAssets() {
        const res = await apiCall("/assets");
        return res.success ? res.data : [];
    },

    async fetchAllocations() {
        const res = await apiCall("/allocations");
        return res.success ? res.data : [];
    },

    async fetchTransfers() {
        const res = await apiCall("/transfers");
        return res.success ? res.data : [];
    },

    async fetchBookings() {
        const res = await apiCall("/bookings");
        return res.success ? res.data : [];
    },

    async fetchMaintenance() {
        const res = await apiCall("/maintenance");
        return res.success ? res.data : [];
    },

    async fetchAudits() {
        const res = await apiCall("/audits");
        return res.success ? res.data : [];
    },

    async fetchLogs() {
        const res = await apiCall("/logs");
        return res.success ? res.data : [];
    },

    async fetchNotifications(userId) {
        const res = await apiCall(`/notifications?user_id=${userId}`);
        return res.success ? res.data : [];
    },

    // Alias for logs (used by Notifications screen)
    async getActivity() {
        return this.fetchLogs();
    },

    // ==========================================
    // Business Logic Actions (POST/PUT Requests)
    // ==========================================

    async logActivity(user, action, details) {
        return apiCall("/logs", "POST", { user, action, details });
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

        // Map 409 conflict to frontend expectations
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
            date: date,
            start_time: startTime,
            end_time: endTime,
            action_user: actionUser
        });

        // Map 409 conflict to frontend expectations
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
            priority: priority,
            employee_id: employeeId,
            action_user: actionUser
        });
    },

    async updateMaintenanceStatus(maintenanceId, status, technician, resolutionNotes, actionUser) {
        return apiCall(`/maintenance/${maintenanceId}`, "PUT", {
            status: status,
            technician: technician,
            notes: resolutionNotes,
            action_user: actionUser
        });
    },

    async createAuditCycle(name, scopeType, scopeValue, auditorIds, actionUser) {
        return apiCall("/audits", "POST", {
            name: name,
            scope_type: scopeType,
            scope_value: scopeValue,
            auditor_ids: auditorIds,
            action_user: actionUser
        });
    },

    async updateAuditItem(auditId, assetId, status, notes, actionUser) {
        return apiCall(`/audits/${auditId}/items/${assetId}`, "PUT", {
            status: status,
            notes: notes,
            action_user: actionUser
        });
    },

    async closeAuditCycle(auditId, actionUser) {
        return apiCall(`/audits/${auditId}/close`, "POST", { action_user: actionUser });
    }
};