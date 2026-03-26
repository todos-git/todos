const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        buyerInfo: {
            email: {
                type: String,
                default: "",
            },
            phone: {
                type: String,
                default: "",
            },
        },

        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                },
                name: String,
                price: Number,
                quantity: Number,
                images: [String],

                deliveryAvailable: Boolean,
                sameDayDelivery: Boolean,
                deliveryCutoffTime: String,

                pickupAvailable: Boolean,
                pickupAddress: String,
                pickupMapLink: String,
            },
        ],

        subtotal: Number,
        shipping: Number,
        total: Number,



        status: {
            type: String,
            enum: ["placed", "delivering", "ready_for_pickup", "delivered", "completed"],
            default: "placed",
        },

        isSeenBySeller: {
            type: Boolean,
            default: false,
        },

        isRated: {
            type: Boolean,
            default: false
        },

        rating: {
            type: Number,
            default: 0
        },

        review: {
            type: String,
            default: ""
        },
        isSeenByBuyer: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);