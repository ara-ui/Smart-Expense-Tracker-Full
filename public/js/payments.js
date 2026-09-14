const paymentForm = document.getElementById("paymentForm");
const paymentAmount = document.getElementById("paymentAmount");
const paymentRemark = document.getElementById("paymentRemark");
const remarkCount = document.getElementById("remarkCount");
const payButton = document.getElementById("payButton");
const paymentMessage = document.getElementById("paymentMessage");
const recentPayments = document.getElementById("recentPayments");

const formatDate = (value) => new Date(value).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
});

const renderPayments = (payments) => {
    if (!payments.length) {
        recentPayments.innerHTML = '<div class="payment-empty">No payments yet.</div>';
        return;
    }
    recentPayments.innerHTML = payments.map((payment) => `
        <a class="payment-row" href="payment-details.html?id=${encodeURIComponent(payment._id)}">
            <span class="payment-amount">₹${Number(payment.amountMinor / 100).toFixed(2)}</span>
            <span class="payment-time">${formatDate(payment.transactionDate || payment.createdAt)}</span>
        </a>
    `).join("");
};

const loadRecentPayments = async () => {
    try {
        const response = await api.get("/payments/history?limit=5");
        renderPayments(response.data.payments || []);
    } catch (err) {
        if (err.response?.status === 403) {
            window.location.replace("premium-required.html?return=payments.html");
            return;
        }
        recentPayments.innerHTML = '<div class="payment-empty">Unable to load payment history.</div>';
    }
};

paymentRemark.addEventListener("input", () => {
    remarkCount.textContent = paymentRemark.value.length;
});

paymentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    paymentMessage.textContent = "";

    const amount = Number(paymentAmount.value);
    const remark = paymentRemark.value.trim();
    if (!Number.isFinite(amount) || amount <= 0) {
        paymentMessage.textContent = "Enter a valid amount.";
        return;
    }
    if (!remark) {
        paymentMessage.textContent = "Enter a remark.";
        return;
    }

    payButton.disabled = true;
    payButton.textContent = "Opening secure payment...";

    try {
        const response = await api.post("/payments/create", { amount, remark });
        const { payment_session_id: paymentSessionId, order_id: orderId } = response.data;
        if (!paymentSessionId || !orderId) throw new Error("Invalid payment order response");

        sessionStorage.setItem("pendingPaymentOrderId", orderId);
        sessionStorage.setItem("pendingPaymentPurpose", "EXPENSE_PAYMENT");

        const cashfree = Cashfree({ mode: "sandbox" });
        await cashfree.checkout({
            paymentSessionId,
            redirectTarget: "_self"
        });
    } catch (err) {
        payButton.disabled = false;
        payButton.textContent = "Pay with Cashfree";
        paymentMessage.textContent = err.response?.data?.message || err.message || "Unable to start payment.";
    }
});

requireAuth();
if (!isPremium()) {
    window.location.replace("premium-required.html?return=payments.html");
} else {
    loadRecentPayments();
}
