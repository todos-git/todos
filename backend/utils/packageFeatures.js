function getPackageConfig(packageType) {
    switch (packageType) {
        case "basic":
            return {
                productLimit: 30,
                canShowLocation: true,
                durationDays: 90,
                amount: 39000,
            };

        case "pro":
            return {
                productLimit: 60,
                canShowLocation: true,
                durationDays: 90,
                amount: 59000,
            };

        case "premium":
            return {
                productLimit: 100,
                canShowLocation: true,
                durationDays: 90,
                amount: 89000,
            };

        case "free":
        default:
            return {
                productLimit: 5,
                canShowLocation: false,
                durationDays: 0,
                amount: 0,
            };
    }
}

module.exports = { getPackageConfig };