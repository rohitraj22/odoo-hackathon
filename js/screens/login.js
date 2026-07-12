/* ==========================================
   AssetFlow - Login & Signup Screen Component
   ========================================== */

import { Store } from "../store.js";
import { checkAuthAndRoute, showToast } from "../app.js";

export function renderLogin(container) {
    container.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-card">
                <div class="auth-logo">
                    <i data-lucide="layers"></i>
                    <span>Asset<span style="color: var(--color-primary-light);">Flow</span></span>
                </div>
                
                <!-- Toggle between Login and Signup -->
                <div id="login-form-view">
                    <div class="auth-header">
                        <h2>Welcome back</h2>
                        <p>Access your organization's AssetFlow dashboard</p>
                    </div>
                    
                    <form id="login-form">
                        <div class="form-group">
                            <label for="login-email">Email Address</label>
                            <input type="email" id="login-email" class="form-control" placeholder="name@company.com" required value="employee@assetflow.com">
                        </div>
                        <div class="form-group">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <label for="login-password" style="margin-bottom:0;">Password</label>
                                <button type="button" class="btn-text" id="forgot-pw-btn" style="font-size:0.775rem;">Forgot password?</button>
                            </div>
                            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required value="password">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 10px;">Sign In</button>
                    </form>
                    
                    <div class="form-footer">
                        <p style="font-size:0.85rem; color:var(--color-gray-500);">Don't have an account? <button class="btn-text" id="go-signup-btn">Create Employee Account</button></p>
                    </div>
                </div>

                <div id="signup-form-view" class="hidden">
                    <div class="auth-header">
                        <h2>Create Account</h2>
                        <p>Register as an Employee to request assets and resource bookings</p>
                    </div>
                    
                    <form id="signup-form">
                        <div class="form-group">
                            <label for="signup-name">Full Name</label>
                            <input type="text" id="signup-name" class="form-control" placeholder="Jane Doe" required>
                        </div>
                        <div class="form-group">
                            <label for="signup-email">Email Address</label>
                            <input type="email" id="signup-email" class="form-control" placeholder="jane.doe@company.com" required>
                        </div>
                        <div class="form-group">
                            <label for="signup-dept">Department</label>
                            <select id="signup-dept" class="form-control" required></select>
                        </div>
                        <div class="form-group">
                            <label for="signup-password">Password</label>
                            <input type="password" id="signup-password" class="form-control" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 10px;">Register</button>
                    </form>
                    
                    <div class="form-footer">
                        <p style="font-size:0.85rem; color:var(--color-gray-500);">Already have an account? <button class="btn-text" id="go-login-btn">Sign In</button></p>
                    </div>
                </div>

                <!-- Helper panel for hackathon reviewers -->
                <div style="margin-top: 30px; padding: 16px; background-color: var(--color-gray-50); border: 1px dashed var(--color-gray-300); border-radius: var(--radius-md); font-size: 0.775rem;">
                    <div style="font-weight:600; color: var(--color-gray-700); margin-bottom: 6px; display:flex; align-items:center; gap:4px;">
                        <i data-lucide="help-circle" style="width:14px; height:14px;"></i> Demo Credentials:
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; color:var(--color-gray-600);">
                        <div><strong>Admin:</strong> admin@assetflow.com</div>
                        <div><strong>Asset Manager:</strong> manager@assetflow.com</div>
                        <div><strong>Dept Head:</strong> head@assetflow.com</div>
                        <div><strong>Employee:</strong> employee@assetflow.com</div>
                    </div>
                    <div style="margin-top:8px; border-top: 1px solid var(--color-gray-200); padding-top:6px; color: var(--color-gray-500);">Password is <strong>password</strong> for all accounts.</div>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();

    // Set up view toggling
    const loginView = container.querySelector("#login-form-view");
    const signupView = container.querySelector("#signup-form-view");

    container.querySelector("#go-signup-btn").addEventListener("click", () => {
        loginView.classList.add("hidden");
        signupView.classList.remove("hidden");
        loadSignupDepts();
    });

    container.querySelector("#go-login-btn").addEventListener("click", () => {
        signupView.classList.add("hidden");
        loginView.classList.remove("hidden");
    });

    // Populate departments list for signup
    function loadSignupDepts() {
        const depts = Store.getDepartments().filter(d => d.status === "Active");
        const select = container.querySelector("#signup-dept");
        select.innerHTML = depts.map(d => `<option value="${d.id}">${d.name}</option>`).join("");
    }

    // Login Form Submit
    container.querySelector("#login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = container.querySelector("#login-email").value.trim().toLowerCase();
        const password = container.querySelector("#login-password").value;

        const employees = Store.getEmployees();
        const user = employees.find(emp => emp.email === email && emp.status === "Active");

        if (!user || user.password !== password) {
            showToast("Invalid email or password. Please try again.", "danger");
            return;
        }

        Store.setCurrentUser(user);
        showToast(`Welcome back, ${user.name}!`, "success");
        checkAuthAndRoute();
    });

    // Signup Form Submit (forces Employee role)
    container.querySelector("#signup-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = container.querySelector("#signup-name").value.trim();
        const email = container.querySelector("#signup-email").value.trim().toLowerCase();
        const deptId = container.querySelector("#signup-dept").value;
        const password = container.querySelector("#signup-password").value;

        const employees = Store.getEmployees();
        
        // Validation: email duplication
        if (employees.some(emp => emp.email === email)) {
            showToast("Email address already registered.", "danger");
            return;
        }

        // Create new employee
        const newEmpId = `EMP-${Date.now().toString().slice(-4)}`;
        const newEmp = {
            id: newEmpId,
            name: name,
            email: email,
            password: password,
            departmentId: deptId,
            role: "Employee", // Signup creates employee accounts ONLY
            status: "Active"
        };

        employees.push(newEmp);
        Store.saveEmployees(employees);

        Store.logActivity(name, "Account Created", `Signed up as a new Employee.`);
        Store.addNotification("New Account Created", `${name} signed up as a new employee.`, "info");

        showToast("Registration successful! You can now log in.", "success");
        
        // Auto fill and transition back to login
        signupView.classList.add("hidden");
        loginView.classList.remove("hidden");
        container.querySelector("#login-email").value = email;
        container.querySelector("#login-password").value = password;
    });

    // Forgot password simulation
    container.querySelector("#forgot-pw-btn").addEventListener("click", () => {
        const email = container.querySelector("#login-email").value.trim();
        if (!email) {
            showToast("Please enter your email address in the email field first.", "warning");
            return;
        }
        showToast(`Password recovery link sent to ${email} (Simulation)`, "info");
    });
}
