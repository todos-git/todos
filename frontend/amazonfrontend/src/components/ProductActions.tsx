"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BuyOptionsModal from "@/components/BuyOptionsModal";

type Seller = {
    _id: string;
    storeName?: string;
};

type Props = {
    product: {
        _id: string;
        name: string;
        price: number;
        images?: string[];
        stock?: number;
        storeName?: string;
        sellerId?: string | Seller;

        deliveryAvailable?: boolean;
        sameDayDelivery?: boolean;
        deliveryCutoffTime?: string;

        pickupAvailable?: boolean;
        pickupAddress?: string;
        pickupMapLink?: string;
    };
};

export default function ProductActions({ product }: Props) {
    const router = useRouter();
    const pathname = usePathname();

    const [open, setOpen] = useState(false);

    const normalizedSellerId =
        typeof product.sellerId === "object"
            ? product.sellerId?._id
            : product.sellerId;

    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const role =
        typeof window !== "undefined" ? localStorage.getItem("role") : null;

    const currentUserId =
        typeof window !== "undefined" ? localStorage.getItem("userId") : null;

    const isLoggedIn = !!token;
    const isSeller = role === "seller";
    const isOwnProduct =
        !!currentUserId &&
        !!normalizedSellerId &&
        currentUserId === normalizedSellerId;

    const isOutOfStock = useMemo(() => (product.stock || 0) <= 0, [product.stock]);

    const handleOpenBuyOptions = () => {
        if (!isLoggedIn) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        if (isSeller && isOwnProduct) {
            alert("Та өөрийн бүтээгдэхүүнийг худалдаж авах боломжгүй.");
            return;
        }

        if (isOutOfStock) {
            alert("Энэ бүтээгдэхүүн дууссан байна.");
            return;
        }

        setOpen(true);
    };

    return (
        <div className="mt-6">
            <button
                onClick={handleOpenBuyOptions}
                disabled={isOutOfStock}
                className={`rounded-lg px-6 py-3 font-medium transition ${isOutOfStock
                        ? "cursor-not-allowed bg-gray-300 text-gray-600"
                        : "bg-black text-white hover:bg-gray-800"
                    }`}
            >
                {isOutOfStock ? "Бараа дууссан" : "Худалдан авах сонголт"}
            </button>

            <BuyOptionsModal
                isOpen={open}
                onClose={() => setOpen(false)}
                product={{
                    ...product,
                    sellerId: normalizedSellerId,
                }}
            />
        </div>
    );
}