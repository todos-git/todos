router.post("/upgrade", authMiddleware, async (req, res) => {
    try {
        const { packageType } = req.body;

        let productLimit = 5;
        let canShowLocation = false;
        let durationDays = 90;

        if (packageType === "basic") {
            productLimit = 30;
            canShowLocation = true;
        }

        if (packageType === "pro") {
            productLimit = 60;
            canShowLocation = true;
        }

        if (packageType === "premium") {
            productLimit = 100;
            canShowLocation = true;
        }

        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + durationDays);

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                packageType,
                productLimit,
                canShowLocation,
                packageExpiresAt: expireDate
            },
            { new: true }
        );

        res.json({
            message: "Package upgraded",
            user
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});