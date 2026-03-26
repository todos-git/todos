const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const authMiddleware = require("../middleware/authMiddleware");

// ADD TO CART
router.post("/add", authMiddleware, async (req, res) => {
    const { productId } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
        item => item.product.toString() === productId
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.items.push({ product: productId });
    }

    await cart.save();

    res.json(cart);
});

// GET CART
router.get("/", authMiddleware, async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id })
        .populate("items.product");

    res.json(cart);
});

module.exports = router;