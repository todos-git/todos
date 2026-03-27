"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCart } from "@/utils/cart";
import { formatPrice } from "@/utils/format";

type CartItem = {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    stock?: number;
    storeName?: string;
    quantity: number;
    sellerId?: string;
    deliveryAvailable?: boolean;
    sameDayDelivery?: boolean;
    deliveryCutoffTime?: string;
    pickupAvailable?: boolean;
    pickupAddress?: string;
    pickupMapLink?: string;
};

export default function CheckoutPage() {
    const [cartItems, setCartItems] = useState<CartItem[] | null>(null);

    const getImageSrc = (src?: string) => {
        if (!src) return "/no-image.png";

        return src.startsWith("http")
            ? src
            : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith("/") ? src : `/${src}`}`;
    };

    const handlePlaceOrder = async () => {
        const token = localStorage.getItem("token");

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                cartItems,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Захиалга хийхэд алдаа гарлаа");
            return;
        }

        alert("Захиалга амжилттай баталгаажлаа");

        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cartUpdated"));
        window.location.href = "/";
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setCartItems(getCart());
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    const subtotal = useMemo(() => {
        if (!cartItems) return 0;
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [cartItems]);

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

    const tax = 0;
    const total = subtotal + shipping + tax;

    if (cartItems === null) {
        return (
            <div className="min-h-screen bg-[#f6f6f6] px-4 py-10 md:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                        <p className="text-gray-500">Захиалгын мэдээлэл ачааллаж байна...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f6f6] px-4 py-10 md:px-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <p className="text-sm uppercase tracking-[0.25em] text-gray-400">
                        Эцсийн баталгаажуулалт
                    </p>
                    <h1 className="mt-2 text-3xl font-bold md:text-4xl">Захиалгаа шалгах</h1>
                    <p className="mt-2 text-gray-500">
                        Захиалга илгээхээсээ өмнө бараа, тоо хэмжээ, нийт дүнгээ шалгана уу.
                    </p>
                </div>

                {cartItems.length === 0 ? (
                    <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                        <h2 className="mb-3 text-2xl font-bold">Таны сагс хоосон байна</h2>
                        <p className="mb-6 text-gray-500">
                            Үргэлжлүүлэхийн тулд сагсандаа бараа нэмнэ үү.
                        </p>
                        <Link
                            href="/cart"
                            className="inline-block rounded-xl bg-black px-6 py-3 text-white hover:opacity-90"
                        >
                            Сагс руу буцах
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                        <div className="space-y-6 xl:col-span-2">
                            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Захиалсан бараанууд</h2>
                                    <span className="text-sm text-gray-500">
                                        {cartItems.reduce((sum, item) => sum + item.quantity, 0)} ширхэг
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    {cartItems.map((item, index) => (
                                        <div key={item._id}>
                                            <div className="flex flex-col gap-5 md:flex-row">
                                                <div className="h-36 w-full shrink-0 overflow-hidden rounded-2xl border bg-gray-100 md:w-36">
                                                    {item.images?.[0] ? (
                                                        <>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={getImageSrc(item.images?.[0])}
                                                                alt={item.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </>
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                        <div>
                                                            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-400">
                                                                Бүтээгдэхүүн
                                                            </p>

                                                            <Link
                                                                href={`/products/${item._id}`}
                                                                className="text-xl font-semibold hover:underline"
                                                            >
                                                                {item.name}
                                                            </Link>

                                                            <p className="mt-3 text-sm text-gray-500">
                                                                Дэлгүүр:{" "}
                                                                <span className="font-medium text-gray-700">
                                                                    {item.storeName || "Тодорхойгүй дэлгүүр"}
                                                                </span>
                                                            </p>

                                                            <p className="mt-1 text-sm text-gray-500">
                                                                Тоо ширхэг:{" "}
                                                                <span className="font-medium text-gray-700">
                                                                    {item.quantity}
                                                                </span>
                                                            </p>

                                                            <p className="mt-1 text-sm text-gray-500">
                                                                Нэгж үнэ:{" "}
                                                                <span className="font-medium text-gray-700">
                                                                    {formatPrice(item.price)}
                                                                </span>
                                                            </p>

                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {item.deliveryAvailable && (
                                                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                                                                        🚚 Хүргэлт
                                                                    </span>
                                                                )}

                                                                {item.pickupAvailable && (
                                                                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                                                                        📍 Pickup
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {item.pickupAvailable && item.pickupAddress && (
                                                                <p className="mt-2 text-sm text-gray-500">
                                                                    Pickup хаяг:{" "}
                                                                    <span className="font-medium text-gray-700">
                                                                        {item.pickupAddress}
                                                                    </span>
                                                                </p>
                                                            )}

                                                            {item.pickupAvailable && item.pickupMapLink && (
                                                                <a
                                                                    href={item.pickupMapLink}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="mt-2 inline-block text-sm text-blue-600 underline"
                                                                >
                                                                    Газрын зураг харах
                                                                </a>
                                                            )}
                                                        </div>

                                                        <div className="md:text-right">
                                                            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-400">
                                                                Барааны дүн
                                                            </p>
                                                            <p className="text-2xl font-bold">
                                                                {formatPrice(item.price * item.quantity)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {index !== cartItems.length - 1 && (
                                                <div className="mt-6 border-t border-dashed pt-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                                <h2 className="mb-4 text-xl font-bold">Тайлбар</h2>

                                <div className="space-y-3 text-sm text-gray-600">
                                    <p>• Барааны нэр, дэлгүүр, тоо хэмжээ, хүргэлт/pickup мэдээллээ шалгана уу.</p>
                                    <p>• Хүргэлттэй худалдагч бүрт 5000₮ хүргэлтийн төлбөр бодогдоно.</p>
                                    <p>• Pickup барааг дээрх заасан байршлаас очиж авах боломжтой.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="sticky top-24 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                                <div className="mb-5 border-b border-dashed pb-4">
                                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                                        Төлбөрийн хураангуй
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold">Захиалгын дүн</h2>
                                </div>

                                <div className="space-y-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Барааны тоо</span>
                                        <span className="font-medium text-gray-800">
                                            {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Дэд дүн</span>
                                        <span className="font-medium text-gray-800">
                                            {formatPrice(subtotal)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Хүргэлт</span>
                                        <span className="font-medium text-gray-800">
                                            {formatPrice(shipping)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Татвар</span>
                                        <span className="font-medium text-gray-800">
                                            {formatPrice(tax)}
                                        </span>
                                    </div>
                                </div>

                                <div className="my-5 border-y border-dashed py-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-semibold">Нийт төлбөр</span>
                                        <span className="text-2xl font-bold">{formatPrice(total)}</span>
                                    </div>
                                </div>

                                <div className="mb-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                                    Захиалга баталгаажуулахдаа бараа, тоо ширхэг, хүргэлтийн сонголт,
                                    нийт төлбөр зөв эсэхийг шалгасан гэж үзнэ.
                                </div>

                                <button
                                    onClick={handlePlaceOrder}
                                    className="w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white transition hover:opacity-90"
                                >
                                    Захиалга баталгаажуулах
                                </button>

                                <Link
                                    href="/cart"
                                    className="mt-4 block text-center text-sm text-gray-500 hover:text-black"
                                >
                                    Сагс руу буцах
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}