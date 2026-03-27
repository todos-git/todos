require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const withdrawRoutes = require("./routes/withdraw");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/payment");
const bannerAdsRoutes = require("./routes/bannerAds");

const User = require("./models/User");

const app = express();

// ==============================
// CORS
// ==============================
const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://todos.mn",
    "https://www.todos.mn",
    "https://todos.vercel.app",
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);

            const isExactMatch = allowedOrigins.includes(origin);
            const isVercelPreview = /^https:\/\/todos-.*\.vercel\.app$/.test(origin);

            if (isExactMatch || isVercelPreview) {
                return callback(null, true);
            }

            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
    })
);

// ==============================
// MIDDLEWARE
// ==============================
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ==============================
// ROUTES
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/banner-ads", bannerAdsRoutes);

// ==============================
// ROOT
// ==============================
app.get("/", (req, res) => {
    res.send("Backend is running");
});

// ==============================
// DB + SERVER START
// ==============================
async function createSuperAdmin() {
    try {
        const existing = await User.findOne({ role: "superadmin" });

        if (existing) return;

        const hashedPassword = await bcrypt.hash("admin123", 10);

        await User.create({
            email: "admin@site.mn",
            password: hashedPassword,
            role: "superadmin",
        });

        console.log("✅ Super admin created");
    } catch (error) {
        console.error("CREATE SUPER ADMIN ERROR:", error);
    }
}

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        await createSuperAdmin();

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("SERVER START ERROR:", error);
    }
}


app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR RAW:", err);
    console.error(
        "GLOBAL ERROR STRING:",
        JSON.stringify(err, Object.getOwnPropertyNames(err))
    );

    res.status(500).json({
        message: err.message || "Server error",
        details: JSON.stringify(err, Object.getOwnPropertyNames(err)),
    });
});

startServer();