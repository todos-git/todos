"use client";

import { addToCart } from "@/utils/cart";

type Props = {
    product: {
        _id: string;
        name: string;
        price: number;
        images?: string[];
        stock?: number;
        storeName?: string;
        slug?: string;
        deliveryAvailable?: boolean;
        pickupAvailable?: boolean;
    };
};

export default function AddToCartButton({ product }: Props) {
    const isOutOfStock = (product.stock || 0) <= 0;

    const handleAdd = () => {
        if (isOutOfStock) {
            alert("Энэ барааны үлдэгдэл дууссан байна");
            return;
        }
        if (!product.deliveryAvailable) {
            alert("Энэ бараа хүргэлтгүй тул сагсанд хийх боломжгүй");
        }

        addToCart(product);
        alert("Added to cart");
    };

    return (
        <button
            onClick={handleAdd}
            disabled={isOutOfStock || !product.deliveryAvailable}
            className={`mt-6 px-6 py-3 rounded-lg transition ${isOutOfStock || !product.deliveryAvailable
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
                }`}
        >
            {isOutOfStock
                ? "Үлдэгдэл дууссан"
                : !product.deliveryAvailable
                    ? "Хүргэлтгүй"
                    : "Add to Cart"}
        </button>
    );
}