function getBannerPricing(durationDays) {
    switch (Number(durationDays)) {
        case 7:
            return {
                label: "Starter",
                amount: 19000,
            };
        case 14:
            return {
                label: "Best Value",
                amount: 29000,
            };
        case 21:
            return {
                label: "Maximum Reach",
                amount: 39000,
            };
        default:
            return null;
    }
}

module.exports = { getBannerPricing };