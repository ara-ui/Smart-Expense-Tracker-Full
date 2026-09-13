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

        // Deprecated legacy budget field. New budgets are stored in BudgetRule.
        // Kept temporarily so the compatibility migration can read old data.
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