"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BannerAd = {
    _id: string;
    title: string;
    subtitle?: string;
    image: string;
    targetType: "store" | "product";
    targetLink: string;
    durationDays: 7 | 14 | 21;
    amount: number;
    status: "pending_payment" | "paid" | "active" | "expired" | "rejected";
    storeNameSnapshot?: string;
    locationSnapshot?: string;
    packageTypeSnapshot?: "free" | "basic" | "pro" | "premium";
    startsAt?: string | null;
    endsAt?: string | null;
};



function getStatusStyle(status: BannerAd["status"]) {
    switch (status) {
        case "active":
            return "bg-green-100 text-green-700";
        case "expired":
            return "bg-gray-100 text-gray-600";
        case "pending_payment":
            return "bg-orange-100 text-orange-700";
        case "paid":
            return "bg-blue-100 text-blue-700";
        case "rejected":
            return "bg-red-100 text-red-700";
        default:
            return "bg-gray-100 text-gray-600";
    }
}

function getStatusText(status: BannerAd["status"]) {
    switch (status) {
        case "active":
            return "Идэвхтэй";
        case "expired":
            return "Дууссан";
        case "pending_payment":
            return "Төлбөр хүлээгдэж байна";
        case "paid":
            return "Төлөгдсөн";
        case "rejected":
            return "Татгалзсан";
        default:
            return status;
    }
}

function getPackageBadge(packageType?: string) {
    switch (packageType) {
        case "premium":
            return {
                label: "Premium",
                className: "bg-yellow-100 text-yellow-700",
            };
        case "pro":
            return {
                label: "Pro",
                className: "bg-purple-100 text-purple-700",
            };
        case "basic":
            return {
                label: "Basic",
                className: "bg-blue-100 text-blue-700",
            };
        default:
            return {
                label: "Free",
                className: "bg-gray-100 text-gray-600",
            };
    }
}

export default function MyBannerAdsPage() {
    const [ads, setAds] = useState<BannerAd[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/my-ads`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                });

                const data = await res.json();
                setAds(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, []);

    const handleDeleteAd = async (id: string) => {
        const confirmed = window.confirm("Энэ баннерыг устгах уу?");
        if (!confirmed) return;

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Устгаж чадсангүй");
            }

            setAds((prev) => prev.filter((ad) => ad._id !== id));
            alert("Баннер амжилттай устгагдлаа");
        } catch (error) {
            console.error("DELETE BANNER ERROR:", error);
            alert(error instanceof Error ? error.message : "Устгах үед алдаа гарлаа");
        }
    };

    const summary = useMemo(() => {
        return {
            total: ads.length,
            active: ads.filter((a) => a.status === "active").length,
            pending: ads.filter((a) => a.status === "pending_payment").length,
            expired: ads.filter((a) => a.status === "expired").length,
        };
    }, [ads]);

    if (loading) {
        return <div className="p-10 text-center">Ачааллаж байна...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 md:p-10 space-y-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Миний баннер зар</h1>
                    <p className="text-gray-500 mt-1">
                        Нүүр хуудсан дээрх сурталчилгаагаа удирдах
                    </p>
                </div>

                <div className="flex gap-3">
                    <Link href="/seller/packages" className="border px-4 py-2 rounded-lg">
                        Багц
                    </Link>

                    <Link
                        href="/seller/banner-ads/create"
                        className="bg-black text-white px-4 py-2 rounded-lg"
                    >
                        Баннер үүсгэх
                    </Link>
                </div>
            </div>

            {/* SUMMARY */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow">
                    <p className="text-sm text-gray-500">Нийт</p>
                    <p className="text-2xl font-bold">{summary.total}</p>
                </div>

                <div className="bg-green-50 p-5 rounded-2xl">
                    <p className="text-sm text-green-700">Идэвхтэй</p>
                    <p className="text-2xl font-bold">{summary.active}</p>
                </div>

                <div className="bg-orange-50 p-5 rounded-2xl">
                    <p className="text-sm text-orange-700">Хүлээгдэж буй</p>
                    <p className="text-2xl font-bold">{summary.pending}</p>
                </div>

                <div className="bg-gray-100 p-5 rounded-2xl">
                    <p className="text-sm text-gray-600">Дууссан</p>
                    <p className="text-2xl font-bold">{summary.expired}</p>
                </div>
            </div>

            {/* EMPTY */}
            {ads.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow">
                    <p className="text-gray-500">Одоогоор баннер байхгүй</p>
                    <Link
                        href="/seller/banner-ads/create"
                        className="mt-4 inline-block bg-black text-white px-4 py-2 rounded-lg"
                    >
                        Анхны баннер үүсгэх
                    </Link>
                </div>
            ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                    {ads.map((ad) => {
                        const pkg = getPackageBadge(ad.packageTypeSnapshot);

                        return (
                            <div
                                key={ad._id}
                                className="bg-white rounded-2xl shadow hover:shadow-xl transition overflow-hidden"
                            >
                                <div className="grid md:grid-cols-2">

                                    {/* TEXT */}
                                    <div className="p-6 space-y-3">
                                        <div className="flex gap-2 flex-wrap">
                                            <span className={`text-xs px-2 py-1 rounded-full ${pkg.className}`}>
                                                {pkg.label}
                                            </span>

                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(ad.status)}`}>
                                                {getStatusText(ad.status)}
                                            </span>
                                        </div>

                                        <h2 className="font-bold text-lg line-clamp-2">
                                            {ad.title}
                                        </h2>

                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {ad.subtitle || "Тайлбар байхгүй"}
                                        </p>

                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p>🏪 {ad.storeNameSnapshot}</p>
                                            <p>📍 {ad.locationSnapshot}</p>
                                            <p>⏱ {ad.durationDays} хоног</p>
                                            <p>💰 ₮{ad.amount.toLocaleString()}</p>
                                        </div>

                                        <div className="text-xs text-gray-400">
                                            {ad.startsAt && (
                                                <p>Эхлэх: {new Date(ad.startsAt).toLocaleDateString()}</p>
                                            )}
                                            {ad.endsAt && (
                                                <p>Дуусах: {new Date(ad.endsAt).toLocaleDateString()}</p>
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            {ad.status === "pending_payment" ? (
                                                <>
                                                    <Link
                                                        href={`/seller/banner-ads/payment/${ad._id}`}
                                                        className="bg-black text-white px-3 py-2 rounded-lg text-sm"
                                                    >
                                                        Төлөх
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAd(ad._id)}
                                                        className="border border-red-200 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-100"
                                                    >
                                                        Устгах
                                                    </button>
                                                </>
                                            ) : ad.status === "expired" ? (
                                                <Link
                                                    href={`/seller/banner-ads/create?renew=${ad._id}`}
                                                    className="bg-black text-white px-3 py-2 rounded-lg text-sm"
                                                >
                                                    Дахин сунгах
                                                </Link>
                                            ) : ad.status === "active" ? (
                                                <Link
                                                    href="/"
                                                    className="border px-3 py-2 rounded-lg text-sm"
                                                >
                                                    Харах
                                                </Link>
                                            ) : (
                                                <Link
                                                    href="/"
                                                    className="border px-3 py-2 rounded-lg text-sm"
                                                >
                                                    Харах
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* IMAGE */}
                                    <div className="relative h-[220px] md:h-full">
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_API_URL}${ad.image}`}
                                            alt={ad.title}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}