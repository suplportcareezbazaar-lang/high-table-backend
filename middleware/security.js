const rateLimit = require("express-rate-limit");
const ipFailures = new Map();
const ipBlocks = new Map();

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

const ipProtection = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // If IP is blocked
    if (ipBlocks.has(ip)) {
        const blockUntil = ipBlocks.get(ip);
        if (now < blockUntil) {
            return res.status(403).json({
                error: "Your IP is temporarily blocked due to suspicious activity"
            });
        } else {
            ipBlocks.delete(ip);
            ipFailures.delete(ip);
        }
    }

    next();
};

const registerFailure = (ip) => {
    const now = Date.now();

    const record = ipFailures.get(ip) || { count: 0, firstAttempt: now };

    record.count += 1;

    // If more than 5 failures in 10 minutes → block 15 min
    if (record.count >= 5 && (now - record.firstAttempt < 10 * 60 * 1000)) {
        ipBlocks.set(ip, now + 15 * 60 * 1000);
        ipFailures.delete(ip);
    } else {
        ipFailures.set(ip, record);
    }
};

module.exports = {
    globalLimiter,
    loginLimiter,
    walletLimiter,
    withdrawLimiter,
    adminLimiter,
    actionCooldown,
    ipProtection,
    registerFailure
};
