const Transaction = require("../../model/Transaction");

const getHistory = async ({ userId, limit = 5 }) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 50);
    return Transaction.find({
        userId,
        purpose: "EXPENSE_PAYMENT"
    })
        .select("amountMinor currency provider orderId providerTransactionId status paymentMethod transactionDate remark expenseId createdAt")
        .sort({ transactionDate: -1, createdAt: -1 })
        .limit(safeLimit)
        .lean();
};

const getTransactionDetails = async ({ userId, transactionId }) => {
    return Transaction.findOne({
        _id: transactionId,
        userId,
        purpose: "EXPENSE_PAYMENT"
    })
        .select("amountMinor currency provider orderId providerTransactionId status paymentMethod transactionDate remark expenseId createdAt")
        .lean();
};

module.exports = { getHistory, getTransactionDetails };
