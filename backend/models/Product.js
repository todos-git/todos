const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        price: {
            type: Number,
            required: true
        },
        images: [
            {
                type: String
            }
        ],
        stock: {
            type: Number,
            default: 0
        },
        sizes: {
            type: [String],
            default: [],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        featured: {
            type: Boolean,
            default: false
        },
        category: {
            type: String,
            default: "All"
        },


        location: {
            type: String,
            default: ""
        },

        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        deliveryAvailable: {
            type: Boolean,
            default: false
        },
        sameDayDelivery: {
            type: Boolean,
            default: false
        },
        deliveryCutoffTime: {
            type: String,
            default: "16:00"
        },

        pickupAvailable: {
            type: Boolean,
            default: false
        },


        pickupAddress: {
            type: String,
            default: ""
        },


        pickupMapLink: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);