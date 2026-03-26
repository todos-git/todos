const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {

        // 🔥 1️⃣ Header-аас token авах
        const authHeader = req.header("Authorization");

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.replace("Bearer ", "");

        // 🔥 2️⃣ Verify
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🔥 3️⃣ User олох
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // 🔥 4️⃣ req.user тохируулах
        req.user = user;   // ⚠️ decoded биш user хадгална

        next();

    } catch (error) {
        console.error("Auth error:", error.message);
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;