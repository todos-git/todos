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
            enum: ["pending", "paid", "failed"],
            default: "pending",
        },

        method: String,


        qpayInvoiceId: String,
        qpaySenderInvoiceNo: String,
        qpayQrText: String,
        qpayDeepLink: String,

        paidAt: Date,
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);