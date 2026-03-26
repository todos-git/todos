console.log("🚀 THIS AUTH FILE IS LOADED");

require("dotenv").config();
console.log("JWT SECRET:", process.env.JWT_SECRET);

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { checkAndDowngradePackage } = require("../utils/checkAndDowngradePackage");










// ================= REGISTER =================
router.post("/register", async (req, res) => {
    try {
        const { role, storeName, categories, category, email, phone, location, password } = req.body;

        console.log("REGISTER BODY:", req.body);

        const normalizedEmail = email?.trim().toLowerCase();
        const normalizedRole = role === "seller" ? "seller" : "user";

        const normalizedCategories = Array.isArray(categories)
            ? categories
                .map((item) => String(item).trim())
                .filter(Boolean)
            : category?.trim()
                ? [category.trim()]
                : [];

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                message: "И-мэйл болон нууц үг шаардлагатай",
            });
        }

        if (password.trim().length < 6) {
            return res.status(400).json({
                message: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой",
            });
        }

        if (!phone || !phone.trim()) {
            return res.status(400).json({
                message: "Утасны дугаараа оруулна уу",
            });
        }

        const phoneRegex = /^[0-9]{8}$/;

        if (!phoneRegex.test(phone.trim())) {
            return res.status(400).json({
                message: "Утасны дугаар 8 оронтой байх ёстой",
            });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({
                message: "Ийм хэрэглэгч бүртгэлтэй байна",
            });
        }

        if (normalizedRole === "seller") {
            if (!storeName?.trim() || !location?.trim() || normalizedCategories.length === 0) {
                return res.status(400).json({
                    message: "Худалдагчийн мэдээллийг бүрэн бөглөнө үү",
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const newUser = await User.create({
            email: normalizedEmail,
            phone: phone.trim(),
            password: hashedPassword,
            role: normalizedRole,
            storeName: normalizedRole === "seller" ? storeName.trim() : "",
            categories: normalizedRole === "seller" ? normalizedCategories : [],
            location: normalizedRole === "seller" ? location.trim() : "",
            verificationToken,
        });

        console.log("REGISTERED USER:", newUser.email);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        const verifyLink = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/verify-email/${verificationToken}`;

        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: normalizedEmail,
            subject: "Имэйл баталгаажуулах",
            html: `
<div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
        
        <h2 style="margin:0 0 16px;font-size:24px;">
            Имэйл баталгаажуулалт
        </h2>

        <p style="margin:0 0 14px;color:#475569;">
            TODOS marketplace-д бүртгүүлсэнд баярлалаа.
        </p>

        <p style="margin:0 0 20px;color:#475569;">
            Доорх товч дээр дарж имэйл хаягаа баталгаажуулна уу.
        </p>

        <div style="margin:24px 0;">
            <a href="${verifyLink}"
               style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:bold;">
               Имэйлээ баталгаажуулах
            </a>
        </div>

        <p style="margin:0 0 12px;font-size:14px;color:#64748b;">
            Баталгаажуулсны дараа доорх холбоосоор нэвтэрнэ үү:
        </p>

        <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login"
               style="color:#2563eb;text-decoration:underline;font-weight:600;">
               Нэвтрэх хуудас руу орох
            </a>
        </p>

        <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;" />

        <p style="font-size:13px;color:#94a3b8;">
            Хэрвээ та энэ бүртгэлийг өөрөө хийгээгүй бол энэ имэйлийг үл тооно уу.
        </p>

    </div>
</div>
`,
        });

        res.json({
            message: "Баталгаажуулах имэйл илгээгдлээ",
        });
    } catch (error) {
        console.log("REGISTER ERROR:", error);

        res.status(500).json({
            message: "Бүртгэхэд алдаа гарлаа",
            error: error.message,
        });
    }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const cleanEmail = email?.toLowerCase().trim();

        if (!cleanEmail || !password) {
            return res.status(400).json({
                message: "И-мэйл болон нууц үгээ оруулна уу",
            });
        }

        const user = await User.findOne({ email: cleanEmail });

        console.log("LOGIN EMAIL:", cleanEmail);
        console.log("FOUND USER:", user);

        if (!user) {
            return res.status(400).json({ message: "Хэрэглэгч олдсонгүй" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Нууц үг буруу байна" });
        }

        if (!user.isVerified) {
            return res.status(400).json({
                message: "Эхлээд имэйлээ баталгаажуулна уу",
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                storeName: user.storeName || "",
                category: user.category || "",
                location: user.location || "",
                packageType: user.packageType || "free",
                canShowLocation: !!user.canShowLocation,
            },
        });
    } catch (error) {
        console.log("LOGIN ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        const cleanEmail = email?.trim().toLowerCase();

        if (!cleanEmail) {
            return res.status(400).json({
                message: "И-мэйл хаягаа оруулна уу",
            });
        }

        const user = await User.findOne({ email: cleanEmail });

        // Security: email burtgeltei esehiig il gargahgui
        if (!user) {
            return res.json({
                message:
                    "Хэрвээ энэ и-мэйл бүртгэлтэй бол нууц үг сэргээх холбоос илгээгдлээ",
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 min

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();

        const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: cleanEmail,
            subject: "Нууц үг сэргээх хүсэлт",
            html: `
                <h2>Нууц үг сэргээх</h2>
                <p>Доорх холбоосоор орж шинэ нууц үгээ тохируулна уу:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>Энэ холбоос 30 минутын хугацаанд хүчинтэй.</p>
                <p>Хэрвээ та энэ хүсэлтийг гаргаагүй бол энэ имэйлийг үл тооно уу.</p>
            `,
        });

        res.json({
            message:
                "Хэрвээ энэ и-мэйл бүртгэлтэй бол нууц үг сэргээх холбоос илгээгдлээ",
        });
    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        res.status(500).json({ message: "Нууц үг сэргээх хүсэлт боловсруулахад алдаа гарлаа" });
    }
});

// ================= RESET PASSWORD =================
router.post("/reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.trim().length < 6) {
            return res.status(400).json({
                message: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой",
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                message: "Сэргээх холбоос хүчингүй эсвэл хугацаа дууссан байна",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        res.json({
            message: "Нууц үг амжилттай шинэчлэгдлээ",
        });
    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        res.status(500).json({ message: "Нууц үг шинэчлэхэд алдаа гарлаа" });
    }
});


// ================= UPGRADE PACKAGE =================
router.post("/upgrade", authMiddleware, async (req, res) => {
    try {
        const { packageType } = req.body;
        const user = req.user;

        if (user.role !== "seller") {
            return res.status(403).json({
                message: "Зөвхөн худалдагч багц ахиулах боломжтой",
            });
        }

        const packages = {
            basic: {
                productLimit: 30,
                canShowLocation: true,
            },
            pro: {
                productLimit: 60,
                canShowLocation: true,
            },
            premium: {
                productLimit: 100,
                canShowLocation: true,
            },
        };

        if (!packages[packageType]) {
            return res.status(400).json({ message: "Багц буруу байна" });
        }

        user.packageType = packageType;
        user.productLimit = packages[packageType].productLimit;
        user.canShowLocation = packages[packageType].canShowLocation;

        const expires = new Date();
        expires.setMonth(expires.getMonth() + 3);
        user.packageExpiresAt = expires;

        await user.save();

        res.json({
            message: `${packageType} багц амжилттай идэвхжлээ`,
            expiresAt: expires,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/profile", authMiddleware, (req, res) => {
    res.json({
        message: "Protected",
        user: req.user,
    });
});


// ================= Verification =================
router.get("/verify/:token", async (req, res) => {
    try {
        const user = await User.findOne({
            verificationToken: req.params.token
        });

        if (!user) {
            return res.status(400).send("Invalid token");
        }

        user.isVerified = true;
        user.verificationToken = null;

        await user.save();

        console.log("VERIFIED USER:", user.email);

        res.send("Email verified successfully");
    } catch (error) {
        console.log("VERIFY ERROR:", error);
        res.status(500).send("Verification failed");
    }
});


// ================= TEST =================
router.get("/test", (req, res) => {
    res.json({ message: "Auth route working" });
});

// ================= GET CURRENT USER =================
router.get("/me", authMiddleware, async (req, res) => {
    try {
        let user = await User.findById(req.user._id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user = await checkAndDowngradePackage(user);

        res.json(user);
    } catch (error) {
        console.error("GET ME ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});




module.exports = router;
