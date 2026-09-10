

document.addEventListener("DOMContentLoaded", function () {

    const user = requireAuth();

    if (!user) return; // requireAuth() already redirects to login

    renderProfileCard(user);
    renderMembershipCard(user);
    renderBudgetCard();
    renderQuickStats();
    renderMotivationCard();
    renderSettingsShortcuts();

});

// ---------------------------------------------------------------------
// 1. PROFILE CARD
// ---------------------------------------------------------------------

function renderProfileCard(user) {

    const initials = user.name
        .split(" ")
        .map(word => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    const avatar = user.profileImage
        ? `<img src="${user.profileImage}" alt="Profile image">`
        : initials;

    const badge = user.isPremiumUser
        ? `<span class="acc-badge acc-badge-premium">Premium Member</span>`
        : `<span class="acc-badge acc-badge-free">Free User</span>`;

    document.getElementById("profileSection").innerHTML = `

        <div class="acc-card acc-profile-card">

            <div class="acc-profile-avatar">
                ${avatar}
            </div>

            <div class="acc-profile-info">

                <h2>${user.name}</h2>
                <p>${user.email}</p>

                <div class="acc-profile-meta">
                    ${badge}
                    <span class="acc-badge acc-badge-status">Active</span>
                    <span class="acc-card-subtext">
                        Joined <span class="acc-placeholder">Not available yet</span>
                    </span>
                </div>

            </div>

        </div>

    `;

}

// ---------------------------------------------------------------------
// 2. MEMBERSHIP CARD
// ---------------------------------------------------------------------

function renderMembershipCard(user) {

    const section = document.getElementById("membershipSection");

    if (user.isPremiumUser) {

        section.innerHTML = `

            <div class="acc-card">

                <div class="acc-card-title">
                    ⭐ Membership
                    <span class="acc-badge acc-badge-premium">Premium</span>
                </div>

                <div class="acc-membership-details">

                    <div>
                        <div class="acc-detail-label">Current Plan</div>
                        <div class="acc-detail-value">Premium</div>
                    </div>

                    <div>
                        <div class="acc-detail-label">Membership Status</div>
                        <div class="acc-detail-value">Active</div>
                    </div>

                    <div>
                        <div class="acc-detail-label">Purchase Date</div>
                        <div class="acc-detail-value acc-placeholder" id="membPurchaseDate">Loading...</div>
                    </div>

                    <div>
                        <div class="acc-detail-label">Last Payment Date</div>
                        <div class="acc-detail-value acc-placeholder" id="membLastPaymentDate">Loading...</div>
                    </div>

                    <div>
                        <div class="acc-detail-label">Expiry Date</div>
                        <div class="acc-detail-value">Lifetime Membership</div>
                    </div>

                    <div>
                        <div class="acc-detail-label">Remaining Days</div>
                        <div class="acc-detail-value">Lifetime</div>
                    </div>

                    <div>
                        <div class="acc-detail-label">Payment Method</div>
                        <div class="acc-detail-value acc-placeholder">Not Recorded</div>
                    </div>

                </div>

            </div>

        `;

        loadMembershipDetails();

    } else {

        section.innerHTML = `

            <div class="acc-card">

                <div class="acc-card-title">
                    ⭐ Membership
                    <span class="acc-badge acc-badge-free">Free User</span>
                </div>

                <p class="acc-card-subtext" style="margin-bottom:16px;">
                Upgrade to Premium to unlock advanced reports,
                spending analytics, leaderboard, and exports.
                </p>

                <button class="acc-btn" id="upgradeBtn">
                    Upgrade to Premium
                </button>

            </div>

        `;
        
        // Reuses the existing buyPremium() from premium.js — same
        // Cashfree order-creation/checkout/verification flow already
        // working on the Dashboard, no second implementation.
        document.getElementById("upgradeBtn").addEventListener("click", buyPremium);

    }

}

// Fetches Purchase Date / Last Payment Date from GET /users/membership via
// the shared `api` instance from apiConfig.js. Current Plan, Membership
// Status, Expiry Date, Remaining Days, and Payment Method are rendered
// synchronously above (they're either already known from `user`, or are
// fixed per the current permanent-premium business rule), so only the two
// date fields need to wait on the network.

async function loadMembershipDetails() {

    const purchaseDateEl = document.getElementById("membPurchaseDate");
    const lastPaymentDateEl = document.getElementById("membLastPaymentDate");

    try {

        const response = await api.get("/users/membership");
        const membership = response.data;

        purchaseDateEl.textContent = membership.purchaseDate
            ? new Date(membership.purchaseDate).toLocaleDateString()
            : "Not available yet";

        lastPaymentDateEl.textContent = membership.lastPaymentDate
            ? new Date(membership.lastPaymentDate).toLocaleDateString()
            : "Not available yet";

        purchaseDateEl.classList.remove("acc-placeholder");
        lastPaymentDateEl.classList.remove("acc-placeholder");

    }
    catch (err) {

        console.log(err);

        purchaseDateEl.textContent = "Unable to load";
        lastPaymentDateEl.textContent = "Unable to load";

    }

}

// ---------------------------------------------------------------------
// 3. MONTHLY BUDGET CARD
// ---------------------------------------------------------------------
// Sprint 2.3: wired to GET/PUT /users/budget via the shared `api` instance
// from apiConfig.js (already loaded on account.html, adds the auth header
// automatically). Keeps the same acc-card / acc-membership-details /
// acc-detail-label / acc-detail-value classes from Sprint 2.2.

// Holds the last-loaded budget response so the edit form and the display
// can both read from one place instead of re-fetching on every toggle.
let currentBudgetData = {
    monthlyBudget: 0,
    currentMonthExpenses: 0,
    remainingBudget: 0
};

function renderBudgetCard() {

    document.getElementById("budgetSection").innerHTML = `

        <div class="acc-card">

            <div class="acc-card-title">💰 Monthly Budget</div>

            <div class="acc-membership-details" id="budgetDisplay">

                <div>
                    <div class="acc-detail-label">Monthly Budget</div>
                    <div class="acc-detail-value acc-placeholder" id="budgetValue">Loading...</div>
                </div>

                <div>
                    <div class="acc-detail-label">Current Month Expenses</div>
                    <div class="acc-detail-value acc-placeholder" id="budgetSpentValue">Loading...</div>
                </div>

                <div>
                    <div class="acc-detail-label">Remaining Budget</div>
                    <div class="acc-detail-value acc-placeholder" id="budgetRemainingValue">Loading...</div>
                </div>

            </div>

            <button class="acc-btn acc-btn-secondary" id="editBudgetBtn" style="margin-top:18px;">
                Edit Budget
            </button>

            <div class="acc-budget-edit" id="budgetEditForm" style="display:none;">

                <label class="acc-detail-label" for="budgetInput">New Monthly Budget (₹)</label>
                <input type="number" id="budgetInput" class="acc-input" min="1" placeholder="e.g. 15000">

                <p class="acc-error-text" id="budgetError" style="display:none;"></p>

                <div class="acc-form-actions">
                    <button class="acc-btn" id="saveBudgetBtn">Save</button>
                    <button class="acc-btn acc-btn-secondary" id="cancelBudgetBtn">Cancel</button>
                </div>

            </div>

        </div>

    `;

    document.getElementById("editBudgetBtn").addEventListener("click", showBudgetEditor);
    document.getElementById("cancelBudgetBtn").addEventListener("click", hideBudgetEditor);
    document.getElementById("saveBudgetBtn").addEventListener("click", saveBudget);

    loadBudget();

}


async function loadBudget() {

    try {

        const response = await api.get("/users/budget");

        currentBudgetData = response.data;

        updateBudgetDisplay();

        // Update Saver immediately using the same budget data
        const medal = computeMedal(
            currentBudgetData.monthlyBudget,
            currentBudgetData.currentMonthExpenses
        );

        renderMedalCard(medal);

    }
    catch (err) {

        console.log(err);

        document.getElementById("budgetValue").textContent = "Unable to load";
        document.getElementById("budgetSpentValue").textContent = "Unable to load";
        document.getElementById("budgetRemainingValue").textContent = "Unable to load";

    }

}


function updateBudgetDisplay() {

    const budgetValueEl = document.getElementById("budgetValue");
    const spentValueEl = document.getElementById("budgetSpentValue");
    const remainingValueEl = document.getElementById("budgetRemainingValue");

    budgetValueEl.classList.remove("acc-placeholder");

    if (!currentBudgetData.monthlyBudget) {
        budgetValueEl.textContent = "Not set yet";
        budgetValueEl.classList.add("acc-placeholder");
    } else {
        budgetValueEl.textContent = `₹${currentBudgetData.monthlyBudget}`;
    }

    spentValueEl.classList.remove("acc-placeholder");
    spentValueEl.textContent = `₹${currentBudgetData.currentMonthExpenses}`;

    remainingValueEl.classList.remove("acc-placeholder");
    remainingValueEl.textContent = `₹${currentBudgetData.remainingBudget}`;

}

function showBudgetEditor() {

    document.getElementById("budgetEditForm").style.display = "block";
    document.getElementById("budgetInput").value = currentBudgetData.monthlyBudget || "";
    document.getElementById("budgetError").style.display = "none";
    document.getElementById("budgetInput").focus();

}

function hideBudgetEditor() {

    document.getElementById("budgetEditForm").style.display = "none";
    document.getElementById("budgetError").style.display = "none";

}

async function saveBudget() {

    const input = document.getElementById("budgetInput");
    const errorEl = document.getElementById("budgetError");
    const saveBtn = document.getElementById("saveBudgetBtn");

    const value = Number(input.value);

    if (!input.value || isNaN(value) || value <= 0) {

        errorEl.textContent = "Please enter a valid positive number.";
        errorEl.style.display = "block";

        return;
    }

    try {

        // Prevent multiple clicks while saving
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        const response = await api.put("/users/budget", {
            monthlyBudget: value
        });

        // Store the fresh budget data
        currentBudgetData = response.data;

        // Update Monthly Budget card immediately
        updateBudgetDisplay();

        // Update Saver/Medal immediately
        const medal = computeMedal(
            currentBudgetData.monthlyBudget,
            currentBudgetData.currentMonthExpenses
        );

        renderMedalCard(medal);

        // Close edit form
        hideBudgetEditor();

    }
    catch (err) {

        errorEl.textContent =
            (err.response && err.response.data && err.response.data.message)
                ? err.response.data.message
                : "Something went wrong. Please try again.";

        errorEl.style.display = "block";

    }
    finally {

        saveBtn.disabled = false;
        saveBtn.textContent = "Save";

    }

}

// ---------------------------------------------------------------------
// 4. QUICK STATISTICS
// ---------------------------------------------------------------------
// Wired to GET /users/stats via the shared `api` instance from
// apiConfig.js (same pattern used for the Budget card). Keeps the exact
// same .acc-card-title / .acc-grid / .acc-stat-card markup from Sprint 2.2 —
// only the values become real.

function renderQuickStats() {

    document.getElementById("statsSection").innerHTML = `

        <div class="acc-card-title">📊 Quick Statistics</div>

        <div class="acc-grid">

            <div class="acc-stat-card">
                <h3>Total Expenses</h3>
                <div class="acc-stat-value acc-placeholder" id="statTotalValue">Loading...</div>
            </div>

            <div class="acc-stat-card">
                <h3>This Month</h3>
                <div class="acc-stat-value acc-placeholder" id="statMonthValue">Loading...</div>
            </div>

            <div class="acc-stat-card">
                <h3>Today's Expenses</h3>
                <div class="acc-stat-value acc-placeholder" id="statTodayValue">Loading...</div>
            </div>

            <div class="acc-stat-card">
                <h3>Highest Category</h3>
                <div class="acc-stat-value acc-placeholder" id="statCategoryValue">Loading...</div>
            </div>

        </div>

    `;

    loadQuickStats();

}

async function loadQuickStats() {

    const totalEl = document.getElementById("statTotalValue");
    const monthEl = document.getElementById("statMonthValue");
    const todayEl = document.getElementById("statTodayValue");
    const categoryEl = document.getElementById("statCategoryValue");

    try {

        const response = await api.get("/users/stats");
        const stats = response.data;

        totalEl.textContent = `₹${stats.totalExpenses}`;
        monthEl.textContent = `₹${stats.thisMonthExpenses}`;
        todayEl.textContent = `₹${stats.todayExpenses}`;
        categoryEl.textContent = stats.highestCategory ? stats.highestCategory : "No expenses yet";

        [totalEl, monthEl, todayEl, categoryEl].forEach(el => {
            el.classList.remove("acc-placeholder");
        });

    }
    catch (err) {

        console.log(err);

        [totalEl, monthEl, todayEl, categoryEl].forEach(el => {
            el.textContent = "Unable to load";
        });

    }

}

function computeMedal(monthlyBudget, currentMonthExpenses) {

    const budget = Number(monthlyBudget) || 0;
    const spent = Number(currentMonthExpenses) || 0;

    if (budget === 0) {

        return {
            icon: "🥉",
            title: "Bronze Saver",
            message: "No Budget Set",
            savingsPercent: 0,
            monthlyBudget: budget,
            currentMonthExpenses: spent,
            isDiamond: false,
            progressLabel: "Progress to Silver",
            progressPercent: 0
        };

    }

    const rawSavingsPercent = ((budget - spent) / budget) * 100;

    // Never allow savings below 0%
    const savingsPercent = Math.max(0, rawSavingsPercent);

    let tier;

    if (savingsPercent < 10) {
        tier = "bronze";
    } else if (savingsPercent < 30) {
        tier = "silver";
    } else if (savingsPercent < 50) {
        tier = "gold";
    } else {
        tier = "diamond";
    }

    const tierConfig = {
        bronze: {
            icon: "🥉",
            title: "Bronze Saver",
            message: "Every rupee saved counts — keep going!",
            rangeStart: 0,
            rangeEnd: 10,
            progressLabel: "Progress to Silver"
        },
        silver: {
            icon: "🥈",
            title: "Silver Saver",
            message: "Nice work! Your savings habit is building.",
            rangeStart: 10,
            rangeEnd: 30,
            progressLabel: "Progress to Gold"
        },
        gold: {
            icon: "🥇",
            title: "Gold Saver",
            message: "Excellent! You're mastering your budget.",
            rangeStart: 30,
            rangeEnd: 50,
            progressLabel: "Progress to Diamond"
        },
        diamond: {
            icon: "💎",
            title: "Diamond Saver",
            message: "Incredible savings discipline — you're a Diamond Saver!",
            rangeStart: 50,
            rangeEnd: 100,
            progressLabel: "Highest Medal Achieved"
        }
    };

    const config = tierConfig[tier];
    const isDiamond = tier === "diamond";

    let progressPercent;

    if (isDiamond) {

        progressPercent = 100;

    } else {

        progressPercent =
            ((savingsPercent - config.rangeStart) / (config.rangeEnd - config.rangeStart)) * 100;

        progressPercent = Math.min(100, Math.max(0, progressPercent));

    }

    return {
        icon: config.icon,
        title: config.title,
        message: config.message,
        savingsPercent,
        monthlyBudget: budget,
        currentMonthExpenses: spent,
        isDiamond,
        progressLabel: config.progressLabel,
        progressPercent
    };

}

function renderMotivationCard() {

    document.getElementById("motivationSection").innerHTML = `

        <div class="acc-card acc-medal-card">

            <div style="display:flex; align-items:center; gap:18px;">

                <div class="acc-medal-icon">🥉</div>

                <div style="flex:1;">
                    <div class="acc-medal-title">Loading...</div>
                    <div class="acc-medal-message">Calculating your savings medal...</div>
                </div>

            </div>

        </div>

    `;



}



function renderMedalCard(medal) {

    const progressSection = medal.isDiamond
        ? `
            <span class="acc-badge" style="background:rgba(255,255,255,.2); color:white;">
                🏆 Highest Medal Achieved
            </span>
        `
        : `
            <div class="acc-progress-label">${medal.progressLabel}</div>
            <div class="acc-progress-track">
                <div class="acc-progress-fill" style="width:${medal.progressPercent}%;"></div>
            </div>
        `;

    document.getElementById("motivationSection").innerHTML = `

        <div class="acc-card acc-medal-card">

            <div style="display:flex; align-items:center; gap:18px;">

                <div class="acc-medal-icon">${medal.icon}</div>

                <div style="flex:1;">
                    <div class="acc-medal-title">${medal.title}</div>
                    <div class="acc-medal-message">${medal.message}</div>
                </div>

            </div>

            <div class="acc-medal-divider"></div>

            ${progressSection}

            <div class="acc-medal-stats">

                <div>
                    <div class="acc-medal-stat-label">Savings Percentage</div>
                    <div class="acc-medal-stat-value">${medal.savingsPercent.toFixed(1)}%</div>
                </div>

                <div>
                    <div class="acc-medal-stat-label">Monthly Budget</div>
                    <div class="acc-medal-stat-value">₹${medal.monthlyBudget}</div>
                </div>

                <div>
                    <div class="acc-medal-stat-label">Current Month Spending</div>
                    <div class="acc-medal-stat-value">₹${medal.currentMonthExpenses}</div>
                </div>

            </div>

        </div>

    `;

}


function renderSettingsShortcuts() {

    document.getElementById("settingsShortcutsSection").innerHTML = `

        <div class="acc-card-title">⚙ Settings</div>

        <div class="acc-grid">

            <button class="acc-shortcut-card" id="changePasswordShortcut">

                <span class="acc-shortcut-icon">🔑</span>
                <span class="acc-shortcut-label">Change Password</span>

            </button>

            <button class="acc-shortcut-card" type="button" id="themeShortcut">

                <span class="acc-shortcut-icon">🎨</span>
                <span class="acc-shortcut-label">Theme</span>

            </button>

            <button class="acc-shortcut-card" type="button">

                <span class="acc-shortcut-icon">🔔</span>
                <span class="acc-shortcut-label">Notifications</span>

            </button>

            <button class="acc-shortcut-card" type="button">

                <span class="acc-shortcut-icon">🔒</span>
                <span class="acc-shortcut-label">Privacy</span>

            </button>

        </div>

    `;

    document
        .getElementById("changePasswordShortcut")
        .addEventListener("click", openChangePasswordModal);


    document
    .getElementById("themeShortcut")
    .addEventListener("click", openThemeModal);
}




function openThemeModal() {

    const existingModal =
        document.getElementById("themeModal");

    if (existingModal) {
        existingModal.remove();
    }

    const currentTheme =
        localStorage.getItem("theme") || "light";

    document.body.insertAdjacentHTML("beforeend", `

        <div class="password-modal-overlay" id="themeModal">

            <div class="password-modal">

                <button
                    type="button"
                    class="password-modal-close"
                    id="closeThemeModal"
                >
                    ×
                </button>

                <div class="password-modal-title">
                    🎨 Theme
                </div>

                <p class="password-modal-subtitle">
                    Choose your theme.
                </p>

                <div class="theme-options">

                    <label class="theme-option">
                        <input
                            type="radio"
                            name="theme"
                            value="light"
                            ${currentTheme === "light" ? "checked" : ""}
                        >
                        <span>☀️ Light</span>
                    </label>

                    <label class="theme-option">
                        <input
                            type="radio"
                            name="theme"
                            value="dark"
                            ${currentTheme === "dark" ? "checked" : ""}
                        >
                        <span>🌙 Dark</span>
                    </label>

                    <label class="theme-option">
                        <input
                            type="radio"
                            name="theme"
                            value="system"
                            ${currentTheme === "system" ? "checked" : ""}
                        >
                        <span>💻 System</span>
                    </label>

                </div>

                <button
                    type="button"
                    class="acc-btn password-action-btn"
                    id="saveThemeBtn"
                >
                    Apply
                </button>

            </div>

        </div>

    `);

    document
        .getElementById("closeThemeModal")
        .addEventListener("click", () => {

            document
                .getElementById("themeModal")
                .remove();

        });

    document
        .getElementById("saveThemeBtn")
        .addEventListener("click", saveTheme);

}


function saveTheme() {

    const selected =
        document.querySelector(
            'input[name="theme"]:checked'
        );

    if (!selected) return;

    const theme = selected.value;

    localStorage.setItem("theme", theme);

    applyTheme(theme);

    document
        .getElementById("themeModal")
        .remove();

}
function applyTheme(theme) {

    if (theme === "dark") {

        document.documentElement.classList.add("dark-theme");

    } else if (theme === "light") {

        document.documentElement.classList.remove("dark-theme");

    } else {

        const prefersDark =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;

        document.documentElement.classList.toggle(
            "dark-theme",
            prefersDark
        );
    }
}

function openChangePasswordModal() {

    const existingModal = document.getElementById("changePasswordModal");

    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML("beforeend", `

        <div class="password-modal-overlay" id="changePasswordModal">

            <div class="password-modal">

                <button
                    type="button"
                    class="password-modal-close"
                    id="closePasswordModal">
                    ×
                </button>

                <div class="password-modal-title">
                    🔑 Change Password
                </div>

                <p class="password-modal-subtitle">
                    Create a new password for your account.
                </p>

                <div id="passwordStepOne">

                    <label class="password-label">
                        New Password
                    </label>

                    <input
                        type="password"
                        id="newPassword"
                        class="password-input"
                        placeholder="Enter new password"
                        autocomplete="new-password"
                    >

                    <div class="password-strength">
                        <div class="password-strength-text" id="passwordStrengthText">
                            Password strength
                        </div>

                        <div class="password-strength-track">
                            <div
                                class="password-strength-fill"
                                id="passwordStrengthFill">
                            </div>
                        </div>
                    </div>

                    <label class="password-label">
                        Confirm New Password
                    </label>

                    <input
                        type="password"
                        id="confirmPassword"
                        class="password-input"
                        placeholder="Confirm new password"
                        autocomplete="new-password"
                    >

                    <p
                        class="password-error"
                        id="passwordError"
                        style="display:none;">
                    </p>

                    <button
                        type="button"
                        class="acc-btn password-action-btn"
                        id="sendPasswordOTPBtn">

                        Send Verification Code

                    </button>

                </div>


                <div
                    id="passwordStepTwo"
                    style="display:none;">

                    <div class="password-success-message">
                        ✓ Verification code sent to your registered email.
                    </div>

                    <label class="password-label">
                        Enter 6-digit verification code
                    </label>

                    <input
                        type="text"
                        id="passwordOTP"
                        class="password-input password-otp-input"
                        inputmode="numeric"
                        maxlength="6"
                        autocomplete="one-time-code"
                    >

                    <p
                        class="password-error"
                        id="otpError"
                        style="display:none;">
                    </p>

                    <button
                        type="button"
                        class="acc-btn password-action-btn"
                        id="verifyPasswordOTPBtn">

                        Verify & Change Password

                    </button>

                    <button
                        type="button"
                        class="password-resend-btn"
                        id="resendPasswordOTPBtn">

                        Resend Code

                    </button>

                </div>

            </div>

        </div>

    `);

    document
    .getElementById("sendPasswordOTPBtn")
    .addEventListener("click", requestPasswordChange);
    
    document
    .getElementById("closePasswordModal")
    .addEventListener("click", closeChangePasswordModal);
    

    document
        .getElementById("verifyPasswordOTPBtn")
        .addEventListener("click", verifyPasswordChange);

    document
        .getElementById("resendPasswordOTPBtn")
        .addEventListener("click", requestPasswordChange);

    document
        .getElementById("newPassword")
        .addEventListener("input", updatePasswordStrength);


}


    function closeChangePasswordModal() {

    const modal = document.getElementById("changePasswordModal");

    if (modal) {
        modal.remove();
    }
}

async function requestPasswordChange() {

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const errorEl =
        document.getElementById("passwordError");

    const button =
        document.getElementById("sendPasswordOTPBtn");

    errorEl.style.display = "none";

    // Minimum 5 characters
    if (!newPassword || !confirmPassword) {

        errorEl.textContent =
            "Please enter and confirm your new password.";

        errorEl.style.display = "block";

        return;
    }

    if (newPassword !== confirmPassword) {

        errorEl.textContent =
            "Passwords do not match.";

        errorEl.style.display = "block";

        return;
    }

    if (newPassword.length < 5) {

        errorEl.textContent =
            "Password must be at least 5 characters.";

        errorEl.style.display = "block";

        return;
    }

    try {

        button.disabled = true;
        button.textContent = "Sending...";

        await api.post(
            "/password/changepassword/request",
            {
                newPassword,
                confirmPassword
            }
        );

        // Hide password fields
        document.getElementById("passwordStepOne").style.display = "none";

        // Show OTP section
        document.getElementById("passwordStepTwo").style.display = "block";

        // Focus OTP field
        document.getElementById("passwordOTP").focus();

    }
    catch (err) {

        console.log(err);

        errorEl.textContent =
            err.response?.data?.message ||
            "Unable to send verification code.";

        errorEl.style.display = "block";

    }
    finally {

        button.disabled = false;
        button.textContent = "Send Verification Code";

    }

}


async function verifyPasswordChange() {

    const otp =
        document.getElementById("passwordOTP").value.trim();

    const errorEl =
        document.getElementById("otpError");

    const button =
        document.getElementById("verifyPasswordOTPBtn");

    errorEl.style.display = "none";

    if (!/^\d{6}$/.test(otp)) {

        errorEl.textContent =
            "Please enter the 6-digit verification code.";

        errorEl.style.display = "block";

        return;
    }

    try {

        button.disabled = true;
        button.textContent = "Verifying...";

        await api.post("/password/changepassword/verify", {
            otp
        });

        alert("Password changed successfully. Please log in again.");

        logout();

    }
    catch (err) {

        console.log(err);

        errorEl.textContent =
            err.response?.data?.message ||
            "Unable to verify the code.";

        errorEl.style.display = "block";

    }
    finally {

        button.disabled = false;
        button.textContent = "Verify & Change Password";

    }

}

function updatePasswordStrength() {

    const password =
        document.getElementById("newPassword").value;

    const text =
        document.getElementById("passwordStrengthText");

    const fill =
        document.getElementById("passwordStrengthFill");

    let strength = 0;

    if (password.length >= 5) {
        strength++;
    }

    if (/[A-Z]/.test(password)) {
        strength++;
    }

    if (/[0-9]/.test(password)) {
        strength++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        strength++;
    }

    if (strength === 0) {

        text.textContent = "Password strength";
        fill.style.width = "0%";

    }
    else if (strength <= 1) {

        text.textContent = "Weak";
        fill.style.width = "25%";

    }
    else if (strength === 2) {

        text.textContent = "Fair";
        fill.style.width = "50%";

    }
    else if (strength === 3) {

        text.textContent = "Good";
        fill.style.width = "75%";

    }
    else {

        text.textContent = "Strong";
        fill.style.width = "100%";

    }

}


const savedTheme =
    localStorage.getItem("theme") || "light";

applyTheme(savedTheme);