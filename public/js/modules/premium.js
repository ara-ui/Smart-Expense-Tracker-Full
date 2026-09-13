// Premium membership + Cashfree checkout.
//
// We use Cashfree's redirect checkout as the normal browser flow. This avoids
// relying on a browser popup/iframe Promise that has been observed to hang in
// the Sandbox simulator. Cashfree returns to payment-status.html with the
// order_id, and that page performs authenticated server-side verification.

function showPremiumFeatures() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const decodedToken = jwt_decode(token);

    if (decodedToken.isPremiumUser) {
        premiumNav.style.display = "flex";
    } else {
        premiumNav.style.display = "block";
    }
}

async function buyPremium() {
    const button = document.getElementById("upgradeBtn");

    try {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "login.html";
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Opening secure payment...";
        }

        const response = await axios.get(
            `${BASE_URL}/purchase/premiummembership`,
            {
                headers: {
                    Authorization: token
                }
            }
        );

        if (
            !response.data?.success ||
            !response.data?.payment_session_id ||
            !response.data?.order_id
        ) {
            throw new Error("Invalid payment order response");
        }

        const cashfree = Cashfree({
            mode: "sandbox"
        });

        // _self is deliberate. The hosted Cashfree checkout runs in the
        // current tab and returns to our payment-status page. This prevents
        // the application/dashboard from being opened inside a separate
        // payment window and gives us one deterministic post-payment path.
        sessionStorage.setItem(
                "pendingPaymentOrderId",
                response.data.order_id
            );        
        await cashfree.checkout({
            paymentSessionId: response.data.payment_session_id,
            redirectTarget: "_self"
        });
    } catch (err) {
        console.error("Payment flow failed:", err);

        if (button) {
            button.disabled = false;
            button.textContent = "⭐ Upgrade to Premium";
        }

        const message =
            err.response?.data?.message ||
            err.message ||
            "Unable to start payment. Please try again.";

        alert(message);
    }
}
