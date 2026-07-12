/* ==========================================
   AssetFlow - Login & Signup Screen Component (Wireframe Aligned)
   ========================================== */

import { Store } from "../store.js";
import { checkAuthAndRoute, showToast } from "../app.js";

export function renderLogin(container) {
    container.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-card" style="padding: 30px;">
                <div style="border: 2px solid var(--color-gray-900); border-radius: var(--radius-md); padding: 8px 16px; font-weight:800; font-size:1.2rem; text-align:center; margin-bottom: 24px; color:var(--color-gray-900);">
                    AssetFlow – login
                </div>
                
                <div class="brand-circle">AF</div>
                
                <!-- Toggle between Login and Signup -->
                <div id="login-form-view">
                    <form id="login-form">
                        <div class="form-group">
                            <label for="login-email">Email</label>
                            <input type="email" id="login-email" class="form-control" placeholder="name@company.com" required value="employee@assetflow.com">
                        </div>
                        <div class="form-group" style="margin-bottom:12px;">
                            <label for="login-password">Password</label>
                            <input type="password" id="login-password" class="form-control" placeholder="**********" required value="password">
                            <div style="text-align:right; margin-top:6px;">
                                <button type="button" class="btn-text" id="forgot-pw-btn" style="font-size:0.8rem; color:var(--color-gray-600);">Forgot password</button>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 10px; border:2px solid var(--color-gray-900); background-color:var(--color-white); color:var(--color-gray-900); font-weight:700;">Sign In</button>
                    </form>
                    
                    <div style="margin: 20px 0; border-top: 1px solid var(--color-gray-400);"></div>
                    
                    <div class="form-footer" style="margin-top:0;">
                        <h4 style="font-size:0.9rem; text-align:left; color:var(--color-gray-800); margin-bottom:4px;">New here?</h4>
                        <div style="border:1px solid var(--color-gray-300); border-radius:var(--radius-md); padding:10px; font-size:0.8rem; color:var(--color-gray-600); text-align:left; margin-bottom:12px; line-height:1.4;">
                            Sign up creates an employee account admin roles assigned later
                        </div>
                        <button class="btn btn-secondary" id="go-signup-btn" style="width:100%; padding:10px; font-weight:600; border:2px solid var(--color-gray-900); color:var(--color-gray-900);">Create Account</button>
                    </div>
                </div>

                <div id="signup-form-view" class="hidden">
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
                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 10px; border:2px solid var(--color-gray-900); background-color:var(--color-white); color:var(--color-gray-900); font-weight:700;">Sign Up & Register</button>
                    </form>
                    
                    <div style="margin: 20px 0; border-top: 1px solid var(--color-gray-400);"></div>
                    
                    <div class="form-footer" style="margin-top:0;">
                        <button class="btn btn-secondary" id="go-login-btn" style="width:100%; padding:10px; font-weight:600; border:2px solid var(--color-gray-900); color:var(--color-gray-900);">Back to Login</button>
                    </div>
                </div>

                <!-- Helper Panel -->
                <div style="margin-top: 24px; padding: 12px; background-color: var(--color-gray-50); border: 1px dashed var(--color-gray-300); border-radius: var(--radius-md); font-size: 0.725rem;">
                    <div style="font-weight:700; color: var(--color-gray-700); margin-bottom: 4px;">Quick Credentials Helper:</div>
                    <div style="display:grid; grid-template-columns:1fr; gap:2px; color:var(--color-gray-600);">
                        <div>• <strong>Admin:</strong> admin@assetflow.com</div>
                        <div>• <strong>Asset Manager:</strong> manager@assetflow.com</div>
                        <div>• <strong>Employee:</strong> employee@assetflow.com</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Toggle scripts
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

    function loadSignupDepts() {
        const depts = Store.getDepartments().filter(d => d.status === "Active");
        const select = container.querySelector("#signup-dept");
        select.innerHTML = depts.map(d => `<option value="${d.id}">${d.name}</option>`).join("");
    }

    // Signin
    container.querySelector("#login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = container.querySelector("#login-email").value.trim().toLowerCase();
        const password = container.querySelector("#login-password").value;

        const employees = Store.getEmployees();
        const user = employees.find(emp => emp.email === email && emp.status === "Active");

        if (!user || user.password !== password) {
            showToast("Incorrect email or password.", "danger");
            return;
        }

        Store.setCurrentUser(user);
        showToast(`Logged in as ${user.name}`, "success");
        checkAuthAndRoute();
    });

    // Signup
    container.querySelector("#signup-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = container.querySelector("#signup-name").value.trim();
        const email = container.querySelector("#signup-email").value.trim().toLowerCase();
        const deptId = container.querySelector("#signup-dept").value;
        const password = container.querySelector("#signup-password").value;

        const employees = Store.getEmployees();
        if (employees.some(emp => emp.email === email)) {
            showToast("Email address already taken.", "danger");
            return;
        }

        const newEmpId = `EMP-${Date.now().toString().slice(-3)}`;
        const newEmp = {
            id: newEmpId,
            name: name,
            email: email,
            password: password,
            departmentId: deptId,
            role: "Employee",
            status: "Active"
        };

        employees.push(newEmp);
        Store.saveEmployees(employees);

        Store.logActivity(name, "Account Created", `Signed up as a new Employee.`);
        Store.addNotification("New Account Created", `${name} signed up as a new employee.`, "info");

        showToast("Registration successful!", "success");
        signupView.classList.add("hidden");
        loginView.classList.remove("hidden");
        container.querySelector("#login-email").value = email;
        container.querySelector("#login-password").value = password;
    });

    container.querySelector("#forgot-pw-btn").addEventListener("click", () => {
        showToast("Password recovery link sent (Simulation)", "info");
    });
}
