const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        packageType: {
            type: String,
            enum: ["basic", "pro", "premium"],
            required: true,
        },

        amount: Number,

        status: {
            type: String,
            enum: [
                "pending",
                "pending_approval",
                "screenshot_requested",
                "screenshot_uploaded",
                "approved",
                "failed",
                "cancelled",
            ],
            default: "pending",
        },

        method: String,


        qpayInvoiceId: String,
        qpaySenderInvoiceNo: String,
        qpayQrText: String,
        qpayDeepLink: String,

        paidAt: Date,
        screenshotImage: {
            type: String,
            default: "",
        },

        cancelReason: {
            type: String,
            default: "",
        },

        cancelledAt: {
            type: Date,
            default: null,
        },

        approvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);