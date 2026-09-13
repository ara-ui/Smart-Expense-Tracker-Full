document.addEventListener("DOMContentLoaded", () => {
    const user = requireAuth();
    if (!user) return;

    if (isPremium()) {
        window.location.replace("expense.html");
        return;
    }

    const upgradeButton = document.getElementById("upgradeBtn");
    const dashboardButton = document.getElementById("dashboardBtn");

    upgradeButton?.addEventListener("click", buyPremium);
    dashboardButton?.addEventListener("click", () => {
        window.location.href = "expense.html";
    });
});
