const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true
        },

        password: {
            type: String,
            required: true
        },

        totalExpense: {
            type: Number,
            default: 0
        },

        isPremiumUser: {
            type: Boolean,
            default: false
        },

        monthlyIncome: {
            type: Number,
            default: 0
        },

        monthlyBudget: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);