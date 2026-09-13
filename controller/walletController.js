const Wallet = require("../model/Wallet");
const BudgetRule = require("../model/BudgetRule");
const { CATEGORIES } = require("../utils/categories");

const PERIODS = ["daily", "weekly", "monthly"];

const isPositiveInt = (v) => Number.isInteger(v) && v > 0;
const isNonNegativeInt = (v) => Number.isInteger(v) && v >= 0;

// Every lookup below is scoped to req.user._id (set by the authenticate
// middleware) - never to an id supplied by the client - so there is no
// wallet/budget-rule id in the API surface for another user's data to leak
// through.

const getOrCreateWallet = async (userId) => {
    const existing = await Wallet.findOne({ userId });
    if (existing) return existing;

    try {
        return await Wallet.create({ userId });
    } catch (err) {
        // Two concurrent first-time requests could both miss the findOne
        // above; the unique index on userId lets only one create() win.
        if (err.code === 11000) {
            return await Wallet.findOne({ userId });
        }
        throw err;
    }
};

const getOrCreateBudgetRule = async (userId) => {
    const existing = await BudgetRule.findOne({ userId });
    if (existing) return existing;

    try {
        return await BudgetRule.create({ userId });
    } catch (err) {
        if (err.code === 11000) {
            return await BudgetRule.findOne({ userId });
        }
        throw err;
    }
};

// GET /wallet
exports.getWallet = async (req, res) => {
    try {
        const wallet = await getOrCreateWallet(req.user._id);
        res.status(200).json({ success: true, wallet });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

// PUT /wallet
// Sets the user's tracked spending-allowance balance. This does not move
// any real money - it's the user manually recording/adjusting their own
// virtual budget figure.
exports.updateWallet = async (req, res) => {
    try {
        const { balancePaise } = req.body;

        if (!isNonNegativeInt(balancePaise)) {
            return res.status(400).json({
                success: false,
                message: "balancePaise must be a non-negative integer (paise)"
            });
        }

        const wallet = await getOrCreateWallet(req.user._id);
        wallet.balancePaise = balancePaise;
        await wallet.save();

        res.status(200).json({ success: true, wallet });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

// GET /wallet/budget-rules
exports.getBudgetRules = async (req, res) => {
    try {
        const budgetRules = await getOrCreateBudgetRule(req.user._id);
        res.status(200).json({ success: true, budgetRules });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

// PUT /wallet/budget-rules
// Updates the overall daily/weekly/monthly limits. Any field left out of
// the body is untouched; sending a field as null clears that limit.
exports.updateBudgetRules = async (req, res) => {
    try {
        const { dailyLimitPaise, weeklyLimitPaise, monthlyLimitPaise } = req.body;
        const fields = { dailyLimitPaise, weeklyLimitPaise, monthlyLimitPaise };

        for (const [key, value] of Object.entries(fields)) {
            if (value === undefined) continue;
            if (value !== null && !isPositiveInt(value)) {
                return res.status(400).json({
                    success: false,
                    message: `${key} must be a positive integer (paise) or null to clear it`
                });
            }
        }

        const budgetRules = await getOrCreateBudgetRule(req.user._id);

        if (dailyLimitPaise !== undefined) budgetRules.dailyLimitPaise = dailyLimitPaise;
        if (weeklyLimitPaise !== undefined) budgetRules.weeklyLimitPaise = weeklyLimitPaise;
        if (monthlyLimitPaise !== undefined) budgetRules.monthlyLimitPaise = monthlyLimitPaise;

        await budgetRules.save();

        res.status(200).json({ success: true, budgetRules });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

// POST /wallet/budget-rules/category  { category, period?, limitPaise }
// Creates or updates the limit for one category+period pair.
exports.upsertCategoryLimit = async (req, res) => {
    try {
        const { category, limitPaise } = req.body;
        const period = req.body.period || "monthly";

        if (!CATEGORIES.includes(category)) {
            return res.status(400).json({ success: false, message: "Invalid category" });
        }

        if (!PERIODS.includes(period)) {
            return res.status(400).json({ success: false, message: "Invalid period" });
        }

        if (!isPositiveInt(limitPaise)) {
            return res.status(400).json({
                success: false,
                message: "limitPaise must be a positive integer (paise)"
            });
        }

        const budgetRules = await getOrCreateBudgetRule(req.user._id);

        const existing = budgetRules.categoryLimits.find(
            (c) => c.category === category && c.period === period
        );

        if (existing) {
            existing.limitPaise = limitPaise;
        } else {
            budgetRules.categoryLimits.push({ category, period, limitPaise });
        }

        await budgetRules.save();

        res.status(200).json({ success: true, budgetRules });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

// DELETE /wallet/budget-rules/category/:category?period=monthly
exports.deleteCategoryLimit = async (req, res) => {
    try {
        const { category } = req.params;
        const period = req.query.period || "monthly";

        if (!CATEGORIES.includes(category)) {
            return res.status(400).json({ success: false, message: "Invalid category" });
        }

        if (!PERIODS.includes(period)) {
            return res.status(400).json({ success: false, message: "Invalid period" });
        }

        const budgetRules = await getOrCreateBudgetRule(req.user._id);

        const before = budgetRules.categoryLimits.length;
        budgetRules.categoryLimits = budgetRules.categoryLimits.filter(
            (c) => !(c.category === category && c.period === period)
        );

        if (budgetRules.categoryLimits.length === before) {
            return res.status(404).json({
                success: false,
                message: "No matching category limit found"
            });
        }

        await budgetRules.save();

        res.status(200).json({ success: true, budgetRules });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

// GET /wallet/summary - wallet + budget-rule config together, for a
// dashboard to render in one call. No calculation against real expenses
// yet - that's the budget engine, which is a later phase.
exports.getSummary = async (req, res) => {
    try {
        const [wallet, budgetRules] = await Promise.all([
            getOrCreateWallet(req.user._id),
            getOrCreateBudgetRule(req.user._id)
        ]);

        res.status(200).json({ success: true, wallet, budgetRules });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};
