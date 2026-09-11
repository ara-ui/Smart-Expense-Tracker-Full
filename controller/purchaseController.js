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

        // Create DB Order
        const order = await Order.create({

            status: "PENDING",

            userId: req.user._id

        });

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
        
        // Create Cashfree Order
        const response = await Cashfree.PGCreateOrder(
            "2022-09-01",
            request
        );

        order.orderId = response.data.order_id;

        await order.save();

        res.status(201).json({

            success: true,

            payment_session_id: response.data.payment_session_id,

            order_id: response.data.order_id

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Unable to create order"

        });

    }

};

// Success
exports.updateTransactionStatus = async (req, res) => {

    try {

        // Scoped to the authenticated user - without this, any logged-in
        // user could pass another user's order_id and have that order's
        // payment (if genuinely successful) flip their own account to
        // premium.
        const order = await Order.findOne({
            orderId: req.body.order_id,
            userId: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order Not Found"
            });
        }

       
        const payments = await Cashfree.PGOrderFetchPayments(
            "2022-09-01",
            req.body.order_id
        );

        if (payments.data && payments.data.length > 0) {

            order.status = "SUCCESSFUL";

            // Save Payment ID (optional but recommended)
            order.paymentId = payments.data[0].cf_payment_id;

            await order.save();

            req.user.isPremiumUser = true;
            await req.user.save();

            const token = generateAccessToken(
                req.user._id,
                req.user.name,
                req.user.email,
                true
            );

            return res.status(200).json({
                success: true,
                message: "Transaction Successful",
                token: token
            });
        }

        return res.status(400).json({
            success: false,
            message: "Payment Verification Failed"
        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });

    }

};

// Failed Transaction
exports.failedTransaction = async (req, res) => {

    try {

        // Same ownership scoping as updateTransactionStatus above.
        const order = await Order.findOne({
            orderId: req.body.order_id,
            userId: req.user._id
        });

        if (!order) {

            return res.status(404).json({

                success: false,

                message: "Order Not Found"

            });

        }

        order.status = "FAILED";

        await order.save();

        return res.status(200).json({

            success: true,

            message: "Transaction Failed"

        });

    }

    catch (err) {

        console.log(err);

        return res.status(500).json({

            success: false

        });

    }

};