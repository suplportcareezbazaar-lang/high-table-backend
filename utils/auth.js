const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

/**
 * 🔐 SINGLE SOURCE OF TRUTH FOR JWT SECRET
 * Must match server.js exactly
 */
//JWT_SECRET=very_long_secure_random_string

/* ================= AUTH MIDDLEWARE ================= */

function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization token missing" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

/* ================= TOKEN CREATION ================= */

function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
            username: user.username,
            country: user.country || "IN",
            agentId: user.agentId || null
        },
        SECRET,
        { expiresIn: process.env.JWT_EXPIRES || "24h" }
    );
}

/* ================= ROLE GUARDS ================= */

function adminOnly(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
    }
    next();
}

function agentOnly(req, res, next) {
    if (req.user.role !== "agent") {
        return res.status(403).json({ error: "Agent only" });
    }
    next();
}

module.exports = {
    auth,
    createToken,
    adminOnly,
    agentOnly
};
