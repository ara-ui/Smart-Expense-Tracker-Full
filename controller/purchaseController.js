const { Cashfree } = require("cashfree-pg");
const Order = require("../model/Order");
const { generateAccessToken } = require("../utils/jwt");

// Cashfree Configuration
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = Cashfree.SANDBOX;

// Create Order
exports.purchasePremium = async (req, res) => {
    try {
        const cashfreeOrderId = "ORDER_" + Date.now();

        const request = {
            order_id: cashfreeOrderId,
            order_amount: 500,
            order_currency: "INR",
            customer_details: {
                customer_id: req.user._id.toString(),
                customer_email: req.user.email,
                customer_phone: "9999999999"
            }
        };

        // Create order in Cashfree first
        const response = await Cashfree.PGCreateOrder(
            "2022-09-01",
            request
        );

        // Make sure Cashfree actually returned a usable order
        if (
            !response.data ||
            !response.data.order_id ||
            !response.data.payment_session_id
        ) {
            return res.status(502).json({
                success: false,
                message: "Unable to create order"
            });
        }

        // Store local order only after Cashfree order creation succeeds
        await Order.create({
            status: "PENDING",
            orderId: response.data.order_id,
            userId: req.user._id
        });

        return res.status(201).json({
            success: true,
            payment_session_id: response.data.payment_session_id,
            order_id: response.data.order_id
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Unable to create order"
        });
    }
};


// Verify Transaction
exports.updateTransactionStatus = async (req, res) => {
    try {
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        // Ownership check prevents IDOR
        const order = await Order.findOne({
            orderId: order_id,
            userId: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order Not Found"
            });
        }

        // Idempotency:
        // If already successful, don't process it again.
        if (order.status === "SUCCESSFUL") {
            const token = generateAccessToken(
                req.user._id,
                req.user.name,
                req.user.email,
                true
            );

            return res.status(200).json({
                success: true,
                message: "Transaction Successful",
                token
            });
        }

        // Fetch actual payment details from Cashfree
        const payments = await Cashfree.PGOrderFetchPayments(
            "2022-09-01",
            order_id
        );

        // Only a payment with actual SUCCESS status is accepted
        const successfulPayment = Array.isArray(payments.data)
            ? payments.data.find(
                (payment) => payment.payment_status === "SUCCESS"
            )
            : null;

        if (!successfulPayment) {
            return res.status(400).json({
                success: false,
                message: "Payment Verification Failed"
            });
        }

        // Mark order successful
        order.status = "SUCCESSFUL";
        order.paymentId = successfulPayment.cf_payment_id;

        await order.save();

        // Upgrade user only after successful Cashfree verification
        if (!req.user.isPremiumUser) {
            req.user.isPremiumUser = true;
            await req.user.save();
        }

        // Generate updated JWT with premium status
        const token = generateAccessToken(
            req.user._id,
            req.user.name,
            req.user.email,
            true
        );

        return res.status(200).json({
            success: true,
            message: "Transaction Successful",
            token
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


// Handle Failed Transaction
exports.failedTransaction = async (req, res) => {
    try {
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        // Ownership check
        const order = await Order.findOne({
            orderId: order_id,
            userId: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order Not Found"
            });
        }

        // Never change a successful payment back to failed
        if (order.status === "SUCCESSFUL") {
            return res.status(409).json({
                success: false,
                message: "Order already completed successfully"
            });
        }

        order.status = "FAILED";

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Transaction Failed"
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};