const mongoose = require("mongoose");

const bannerAdSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        subtitle: {
            type: String,
            default: "",
            trim: true,
        },

        image: {
            type: String,
            required: true,
        },

        targetType: {
            type: String,
            enum: ["store", "product"],
            required: true,
        },

        targetProductId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null,
        },

        targetLink: {
            type: String,
            default: "",
        },

        durationDays: {
            type: Number,
            enum: [7, 14, 21],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        status: {
            type: String,
            enum: [
                "pending_payment",
                "pending_approval",
                "active",
                "expired",
                "rejected",
                "cancelled",
            ],
            default: "pending_payment",
        },

        storeNameSnapshot: {
            type: String,
            default: "",
        },

        locationSnapshot: {
            type: String,
            default: "",
        },

        packageTypeSnapshot: {
            type: String,
            enum: ["free", "basic", "pro", "premium"],
            default: "free",
        },

        startsAt: {
            type: Date,
            default: null,
        },

        endsAt: {
            type: Date,
            default: null,
        },

        isActive: {
            type: Boolean,
            default: false,
        },

        isAdminBanner: {
            type: Boolean,
            default: false,
        },

        // QPay / payment data
        qpayInvoiceId: {
            type: String,
            default: "",
        },

        qpayQrText: {
            type: String,
            default: "",
        },

        qpayDeepLink: {
            type: String,
            default: "",
        },

        paidAt: {
            type: Date,
            default: null,
        },
        approvedAt: {
            type: Date,
            default: null,
        },

        cancelledAt: {
            type: Date,
            default: null,
        },

        cancelReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("BannerAd", bannerAdSchema);