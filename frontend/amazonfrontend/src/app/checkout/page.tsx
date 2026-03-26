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
            <div className="min-h-screen bg-[#f6f6f6] px-4 md:px-6 py-10">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <p className="text-gray-500">Захиалгын мэдээлэл ачааллаж байна...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f6f6] px-4 md:px-6 py-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <p className="text-sm uppercase tracking-[0.25em] text-gray-400">
                        Эцсийн баталгаажуулалт
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold mt-2">
                        Захиалгаа шалгах
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Захиалга илгээхээсээ өмнө бараа, тоо хэмжээ, нийт дүнгээ шалгана уу.
                    </p>
                </div>

                {cartItems.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center">
                        <h2 className="text-2xl font-bold mb-3">Таны сагс хоосон байна</h2>
                        <p className="text-gray-500 mb-6">
                            Үргэлжлүүлэхийн тулд сагсандаа бараа нэмнэ үү.
                        </p>
                        <Link
                            href="/cart"
                            className="inline-block px-6 py-3 rounded-xl bg-black text-white hover:opacity-90"
                        >
                            Сагс руу буцах
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 space-y-6">
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold">Захиалсан бараанууд</h2>
                                    <span className="text-sm text-gray-500">
                                        {cartItems.reduce((sum, item) => sum + item.quantity, 0)} ширхэг
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    {cartItems.map((item, index) => (
                                        <div key={item._id}>
                                            <div className="flex flex-col md:flex-row gap-5">
                                                <div className="w-full md:w-36 h-36 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border">
                                                    {item.images?.[0] ? (
                                                        <>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={
                                                                    item.images[0].startsWith("http")
                                                                        ? item.images[0]
                                                                        : `${process.env.NEXT_PUBLIC_API_URL}${item.images[0].startsWith("/") ? item.images[0] : `/${item.images[0]}`}`
                                                                }
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                        <div>
                                                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">
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
                                                                <span className="text-gray-700 font-medium">
                                                                    {item.storeName || "Тодорхойгүй дэлгүүр"}
                                                                </span>
                                                            </p>

                                                            <p className="mt-1 text-sm text-gray-500">
                                                                Тоо ширхэг:{" "}
                                                                <span className="text-gray-700 font-medium">
                                                                    {item.quantity}
                                                                </span>
                                                            </p>

                                                            <p className="mt-1 text-sm text-gray-500">
                                                                Нэгж үнэ:{" "}
                                                                <span className="text-gray-700 font-medium">
                                                                    {formatPrice(item.price)}
                                                                </span>
                                                            </p>

                                                            <div className="mt-3 flex flex-wrap gap-2">
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

                                                            {item.pickupAvailable && item.pickupAddress && (
                                                                <p className="mt-2 text-sm text-gray-500">
                                                                    Pickup хаяг:{" "}
                                                                    <span className="text-gray-700 font-medium">
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
                                                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">
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
                                                <div className="border-t border-dashed mt-6 pt-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                                <h2 className="text-xl font-bold mb-4">Тайлбар</h2>

                                <div className="space-y-3 text-sm text-gray-600">
                                    <p>• Барааны нэр, дэлгүүр, тоо хэмжээ, хүргэлт/pickup мэдээллээ шалгана уу.</p>
                                    <p>• Хүргэлттэй худалдагч бүрт 5000₮ хүргэлтийн төлбөр бодогдоно.</p>
                                    <p>• Pickup барааг дээрх заасан байршлаас очиж авах боломжтой.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 sticky top-24">
                                <div className="border-b border-dashed pb-4 mb-5">
                                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                                        Төлбөрийн хураангуй
                                    </p>
                                    <h2 className="text-2xl font-bold mt-2">Захиалгын дүн</h2>
                                </div>

                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Барааны тоо</span>
                                        <span className="font-medium text-gray-800">
                                            {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Дэд дүн</span>
                                        <span className="font-medium text-gray-800">
                                            {formatPrice(subtotal)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Хүргэлт</span>
                                        <span className="font-medium text-gray-800">
                                            {formatPrice(shipping)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Татвар</span>
                                        <span className="font-medium text-gray-800">
                                            {formatPrice(tax)}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-b border-dashed py-5 my-5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold">Нийт төлбөр</span>
                                        <span className="text-2xl font-bold">
                                            {formatPrice(total)}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-sm text-gray-600">
                                    Захиалга баталгаажуулахдаа бараа, тоо ширхэг, хүргэлтийн сонголт,
                                    нийт төлбөр зөв эсэхийг шалгасан гэж үзнэ.
                                </div>

                                <button
                                    onClick={handlePlaceOrder}
                                    className="w-full bg-black text-white py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition"
                                >
                                    Захиалга баталгаажуулах
                                </button>

                                <Link
                                    href="/cart"
                                    className="block text-center mt-4 text-sm text-gray-500 hover:text-black"
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










