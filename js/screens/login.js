/* ==========================================
   AssetFlow - Login & Signup Screen Component
   ========================================== */

import { Store } from "../store.js";
import { checkAuthAndRoute, showToast } from "../app.js";

export function renderLogin(container) {
    let recoveryEmail = "";

    container.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-container-card">
                <!-- Left brand panel (desktop only) -->
                <div class="auth-brand-panel">
                    <div class="auth-brand-header">
                        <div class="auth-brand-logo-icon">
                            <i data-lucide="layers"></i>
                        </div>
                        <span class="auth-brand-title">AssetFlow</span>
                    </div>
                    <div class="auth-brand-content">
                        <h1 class="auth-brand-headline">Manage & Allocate Assets Seamlessly</h1>
                        <p class="auth-brand-subheadline">
                            Simplify physical asset and resource lifecycle management. Reduce tracking overhead, prevent booking overlaps, and automate maintenance workflows.
                        </p>
                        <div class="auth-features-list">
                            <div class="auth-feature-item">
                                <div class="auth-feature-icon">
                                    <i data-lucide="package"></i>
                                </div>
                                <div class="auth-feature-text">
                                    <h4>Centralized Asset Directory</h4>
                                    <p>Comprehensive tracking for category parameters, lifecycle history, and locations.</p>
                                </div>
                            </div>
                            <div class="auth-feature-item">
                                <div class="auth-feature-icon">
                                    <i data-lucide="repeat"></i>
                                </div>
                                <div class="auth-feature-text">
                                    <h4>Conflict-Free Allocations</h4>
                                    <p>Strict allocation conflict validation with Peer-to-Peer transfer workflows.</p>
                                </div>
                            </div>
                            <div class="auth-feature-item">
                                <div class="auth-feature-icon">
                                    <i data-lucide="calendar"></i>
                                </div>
                                <div class="auth-feature-text">
                                    <h4>Smart Resource Booking</h4>
                                    <p>Reserve bookable assets and shared conference rooms with strict overlap checks.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="auth-brand-footer">
                        <span>© 2026 AssetFlow Inc.</span>
                        <span>v1.0.2</span>
                    </div>
                </div>

                <!-- Right form panel (Login, Signup, Forgot, OTP, Reset) -->
                <div class="auth-form-panel">
                    <!-- Mobile Logo -->
                    <div class="auth-logo-mobile">
                        <i data-lucide="layers"></i>
                        <span>Asset<span style="color: var(--color-primary);">Flow</span></span>
                    </div>

                    <!-- 1. LOGIN VIEW -->
                    <div id="login-form-view" class="auth-view-fade">
                        <div class="auth-eyebrow">
                            <i data-lucide="shield-check" style="width:14px; height:14px;"></i>
                            Private workspace access
                        </div>
                        <div class="auth-header">
                            <h2>Welcome back</h2>
                            <p>Sign in to manage assets, allocations, bookings, and maintenance in one place.</p>
                        </div>

                        <div class="auth-login-strip">
                            <div class="auth-login-pill">
                                <strong>Employee account</strong>
                                <span>Use your organization email to continue.</span>
                            </div>
                            <div class="auth-login-pill">
                                <strong>Fast recovery</strong>
                                <span>Reset access without leaving the screen.</span>
                            </div>
                            <div class="auth-login-pill">
                                <strong>Role aware</strong>
                                <span>Different workspaces open after sign in.</span>
                            </div>
                        </div>
                        
                        <form id="login-form">
                            <div class="form-group">
                                <label for="login-email">Email Address</label>
                                <div class="input-icon-container">
                                    <i data-lucide="mail" class="field-icon"></i>
                                    <input type="email" id="login-email" class="form-control" placeholder="name@company.com" autocomplete="email" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                                    <label for="login-password" style="margin-bottom:0;">Password</label>
                                    <button type="button" class="btn-text" id="forgot-pw-btn" style="font-size:0.775rem;">Forgot password?</button>
                                </div>
                                <div class="input-icon-container">
                                    <i data-lucide="lock" class="field-icon"></i>
                                    <input type="password" id="login-password" class="form-control" placeholder="••••••••" autocomplete="current-password" required style="padding-right: 44px;">
                                    <button type="button" class="password-toggle-btn" data-target="login-password">
                                        <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                                    </button>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 10px;">Sign In</button>
                        </form>
                        
                        <div class="form-footer">
                            <p style="font-size:0.85rem; color:var(--color-gray-500);">Don't have an account? <button class="btn-text" id="go-signup-btn" style="font-weight: 600;">Create account</button></p>
                        </div>
                    </div>

                    <!-- 2. SIGNUP VIEW -->
                    <div id="signup-form-view" class="hidden auth-view-fade">
                        <div class="auth-header">
                            <h2>Create Account</h2>
                            <p>Register as an Employee to request assets and bookings</p>
                        </div>
                        
                        <form id="signup-form">
                            <div class="form-group">
                                <label for="signup-name">Full Name</label>
                                <div class="input-icon-container">
                                    <i data-lucide="user" class="field-icon"></i>
                                    <input type="text" id="signup-name" class="form-control" placeholder="Jane Doe" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="signup-email">Email Address</label>
                                <div class="input-icon-container">
                                    <i data-lucide="mail" class="field-icon"></i>
                                    <input type="email" id="signup-email" class="form-control" placeholder="jane.doe@company.com" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="signup-dept">Department</label>
                                <div class="input-icon-container">
                                    <i data-lucide="building-2" class="field-icon"></i>
                                    <select id="signup-dept" class="form-control" required></select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="signup-password">Password</label>
                                <div class="input-icon-container">
                                    <i data-lucide="lock" class="field-icon"></i>
                                    <input type="password" id="signup-password" class="form-control" placeholder="••••••••" autocomplete="new-password" required>
                                    <button type="button" class="password-toggle-btn" data-target="signup-password">
                                        <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                                    </button>
                                </div>
                                <!-- Password Strength Meter -->
                                <div class="password-strength-wrapper">
                                    <div class="password-strength-bar-container">
                                        <div id="pw-strength-bar" class="password-strength-bar"></div>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <span id="pw-strength-text" class="password-strength-text">Password Strength: Too weak</span>
                                    </div>
                                    <ul class="password-requirements">
                                        <li id="req-length" class="password-requirement-item">
                                            <i data-lucide="circle"></i> Min 6 characters
                                        </li>
                                        <li id="req-number" class="password-requirement-item">
                                            <i data-lucide="circle"></i> At least 1 number
                                        </li>
                                        <li id="req-upper" class="password-requirement-item">
                                            <i data-lucide="circle"></i> At least 1 uppercase
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <button type="submit" id="signup-submit-btn" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 10px;" disabled>Register</button>
                        </form>
                        
                        <div class="form-footer">
                            <p style="font-size:0.85rem; color:var(--color-gray-500);">Already have an account? <button class="btn-text" id="go-login-btn" style="font-weight: 600;">Sign In</button></p>
                        </div>
                    </div>

                    <!-- 3. FORGOT PASSWORD VIEW -->
                    <div id="forgot-form-view" class="hidden auth-view-fade">
                        <div class="auth-header">
                            <h2>Reset Password</h2>
                            <p>Enter your email to receive a recovery code</p>
                        </div>
                        
                        <form id="forgot-form">
                            <div class="form-group">
                                <label for="forgot-email">Email Address</label>
                                <div class="input-icon-container">
                                    <i data-lucide="mail" class="field-icon"></i>
                                    <input type="email" id="forgot-email" class="form-control" placeholder="name@company.com" autocomplete="email" required>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 10px;">Send Recovery Code</button>
                        </form>
                        
                        <div class="form-footer">
                            <p style="font-size:0.85rem; color:var(--color-gray-500);">Remember password? <button class="btn-text" id="forgot-go-login-btn">Back to Sign In</button></p>
                        </div>
                    </div>

                    <!-- 4. OTP VERIFICATION VIEW -->
                    <div id="otp-form-view" class="hidden auth-view-fade">
                        <div class="auth-header">
                            <h2>Verify Identity</h2>
                            <p id="otp-sub-text">Enter the 6-digit code sent to your email.</p>
                        </div>
                        
                        <form id="otp-form">
                            <div class="form-group">
                                <label for="otp-code">Verification Code</label>
                                <div class="input-icon-container">
                                    <i data-lucide="shield-check" class="field-icon"></i>
                                    <input type="text" id="otp-code" class="form-control" placeholder="123456" maxlength="6" pattern="\\d{6}" style="text-align: center; letter-spacing: 4px; font-size: 1.25rem;" required>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 10px;">Verify Code</button>
                        </form>
                        
                        <div class="form-footer">
                            <p style="font-size:0.85rem; color:var(--color-gray-500);">Didn't receive code? <button type="button" class="btn-text" id="resend-code-btn">Resend Code</button></p>
                        </div>
                    </div>

                    <!-- 5. NEW PASSWORD VIEW -->
                    <div id="reset-form-view" class="hidden auth-view-fade">
                        <div class="auth-header">
                            <h2>Set New Password</h2>
                            <p>Choose a secure password for your account</p>
                        </div>
                        
                        <form id="reset-form">
                            <div class="form-group">
                                <label for="reset-password">New Password</label>
                                <div class="input-icon-container">
                                    <i data-lucide="lock" class="field-icon"></i>
                                    <input type="password" id="reset-password" class="form-control" placeholder="••••••••" autocomplete="new-password" required>
                                    <button type="button" class="password-toggle-btn" data-target="reset-password">
                                        <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="reset-password-confirm">Confirm Password</label>
                                <div class="input-icon-container">
                                    <i data-lucide="lock" class="field-icon"></i>
                                    <input type="password" id="reset-password-confirm" class="form-control" placeholder="••••••••" autocomplete="new-password" required>
                                    <button type="button" class="password-toggle-btn" data-target="reset-password-confirm">
                                        <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                                    </button>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 10px;">Reset Password</button>
                        </form>
                    </div>
                    <div class="auth-support-note">
                        Use your organization email to sign in. If you are new, create an employee account from the form below and your access will be stored locally for this workspace.
                    </div>
                </div>
            </div>
        </div>
    `;

    safeCreateIcons();

    // Select Views
    const loginView = container.querySelector("#login-form-view");
    const signupView = container.querySelector("#signup-form-view");
    const forgotView = container.querySelector("#forgot-form-view");
    const otpView = container.querySelector("#otp-form-view");
    const resetView = container.querySelector("#reset-form-view");

    // Clear and toggle helper
    function showView(targetView) {
        [loginView, signupView, forgotView, otpView, resetView].forEach(v => v.classList.add("hidden"));
        targetView.classList.remove("hidden");
        safeCreateIcons();
    }

    // View Navigation triggers
    container.querySelector("#go-signup-btn").addEventListener("click", () => {
        showView(signupView);
        loadSignupDepts();
    });

    container.querySelector("#go-login-btn").addEventListener("click", () => {
        showView(loginView);
    });

    container.querySelector("#forgot-pw-btn").addEventListener("click", () => {
        showView(forgotView);
        const currentEmailInput = container.querySelector("#login-email").value;
        container.querySelector("#forgot-email").value = currentEmailInput;
    });

    container.querySelector("#forgot-go-login-btn").addEventListener("click", () => {
        showView(loginView);
    });

    // Populate departments list for signup
    function loadSignupDepts() {
        const depts = Store.getDepartments().filter(d => d.status === "Active");
        const select = container.querySelector("#signup-dept");
        if (depts.length === 0) {
            select.innerHTML = `<option value="">No departments available</option>`;
            select.disabled = true;
            return;
        }

        select.disabled = false;
        select.innerHTML = depts.map(d => `<option value="${d.id}">${d.name}</option>`).join("");
    }

    // Bind Password Visibility Toggles
    const toggleBtns = container.querySelectorAll(".password-toggle-btn");
    toggleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const input = container.querySelector(`#${targetId}`);
            const icon = btn.querySelector("i");
            
            if (input.type === "password") {
                input.type = "text";
                icon.setAttribute("data-lucide", "eye-off");
            } else {
                input.type = "password";
                icon.setAttribute("data-lucide", "eye");
            }
            safeCreateIcons();
        });
    });

    // Signup Password Strength Validation
    const signupPwInput = container.querySelector("#signup-password");
    signupPwInput.addEventListener("input", () => {
        const password = signupPwInput.value;
        const bar = container.querySelector("#pw-strength-bar");
        const text = container.querySelector("#pw-strength-text");
        const submitBtn = container.querySelector("#signup-submit-btn");

        // Rule evaluation
        const meetsLength = password.length >= 6;
        const meetsNumber = /\d/.test(password);
        const meetsUpper = /[A-Z]/.test(password);

        // Update checklist UI helpers
        updateRequirementUI("req-length", meetsLength);
        updateRequirementUI("req-number", meetsNumber);
        updateRequirementUI("req-upper", meetsUpper);

        // Count met rules
        let score = 0;
        if (meetsLength) score++;
        if (meetsNumber) score++;
        if (meetsUpper) score++;

        // Reset visual indicators
        bar.className = "password-strength-bar";
        
        if (score === 0 || password.length === 0) {
            bar.style.width = "0%";
            text.textContent = "Password Strength: Too weak";
            submitBtn.disabled = true;
        } else if (score === 1) {
            bar.classList.add("weak");
            text.textContent = "Password Strength: Weak (Must satisfy all requirements)";
            submitBtn.disabled = true;
        } else if (score === 2) {
            bar.classList.add("medium");
            text.textContent = "Password Strength: Medium (Must satisfy all requirements)";
            submitBtn.disabled = true;
        } else if (score === 3) {
            bar.classList.add("strong");
            text.textContent = "Password Strength: Strong";
            submitBtn.disabled = false; // Satisfies all 3 rules!
        }
    });

    function updateRequirementUI(reqId, met) {
        const item = container.querySelector(`#${reqId}`);
        const icon = item.querySelector("i");
        if (met) {
            item.classList.add("met");
            icon.setAttribute("data-lucide", "check-circle-2");
        } else {
            item.classList.remove("met");
            icon.setAttribute("data-lucide", "circle");
        }
        safeCreateIcons();
    }

    // Login Form Submit
    container.querySelector("#login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = container.querySelector("#login-email").value.trim().toLowerCase();
        const password = container.querySelector("#login-password").value;

        Store.login(email, password).then(result => {
            if (!result.success) {
                showToast(result.message || "Invalid email or password. Please try again.", "danger");
                return;
            }

            const user = result.data.user || result.data;
            Store.setCurrentUser(user);
            showToast(`Welcome back, ${user.name}!`, "success");
            checkAuthAndRoute();
        });
    });

    // Signup Form Submit (forces Employee role)
    container.querySelector("#signup-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = container.querySelector("#signup-name").value.trim();
        const email = container.querySelector("#signup-email").value.trim().toLowerCase();
        const deptId = container.querySelector("#signup-dept").value;
        const password = signupPwInput.value;

        Store.signup({
            name,
            email,
            department_id: deptId,
            password
        }).then(result => {
            if (!result.success) {
                showToast(result.message || "Email address already registered.", "danger");
                return;
            }

            Store.logActivity(name, "Account Created", `Signed up as a new Employee.`).catch(() => {});
            Store.addNotification("New Account Created", `${name} signed up as a new employee.`, "info").catch(() => {});

            showToast("Registration successful! You can now log in.", "success");
            showView(loginView);
            container.querySelector("#login-email").value = email;
            container.querySelector("#login-password").value = password;
        });
    });

    // Forgot Password Request Submit
    container.querySelector("#forgot-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = container.querySelector("#forgot-email").value.trim().toLowerCase();
        const employees = Store.getEmployees();
        const user = employees.find(emp => emp.email === email && emp.status === "Active");

        if (!user) {
            showToast("This email address is not registered in our system.", "danger");
            return;
        }

        recoveryEmail = email;
        showToast(`Verification code sent to ${email} (Simulation)`, "success");
        
        // Transition to OTP Code view
        showView(otpView);
        container.querySelector("#otp-sub-text").textContent = `Enter the 6-digit code sent to ${email}.`;
    });

    // OTP Code Verification Submit
    container.querySelector("#otp-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const code = container.querySelector("#otp-code").value.trim();

        if (code !== "123456") {
            showToast("Invalid verification code. Please enter 123456 for testing.", "danger");
            return;
        }

        showToast("Code verified successfully!", "success");
        showView(resetView);
    });

    // Resend code trigger
    container.querySelector("#resend-code-btn").addEventListener("click", () => {
        showToast(`A new verification code has been sent to ${recoveryEmail}`, "info");
    });

    // Reset Password Form Submit
    container.querySelector("#reset-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const newPassword = container.querySelector("#reset-password").value;
        const confirmPassword = container.querySelector("#reset-password-confirm").value;

        if (newPassword !== confirmPassword) {
            showToast("Passwords do not match.", "danger");
            return;
        }

        if (newPassword.length < 6) {
            showToast("Password must be at least 6 characters.", "danger");
            return;
        }

        Store.resetPassword(recoveryEmail, newPassword).then(result => {
            if (!result.success) {
                showToast(result.message || "Unable to update password.", "danger");
                showView(loginView);
                return;
            }

            Store.logActivity(recoveryEmail, "Password Reset", "Password was reset via forgot password screen.").catch(() => {});
            showToast("Password updated successfully! Please log in.", "success");
            showView(loginView);
            container.querySelector("#login-email").value = recoveryEmail;
            container.querySelector("#login-password").value = newPassword;
        });
    });
}
