const historyList = document.getElementById("historyList");
const formatHistoryDate = (value) => new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

const loadHistory = async () => {
    try {
        const response = await api.get("/payments/history?limit=50");
        const payments = response.data.payments || [];
        if (!payments.length) {
            historyList.innerHTML = '<div class="history-empty">No payments yet.</div>';
            return;
        }
        historyList.innerHTML = payments.map((payment) => `
            <a class="history-row" href="payment-details.html?id=${encodeURIComponent(payment._id)}">
                <span class="history-amount">₹${Number(payment.amountMinor / 100).toFixed(2)}</span>
                <span class="history-time">${formatHistoryDate(payment.transactionDate || payment.createdAt)}</span>
            </a>
        `).join("");
    } catch (err) {
        if (err.response?.status === 403) {
            window.location.replace("premium-required.html?return=payments.html");
            return;
        }
        historyList.innerHTML = '<div class="history-empty">Unable to load payment history.</div>';
    }
};

requireAuth();
if (!isPremium()) {
    window.location.replace("premium-required.html?return=payments.html");
} else {
    loadHistory();
}
