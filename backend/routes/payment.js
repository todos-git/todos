const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { getPackageConfig } = require("../utils/packageFeatures");
const axios = require("axios");
const TermAcceptance = require("../models/TermAcceptance");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const {
    PACKAGE_TERMS_VERSION,
    PACKAGE_CHECKBOX_LABEL,
    PACKAGE_TERMS_TEXT,
} = require("../utils/serviceTerms");

const storage = new CloudinaryStorage({
    cloudinary,
    params: async () => ({
        folder: "todos/payment-screenshots",
        resource_type: "image",
    }),
});

const upload = multer({ storage });

// CREATE PAYMENT
router.post("/create", authMiddleware, async (req, res) => {
    try {
        const { packageType } = req.body;

        if (!["basic", "pro", "premium"].includes(packageType)) {
            return res.status(400).json({ message: "Invalid package type" });
        }

        const config = getPackageConfig(packageType);

        const payment = await Payment.create({
            userId: req.user._id,
            packageType,
            amount: config.amount,
            status: "pending",
            method: "manual",
        });

        res.status(201).json(payment);
    } catch (error) {
        console.error("CREATE PAYMENT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// SAVE PACKAGE TERMS ACCEPTANCE
router.post("/accept-terms", authMiddleware, async (req, res) => {
    try {
        const { paymentId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(paymentId)) {
            return res.status(400).json({ message: "Invalid payment id" });
        }

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (payment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const existing = await TermAcceptance.findOne({
            userId: req.user._id,
            type: "package",
            targetId: payment._id,
            termsVersion: PACKAGE_TERMS_VERSION,
        });

        if (existing) {
            return res.json({
                message: "Terms already accepted",
                acceptance: existing,
            });
        }

        const acceptance = await TermAcceptance.create({
            userId: req.user._id,
            type: "package",
            targetId: payment._id,
            termsVersion: PACKAGE_TERMS_VERSION,
            accepted: true,
            checkboxLabel: PACKAGE_CHECKBOX_LABEL,
            termsSnapshot: PACKAGE_TERMS_TEXT,
            userAgent: req.headers["user-agent"] || "",
            ipAddress:
                req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
                req.socket.remoteAddress ||
                "",
            acceptedAt: new Date(),
        });

        res.status(201).json({
            message: "Terms accepted",
            acceptance,
        });
    } catch (error) {
        console.error("PACKAGE TERMS ACCEPT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// CREATE QPAY INVOICE
router.post("/qpay/create", authMiddleware, async (req, res) => {
    try {
        const { paymentId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(paymentId)) {
            return res.status(400).json({ message: "Invalid payment id" });
        }

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (payment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (payment.qpayDeepLink) {
            return res.json({
                deeplink: payment.qpayDeepLink,
                qr: payment.qpayQrText || "",
            });
        }

        const isProductionQpayReady =
            process.env.QPAY_USERNAME &&
            process.env.QPAY_PASSWORD &&
            process.env.QPAY_INVOICE_CODE &&
            process.env.BACKEND_URL;

        if (!isProductionQpayReady) {
            payment.qpayInvoiceId = `mock-${payment._id}`;
            payment.qpaySenderInvoiceNo = payment._id.toString();
            payment.qpayQrText = `MOCK-QR-${payment._id}`;
            payment.qpayDeepLink = "#mock-qpay";
            await payment.save();

            return res.json({
                deeplink: payment.qpayDeepLink,
                qr: payment.qpayQrText,
                mock: true,
                message: "Mock QPay invoice created",
            });
        }

        const qpayRes = await axios.post(
            "https://merchant.qpay.mn/v2/invoice",
            {
                invoice_code: process.env.QPAY_INVOICE_CODE,
                sender_invoice_no: payment._id.toString(),
                invoice_receiver_code: "terminal",
                invoice_description: `${payment.packageType} package`,
                amount: payment.amount,
                callback_url: `${process.env.BACKEND_URL}/api/payments/webhook/qpay`,
            },
            {
                auth: {
                    username: process.env.QPAY_USERNAME,
                    password: process.env.QPAY_PASSWORD,
                },
            }
        );

        const data = qpayRes.data;

        payment.qpayInvoiceId = data.invoice_id || "";
        payment.qpaySenderInvoiceNo = payment._id.toString();
        payment.qpayQrText = data.qr_text || "";
        payment.qpayDeepLink = data?.urls?.[0]?.link || "";
        await payment.save();

        return res.json({
            deeplink: payment.qpayDeepLink,
            qr: payment.qpayQrText,
            mock: false,
        });
    } catch (error) {
        console.error("QPAY CREATE ERROR:", error.response?.data || error.message);
        return res.status(500).json({
            message: "QPay invoice үүсгэхэд алдаа гарлаа",
            error: error.response?.data || error.message || "Unknown QPay error",
        });
    }
});

// CONFIRM PAYMENT (seller clicked "I have paid")
router.post("/confirm-demo/:id", authMiddleware, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (payment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const acceptedTerms = await TermAcceptance.findOne({
            userId: req.user._id,
            type: "package",
            targetId: payment._id,
            termsVersion: PACKAGE_TERMS_VERSION,
        });

        if (!acceptedTerms) {
            return res.status(400).json({
                message: "Үйлчилгээний нөхцөл зөвшөөрөгдөөгүй байна",
            });
        }

        if (payment.status === "approved") {
            return res.json({
                message: "Payment already approved",
                status: payment.status,
            });
        }

        payment.status = "pending_approval";
        payment.paidAt = new Date();
        await payment.save();

        res.json({
            message: "Төлбөр шалгах хүлээгдэж байна",
            status: payment.status,
        });
    } catch (err) {
        console.error("CONFIRM PAYMENT ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// GET MY LATEST PAYMENT
router.get("/my/latest", authMiddleware, async (req, res) => {
    try {
        const payment = await Payment.findOne({
            userId: req.user._id,
            status: {
                $in: [
                    "pending",
                    "pending_approval",
                    "screenshot_requested",
                    "screenshot_uploaded",
                    "approved",
                ],
            },
        }).sort({ createdAt: -1 });

        res.json(payment || null);
    } catch (error) {
        console.error("GET MY LATEST PAYMENT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ADMIN UNREAD PENDING COUNT
router.get("/admin/pending-count", authMiddleware, async (req, res) => {
    try {
        const adminUser = await User.findById(req.user._id);

        if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
            return res.status(403).json({ message: "Admin only" });
        }

        const count = await Payment.countDocuments({
            status: { $in: ["pending_approval", "screenshot_requested", "screenshot_uploaded"] },
        });

        res.json({ count });
    } catch (error) {
        console.error("ADMIN PENDING COUNT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ADMIN GET APPROVE REQUESTS
router.get("/admin/pending", authMiddleware, async (req, res) => {
    try {
        const adminUser = await User.findById(req.user._id);

        if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
            return res.status(403).json({ message: "Admin only" });
        }

        const payments = await Payment.find({
            status: { $in: ["pending_approval", "screenshot_requested", "screenshot_uploaded"] },
        })
            .populate("userId", "email storeName phone")
            .sort({ createdAt: -1 });

        res.json(payments);
    } catch (error) {
        console.error("ADMIN GET PENDING PAYMENTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ADMIN GET APPROVED PAYMENTS
router.get("/admin/approved", authMiddleware, async (req, res) => {
    try {
        const adminUser = await User.findById(req.user._id);

        if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
            return res.status(403).json({ message: "Admin only" });
        }

        const payments = await Payment.find({
            status: "approved",
        })
            .populate("userId", "email storeName phone")
            .sort({ approvedAt: -1, updatedAt: -1, createdAt: -1 });

        res.json(payments);
    } catch (error) {
        console.error("ADMIN GET APPROVED PAYMENTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ADMIN GET CANCELLED PAYMENTS
router.get("/admin/cancelled", authMiddleware, async (req, res) => {
    try {
        const adminUser = await User.findById(req.user._id);

        if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
            return res.status(403).json({ message: "Admin only" });
        }

        const payments = await Payment.find({
            status: "cancelled",
        })
            .populate("userId", "email storeName phone")
            .sort({ cancelledAt: -1, updatedAt: -1, createdAt: -1 });

        res.json(payments);
    } catch (error) {
        console.error("ADMIN GET CANCELLED PAYMENTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ADMIN PAYMENT STATISTICS
router.get("/admin/stats", authMiddleware, async (req, res) => {
    try {
        const adminUser = await User.findById(req.user._id);

        if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
            return res.status(403).json({ message: "Admin only" });
        }

        const [pendingCount, approvedCount, cancelledCount, sellerCount] = await Promise.all([
            Payment.countDocuments({
                status: { $in: ["pending_approval", "screenshot_requested", "screenshot_uploaded"] },
            }),
            Payment.countDocuments({ status: "approved" }),
            Payment.countDocuments({ status: "cancelled" }),
            User.countDocuments({ role: "seller" }),
        ]);

        res.json({
            pendingCount,
            approvedCount,
            cancelledCount,
            sellerCount,
        });
    } catch (error) {
        console.error("ADMIN PAYMENT STATS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ADMIN APPROVE PAYMENT
router.post("/:id/admin-approve", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid payment id" });
        }

        const adminUser = await User.findById(req.user._id);

        if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
            return res.status(403).json({ message: "Admin only" });
        }

        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (payment.status === "approved") {
            return res.json({
                message: "Payment already approved",
                payment,
            });
        }

        const user = await User.findById(payment.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const config = getPackageConfig(payment.packageType);

        user.packageType = payment.packageType;
        user.productLimit = config.productLimit;
        user.canShowLocation = config.canShowLocation;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + config.durationDays);
        user.packageExpiresAt = expiresAt;

        await user.save();

        payment.status = "approved";
        payment.approvedAt = new Date();
        payment.paidAt = payment.paidAt || new Date();
        await payment.save();

        res.json({
            message: "Payment approved and package activated",
            payment,
            user: {
                _id: user._id,
                packageType: user.packageType,
                productLimit: user.productLimit,
                canShowLocation: user.canShowLocation,
                packageExpiresAt: user.packageExpiresAt,
            },
        });
    } catch (error) {
        console.error("ADMIN APPROVE PAYMENT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ADMIN REQUEST SCREENSHOT
router.post("/:id/request-screenshot", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid payment id" });
        }

        const adminUser = await User.findById(req.user._id);

        if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
            return res.status(403).json({ message: "Admin only" });
        }

        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        payment.status = "screenshot_requested";
        await payment.save();

        res.json({
            message: "Screenshot requested",
            payment,
        });
    } catch (error) {
        console.error("REQUEST SCREENSHOT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ADMIN CANCEL PAYMENT
router.post("/:id/admin-cancel", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid payment id" });
        }

        const adminUser = await User.findById(req.user._id);

        if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
            return res.status(403).json({ message: "Admin only" });
        }

        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        payment.status = "cancelled";
        payment.cancelReason = String(reason || "").trim() || "No reason provided";
        payment.cancelledAt = new Date();
        await payment.save();

        res.json({
            message: "Payment cancelled",
            payment,
        });
    } catch (error) {
        console.error("ADMIN CANCEL PAYMENT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// SELLER UPLOAD SCREENSHOT
router.post(
    "/:id/upload-screenshot",
    authMiddleware,
    upload.single("screenshot"),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid payment id" });
            }

            const payment = await Payment.findById(id);

            if (!payment) {
                return res.status(404).json({ message: "Payment not found" });
            }

            if (payment.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized" });
            }

            if (!req.file) {
                return res.status(400).json({ message: "Screenshot image is required" });
            }

            payment.screenshotImage = req.file.path;
            payment.status = "screenshot_uploaded";
            await payment.save();

            res.json({
                message: "Screenshot uploaded successfully",
                payment,
            });
        } catch (error) {
            console.error("UPLOAD SCREENSHOT ERROR:", error);
            res.status(500).json({ message: error.message });
        }
    }
);

// GET SINGLE PAYMENT
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid payment id" });
        }

        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (payment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        res.json(payment);
    } catch (error) {
        console.error("GET PAYMENT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// CANCEL PAYMENT (seller side)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid payment id" });
        }

        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (payment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (payment.status === "approved") {
            return res.status(400).json({
                message: "Баталгаажсан төлбөрийг цуцлах боломжгүй",
            });
        }

        await TermAcceptance.deleteMany({
            userId: req.user._id,
            type: "package",
            targetId: payment._id,
            termsVersion: PACKAGE_TERMS_VERSION,
        });

        await payment.deleteOne();

        res.json({ message: "Payment cancelled successfully" });
    } catch (error) {
        console.error("CANCEL PAYMENT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;