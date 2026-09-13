const mongoose = require("mongoose");

// Money is stored as an integer number of paise (1 INR = 100 paise), never
// as a JavaScript float, to avoid rounding errors. Convert rupees <-> paise
// only at the edges (frontend display / request parsing).
//
// This is a VIRTUAL budgeting ledger the user tracks their own spending
// allowance against - it is NOT a real-money custodial wallet. No funds
// are ever actually held, moved, deposited, or withdrawn by this app.
const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        balancePaise: {
            type: Number,
            required: true,
            default: 0,
            validate: {
                validator: (v) => Number.isInteger(v) && v >= 0,
                message: "balancePaise must be a non-negative integer (paise, not rupees)"
            }
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
