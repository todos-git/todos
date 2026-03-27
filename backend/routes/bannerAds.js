const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const axios = require("axios");

const BannerAd = require("../models/BannerAd");
const User = require("../models/User");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const { getBannerPricing } = require("../utils/bannerPricing");
const TermAcceptance = require("../models/TermAcceptance");
const {
    BANNER_TERMS_VERSION,
    BANNER_CHECKBOX_LABEL,
    BANNER_TERMS_TEXT,
} = require("../utils/serviceTerms");

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// ==============================
// CREATE BANNER AD
// ==============================
router.post(
    "/",
    authMiddleware,
    upload.single("image"),
    async (req, res) => {
        try {
            const user = await User.findById(req.user._id);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (user.role !== "seller") {
                return res.status(403).json({ message: "Only sellers can create banner ads" });
            }

            const { title, subtitle, targetType, targetProductId, durationDays, } = req.body;

            if (!title || !targetType || !durationDays) {
                return res.status(400).json({
                    message: "Title, target type, and duration are required",
                });
            }

            if (!req.file && !req.body.existingImage?.trim()) {
                return res.status(400).json({ message: "Banner image is required" });
            }

            if (!["store", "product"].includes(targetType)) {
                return res.status(400).json({ message: "Invalid target type" });
            }

            const pricing = getBannerPricing(durationDays);

            if (!pricing) {
                return res.status(400).json({ message: "Invalid duration" });
            }

            let targetLink = `/store/${user._id}`;
            let finalTargetProductId = null;

            if (targetType === "product") {
                if (!targetProductId) {
                    return res.status(400).json({ message: "Target product is required" });
                }

                if (!mongoose.Types.ObjectId.isValid(targetProductId)) {
                    return res.status(400).json({ message: "Invalid target product id" });
                }

                const product = await Product.findById(targetProductId);

                if (!product) {
                    return res.status(404).json({ message: "Target product not found" });
                }

                if (product.sellerId.toString() !== req.user._id.toString()) {
                    return res.status(403).json({ message: "You can only advertise your own product" });
                }

                finalTargetProductId = product._id;
                targetLink = `/products/${product._id}`;
            }

            const bannerAd = await BannerAd.create({
                sellerId: req.user._id,
                title: title.trim(),
                subtitle: subtitle?.trim() || "",
                image: req.file
                    ? `/uploads/${req.file.filename}`
                    : req.body.existingImage.trim(),
                targetType,
                targetProductId: finalTargetProductId,
                targetLink,
                durationDays: Number(durationDays),
                amount: pricing.amount,
                status: "pending_payment",
                storeNameSnapshot: user.storeName || "My Store",
                locationSnapshot: user.location || "",
                packageTypeSnapshot: user.packageType || "free",
                startsAt: null,
                endsAt: null,
                isActive: false,
                qpayInvoiceId: "",
                qpayQrText: "",
                qpayDeepLink: "",
                paidAt: null,
            });



            res.status(201).json(bannerAd);
        } catch (error) {
            console.error("CREATE BANNER AD ERROR:", error);
            res.status(500).json({ message: error.message });
        }
    }
);

// ==============================
// GET MY BANNER ADS
// ==============================
router.get("/my-ads", authMiddleware, async (req, res) => {
    try {
        const now = new Date();

        await BannerAd.updateMany(
            {
                sellerId: req.user._id,
                status: "active",
                isActive: true,
                endsAt: { $lt: now },
            },
            {
                $set: {
                    status: "expired",
                    isActive: false,
                },
            }
        );

        const ads = await BannerAd.find({ sellerId: req.user._id }).sort({ createdAt: -1 });

        res.json(ads);
    } catch (error) {
        console.error("GET MY BANNER ADS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// GET SINGLE BANNER AD
// ==============================
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid banner ad id" });
        }

        const ad = await BannerAd.findById(id);

        if (!ad) {
            return res.status(404).json({ message: "Banner ad not found" });
        }

        if (ad.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        res.json(ad);
    } catch (error) {
        console.error("GET BANNER AD ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});


// ==============================
// SAVE BANNER TERMS ACCEPTANCE
// ==============================
router.post("/:id/accept-terms", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid banner ad id" });
        }

        const ad = await BannerAd.findById(id);

        if (!ad) {
            return res.status(404).json({ message: "Banner ad not found" });
        }

        if (ad.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const existing = await TermAcceptance.findOne({
            userId: req.user._id,
            type: "banner",
            targetId: ad._id,
            termsVersion: BANNER_TERMS_VERSION,
        });

        if (existing) {
            return res.json({ message: "Terms already accepted", acceptance: existing });
        }

        const acceptance = await TermAcceptance.create({
            userId: req.user._id,
            type: "banner",
            targetId: ad._id,
            termsVersion: BANNER_TERMS_VERSION,
            accepted: true,
            checkboxLabel: BANNER_CHECKBOX_LABEL,
            termsSnapshot: BANNER_TERMS_TEXT,
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
        console.error("BANNER TERMS ACCEPT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});


// ==============================
// CREATE BANNER QPAY (mock-ready / production-ready)
// ==============================
router.post("/:id/qpay-create", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid banner ad id" });
        }

        const ad = await BannerAd.findById(id);

        if (!ad) {
            return res.status(404).json({ message: "Banner ad not found" });
        }

        if (ad.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (ad.qpayDeepLink) {
            return res.json({
                deeplink: ad.qpayDeepLink,
                qr: ad.qpayQrText || "",
                mock: ad.qpayDeepLink === "#mock-qpay-banner",
            });
        }

        const isProductionQpayReady =
            process.env.QPAY_USERNAME &&
            process.env.QPAY_PASSWORD &&
            process.env.QPAY_INVOICE_CODE &&
            process.env.BACKEND_URL;

        // Mock mode
        if (!isProductionQpayReady) {
            ad.qpayInvoiceId = `mock-banner-${ad._id}`;
            ad.qpayQrText = `MOCK-BANNER-QR-${ad._id}`;
            ad.qpayDeepLink = "#mock-qpay-banner";
            await ad.save();

            return res.json({
                deeplink: ad.qpayDeepLink,
                qr: ad.qpayQrText,
                mock: true,
                message: "Mock banner QPay invoice created",
            });
        }

        // Production mode
        const qpayRes = await axios.post(
            "https://merchant.qpay.mn/v2/invoice",
            {
                invoice_code: process.env.QPAY_INVOICE_CODE,
                sender_invoice_no: ad._id.toString(),
                invoice_receiver_code: "terminal",
                invoice_description: `Banner: ${ad.title}`,
                amount: ad.amount,
                callback_url: `${process.env.BACKEND_URL}/api/banner-ads/webhook/qpay`,
            },
            {
                auth: {
                    username: process.env.QPAY_USERNAME,
                    password: process.env.QPAY_PASSWORD,
                },
            }
        );

        const data = qpayRes.data;

        ad.qpayInvoiceId = data.invoice_id || "";
        ad.qpayQrText = data.qr_text || "";
        ad.qpayDeepLink = data?.urls?.[0]?.link || "";
        await ad.save();

        return res.json({
            deeplink: ad.qpayDeepLink,
            qr: ad.qpayQrText,
            mock: false,
        });
    } catch (error) {
        console.error("CREATE BANNER QPAY ERROR:", error.response?.data || error.message);
        res.status(500).json({
            message: "Banner QPay үүсгэхэд алдаа гарлаа",
            error: error.response?.data || error.message,
        });
    }
});

// ==============================
// CONFIRM BANNER PAYMENT (demo)
// ==============================
router.post("/:id/confirm-demo", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid banner ad id" });
        }

        const ad = await BannerAd.findById(id);

        if (!ad) {
            return res.status(404).json({ message: "Banner ad not found" });
        }

        if (ad.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }
        const acceptedTerms = await TermAcceptance.findOne({
            userId: req.user._id,
            type: "banner",
            targetId: ad._id,
            termsVersion: BANNER_TERMS_VERSION,
        });

        if (!acceptedTerms) {
            return res.status(400).json({
                message: "Үйлчилгээний нөхцөл зөвшөөрөгдөөгүй байна",
            });
        }

        if (ad.status === "active") {
            return res.json({
                message: "Banner already active",
                ad,
            });
        }

        const startsAt = new Date();
        const endsAt = new Date(startsAt);
        endsAt.setDate(endsAt.getDate() + ad.durationDays);

        ad.status = "active";
        ad.isActive = true;
        ad.startsAt = startsAt;
        ad.endsAt = endsAt;
        ad.paidAt = new Date();

        await ad.save();

        res.json({
            message: "Banner payment confirmed",
            ad,
        });
    } catch (error) {
        console.error("CONFIRM BANNER PAYMENT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// PUBLIC ACTIVE BANNERS
// ==============================
router.get("/", async (req, res) => {
    try {
        const now = new Date();

        await BannerAd.updateMany(
            {
                status: "active",
                isActive: true,
                endsAt: { $lt: now },
            },
            {
                $set: {
                    status: "expired",
                    isActive: false,
                },
            }
        );

        const ads = await BannerAd.find({
            status: "active",
            isActive: true,
            startsAt: { $lte: now },
            endsAt: { $gte: now },
        }).sort({ createdAt: -1 });

        res.json(ads);
    } catch (error) {
        console.error("GET ACTIVE BANNERS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});


// ==============================
// DELETE BANNER AD
// ==============================
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid banner ad id" });
        }

        const ad = await BannerAd.findById(id);

        if (!ad) {
            return res.status(404).json({ message: "Banner ad not found" });
        }

        if (ad.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // pending/paid/rejected/expired дээр delete OK
        // active banner-г delete хийхгүй байлгамаар байвал энэ шалгалт үлдээнэ
        if (ad.status === "active") {
            return res.status(400).json({
                message: "Идэвхтэй баннерыг устгах боломжгүй",
            });
        }

        await ad.deleteOne();

        res.json({ message: "Banner ad deleted successfully" });
    } catch (error) {
        console.error("DELETE BANNER AD ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;