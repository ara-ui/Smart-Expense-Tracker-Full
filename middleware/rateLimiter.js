const rateLimit = require("express-rate-limit");

// Applied to login/register. Generous enough for normal retry-after-typo
// use, tight enough to slow down credential stuffing/brute force.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many attempts. Please try again later."
    }
});

// Applied to forgot-password / OTP request+verify endpoints, where
// abuse (spamming a mailbox, or brute-forcing a 6-digit OTP) is the
// specific risk.
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many attempts. Please try again later."
    }
});

// Applied to payment-related endpoints. Looser than the auth/OTP limiters
// since a normal checkout can involve a couple of status-check calls, but
// still bounded.
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

module.exports = { authLimiter, otpLimiter, paymentLimiter };
