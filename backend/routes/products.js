const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const mongoose = require("mongoose");
const { checkAndDowngradePackage } = require("../utils/checkAndDowngradePackage");

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
        folder: "todos/products",
        resource_type: "image",
    }),
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        console.log("PRODUCT FILE:", {
            originalname: file.originalname,
            mimetype: file.mimetype,
        });
        cb(null, true);
    },
});

const uploadProductsMiddleware = (req, res, next) => {
    upload.array("images", 5)(req, res, function (err) {
        if (err) {
            console.error("PRODUCT UPLOAD ERROR:", err);
            console.error("PRODUCT UPLOAD ERROR STRING:", JSON.stringify(err, Object.getOwnPropertyNames(err)));

            return res.status(500).json({
                message: "Image upload failed",
                error: err.message || String(err),
                details: JSON.stringify(err, Object.getOwnPropertyNames(err)),
            });
        }

        next();
    });
};

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/ө/g, "o")
        .replace(/ү/g, "u")
        .replace(/ё/g, "yo")
        .replace(/й/g, "i")
        .replace(/ч/g, "ch")
        .replace(/ш/g, "sh")
        .replace(/ж/g, "j")
        .replace(/э/g, "e")
        .replace(/х/g, "h");
}

// ==============================
// CREATE PRODUCT
// ==============================
router.post(
    "/",
    authMiddleware,
    uploadProductsMiddleware,
    async (req, res) => {
        try {
            console.log("BODY:", req.body);
            console.log("FILES:", req.files);

            let user = await User.findById(req.user._id);

            if (!user) {
                return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
            }

            if (user.role !== "seller") {
                return res.status(403).json({
                    message: "Зөвхөн худалдагч бүтээгдэхүүн нэмэх боломжтой",
                });
            }

            user = await checkAndDowngradePackage(user);

            const existingProductCount = await Product.countDocuments({
                sellerId: req.user._id,
            });


            if (existingProductCount >= user.productLimit) {
                return res.status(400).json({
                    message: `Таны багц хамгийн ихдээ ${user.productLimit} бүтээгдэхүүн оруулах боломжтой`,
                });
            }

            const deliveryAvailable = req.body.deliveryAvailable === "true";
            const sameDayDelivery = req.body.sameDayDelivery === "true";
            const pickupAvailable = req.body.pickupAvailable === "true";
            const deliveryCutoffTime = req.body.deliveryCutoffTime || "16:00";

            if (!req.body.name?.trim() || !req.body.description?.trim()) {
                return res.status(400).json({
                    message: "Бүтээгдэхүүний нэр болон тайлбар шаардлагатай",
                });
            }

            if (!req.body.price || Number(req.body.price) <= 0) {
                return res.status(400).json({
                    message: "Зөв үнэ оруулна уу",
                });
            }

            if (req.body.stock === undefined || Number(req.body.stock) < 0) {
                return res.status(400).json({
                    message: "Зөв үлдэгдэл оруулна уу",
                });
            }

            if (!deliveryAvailable && !pickupAvailable) {
                return res.status(400).json({
                    message: "Хүргэлт эсвэл очиж авах сонголтоос ядаж нэгийг сонгоно уу",
                });
            }

            if (pickupAvailable && !req.body.pickupMapLink?.trim()) {
                return res.status(400).json({
                    message: "Байршлын линк шаардлагатай",
                });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    message: "Хамгийн багадаа 1 зураг шаардлагатай",
                });
            }

            const product = new Product({
                name: req.body.name.trim(),
                description: req.body.description.trim(),
                price: Number(req.body.price),
                stock: Number(req.body.stock),
                sizes: Array.isArray(req.body.sizes)
                    ? req.body.sizes.map((size) => String(size).trim()).filter(Boolean)
                    : req.body.sizes
                        ? [String(req.body.sizes).trim()]
                        : [],
                isActive: Number(req.body.stock) > 0,
                category: req.body.category?.trim() || "All",
                location: user.location || "",
                deliveryAvailable,
                sameDayDelivery: deliveryAvailable ? sameDayDelivery : false,
                deliveryCutoffTime: deliveryAvailable ? deliveryCutoffTime : "16:00",
                pickupAvailable,
                pickupAddress: "",
                pickupMapLink: req.body.pickupMapLink?.trim() || "",
                images: req.files.map((file) => file.path),
                sellerId: req.user._id,
            });

            await product.save();

            res.status(201).json({
                message: "Бүтээгдэхүүн амжилттай нэмэгдлээ",
                product,
            });
        } catch (error) {
            console.error("CREATE PRODUCT ERROR:", error);
            res.status(500).json({ message: error.message });
        }
    }
);

// ==============================
// GET MY PRODUCTS
// ==============================
router.get("/my-products", authMiddleware, async (req, res) => {
    try {
        const products = await Product.find({
            sellerId: req.user._id,
        }).sort({ createdAt: -1 });

        res.json(products);
    } catch (error) {
        console.error("GET MY PRODUCTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// GET ALL + SEARCH + FILTER + SELLER RATING
// ==============================
router.get("/", async (req, res) => {
    try {
        const { search, category } = req.query;

        const query = {
            $or: [{ isActive: true }, { isActive: { $exists: false } }],
        };

        if (search) {

            const words = search.split(" ");

            query.$or = [];

            words.forEach(word => {

                const normalized = normalizeText(word);

                query.$or.push(
                    { name: { $regex: word, $options: "i" } },
                    { name: { $regex: normalized, $options: "i" } },

                    { description: { $regex: word, $options: "i" } },
                    { description: { $regex: normalized, $options: "i" } },

                    { category: { $regex: word, $options: "i" } },
                    { category: { $regex: normalized, $options: "i" } },
                );

            });

        }

        if (category && category !== "All") {
            query.category = category;
        }

        const products = await Product.find(query)
            .populate(
                "sellerId",
                "email storeName packageType canShowLocation isVerified"
            )
            .sort({ createdAt: -1 });

        const ratedOrders = await Order.find({
            isRated: true,
            rating: { $gt: 0 },
        }).select("sellerId rating");

        const sellerRatingsMap = {};

        ratedOrders.forEach((order) => {
            const sellerId = order.sellerId?.toString();

            if (!sellerId) return;

            if (!sellerRatingsMap[sellerId]) {
                sellerRatingsMap[sellerId] = {
                    total: 0,
                    count: 0,
                };
            }

            sellerRatingsMap[sellerId].total += order.rating;
            sellerRatingsMap[sellerId].count += 1;
        });

        const modifiedProducts = products.map((product) => {
            const obj = product.toObject();

            if (!obj.sellerId || !obj.sellerId.canShowLocation) {
                obj.location = "🔒 Upgrade to see location";
            }

            const sellerId = obj.sellerId?._id?.toString();

            const ratingData = sellerId
                ? sellerRatingsMap[sellerId] || { total: 0, count: 0 }
                : { total: 0, count: 0 };

            const avgRating =
                ratingData.count > 0 ? ratingData.total / ratingData.count : 0;

            obj.sellerRating = Number(avgRating.toFixed(1));
            obj.sellerReviewCount = ratingData.count;
            obj.isTopSeller =
                obj.sellerReviewCount >= 5 &&
                obj.sellerRating >= 4.5;

            return obj;
        });

        res.json(modifiedProducts);
    } catch (error) {
        console.error("GET ALL PRODUCTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// GET SELLER STORE + PRODUCTS
// ==============================
router.get("/store/:sellerId", async (req, res) => {
    try {
        const { sellerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({ message: "Invalid seller id" });
        }

        const seller = await User.findById(sellerId).select(
            "storeName email phone storeDescription storeLogo packageType isVerified location canShowLocation categories"
        );

        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }

        const products = await Product.find({
            sellerId,
            $or: [{ isActive: true }, { isActive: { $exists: false } }],
        })
            .sort({ createdAt: -1 })
            .select(
                "name price stock images category description sellerId deliveryAvailable sameDayDelivery deliveryCutoffTime pickupAvailable pickupAddress pickupMapLink createdAt"
            );

        const sellerObj = seller.toObject();

        if (!sellerObj.canShowLocation) {
            sellerObj.location = "🔒 Location locked";
        }

        res.json({
            seller: sellerObj,
            products,
        });
    } catch (error) {
        console.error("GET SELLER STORE ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// GET SINGLE PRODUCT
// ==============================
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid product id" });
        }

        const product = await Product.findById(id).populate(
            "sellerId",
            "email storeName packageType isVerified location canShowLocation"
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const obj = product.toObject();

        if (!obj.sellerId || !obj.sellerId.canShowLocation) {
            obj.location = "🔒 Location locked";
        }

        const ratedOrders = await Order.find({
            sellerId: product.sellerId?._id || product.sellerId,
            isRated: true,
            rating: { $gt: 0 },
        }).select("rating");

        const reviewCount = ratedOrders.length;
        const averageRating =
            reviewCount > 0
                ? ratedOrders.reduce((sum, order) => sum + order.rating, 0) / reviewCount
                : 0;

        obj.sellerRating = Number(averageRating.toFixed(1));
        obj.sellerReviewCount = reviewCount;

        res.json(obj);
    } catch (error) {
        console.error("GET SINGLE PRODUCT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// UPDATE PRODUCT
// ==============================
router.put(
    "/:id",
    authMiddleware,
    upload.array("images", 5),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid product id" });
            }

            const product = await Product.findById(id);

            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            if (product.sellerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized" });
            }


            const user = await User.findById(req.user._id);

            const deliveryAvailable = req.body.deliveryAvailable === "true";
            const sameDayDelivery = req.body.sameDayDelivery === "true";
            const pickupAvailable = req.body.pickupAvailable === "true";
            const deliveryCutoffTime = req.body.deliveryCutoffTime || "16:00";

            if (!deliveryAvailable && !pickupAvailable) {
                return res.status(400).json({
                    message: "Хүргэлт эсвэл очиж авах сонголтоос ядаж нэгийг сонгоно уу",
                });
            }
            if (pickupAvailable && !req.body.pickupMapLink?.trim()) {
                return res.status(400).json({
                    message: "Байршлын линк шаардлагатай",
                });
            }

            product.name = req.body.name;
            product.description = req.body.description;
            product.price = req.body.price;
            product.stock = Number(req.body.stock);
            product.sizes = Array.isArray(req.body.sizes)
                ? req.body.sizes.map((size) => String(size).trim()).filter(Boolean)
                : req.body.sizes
                    ? [String(req.body.sizes).trim()]
                    : [];
            product.isActive = Number(req.body.stock) > 0;
            product.category = req.body.category;


            product.location = user?.location || "";

            product.deliveryAvailable = deliveryAvailable;
            product.sameDayDelivery = deliveryAvailable ? sameDayDelivery : false;
            product.deliveryCutoffTime = deliveryAvailable ? deliveryCutoffTime : "16:00";

            product.pickupAvailable = pickupAvailable;


            product.pickupMapLink = req.body.pickupMapLink || "";

            let existingImages = req.body.existingImages || [];

            if (!Array.isArray(existingImages)) {
                existingImages = existingImages ? [existingImages] : [];
            }

            const newImages = req.files
                ? req.files.map((file) => file.path)
                : [];

            product.images = [...existingImages, ...newImages];

            await product.save();

            res.json(product);
        } catch (error) {
            console.error("UPDATE PRODUCT ERROR:", error);
            res.status(500).json({ message: error.message });
        }
    }
);

// ==============================
// DELETE PRODUCT
// ==============================
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid product id" });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await product.deleteOne();

        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("DELETE PRODUCT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==============================
// TOGGLE PRODUCT ACTIVE
// ==============================
router.put("/:id/toggle-active", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }


        product.isActive = !product.isActive;


        if (!product.isActive) {
            product.stock = 0;
        }

        await product.save();

        res.json({
            message: product.isActive
                ? "Product reactivated"
                : "Product deactivated",
            product,
        });
    } catch (error) {
        console.error("TOGGLE PRODUCT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;