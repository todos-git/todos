"use client";

import { addToCart } from "@/utils/cart";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    product: {
        _id: string;
        name: string;
        price: number;
        images?: string[];
        stock?: number;
        storeName?: string;
        sellerId?: string;

        deliveryAvailable?: boolean;
        sameDayDelivery?: boolean;
        deliveryCutoffTime?: string;

        pickupAvailable?: boolean;
        pickupAddress?: string;
        pickupMapLink?: string;
    };
};

export default function BuyOptionsModal({ isOpen, onClose, product }: Props) {
    if (!isOpen) return null;

    const isOutOfStock = (product.stock || 0) <= 0;

    const handleAddToCart = () => {
        if (!product.sellerId) {
            alert("sellerId missing");
            return;
        }

        if (isOutOfStock) {
            alert("Энэ барааны үлдэгдэл дууссан байна");
            return;
        }

        addToCart({
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            stock: product.stock,
            storeName: product.storeName,
            sellerId: product.sellerId,

            deliveryAvailable: product.deliveryAvailable,
            sameDayDelivery: product.sameDayDelivery,
            deliveryCutoffTime: product.deliveryCutoffTime,

            pickupAvailable: product.pickupAvailable,
            pickupAddress: product.pickupAddress,
            pickupMapLink: product.pickupMapLink,
        });

        alert("Added to cart");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="mb-2 text-xl font-bold">Choose Purchase Option</h2>
                <p className="mb-2 text-sm text-gray-500">{product.name}</p>

                <p className={`mb-5 text-sm font-medium ${isOutOfStock ? "text-red-600" : "text-gray-600"}`}>
                    {isOutOfStock
                        ? "📦 Үлдэгдэл дууссан"
                        : `📦 Үлдэгдэл: ${product.stock ?? 0}`}
                </p>

                <div className="mb-4 rounded-xl border p-4">
                    <p className="mb-2 font-semibold">🚚 Delivery</p>

                    {product.deliveryAvailable ? (
                        <>
                            <p className="mb-2 text-sm text-green-600">
                                Delivery available for this item
                            </p>

                            {product.sameDayDelivery ? (
                                <p className="mb-3 text-sm text-gray-600">
                                    Order before{" "}
                                    <span className="font-semibold text-black">
                                        {product.deliveryCutoffTime || "16:00"}
                                    </span>{" "}
                                    for same day delivery
                                </p>
                            ) : (
                                <p className="mb-3 text-sm text-gray-600">
                                    Delivery starts tomorrow
                                </p>
                            )}

                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className={`w-full rounded-lg py-2 ${isOutOfStock
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-black text-white hover:opacity-90"
                                    }`}
                            >
                                {isOutOfStock ? "Үлдэгдэл дууссан" : "Add to Cart"}
                            </button>
                        </>
                    ) : (
                        <p className="text-sm text-red-500">
                            This item has no delivery
                        </p>
                    )}
                </div>

                <div className="mb-4 rounded-xl border p-4">
                    <p className="mb-2 font-semibold">📍 Pickup</p>

                    {product.pickupAvailable ? (
                        <>
                            <p className="mb-2 text-sm text-gray-600">
                                {product.pickupAddress || "Pickup location available"}
                            </p>

                            {product.pickupMapLink && (
                                <a
                                    href={product.pickupMapLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-blue-600 underline"
                                >
                                    Open in Google Maps
                                </a>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">
                            Pickup is not available for this item
                        </p>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="mt-2 w-full rounded-lg border py-2"
                >
                    Close
                </button>
            </div>
        </div>
    );
}