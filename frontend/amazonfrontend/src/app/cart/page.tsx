"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCart, removeFromCart, updateCartQuantity } from "@/utils/cart";
import { formatPrice } from "@/utils/format";

type CartItem = {
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

export default function CartPage() {

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

    const getImageSrc = (src?: string) => {
        if (!src) return "/no-image.png";

        if (
            src.startsWith("http://") ||
            src.startsWith("https://") ||
            src.startsWith("blob:") ||
            src.startsWith("data:")
        ) {
            return src;
        }

        const normalizedSrc = src.startsWith("/") ? src : `/${src}`;
        return apiBaseUrl ? `${apiBaseUrl}${normalizedSrc}` : normalizedSrc;
    };
    const [cartItems, setCartItems] = useState<CartItem[] | null>(null);

    useEffect(() => {
        const syncCart = () => {
            setCartItems(getCart());
        };

        const timer = setTimeout(syncCart, 0);

        window.addEventListener("cartUpdated", syncCart);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("cartUpdated", syncCart);
        };
    }, []);

    const handleRemove = (id: string) => {
        removeFromCart(id);
        const updated = getCart();
        setCartItems(updated);
    };

    const handleIncrease = (item: CartItem) => {
        updateCartQuantity(item._id, item.quantity + 1);
        const updated = getCart();
        setCartItems(updated);
    };

    const handleDecrease = (item: CartItem) => {
        if (item.quantity > 1) {
            updateCartQuantity(item._id, item.quantity - 1);
            const updated = getCart();
            setCartItems(updated);
        }
    };

    const getDeliveryInfoText = (item: CartItem) => {
        if (item.deliveryAvailable) {
            if (item.sameDayDelivery) {
                return `${item.deliveryCutoffTime || "16:00"} цагаас өмнө захиалбал өдөртөө хүргэнэ`;
            }

            return "Хүргэлттэй";
        }

        if (item.pickupAvailable) {
            return "Очиж авах боломжтой";
        }

        return "Хүргэлтийн мэдээлэл байхгүй";
    };

    const subtotal = cartItems
        ? cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        : 0;

    const shipping = useMemo(() => {
        if (!cartItems || cartItems.length === 0) return 0;

        const sellerDeliveryMap = new Map<string, boolean>();

        cartItems.forEach((item) => {
            const sellerKey = item.sellerId || item.storeName || item._id;

            if (!sellerDeliveryMap.has(sellerKey)) {
                sellerDeliveryMap.set(sellerKey, false);
            }

            if (item.deliveryAvailable) {
                sellerDeliveryMap.set(sellerKey, true);
            }
        });

        let totalShipping = 0;

        sellerDeliveryMap.forEach((hasDelivery) => {
            if (hasDelivery) {
                totalShipping += 5000;
            }
        });

        return totalShipping;
    }, [cartItems]);

    const total = subtotal + shipping;

    if (cartItems === null) {
        return (
            <div className="min-h-screen bg-gray-100 px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-xl shadow p-6">
                        <p>Сагс ачааллаж байна...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 px-6 py-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
                    <h1 className="text-2xl font-bold mb-6">Миний сагс</h1>

                    {cartItems.length === 0 ? (
                        <p className="text-gray-500">Таны сагс хоосон байна.</p>
                    ) : (
                        <div className="space-y-5">
                            {cartItems.map((item) => (
                                <div
                                    key={item._id}
                                    className="border rounded-xl p-4 flex flex-col md:flex-row gap-4"
                                >
                                    <div className="w-full md:w-40 h-40 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        {item.images?.[0] ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={getImageSrc(item.images?.[0])
                                                        ? item.images[0]
                                                        : `${process.env.NEXT_PUBLIC_API_URL}${item.images[0].startsWith("/") ? item.images[0] : `/${item.images[0]}`}`
                                                    }
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-gray-400 text-sm">
                                                    No Image
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <Link
                                            href={`/products/${item._id}`}
                                            className="text-lg font-semibold hover:text-blue-600"
                                        >
                                            {item.name}
                                        </Link>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Дэлгүүр: {item.storeName || "Тодорхойгүй дэлгүүр"}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            Үлдэгдэл: {item.stock ?? 0}
                                        </p>

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {item.deliveryAvailable && (
                                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                    🚚 Хүргэлт
                                                </span>
                                            )}

                                            {item.pickupAvailable && (
                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                    📍 Pickup
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-blue-600 mt-2 font-medium">
                                            {getDeliveryInfoText(item)}
                                        </p>

                                        {item.pickupAvailable && item.pickupAddress && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                Очиж авах хаяг: {item.pickupAddress}
                                            </p>
                                        )}

                                        <p className="text-lg font-bold mt-3">
                                            {formatPrice(item.price * item.quantity)}
                                        </p>

                                        <div className="flex items-center gap-3 mt-4">
                                            <button
                                                onClick={() => handleDecrease(item)}
                                                className="px-3 py-1 border rounded"
                                            >
                                                -
                                            </button>

                                            <span className="min-w-[24px] text-center">
                                                {item.quantity}
                                            </span>

                                            <button
                                                onClick={() => handleIncrease(item)}
                                                className="px-3 py-1 border rounded"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="mt-4 flex gap-4 text-sm flex-wrap">
                                            <button
                                                onClick={() => handleRemove(item._id)}
                                                className="text-red-500 hover:underline"
                                            >
                                                Устгах
                                            </button>

                                            <Link
                                                href={`/products/${item._id}`}
                                                className="text-blue-500 hover:underline"
                                            >
                                                Бараа харах
                                            </Link>

                                            {item.pickupAvailable && item.pickupMapLink && (
                                                <a
                                                    href={item.pickupMapLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    Газрын зураг харах
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="md:w-32 text-right">
                                        <p className="text-sm text-gray-500">Нийт</p>
                                        <p className="text-lg font-bold">
                                            {formatPrice(item.price * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow p-6 h-fit sticky top-24">
                    <h2 className="text-xl font-bold mb-4">Захиалгын дүн</h2>

                    <div className="flex justify-between mb-2">
                        <span>Барааны тоо</span>
                        <span>
                            {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                    </div>

                    <div className="flex justify-between mb-2">
                        <span>Дэд дүн</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>

                    <div className="flex justify-between mb-2">
                        <span>Хүргэлт</span>
                        <span>{formatPrice(shipping)}</span>
                    </div>

                    <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
                        <span>Нийт төлбөр</span>
                        <span>{formatPrice(total)}</span>
                    </div>

                    <Link
                        href="/checkout"
                        className="block w-full mt-5 bg-yellow-400 hover:bg-yellow-500 py-3 rounded-lg font-semibold text-center"
                    >
                        Захиалга баталгаажуулах
                    </Link>
                </div>
            </div>
        </div>
    );
}










