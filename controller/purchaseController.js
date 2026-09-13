const { generateAccessToken } = require("../utils/jwt");
const {
    createPremiumOrder,
    verifyAndApply,
    verifyAndApplyByOrderId
} = require("../services/payments/paymentService");

const successResponse = (res, user, order) => {
    const token = generateAccessToken(
        user._id,
        user.name,
        user.email,
        true
    );

    return res.status(200).json({
        success: true,
        message: "Transaction Successful",
        token,
        order_id: order.orderId
    });
};

exports.purchasePremium = async (req, res) => {
    try {
        if (req.user.isPremiumUser) {
            return res.status(409).json({
                success: false,
                message: "User is already a premium member"
            });
        }

        const result = await createPremiumOrder(req.user);

        return res.status(201).json({
            success: true,
            payment_session_id: result.paymentSessionId,
            order_id: result.orderId
        });
    } catch (err) {
        console.error("Payment order creation failed:", err);
        return res.status(502).json({
            success: false,
            message: "Unable to create payment order"
        });
    }
};

exports.updateTransactionStatus = async (req, res) => {
    try {
        const { order_id: orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        const result = await verifyAndApply({
            orderId,
            userId: req.user._id
        });

        if (result.state === "NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Order Not Found"
            });
        }

        if (result.state === "SUCCESS") {
            return successResponse(res, req.user, result.order);
        }

        if (result.state === "PROCESSING" || result.state === "PENDING") {
            return res.status(202).json({
                success: false,
                pending: true,
                message: "Payment is still being processed. Please check again."
            });
        }

        return res.status(400).json({
            success: false,
            message: "Payment was not successful"
        });
    } catch (err) {
        console.error("Payment verification failed:", err);
        return res.status(502).json({
            success: false,
            message: "Unable to verify payment"
        });
    }
};

// Cashfree may redirect here when popup checkout cannot stay in the same
// window. This endpoint intentionally does NOT grant premium or perform a
// payment side effect. It only sends the browser back to the frontend,
// where the authenticated verification endpoint performs the effect.
exports.cashfreeReturn = async (req, res) => {
    const orderId = typeof req.query.order_id === "string"
        ? req.query.order_id
        : "";

    const appUrl = (process.env.APP_URL || "").replace(/\/+$/, "");

    if (!appUrl) {
        return res.status(500).send("Payment return URL is not configured");
    }

    const target = new URL(`${appUrl}/premium-required.html`);
    if (orderId) target.searchParams.set("order_id", orderId);

    return res.redirect(303, target.toString());
};

// Cashfree webhooks are provider-to-server notifications. Signature
// verification happens before parsing/using the payload.
exports.cashfreeWebhook = async (req, res) => {
    const provider = require("../services/payments/providers/cashfreeProvider");

    try {
        const signature = req.header("x-webhook-signature");
        const timestamp = req.header("x-webhook-timestamp");
        const rawBody = Buffer.isBuffer(req.body)
            ? req.body.toString("utf8")
            : "";

        if (!provider.verifyWebhookSignature({
            signature,
            timestamp,
            rawBody
        })) {
            return res.status(401).json({
                success: false,
                message: "Invalid webhook signature"
            });
        }

        const payload = JSON.parse(rawBody);
        const orderId =
            payload?.data?.order?.order_id ||
            payload?.data?.order?.orderId;

        if (orderId) {
            // Webhook is a trigger to reconcile provider state; provider
            // fetch remains authoritative and idempotent.
            await verifyAndApplyByOrderId(orderId);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Cashfree webhook processing failed:", err);
        return res.status(400).json({
            success: false,
            message: "Invalid webhook"
        });
    }
};
