// Premium membership + Cashfree checkout.

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
