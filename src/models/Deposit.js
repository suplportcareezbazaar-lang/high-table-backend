const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        depositId: {
            type: String,
            unique: true
        },

        amount: Number,

        status: {
            type: String,
            enum: ["INITIATED", "CONFIRMED", "FAILED"],
            default: "INITIATED"
        },

        utr: String,
        gatewayOrderId: String
    },
    {
        timestamps: true
    }
);

depositSchema.index({ userId: 1 });
depositSchema.index({ depositId: 1 });

module.exports = mongoose.model("Deposit", depositSchema);
