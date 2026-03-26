export type CartItem = {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    stock?: number;
    storeName?: string;
    slug?: string;
    quantity: number;
    sellerId?: string;

    deliveryAvailable?: boolean;
    sameDayDelivery?: boolean;
    deliveryCutoffTime?: string;

    pickupAvailable?: boolean;
    pickupAddress?: string;
    pickupMapLink?: string;
};

const emitCartUpdated = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cartUpdated"));
    }
};

export const getCart = (): CartItem[] => {
    if (typeof window === "undefined") return [];

    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
};

export const addToCart = (product: Omit<CartItem, "quantity">) => {
    const cart = getCart();

    const existingItem = cart.find((item) => item._id === product._id);

    if (existingItem) {
        if (existingItem.stock && existingItem.quantity >= existingItem.stock) {
            emitCartUpdated();
            return;
        }

        existingItem.quantity += 1;

        existingItem.sellerId = product.sellerId;

        existingItem.deliveryAvailable = product.deliveryAvailable;
        existingItem.sameDayDelivery = product.sameDayDelivery;
        existingItem.deliveryCutoffTime = product.deliveryCutoffTime;

        existingItem.pickupAvailable = product.pickupAvailable;
        existingItem.pickupAddress = product.pickupAddress;
        existingItem.pickupMapLink = product.pickupMapLink;

        existingItem.storeName = product.storeName;
        existingItem.images = product.images;
        existingItem.price = product.price;
        existingItem.stock = product.stock;
        existingItem.slug = product.slug;
    } else {
        cart.push({
            ...product,
            quantity: 1,
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    emitCartUpdated();
};

export const removeFromCart = (productId: string) => {
    const updatedCart = getCart().filter((item) => item._id !== productId);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    emitCartUpdated();
};

export const updateCartQuantity = (productId: string, newQuantity: number) => {
    const cart = getCart();

    const updatedCart = cart.map((item) => {
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

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    emitCartUpdated();
};

export const getCartCount = () => {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
};

export const clearCart = () => {
    localStorage.removeItem("cart");
    emitCartUpdated();
};