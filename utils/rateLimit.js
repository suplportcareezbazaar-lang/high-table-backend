const rateLimit = require("express-rate-limit");

/* ===== AUTH LIMIT (login / register) ===== */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10,                 // 10 attempts
    message: { error: "Too many attempts. Try again later." }
});

/* ===== PAYMENT LIMIT ===== */
const paymentLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: "Too many payment requests. Slow down." }
});

/* ===== BET LIMIT ===== */
const betLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: "Betting too fast. Wait a moment." }
});

/* ===== WITHDRAW LIMIT ===== */
const withdrawLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3,
    message: { error: "Withdrawal limit reached for today." }
});

module.exports = {
    authLimiter,
    paymentLimiter,
    betLimiter,
    withdrawLimiter
};