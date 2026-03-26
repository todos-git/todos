async function checkAndDowngradePackage(user) {
    if (!user) return user;

    if (
        user.packageType !== "free" &&
        user.packageExpiresAt &&
        new Date(user.packageExpiresAt) <= new Date()
    ) {
        user.packageType = "free";
        user.productLimit = 5;
        user.canShowLocation = false;
        user.packageExpiresAt = null;

        await user.save();
    }

    return user;
}

module.exports = { checkAndDowngradePackage };