const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Ledger = require("../models/Ledger");
const Bet = require("../models/Bet");

async function placeBet({
    userId,
    matchId,
    selectedTeam,
    amount
}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const wallet = await Wallet.findOne({ userId }).session(session);

        if (!wallet) throw new Error("Wallet not found");

        if (wallet.balance < amount) {
            throw new Error("Insufficient balance");
        }

        wallet.balance -= amount;
        await wallet.save({ session });

        const bet = await Bet.create([{
            userId,
            matchId,
            selectedTeam,
            amount,
            mainBet: amount * 0.75,
            hedgeBet: amount * 0.25,
            odds: 2,
            status: "pending"
        }], { session });

        await Ledger.create([{
            userId,
            type: "bet",
            amount: -amount,
            balanceAfter: wallet.balance,
            ref: bet[0]._id,
            meta: { matchId }
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return bet[0];

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

module.exports = { placeBet };
