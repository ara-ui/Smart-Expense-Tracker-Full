const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../../model/Order");
const { User } = require("../../model");
const { getProvider } = require("./providerRegistry");
const { applyPurposeEffect } = require("./purposeHandlers");
const { upsertTransaction } = require("./transactionService");

const PROCESSING_LEASE_MS = 2 * 60 * 1000;

const createPremiumOrder = async (user) => {
    const orderId = `ORDER_${crypto.randomUUID().replace(/-/g, "")}`;

    const order = await Order.create({
        orderId,
        provider: "cashfree",
        purpose: "PREMIUM_MEMBERSHIP",
        amountMinor: 50000,
        currency: "INR",
        status: "PENDING",
        userId: user._id
    });

    try {
        const provider = getProvider(order.provider);
        const created = await provider.createOrder({
            orderId: order.orderId,
            amountMinor: order.amountMinor,
            currency: order.currency,
            user
        });

        order.paymentSessionId = created.paymentSessionId;
        await order.save();

        return {
            orderId: order.orderId,
            paymentSessionId: order.paymentSessionId
        };
    } catch (err) {
        await Order.updateOne(
            { _id: order._id, status: "PENDING" },
            { $set: { status: "FAILED" } }
        );
        throw err;
    }
};

const getOrderForUser = async (orderId, userId) => {
    return Order.findOne({ orderId, userId });
};

const claimOrder = async (orderId, userId) => {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - PROCESSING_LEASE_MS);

    return Order.findOneAndUpdate(
        {
            orderId,
            userId,
            $or: [
                { status: "PENDING" },
                { status: "PROCESSING", processingStartedAt: { $lt: staleBefore } }
            ]
        },
        {
            $set: {
                status: "PROCESSING",
                processingStartedAt: now
            }
        },
        { new: true }
    );
};

const verifyAndApply = async ({ orderId, userId }) => {
    const existing = await getOrderForUser(orderId, userId);

    if (!existing) {
        return { state: "NOT_FOUND" };
    }

    if (existing.status === "SUCCESSFUL") {
        await upsertTransaction({
            order: existing,
            status: "SUCCESS"
        });
        return { state: "SUCCESS", order: existing };
    }

    if (existing.status === "FAILED") {
        await upsertTransaction({
            order: existing,
            status: "FAILED"
        });
        return { state: "FAILED", order: existing };
    }

    const order = await claimOrder(orderId, userId);

    if (!order) {
        const current = await getOrderForUser(orderId, userId);

        if (current?.status === "SUCCESSFUL") {
            return { state: "SUCCESS", order: current };
        }

        if (current?.status === "FAILED") {
            return { state: "FAILED", order: current };
        }

        return { state: "PROCESSING", order: current };
    }

    const provider = getProvider(order.provider);
    const payment = await provider.getPayments(order.orderId);

    if (payment.state === "PENDING") {
        await Order.updateOne(
            { _id: order._id, status: "PROCESSING" },
            {
                $set: { status: "PENDING" },
                $unset: { processingStartedAt: 1 }
            }
        );

        await upsertTransaction({
            order,
            payment,
            status: "PENDING"
        });

        return { state: "PENDING", order };
    }

    if (payment.state === "FAILED") {
        const failedUpdate = {
            $set: { status: "FAILED" },
            $unset: { processingStartedAt: 1 }
        };

        if (payment.paymentId) {
            failedUpdate.$set.paymentId = payment.paymentId;
        }

        await Order.updateOne(
            { _id: order._id, status: "PROCESSING" },
            failedUpdate
        );

        await upsertTransaction({
            order,
            payment,
            status: "FAILED"
        });

        return { state: "FAILED", order };
    }

    // SUCCESS: transition PROCESSING -> SUCCESSFUL and apply the business
    // effect in one MongoDB transaction. A second concurrent verifier cannot
    // pass the PROCESSING predicate and therefore cannot apply the effect.
    const session = await mongoose.startSession();

    try {
        let finalized = false;

        await session.withTransaction(async () => {
            const current = await Order.findOneAndUpdate(
                { _id: order._id, status: "PROCESSING" },
                {
                    $set: {
                        status: "SUCCESSFUL",
                        paymentId: payment.paymentId,
                        processingStartedAt: null
                    }
                },
                { new: true, session }
            );

            if (!current) return;

            finalized = true;

            await upsertTransaction({
                order: current,
                payment,
                status: "SUCCESS",
                session
            });

            await applyPurposeEffect({
                order: current,
                session
            });
        });

        if (!finalized) {
            const current = await getOrderForUser(orderId, userId);
            return current?.status === "SUCCESSFUL"
                ? { state: "SUCCESS", order: current }
                : { state: "PROCESSING", order: current };
        }

        const finalOrder = await getOrderForUser(orderId, userId);
        return { state: "SUCCESS", order: finalOrder };
    } finally {
        await session.endSession();
    }
};

const verifyAndApplyByOrderId = async (orderId) => {
    const order = await Order.findOne({ orderId });

    if (!order) return { state: "NOT_FOUND" };

    return verifyAndApply({
        orderId,
        userId: order.userId
    });
};

module.exports = {
    createPremiumOrder,
    getOrderForUser,
    verifyAndApply,
    verifyAndApplyByOrderId
};
