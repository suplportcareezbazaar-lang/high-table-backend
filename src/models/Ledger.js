const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "deposit",
                "bet",
                "win",
                "hedge",
                "withdraw",
                "commission"
            ],
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        balanceAfter: {
            type: Number,
            required: true
        },

        ref: {
            type: String
        },

        meta: {
            type: Object,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

// Performance indexes
ledgerSchema.index({ userId: 1, createdAt: -1 });
ledgerSchema.index({ type: 1 });

module.exports = mongoose.model("Ledger", ledgerSchema);
