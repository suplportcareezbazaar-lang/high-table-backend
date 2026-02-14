const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        balance: {
            type: Number,
            default: 0
        },

        lockedBalance: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Fast lookup
walletSchema.index({ userId: 1 });

module.exports = mongoose.model("Wallet", walletSchema);
