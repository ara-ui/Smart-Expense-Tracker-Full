const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authentication");
const budgetReauth = require("../middleware/budgetReauth");
const { authLimiter } = require("../middleware/rateLimiter");
const {
    verifyBudgetPassword,
    getBudgetRules,
    updateBudgetRules,
    upsertCategoryLimit,
    deleteCategoryLimit,
    getBudgetStatus
} = require("../controller/budgetController");

router.post("/verify-password", authenticate, authLimiter, verifyBudgetPassword);

router.get("/rules", authenticate, getBudgetRules);
router.put("/rules", authenticate, budgetReauth, updateBudgetRules);

router.post("/rules/category", authenticate, budgetReauth, upsertCategoryLimit);
router.delete("/rules/category/:category", authenticate, budgetReauth, deleteCategoryLimit);

router.get("/status", authenticate, getBudgetStatus);

module.exports = router;
