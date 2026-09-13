const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authentication");

const {
    getWallet,
    updateWallet,
    getBudgetRules,
    updateBudgetRules,
    upsertCategoryLimit,
    deleteCategoryLimit,
    getSummary,
    getBudgetStatus
} = require("../controller/walletController");

router.get("/", authenticate, getWallet);
router.put("/", authenticate, updateWallet);

router.get("/budget-rules", authenticate, getBudgetRules);
router.put("/budget-rules", authenticate, updateBudgetRules);
router.post("/budget-rules/category", authenticate, upsertCategoryLimit);
router.delete("/budget-rules/category/:category", authenticate, deleteCategoryLimit);

router.get("/summary", authenticate, getSummary);
router.get("/budget-status", authenticate, getBudgetStatus);

module.exports = router;
