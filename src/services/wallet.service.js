const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Ledger = require("../models/Ledger");

/**
 * 🔐 Atomic Balance Update
 */
async function updateBalance({
    userId,
    amount,
    type,
    ref = null,
    meta = {}
}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const wallet = await Wallet.findOne({ userId }).session(session);

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        const newBalance = wallet.balance + amount;

        if (newBalance < 0) {
            throw new Error("Insufficient balance");
        }

        wallet.balance = newBalance;
        await wallet.save({ session });

        await Ledger.create([{
            userId,
            type,
            amount,
            balanceAfter: newBalance,
            ref,
            meta
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return newBalance;

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

module.exports = {
    updateBalance
};
