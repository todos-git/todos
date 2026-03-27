export type PickupItem = {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    stock?: number;
    storeName?: string;
    slug?: string;
    quantity: number;
    sellerId?: string;
    pickupAvailable?: boolean;
    pickupAddress?: string;
    pickupMapLink?: string;
};

const emitPickupUpdated = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pickupUpdated"));
    }
};

export const getPickupItems = (): PickupItem[] => {
    if (typeof window === "undefined") return [];

    const pickup = localStorage.getItem("pickup");
    return pickup ? JSON.parse(pickup) : [];
};

export const addToPickup = (product: Omit<PickupItem, "quantity">) => {
    const pickupItems = getPickupItems();

    const existingItem = pickupItems.find((item) => item._id === product._id);

    if (existingItem) {
        if (existingItem.stock && existingItem.quantity >= existingItem.stock) {
            emitPickupUpdated();
            return;
        }

        existingItem.quantity += 1;
        existingItem.storeName = product.storeName;
        existingItem.images = product.images;
        existingItem.price = product.price;
        existingItem.stock = product.stock;
        existingItem.slug = product.slug;
        existingItem.sellerId = product.sellerId;
        existingItem.pickupAvailable = product.pickupAvailable;
        existingItem.pickupAddress = product.pickupAddress;
        existingItem.pickupMapLink = product.pickupMapLink;
    } else {
        pickupItems.push({
            ...product,
            quantity: 1,
        });
    }

    localStorage.setItem("pickup", JSON.stringify(pickupItems));
    emitPickupUpdated();
};

export const removeFromPickup = (productId: string) => {
    const updated = getPickupItems().filter((item) => item._id !== productId);
    localStorage.setItem("pickup", JSON.stringify(updated));
    emitPickupUpdated();
};

export const updatePickupQuantity = (productId: string, newQuantity: number) => {
    const pickupItems = getPickupItems();

    const updated = pickupItems.map((item) => {
        if (item._id === productId) {
            if (newQuantity < 1) {
                return { ...item, quantity: 1 };
            }

            if (item.stock && newQuantity > item.stock) {
                return item;
            }

            return {
                ...item,
                quantity: newQuantity,
            };
        }

        return item;
    });

    localStorage.setItem("pickup", JSON.stringify(updated));
    emitPickupUpdated();
};

export const getPickupCount = () => {
    const pickupItems = getPickupItems();
    return pickupItems.reduce((total, item) => total + item.quantity, 0);
};

export const clearPickup = () => {
    localStorage.removeItem("pickup");
    emitPickupUpdated();
};