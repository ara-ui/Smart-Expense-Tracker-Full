const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        // Provider-facing order identifier. Kept opaque/random so internal
        // MongoDB IDs are never exposed to a payment provider or URL.
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        provider: {
            type: String,
            required: true,
            enum: ["cashfree"],
            default: "cashfree",
            index: true
        },

        purpose: {
            type: String,
            required: true,
            enum: ["PREMIUM_MEMBERSHIP", "EXPENSE_PAYMENT"],
            default: "PREMIUM_MEMBERSHIP",
            index: true
        },

        amountMinor: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "amountMinor must be an integer"
            }
        },

        currency: {
            type: String,
            required: true,
            enum: ["INR"],
            default: "INR"
        },

        paymentSessionId: {
            type: String,
            default: null
        },

        paymentId: {
            type: String,
            default: null,
            index: true
        },

        // User-entered context for an expense payment. Kept on the order so
        // the verified payment can create the expense without trusting the
        // browser after checkout.
        remark: {
            type: String,
            default: null,
            trim: true
        },

        expenseCategory: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: ["PENDING", "PROCESSING", "SUCCESSFUL", "FAILED"],
            required: true,
            default: "PENDING",
            index: true
        },

        processingStartedAt: {
            type: Date,
            default: null
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // Client supplied idempotency key. Scoped by user so a retried
        // request cannot create a second local order.
        idempotencyKey: {
            type: String,
            default: null,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ provider: 1, orderId: 1 }, { unique: true });
orderSchema.index(
    { userId: 1, idempotencyKey: 1 },
    { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

module.exports = mongoose.model("Order", orderSchema);
