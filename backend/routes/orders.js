const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product")
const authMiddleware = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// ==============================
// CREATE ORDER (SPLIT BY SELLER)
// ==============================
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { cartItems } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const sellerGroups = {};

        cartItems.forEach((item) => {
            const sellerId = item.sellerId;

            if (!sellerId) {
                throw new Error("Missing sellerId in cart item");
            }

            if (!sellerGroups[sellerId]) {
                sellerGroups[sellerId] = [];
            }

            sellerGroups[sellerId].push(item);
        });

        const createdOrders = [];

        for (const sellerId in sellerGroups) {
            const items = sellerGroups[sellerId];

            let subtotal = 0;

            items.forEach((item) => {
                subtotal += item.price * item.quantity;
            });

            const hasDelivery = items.some((i) => i.deliveryAvailable);
            const hasOnlyPickup = items.every(
                (i) => !i.deliveryAvailable && i.pickupAvailable
            );

            let status = "placed";
            if (hasOnlyPickup) {
                status = "ready_for_pickup";
            }

            const shipping = hasDelivery ? 5000 : 0;
            const total = subtotal + shipping;

            const seller = await User.findById(sellerId);
            const buyer = await User.findById(req.user._id);

            const order = new Order({
                buyerId: req.user._id,
                sellerId,
                status,
                isSeenBySeller: false,
                buyerInfo: {
                    email: buyer?.email || "",
                    phone: buyer?.phone || "",
                },
                items: items.map((item) => ({
                    productId: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    images: item.images,

                    deliveryAvailable: item.deliveryAvailable,
                    sameDayDelivery: item.sameDayDelivery,
                    deliveryCutoffTime: item.deliveryCutoffTime,

                    pickupAvailable: item.pickupAvailable,
                    pickupAddress: item.pickupAddress,
                    pickupMapLink: item.pickupMapLink,
                })),
                subtotal,
                shipping,
                total,
            });

            await order.save();
            createdOrders.push(order);

            if (seller?.email) {
                await transporter.sendMail({
                    from: process.env.MAIL_USER,
                    to: seller.email,
                    subject: "Шинэ захиалга ирлээ",
                    html: `
                <h2>Шинэ захиалга ирлээ</h2>
                <p>Танд шинэ захиалга ирсэн байна.</p>

                <p>Захиалгын дугаар: ${order._id}</p>
                <p>Худалдан авагчийн имэйл: ${order.buyerInfo?.email || "-"}</p>
                <p>Худалдан авагчийн утас: ${order.buyerInfo?.phone || "-"}</p>
                <p>Нийт дүн: ${total}₮</p>

                <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/seller/orders">
                    Захиалгаа харах
                </a>
            `,
                });
            }
        }

        res.status(201).json({
            message: "Orders created",
            orders: createdOrders,
        });
    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});



// ==============================
// GET BUYER UNREAD ORDER COUNT
// ==============================
router.get("/buyer-orders/unread-count", authMiddleware, async (req, res) => {
    try {
        const count = await Order.countDocuments({
            buyerId: req.user._id,
            isSeenByBuyer: false,
        });

        res.json({ count });
    } catch (error) {
        console.error("BUYER UNREAD COUNT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});


// ==============================
// GET SELLER UNREAD ORDER COUNT
// ==============================
router.get("/seller-orders/unread-count", authMiddleware, async (req, res) => {
    try {
        const count = await Order.countDocuments({
            sellerId: req.user._id,
            isSeenBySeller: false,
        });

        res.json({ count });
    } catch (error) {
        console.error("GET SELLER UNREAD ORDER COUNT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// GET BUYER ORDERS
// ==============================
router.get("/my-orders", authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ buyerId: req.user._id })
            .populate("sellerId", "storeName email")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error("GET BUYER ORDERS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// GET SELLER ORDERS
// ==============================
router.get("/seller-orders", authMiddleware, async (req, res) => {
    try {
        await Order.updateMany(
            {
                sellerId: req.user._id,
                isSeenBySeller: false,
            },
            {
                $set: {
                    isSeenBySeller: true,
                },
            }
        );

        const orders = await Order.find({ sellerId: req.user._id })
            .populate("buyerId", "email phone")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error("GET SELLER ORDERS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// GET SELLER RATING SUMMARY
// ==============================
router.get("/seller-rating-summary", authMiddleware, async (req, res) => {
    try {
        const ratedOrders = await Order.find({
            sellerId: req.user._id,
            isRated: true,
            rating: { $gt: 0 },
        }).select("rating review");

        const reviewCount = ratedOrders.length;

        const averageRating =
            reviewCount > 0
                ? ratedOrders.reduce((sum, order) => sum + order.rating, 0) / reviewCount
                : 0;

        const latestReviews = ratedOrders
            .filter((order) => order.review && order.review.trim())
            .slice(-5)
            .reverse()
            .map((order) => ({
                rating: order.rating,
                review: order.review,
            }));

        res.json({
            averageRating: Number(averageRating.toFixed(1)),
            reviewCount,
            latestReviews,
        });
    } catch (error) {
        console.error("GET SELLER RATING SUMMARY ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// MARK BUYER ORDERS AS SEEN
// ==============================
router.put("/buyer-orders/mark-seen", authMiddleware, async (req, res) => {
    try {
        await Order.updateMany(
            {
                buyerId: req.user._id,
                isSeenByBuyer: false,
            },
            {
                $set: { isSeenByBuyer: true },
            }
        );

        res.json({ message: "Marked as seen" });
    } catch (error) {
        console.error("MARK BUYER ORDERS SEEN ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// UPDATE ORDER STATUS (SELLER)
// ==============================
router.put("/:id/status", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid order id" });
        }

        const allowedStatuses = [
            "placed",
            "delivering",
            "ready_for_pickup",
            "delivered",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const isStartingFulfillment =
            order.status === "placed" &&
            (status === "delivering" || status === "ready_for_pickup");

        if (isStartingFulfillment) {
            for (const item of order.items) {
                if (!item.productId) {
                    return res.status(400).json({
                        message: `${item.name || "Product"} productId missing`,
                    });
                }

                const product = await Product.findById(item.productId);

                if (!product) {
                    return res.status(404).json({
                        message: `${item.name || "Product"} not found`,
                    });
                }

                if (product.sellerId.toString() !== req.user._id.toString()) {
                    return res.status(403).json({
                        message: `${product.name} is not your product`,
                    });
                }

                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        message: `${product.name} үлдэгдэл хүрэлцэхгүй байна. Одоогийн үлдэгдэл: ${product.stock}`,
                    });
                }
            }

            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: -item.quantity },
                });
            }
        }

        order.status = status;
        order.isSeenByBuyer = false;
        await order.save();

        res.json({
            message: "Order status updated",
            order,
        });
    } catch (error) {
        console.error("UPDATE ORDER STATUS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// CONFIRM RECEIVED (BUYER)
// ==============================
router.put("/:id/confirm", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.buyerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (order.status !== "delivered") {
            return res.status(400).json({ message: "Order not delivered yet" });
        }

        order.status = "delivered";
        await order.save();

        await User.findByIdAndUpdate(order.buyerId, {
            $inc: { points: 5 }
        });

        const seller = await User.findById(order.sellerId);

        if (seller?.email) {

            await transporter.sendMail({
                from: process.env.MAIL_USER,
                to: seller.email,
                subject: "Захиалга баталгаажлаа",
                html: `
        <h2>Buyer захиалга баталгаажууллаа</h2>
        <p>Захиалгын дугаар: ${order._id}</p>
        `
            });
        }

        res.json({
            message: "Order confirmed. +5 points",
            order,
            awardedPoints: 5
        });
    } catch (error) {
        console.error("CONFIRM ORDER ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// RATE ORDER (BUYER)
// ==============================
router.put("/:id/rate", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, review } = req.body;

        const numericRating = Number(rating);

        if (numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.buyerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (order.status !== "delivered") {
            return res.status(400).json({ message: "Order must be delivered first" });
        }

        if (order.isRated) {
            return res.status(400).json({ message: "Order already rated" });
        }

        order.rating = numericRating;
        order.review = (review || "").trim();
        order.isRated = true;
        order.status = "completed";

        await order.save();

        await User.findByIdAndUpdate(order.buyerId, {
            $inc: { points: 2 }
        });

        res.json({
            message: "Rating submitted. +2 points",
            order,
            awardedPoints: 2
        });
    } catch (error) {
        console.error("RATE ORDER ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;