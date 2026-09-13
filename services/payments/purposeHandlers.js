const { User } = require("../../model");

const handlers = {
    PREMIUM_MEMBERSHIP: async ({ order, session }) => {
        // The order state transition and this user update happen in the same
        // MongoDB transaction. If the transaction fails, premium is not
        // granted and the order does not become SUCCESSFUL.
        const user = await User.findById(order.userId).session(session);

        if (!user) {
            throw new Error("Payment owner no longer exists");
        }

        user.isPremiumUser = true;
        await user.save({ session });
    }
};

const applyPurposeEffect = async ({ order, session }) => {
    const handler = handlers[order.purpose];

    if (!handler) {
        throw new Error(`Unsupported payment purpose: ${order.purpose}`);
    }

    await handler({ order, session });
};

module.exports = { applyPurposeEffect };
