const rateLimit = require("express-rate-limit");

/*
|--------------------------------------------------------------------------
| Global API limiter
|--------------------------------------------------------------------------
*/

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // max 500 requests per IP
    standardHeaders: true,
    legacyHeaders: false,
});

/*
|--------------------------------------------------------------------------
| Login protection (anti brute force)
|--------------------------------------------------------------------------
*/

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 login attempts per 15 mins
    message: {
        success: false,
        message: "Too many login attempts. Try again later."
    }
});

/*
|--------------------------------------------------------------------------
| Wallet operation limiter
|--------------------------------------------------------------------------
*/

const walletLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30, // 30 wallet operations per 10 mins
});

/*
|--------------------------------------------------------------------------
| Withdrawal limiter (very strict)
|--------------------------------------------------------------------------
*/

const withdrawLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5, // 5 withdrawals per hour per IP
});

/*
|--------------------------------------------------------------------------
| Admin limiter
|--------------------------------------------------------------------------
*/

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

const actionCooldown = (actionKey, cooldownMs = 5000) => {
    return (req, res, next) => {
        const userId = req.user?.id;
        if (!userId) return next();

        const key = `${userId}_${actionKey}`;
        const now = Date.now();

        if (recentActions.has(key)) {
            const lastTime = recentActions.get(key);
            if (now - lastTime < cooldownMs) {
                return res.status(429).json({
                    error: "Please wait before repeating this action"
                });
            }
        }

        recentActions.set(key, now);
        next();
    };
};

module.exports.actionCooldown = actionCooldown;

module.exports = {
    globalLimiter,
    loginLimiter,
    walletLimiter,
    withdrawLimiter,
    adminLimiter
};
