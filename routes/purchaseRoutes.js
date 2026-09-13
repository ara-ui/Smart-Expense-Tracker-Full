const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authentication");
const { paymentLimiter } = require("../middleware/rateLimiter");

const {
    purchasePremium,
    updateTransactionStatus
} = require("../controller/purchaseController");

router.get(
    "/premiummembership",
    authenticate,
    paymentLimiter,
    purchasePremium
);

router.post(
    "/updatetransactionstatus",
    authenticate,
    paymentLimiter,
    updateTransactionStatus
);

module.exports = router;
