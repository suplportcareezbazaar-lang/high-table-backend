const mongoose = require("mongoose");
const Bet = require("../models/Bet");
const Wallet = require("../models/Wallet");
const Ledger = require("../models/Ledger");

async function settleMatch(matchId, winningTeam) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const bets = await Bet.find({
            matchId,
            status: "pending"
        }).session(session);

        for (const bet of bets) {
            let payout = 0;

            if (bet.selectedTeam === winningTeam) {
                payout = bet.mainBet * bet.odds + bet.hedgeBet;
            }

            const wallet = await Wallet.findOne({
                userId: bet.userId
            }).session(session);

            if (!wallet) continue;

            if (payout > 0) {
                wallet.balance += payout;

                await Ledger.create([{
                    userId: bet.userId,
                    type: "win",
                    amount: payout,
                    balanceAfter: wallet.balance,
                    ref: bet._id,
                    meta: { matchId }
                }], { session });
            }

            bet.status = "settled";
            await bet.save({ session });
            await wallet.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        return true;

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

module.exports = { settleMatch };
