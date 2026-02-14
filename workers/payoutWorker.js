const fs = require("fs");
const path = require("path");
const Ledger = require('../models/Ledger');

// 🔌 Provider (can be swapped later)
const payoutProvider = require("../payouts/mock.provider");

const withdrawalsFile = path.join(__dirname, "../data/withdrawals.json");
const banksFile = path.join(__dirname, "../data/banks.json");

function readJSON(file, fallback = []) {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function processPayouts() {
    const withdrawals = readJSON(withdrawalsFile);
    const banks = readJSON(banksFile);

    const queue = withdrawals.filter(w =>
        w.status === "APPROVED" && !w.payoutRef
    );

    for (const w of queue) {
        try {
            console.log("💸 Processing payout:", w.id);

            // 🔒 lock
            w.status = "PROCESSING";
            writeJSON(withdrawalsFile, withdrawals);

            const bank = banks.find(b => b.userId === w.userId);
            if (!bank) throw new Error("Bank details missing");

            const result = await payoutProvider.executePayout(w, bank);

            if (!result.success) {
                throw new Error(result.error || "Payout failed");
            }

            // ✅ success
            w.status = "PAID";
            w.payoutRef = result.ref;
            w.paidAt = new Date().toISOString();

            ledger.addEntry({
                userId: w.userId,
                type: "withdraw",
                amount: -Number(w.amount),
                ref: w.id,
                meta: {
                    payoutRef: result.ref,
                    provider: "GENERIC"
                }
            });

            console.log("✅ Paid:", w.id);

        } catch (err) {
            w.status = "FAILED";
            w.payoutError = err.message;
            console.error("❌ Payout error:", err.message);
        }

        writeJSON(withdrawalsFile, withdrawals);
    }
}

module.exports = { processPayouts };
