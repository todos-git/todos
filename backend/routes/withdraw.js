const express = require("express");
const router = express.Router();
const Withdraw = require("../models/Withdraw");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");


// SELLER REQUEST WITHDRAW
router.post("/request", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "seller") {
            return res.status(403).json({ message: "Not authorized" });
        }

        const { amount } = req.body;

        const user = await User.findById(req.user._id);

        if (user.availableBalance < amount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const withdraw = await Withdraw.create({
            seller: user._id,
            amount,
            status: "pending"
        });

        res.json({ message: "Withdraw request sent", withdraw });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});


// ADMIN APPROVE WITHDRAW
router.put("/:id/approve", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "superadmin") {
            return res.status(403).json({ message: "Not authorized" });
        }

        const withdraw = await Withdraw.findById(req.params.id);

        if (!withdraw) {
            return res.status(404).json({ message: "Withdraw not found" });
        }

        if (withdraw.status !== "pending") {
            return res.status(400).json({ message: "Already processed" });
        }

        const seller = await User.findById(withdraw.seller);

        seller.availableBalance -= withdraw.amount;
        await seller.save();

        withdraw.status = "approved";
        await withdraw.save();

        res.json({ message: "Withdraw approved" });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;