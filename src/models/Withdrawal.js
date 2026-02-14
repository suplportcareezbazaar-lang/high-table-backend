const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema({
  withdrawalId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED", "PAID"],
    default: "PENDING"
  },
  lockedAmount: {
    type: Number,
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  approvedAt: Date,
  payoutRef: String
}, {
  timestamps: true
});

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
