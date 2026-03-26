const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            trim: true,
            default: "",
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: ["user", "admin", "superadmin", "seller"],
            default: "user",
        },

        storeName: {
            type: String,
            default: "",
        },

        categories: {
            type: [String],
            default: [],
        },

        location: {
            type: String,
            default: "",
        },

        storeDescription: {
            type: String,
            default: "",
        },

        storeLogo: {
            type: String,
            default: "",
        },

        availableBalance: {
            type: Number,
            default: 0,
        },

        points: {
            type: Number,
            default: 0,
        },

        packageType: {
            type: String,
            enum: ["free", "basic", "pro", "premium"],
            default: "free",
        },

        productLimit: {
            type: Number,
            default: 5,
        },

        canShowLocation: {
            type: Boolean,
            default: false,
        },

        packageExpiresAt: {
            type: Date,
            default: null,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        verificationToken: {
            type: String,
            default: null,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);