const mongoose = require("mongoose");

const termAcceptanceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: ["package", "banner"],
            required: true,
        },

        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        termsVersion: {
            type: String,
            required: true,
        },

        accepted: {
            type: Boolean,
            default: true,
        },

        checkboxLabel: {
            type: String,
            default: "",
        },

        termsSnapshot: {
            type: String,
            required: true,
        },

        userAgent: {
            type: String,
            default: "",
        },

        ipAddress: {
            type: String,
            default: "",
        },

        acceptedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TermAcceptance", termAcceptanceSchema);