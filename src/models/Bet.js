const mongoose = require("mongoose");

const betSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        matchId: {
            type: String,
            required: true
        },

        selectedTeam: {
            type: String,
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        mainBet: Number,
        hedgeBet: Number,
        odds: Number,

        status: {
            type: String,
            enum: ["pending", "settled", "cancelled"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

betSchema.index({ userId: 1 });
betSchema.index({ matchId: 1 });
betSchema.index({ status: 1 });

module.exports = mongoose.model("Bet", betSchema);
