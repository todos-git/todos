"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    getPickupItems,
    removeFromPickup,
    updatePickupQuantity,
} from "@/utils/pickup";
import { formatPrice } from "@/utils/format";

type PickupItem = {
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

export default function PickupPage() {
    const [pickupItems, setPickupItems] = useState<PickupItem[] | null>(null);

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

    useEffect(() => {
        const syncPickup = () => {
            setPickupItems(getPickupItems());
        };

        const timer = setTimeout(syncPickup, 0);

        window.addEventListener("pickupUpdated", syncPickup);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("pickupUpdated", syncPickup);
        };
    }, []);

    const handleRemove = (id: string) => {
        removeFromPickup(id);
        setPickupItems(getPickupItems());
    };

    const handleIncrease = (item: PickupItem) => {
        updatePickupQuantity(item._id, item.quantity + 1);
        setPickupItems(getPickupItems());
    };

    const handleDecrease = (item: PickupItem) => {
        if (item.quantity > 1) {
            updatePickupQuantity(item._id, item.quantity - 1);
            setPickupItems(getPickupItems());
        }
    };

    const total = useMemo(() => {
        if (!pickupItems) return 0;
        return pickupItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [pickupItems]);

    if (pickupItems === null) {
        return (
            <div className="min-h-screen bg-gray-100 px-6 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="rounded-xl bg-white p-6 shadow">
                        <p>Pickup жагсаалт ачааллаж байна...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 px-6 py-8">
            <div className="mx-auto max-w-6xl grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow">
                    <h1 className="mb-6 text-2xl font-bold">Pickup жагсаалт</h1>

                    {pickupItems.length === 0 ? (
                        <p className="text-gray-500">Pickup жагсаалт хоосон байна.</p>
                    ) : (
                        <div className="space-y-5">
                            {pickupItems.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row"
                                >
                                    <div className="h-40 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 md:w-40">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={getImageSrc(item.images?.[0])}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <Link
                                            href={`/products/${item._id}`}
                                            className="text-lg font-semibold hover:text-blue-600"
                                        >
                                            {item.name}
                                        </Link>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Дэлгүүр: {item.storeName || "Тодорхойгүй дэлгүүр"}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            Үлдэгдэл: {item.stock ?? 0}
                                        </p>

                                        {item.pickupAddress && (
                                            <p className="mt-2 text-sm text-gray-500">
                                                Pickup хаяг: {item.pickupAddress}
                                            </p>
                                        )}

                                        <p className="mt-3 text-lg font-bold">
                                            {formatPrice(item.price * item.quantity)}
                                        </p>

                                        <div className="mt-4 flex items-center gap-3">
                                            <button
                                                onClick={() => handleDecrease(item)}
                                                className="rounded border px-3 py-1"
                                            >
                                                -
                                            </button>

                                            <span className="min-w-[24px] text-center">
                                                {item.quantity}
                                            </span>

                                            <button
                                                onClick={() => handleIncrease(item)}
                                                className="rounded border px-3 py-1"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-4 text-sm">
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

                                            {item.pickupMapLink && (
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

                                    <div className="text-right md:w-32">
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

                <div className="sticky top-24 h-fit rounded-xl bg-white p-6 shadow">
                    <h2 className="mb-4 text-xl font-bold">Pickup дүн</h2>

                    <div className="mb-2 flex justify-between">
                        <span>Барааны тоо</span>
                        <span>
                            {pickupItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                    </div>

                    <div className="border-t pt-3 mt-3 flex justify-between text-lg font-bold">
                        <span>Нийт</span>
                        <span>{formatPrice(total)}</span>
                    </div>

                    <div className="mt-5 rounded-lg bg-violet-50 p-4 text-sm text-violet-700">
                        Pickup бараанууд нь сагснаас тусдаа хадгалагдана.
                    </div>
                </div>
            </div>
        </div>
    );
}