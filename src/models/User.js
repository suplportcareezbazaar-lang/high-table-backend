const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },

        mobile: {
            type: String,
            required: true
        },

        passwordHash: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["user", "admin", "agent"],
            default: "user"
        },

        approved: {
            type: Boolean,
            default: true
        },

        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        country: {
            type: String,
            default: "IN"
        },

        resetToken: String,
        resetExpires: Date
    },
    {
        timestamps: true
    }
);

// Index for fast login
//userSchema.index({ username: 1 });
//userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);
