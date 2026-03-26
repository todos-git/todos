"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type BannerAd = {
    _id: string;
    title: string;
    subtitle?: string;
    image: string;
    targetType: "store" | "product";
    targetLink: string;
    storeNameSnapshot?: string;
    locationSnapshot?: string;
    packageTypeSnapshot?: "free" | "basic" | "pro" | "premium";
};

function getSellerBadge(packageType?: string) {
    switch (packageType) {
        case "premium":
            return {
                label: "Premium Seller",
                className: "bg-yellow-100 text-yellow-700",
            };
        case "pro":
            return {
                label: "Pro Seller",
                className: "bg-purple-100 text-purple-700",
            };
        case "basic":
            return {
                label: "Basic Seller",
                className: "bg-blue-100 text-blue-700",
            };
        default:
            return {
                label: "Free Seller",
                className: "bg-gray-100 text-gray-700",
            };
    }
}

export default function HomeHeroBanner() {
    const [banners, setBanners] = useState<BannerAd[]>([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads`, {
                    cache: "no-store",
                });

                const data = await res.json();
                setBanners(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("GET HERO BANNERS ERROR:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % banners.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [banners]);

    if (loading) {
        return (
            <section className="relative w-full bg-transparent">
                <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-6">
                    <div className="rounded-3xl h-[280px] md:h-[420px] bg-slate-100 animate-pulse shadow-xl" />
                </div>
            </section>
        );
    }

    if (banners.length === 0) {
        return (
            <section className="relative w-full bg-transparent">
                <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-6">
                    <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 items-center min-h-[300px] md:min-h-[460px] gap-8 p-6 md:p-10">
                            <div className="space-y-4">
                                <p className="text-sm md:text-base font-medium text-gray-700">
                                    Sponsored & Premium Seller Products
                                </p>

                                <h1 className="text-3xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                                    Discover top featured products
                                </h1>

                                <p className="text-gray-700 text-sm md:text-lg max-w-xl">
                                    Promote your store with premium homepage banner
                                    placement and reach more buyers.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href="/seller/banner-ads/create"
                                        className="bg-black text-white px-5 py-3 rounded-lg text-center"
                                    >
                                        Create Banner Ad
                                    </Link>

                                    <Link
                                        href="/seller/packages"
                                        className="bg-white text-black px-5 py-3 rounded-lg text-center border"
                                    >
                                        Upgrade Package
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const activeBanner = banners[current];
    const badge = getSellerBadge(activeBanner.packageTypeSnapshot);

    return (
        <section className="relative w-full bg-transparent">
            <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-6">
                <div className="rounded-3xl overflow-hidden shadow-xl bg-[#f6f2fa]">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] min-h-[300px] md:min-h-[460px]">
                        <div className="p-6 md:p-10 lg:p-12 flex flex-col justify-center">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span
                                    className={`text-xs px-3 py-1 rounded-full ${badge.className}`}
                                >
                                    {badge.label}
                                </span>

                                <span className="text-xs px-3 py-1 rounded-full bg-white text-black">
                                    Sponsored
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.05]">
                                {activeBanner.title}
                            </h1>

                            <p className="text-gray-800 text-sm md:text-base lg:text-lg max-w-xl mt-4 line-clamp-3">
                                {activeBanner.subtitle || "Featured banner promotion"}
                            </p>

                            <div className="mt-5">
                                <p className="font-semibold text-gray-900 text-base md:text-lg">
                                    {activeBanner.storeNameSnapshot || "Featured Store"}
                                </p>
                                <p className="text-sm text-gray-700">
                                    {activeBanner.locationSnapshot || "Seller location"}
                                </p>
                            </div>

                            <div className="mt-6">
                                <Link
                                    href={activeBanner.targetLink || "/"}
                                    className="inline-block bg-black text-white px-5 py-3 rounded-lg"
                                >
                                    {activeBanner.targetType === "store" ? "Visit Store" : "Shop Now"}
                                </Link>
                            </div>
                        </div>

                        <div className="relative min-h-[260px] md:min-h-[460px] w-full bg-white">
                            <Image
                                src={`${process.env.NEXT_PUBLIC_API_URL}${activeBanner.image}`}
                                alt={activeBanner.title}
                                fill
                                priority
                                unoptimized
                                className="object-contain p-2 md:p-4"
                            />
                        </div>
                    </div>
                </div>

                {banners.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                        {banners.map((banner, index) => (
                            <button
                                key={banner._id}
                                onClick={() => setCurrent(index)}
                                className={`h-2.5 rounded-full transition-all ${current === index
                                    ? "w-8 bg-black"
                                    : "w-2.5 bg-black/40"
                                    }`}
                                aria-label={`Go to banner ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}