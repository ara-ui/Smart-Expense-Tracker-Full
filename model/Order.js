const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true
        },

        paymentId: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: ["PENDING", "SUCCESSFUL", "FAILED"],
            required: true,
            default: "PENDING"
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);