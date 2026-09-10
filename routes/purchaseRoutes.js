const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authentication");
const { paymentLimiter } = require("../middleware/rateLimiter");

const {

    purchasePremium,

    updateTransactionStatus,

    failedTransaction

} = require("../controller/purchaseController");

router.get("/premiummembership",authenticate,paymentLimiter,purchasePremium);

router.post("/updatetransactionstatus",authenticate,paymentLimiter,updateTransactionStatus);

router.post("/failedtransaction",authenticate,paymentLimiter,failedTransaction);

module.exports = router;