"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/utils/format";

type Seller = {
    _id?: string;
    storeName?: string;
    packageType?: "free" | "basic" | "pro" | "premium";
    isVerified?: boolean;
};

type Product = {
    _id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    location?: string;
    images?: string[];
    sellerId?: Seller;

    deliveryAvailable?: boolean;
    sameDayDelivery?: boolean;
    deliveryCutoffTime?: string;

    pickupAvailable?: boolean;
    pickupAddress?: string;
    pickupMapLink?: string;

    sellerRating?: number;
    sellerReviewCount?: number;
    isTopSeller?: boolean;
};

function getSellerBadge(packageType?: string) {
    switch (packageType) {
        case "premium":
            return {
                label: "Премиум",
                className: "bg-yellow-100 text-yellow-700",
            };
        case "pro":
            return {
                label: "Про",
                className: "bg-purple-100 text-purple-700",
            };
        case "basic":
            return {
                label: "Энгийн",
                className: "bg-blue-100 text-blue-700",
            };
        default:
            return {
                label: "Багц аваагүй",
                className: "bg-gray-100 text-gray-700",
            };
    }
}

export default function ProductCard({
    product,
    showSeller = false,
    featured = false,
}: {
    product: Product;
    showSeller?: boolean;
    featured?: boolean;
}) {
    const imageUrl =
        product.images && product.images.length > 0
            ? `${process.env.NEXT_PUBLIC_API_URL}${product.images[0]}`
            : "/no-image.png";

    const badge = getSellerBadge(product.sellerId?.packageType);

    const isTopRated =
        (product.sellerReviewCount || 0) >= 3 &&
        (product.sellerRating || 0) >= 4.5;




    return (
        <Link
            href={`/products/${product._id}`}
            className={`block rounded-2xl border bg-white p-4 shadow transition hover:shadow-lg ${featured ? "border-yellow-300" : ""
                }`}
        >
            <div className="relative mb-3 h-48 w-full overflow-hidden rounded-xl bg-gray-100">
                <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                    loading="eager"
                />
            </div>

            {showSeller && (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="line-clamp-1 text-sm font-medium text-gray-700">
                        {product.sellerId?.storeName || "Дэлгүүр"}
                    </p>

                    <span
                        className={`rounded-full px-2 py-1 text-xs ${badge.className}`}
                    >
                        {badge.label}
                    </span>

                    {product.sellerId?.isVerified && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                            Баталгаажсан
                        </span>
                    )}
                    {product.isTopSeller && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                            🔥 Top Seller
                        </span>
                    )}

                    {isTopRated && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                            Өндөр үнэлгээтэй
                        </span>
                    )}
                </div>
            )}

            <h3 className="line-clamp-1 text-lg font-semibold">{product.name}</h3>




            <div className="mt-2 flex flex-wrap gap-2">
                {product.deliveryAvailable && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                        🚚 Хүргэлт
                    </span>
                )}

                {product.pickupAvailable && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                        📍 Очиж авах
                    </span>
                )}

                {!product.deliveryAvailable && !product.pickupAvailable && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                        Боломжгүй
                    </span>
                )}
            </div>





            <p className="mt-2 text-lg font-bold">{formatPrice(product.price)}</p>




        </Link>
    );
}