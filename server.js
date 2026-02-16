require("dotenv").config();
const connectDB = require("./src/config/db");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
//const ledger = require("./utils/ledger");
const User = require("./src/models/User");
const Wallet = require("./src/models/Wallet");
const Ledger = require("./src/models/Ledger");
const Deposit = require("./src/models/Deposit");
const Bet = require("./src/models/Bet");
const Withdrawal = require("./src/models/Withdrawal");
const mongoose = require("mongoose");

const {
    globalLimiter,
    loginLimiter,
    walletLimiter,
    withdrawLimiter,
    adminLimiter,
    actionCooldown,
    ipProtection,
    registerFailure
} = require("./middleware/security");

const {
    authLimiter,
    paymentLimiter,
    betLimiter
} = require("./utils/rateLimit");

const recentActions = new Map();

const { auth, agentOnly, adminOnly } = require("./utils/auth");

const { getAllMatches, getAllResults } = require("./services");

const app = express();
app.use(helmet({
    contentSecurityPolicy: false
}));

app.use(globalLimiter);
app.use(ipProtection);
app.disable("x-powered-by");

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);

const DEV_MODE = process.env.NODE_ENV !== "production";

const allowedOrigins = process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL]
    : [
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

/* ================== AUTH ================== */

//function auth(req, res, next) {
//  const header = req.headers.authorization;
//if (!header) return res.status(401).json({ error: "No token" });

//const token = header.startsWith("Bearer ")
//  ? header.split(" ")[1]
//: header;

//try {
//  req.user = jwt.verify(token, SECRET);
//next();
//} catch {
//  return res.status(401).json({ error: "Invalid token" });
//}
//}

//function adminOnly(req, res, next) {
//  if (req.user.role !== "admin")
//    return res.status(403).json({ error: "Admin access only" });
//next();
//}

//function agentOnly(req, res, next) {
//  if (req.user.role !== "agent")
//    return res.status(403).json({ error: "Agent only" });
//next();
//}

app.post("/api/deposit/init", auth, paymentLimiter, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount < 100) {
            return res.status(400).json({ error: "Minimum deposit is 100" });
        }

        const depositId = "DEP_" + uuidv4();

        // Save init record
        await Deposit.create({
            depositId,
            userId: req.user.id,
            amount: Number(amount),
            status: "INITIATED"
        });

        // Prepare body for IMB (x-www-form-urlencoded)
        const body = new URLSearchParams();
        body.append("customer_mobile", "9876543210");
        body.append("user_token", process.env.IMB_USER_TOKEN);
        body.append("amount", amount);
        body.append("order_id", depositId);
        body.append("redirect_url", "https://example.com/payment-success");
        body.append("remark1", req.user.username || "User");
        body.append("remark2", "wallet_deposit");

        const response = await axios.post(
            "https://secure-stage.imb.org.in/api/create-order",
            body,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-API-KEY": process.env.IMB_API_KEY,
                    "Accept": "application/json"
                },
                timeout: 20000
            }
        );

        if (DEV_MODE) {
            console.log("IMB CREATE ORDER SUCCESS:", response.data);
        }

        return res.json({
            success: true,
            payment_url: response.data.payment_link
        });

    } catch (err) {
        console.error("IMB CREATE ORDER FAILED");
        console.error("RESP STATUS:", err.response?.status);
        console.error("RESP DATA:", err.response?.data);
        console.error("MESSAGE:", err.message);

        return res.status(500).json({ error: "Payment gateway error" });
    }
});

/* ================== IMB PAYMENT WEBHOOK ================== */

app.post("/api/payment/webhook", paymentLimiter, async (req, res) => {

    if (req.headers["x-webhook-secret"] !== process.env.IMB_WEBHOOK_SECRET) {
        return res.status(403).json({ error: "Unauthorized webhook" });
    }

    try {
        const payload = req.body;

        /*
          Expected IMB payload example:
          {
            order_id: "DEP_xxx",
            status: "SUCCESS" | "FAILED",
            amount: 500,
            utr: "123456789",
            reference_id: "IMB_xxx"
          }
        */

        const {
            order_id,
            status,
            amount,
            utr,
            reference_id
        } = payload;

        if (!order_id || !status) {
            return res.status(400).json({ error: "Invalid webhook payload" });
        }

        const deposit = await Deposit.findOne({ depositId: order_id });

        if (!deposit) {
            console.error("❌ Deposit not found:", order_id);
            return res.status(404).json({ error: "Deposit not found" });
        }

        // 🔒 CRITICAL: prevent double credit
        if (deposit.status === "CONFIRMED") {
            return res.json({ message: "Already processed" });
        }

        if (status !== "SUCCESS") {
            deposit.status = "FAILED";
            deposit.confirmedAt = new Date().toISOString();
            await deposit.save();

            return res.json({ message: "Payment failed recorded" });
        }

        // ================= SUCCESS PAYMENT =================

        deposit.status = "CONFIRMED";
        deposit.utr = utr || null;
        deposit.gatewayOrderId = reference_id || null;
        deposit.confirmedAt = new Date().toISOString();

        await deposit.save();

        // ================= LEDGER CREDIT =================

        const { updateBalance } = require("./src/services/wallet.service");

        await updateBalance({
            userId: deposit.userId,
            amount: Number(amount),
            type: "deposit",
            ref: deposit.depositId,
            meta: {
                gateway: "IMB",
                currency: "INR"
            }
        });

        console.log("✅ Deposit confirmed & ledger credited:", order_id);

        res.json({ success: true });

    } catch (err) {
        console.error("❌ WEBHOOK ERROR:", err.message);
        res.status(500).json({ error: "Webhook processing failed" });
    }
});

/* ================== REGISTER ================== */

app.post("/api/register", loginLimiter, authLimiter, async (req, res) => {
    try {
        const { username, email, mobile, password } = req.body;

        if (!username || !email || !mobile || !password) {
            return res.status(400).json({ error: "All fields required" });
        }

        const existing = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existing) {
            return res.status(400).json({ error: "User already exists" });
        }

        const bcrypt = require("bcryptjs");
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            mobile,
            passwordHash,
            role: "user",
            approved: true
        });

        await Wallet.create({
            userId: user._id,
            balance: 0
        });

        res.json({
            message: "Registered successfully",
            userId: user._id
        });

    } catch (err) {
        console.error("REGISTER ERROR:", err.message);
        res.status(500).json({ error: "Registration failed" });
    }
});

/* ================== LOGIN ================== */

const { createToken } = require("./utils/auth");

app.post("/api/login", loginLimiter, authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            registerFailure(req.ip);
            return res.status(400).json({ error: "Invalid login" });
        }
        
        const bcrypt = require("bcryptjs");
        const ok = await bcrypt.compare(password, user.passwordHash);

        if (!ok) {
            registerFailure(req.ip);
            return res.status(401).json({ error: "Wrong password" });
        }

        const token = createToken({
            id: user._id,
            role: user.role,
            username: user.username,
            country: user.country,
            agentId: user.agentId
        });

        res.json({
            token,
            role: user.role,
            userId: user._id
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err.message);
        res.status(500).json({ error: "Login failed" });
    }
});

const crypto = require("crypto");

app.post("/api/password/forgot", async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    res.json({ message: "Reset link sent" });
});

app.post("/api/password/reset", async (req, res) => {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
        resetToken: token,
        resetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetExpires = undefined;

    await user.save();

    res.json({ message: "Password updated successfully" });
});

// ================= MATCH API =================
const { getLogo } = require("./utils/logoMap");

app.get("/api/matches", async (req, res) => {
    try {
        const rawMatches = await getAllMatches();

        const matches = rawMatches.map(m => ({
            ...m,

            // ✅ attach logos safely
            team1Logo: m.team1Logo || null,
            team2Logo: m.team2Logo || null,
            leagueLogo: m.leagueLogo || null,
            sportLogo: getLogo(m.sport)

            // optional league / sport logos (future use)
            //leagueLogo: getLogo(m.league),
        }));

        res.json(matches);
    } catch (err) {
        console.error("❌ /api/matches error:", err.message);
        res.status(500).json([]);
    }
});

// ================= RESULT API =================
app.get("/api/results", async (req, res) => {
    try {
        const results = await getAllResults();
        res.json(results);
    } catch (err) {
        console.error("❌ /api/results error:", err.message);
        res.status(500).json([]);
    }
});

/* ================== WALLET ================== */

app.get("/api/wallet", auth, async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.user.id });

        if (!wallet) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        const history = await Ledger.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            balance: wallet.balance,
            history
        });

    } catch (err) {
        console.error("WALLET ERROR:", err.message);
        res.status(500).json({ error: "Failed to load wallet" });
    }
});

/* ================== LOGOUT (FRONTEND SAFE) ================== */

app.post("/api/logout", (req, res) => {
    // JWT logout = frontend deletes token
    res.json({ message: "Logged out" });
});

/* ================== BANK ================== */

/* ================== WITHDRAW ================== */
app.post("/api/wallet/withdraw",
    withdrawLimiter,
    auth,
    actionCooldown("withdraw", 10000),
    async (req, res) => {
        const { amount } = req.body;

        if (!amount || amount < 500) {
            return res.status(400).json({ error: "Minimum withdrawal is 500" });
        }

        try {
            // 🛑 DAILY LIMIT CHECK (3 per 24h)
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const withdrawCount = await Withdrawal.countDocuments({
                userId: req.user.id,
                createdAt: { $gte: last24h }
            });

            if (withdrawCount >= 3) {
                return res.status(400).json({
                    error: "Daily withdrawal limit reached (3 per 24h)"
                });
            }

            const session = await mongoose.startSession();
            session.startTransaction();

            const wallet = await Wallet.findOne({
                userId: req.user.id
            }).session(session);

            if (!wallet) throw new Error("Wallet not found");

            if (wallet.balance < amount)
                throw new Error("Insufficient balance");

            // 🔐 Lock balance immediately
            wallet.balance -= amount;
            await wallet.save({ session });

            const withdrawalId = "WD_" + Date.now();

            await Withdrawal.create([{
                withdrawalId,
                userId: req.user.id,
                amount,
                lockedAmount: amount,
                status: "PENDING"
            }], { session });

            await Ledger.create([{
                userId: req.user.id,
                type: "withdraw_lock",
                amount: -amount,
                balanceAfter: wallet.balance,
                ref: withdrawalId,
                meta: { action: "withdraw_request" }
            }], { session });

            await session.commitTransaction();
            session.endSession();

            res.json({ message: "Withdrawal request submitted" });

        } catch (err) {
            console.error("WITHDRAW ERROR:", err.message);
            res.status(400).json({ error: err.message });
        }
    });


// ================== WALLET HISTORY ================== 

// ================== BET HISTORY ==================

function minutesDiff(startTime) {
    const now = new Date();
    const matchTime = new Date(startTime);
    return Math.floor((matchTime - now) / 60000);
}

/* ================== ✅ MATCHES API (FINAL FIX) ================== 
app.get("/api/matches", (req, res) => {
    try {
        const matches = readJSON("./data/matches.json");

        
         * ⚠️ IMPORTANT
         * DO NOT recompute or override status here.
         * Status already comes correctly from CricAPI.
         

        const cleaned = matches.map(m => ({
            id: m.externalMatchId,
            sport: m.sport,
            league: m.league,
            team1: m.team1,
            team2: m.team2,
            startTime: m.startTime,
            status: m.status,          // live | upcoming | finished
            bettingOpen: m.bettingOpen // derived earlier
        }));

        res.json(cleaned);
    } catch (err) {
        console.error("MATCH API ERROR:", err);
        res.status(500).json({ error: "Failed to load matches" });
    }
}); */

app.post("/api/bet/place",
    auth,
    betLimiter,
    actionCooldown("bet", 5000),
    async (req, res) => {
        const { matchId, team, amount } = req.body;

        if (!matchId || !team || !amount)
            return res.status(400).json({ error: "Missing fields" });

        if (amount < 20)
            return res.status(400).json({ error: "Minimum bet is 20 tokens" });

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 🔐 Check existing pending bet
            const existing = await Bet.findOne({
                userId: req.user.id,
                matchId,
                status: "pending"
            }).session(session);

            if (existing) {
                throw new Error("You already have an active bet on this match");
            }

            // 🔐 Load wallet
            const wallet = await Wallet.findOne({
                userId: req.user.id
            }).session(session);

            if (!wallet) throw new Error("Wallet not found");

            if (wallet.balance < amount)
                throw new Error("Insufficient balance");

            // 🔐 Deduct balance
            wallet.balance -= Number(amount);
            await wallet.save({ session });

            // 🔐 Create bet
            const bet = await Bet.create([{
                userId: req.user.id,
                matchId,
                selectedTeam: team,
                mainBet: Math.floor(amount * 0.75),
                hedgeBet: Math.floor(amount * 0.25),
                odds: 2,
                status: "pending"
            }], { session });

            // 🔐 Create ledger entry
            await Ledger.create([{
                userId: req.user.id,
                type: "bet",
                amount: -Number(amount),
                balanceAfter: wallet.balance,
                ref: bet[0]._id,
                meta: { matchId, team }
            }], { session });

            // 🔐 Agent commission (Mongo version)
            const bettor = await User.findById(req.user.id).session(session);

            if (bettor?.agentId) {
                const agent = await User.findOne({
                    _id: bettor.agentId,
                    role: "agent",
                    approved: true
                }).session(session);

                if (agent) {
                    await Ledger.create([{
                        userId: agent._id,
                        type: "commission",
                        amount: Math.floor(amount * 0.02),
                        balanceAfter: 0, // optional (we'll improve later)
                        ref: bet[0]._id,
                        meta: { downline: bettor._id }
                    }], { session });

                    await Wallet.updateOne(
                        { userId: agent._id },
                        { $inc: { balance: Math.floor(amount * 0.02) } },
                        { session }
                    );
                }
            }

            await session.commitTransaction();
            session.endSession();

            res.json({ message: "Bet placed successfully" });

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ error: err.message });
        }
    });

const { processPayouts } = require("./workers/payoutWorker");

if (process.env.NODE_ENV === "production") {
    setInterval(() => {
        processPayouts()
            .then(() => console.log("💸 Auto payout cycle complete"))
            .catch(err => console.error("PAYOUT ERROR:", err.message));
    }, 60 * 1000);
}

if (process.env.NODE_ENV === "production") {
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({
            error: process.env.NODE_ENV === "production"
                ? "Internal Server Error"
                : err.message
        });
    });
}

const { settleMatch } = require("./src/services/settlement.service");

app.post("/api/admin/settle", auth, adminOnly, async (req, res) => {
    const { matchId, winningTeam } = req.body;

    if (!matchId || !winningTeam)
        return res.status(400).json({ error: "Missing fields" });

    try {
        await settleMatch(matchId, winningTeam);
        res.json({ message: "Match settled successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/admin/withdrawals", auth, adminOnly, async (req, res) => {
    const withdrawals = await Withdrawal.find()
        .sort({ createdAt: -1 });

    res.json(withdrawals);
});

app.post("/api/admin/withdraw/approve", auth, adminOnly, async (req, res) => {
    const { withdrawalId } = req.body;

    const withdrawal = await Withdrawal.findOne({ withdrawalId });

    if (!withdrawal)
        return res.status(404).json({ error: "Not found" });

    if (withdrawal.status !== "PENDING")
        return res.status(400).json({ error: "Invalid state" });

    withdrawal.status = "APPROVED";
    withdrawal.approvedBy = req.user.id;
    withdrawal.approvedAt = new Date();

    await withdrawal.save();

    res.json({ message: "Withdrawal approved" });
});

app.post("/api/admin/withdraw/reject", auth, adminOnly, async (req, res) => {
    const { withdrawalId } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const withdrawal = await Withdrawal.findOne({ withdrawalId }).session(session);

        if (!withdrawal)
            throw new Error("Not found");

        if (withdrawal.status !== "PENDING")
            throw new Error("Invalid state");

        const wallet = await Wallet.findOne({
            userId: withdrawal.userId
        }).session(session);

        wallet.balance += withdrawal.lockedAmount;
        await wallet.save({ session });

        await Ledger.create([{
            userId: withdrawal.userId,
            type: "withdraw_refund",
            amount: withdrawal.lockedAmount,
            balanceAfter: wallet.balance,
            ref: withdrawalId
        }], { session });

        withdrawal.status = "REJECTED";
        await withdrawal.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({ message: "Withdrawal rejected & refunded" });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: err.message });

    }
});

/* ================== SERVER ================== */

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
