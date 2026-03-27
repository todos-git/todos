"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/utils/format";

interface SellerMe {
    email: string;
    role: string;
    storeName?: string;
    categories?: string[];
    location?: string;
    storeDescription?: string;
    storeLogo?: string;
    packageType: "free" | "basic" | "pro" | "premium";
    productLimit: number;
    canShowLocation: boolean;
    packageExpiresAt?: string | null;
    isVerified?: boolean;
}

interface Product {
    _id: string;
    name: string;
    price: number;
    stock: number;
    images?: string[];
}

interface Order {
    _id: string;
}

interface RatingSummary {
    averageRating: number;
    reviewCount: number;
    latestReviews: {
        rating: number;
        review: string;
    }[];
}

export default function SellerDashboardPage() {
    const [user, setUser] = useState<SellerMe | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
        averageRating: 0,
        reviewCount: 0,
        latestReviews: [],
    });
    const [loading, setLoading] = useState(true);

    const getImageSrc = (src?: string) => {
        if (!src) return "/no-image.png";

        return src.startsWith("http")
            ? src
            : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith("/") ? src : `/${src}`}`;
    };

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem("token");

                const [userRes, productsRes, ordersRes, ratingRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/my-products`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller-orders`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller-rating-summary`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }),
                ]);

                const userData = await userRes.json();
                const productsData = await productsRes.json();
                const ordersData = await ordersRes.json();
                const ratingData = await ratingRes.json();

                if (!userRes.ok) {
                    throw new Error(userData.message || "Худалдагчийн мэдээлэл авахад алдаа гарлаа");
                }

                if (!productsRes.ok) {
                    throw new Error(productsData.message || "Бүтээгдэхүүнүүдийг авахад алдаа гарлаа");
                }

                if (!ordersRes.ok) {
                    throw new Error(ordersData.message || "Захиалгуудыг авахад алдаа гарлаа");
                }

                if (!ratingRes.ok) {
                    throw new Error(ratingData.message || "Үнэлгээний мэдээлэл авахад алдаа гарлаа");
                }

                setUser(userData);
                setProducts(Array.isArray(productsData) ? productsData : []);
                setOrders(Array.isArray(ordersData) ? ordersData : []);
                setRatingSummary(
                    ratingData || {
                        averageRating: 0,
                        reviewCount: 0,
                        latestReviews: [],
                    }
                );
            } catch (error) {
                console.error("DASHBOARD ERROR:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const usedProducts = products.length;
    const limit = user?.productLimit || 0;
    const remaining = Math.max(limit - usedProducts, 0);
    const usagePercent = limit > 0 ? Math.min((usedProducts / limit) * 100, 100) : 0;

    const packageLabel = useMemo(() => {
        switch (user?.packageType) {
            case "basic":
                return "Энгийн багц";
            case "pro":
                return "Про багц";
            case "premium":
                return "Премиум багц";
            default:
                return "Үнэгүй багц";
        }
    }, [user?.packageType]);

    const packageBadgeClass = useMemo(() => {
        switch (user?.packageType) {
            case "basic":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "pro":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "premium":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    }, [user?.packageType]);

    const packageHeroClass = useMemo(() => {
        switch (user?.packageType) {
            case "basic":
                return "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50";
            case "pro":
                return "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50";
            case "premium":
                return "border-yellow-200 bg-gradient-to-br from-yellow-50 via-white to-amber-50";
            default:
                return "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100";
        }
    }, [user?.packageType]);

    const progressBarClass = useMemo(() => {
        switch (user?.packageType) {
            case "basic":
                return "bg-blue-500";
            case "pro":
                return "bg-emerald-500";
            case "premium":
                return "bg-yellow-500";
            default:
                return "bg-slate-700";
        }
    }, [user?.packageType]);

    const topRatedBadge =
        ratingSummary.reviewCount >= 3 && ratingSummary.averageRating >= 4.5;

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl p-10">
                <p className="text-slate-600">Хяналтын самбарыг ачааллаж байна...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Худалдагчийн хяналтын самбар</h1>
                    <p className="mt-1 text-slate-500">
                        Дэлгүүр, багц, бүтээгдэхүүн, захиалгаа эндээс удирдаарай
                    </p>
                </div>

                <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
                    <Link
                        href="/seller/add-product"
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-center font-medium text-white transition hover:bg-slate-800"
                    >
                        Бүтээгдэхүүн нэмэх
                    </Link>

                    <Link
                        href="/seller/products"
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-center font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Миний бүтээгдэхүүнүүд
                    </Link>

                    <Link
                        href="/seller/orders"
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-center font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Захиалгууд
                    </Link>

                    <Link
                        href="/seller/packages"
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-center font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Багц шинэчлэх
                    </Link>
                </div>
            </div>

            <div className={`rounded-3xl border p-5 shadow-sm md:p-7 ${packageHeroClass}`}>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-3xl font-extrabold text-slate-900">
                                {user?.storeName?.trim() || "Миний дэлгүүр"}
                            </h2>

                            <span
                                className={`rounded-full border px-3 py-1 text-sm font-semibold ${packageBadgeClass}`}
                            >
                                {packageLabel}
                            </span>

                            {user?.isVerified && (
                                <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                                    Баталгаажсан
                                </span>
                            )}

                            {topRatedBadge && (
                                <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                                    Өндөр үнэлгээтэй худалдагч
                                </span>
                            )}
                        </div>

                        <p className="text-slate-600">{user?.email}</p>

                        {user?.categories && user.categories.length > 0 && (
                            <div className="text-sm text-slate-500">
                                <p className="mb-2">
                                    Ангиллууд:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {user.categories.map((item) => (
                                        <span
                                            key={item}
                                            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {user?.location && (
                            <p className="text-sm text-slate-500">
                                Байршил: <span className="font-medium text-slate-700">{user.location}</span>
                            </p>
                        )}

                        <p className="text-sm text-slate-500">
                            Байршил харагдах эсэх:{" "}
                            <span className={user?.canShowLocation ? "font-medium text-green-600" : "font-medium text-red-500"}>
                                {user?.canShowLocation ? "Нээлттэй" : "Түгжээтэй"}
                            </span>
                        </p>

                        <p className="text-sm text-slate-500">
                            Багцын хугацаа:{" "}
                            <span className="font-medium text-slate-700">
                                {user?.packageExpiresAt
                                    ? new Date(user.packageExpiresAt).toLocaleDateString()
                                    : "Хугацаагүй"}
                            </span>
                        </p>
                    </div>

                    <div className="min-w-full rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm lg:min-w-[320px]">
                        <p className="mb-2 text-sm text-slate-500">Бүтээгдэхүүний ашиглалт</p>
                        <p className="text-3xl font-extrabold text-slate-900">
                            {usedProducts} / {limit}
                        </p>

                        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                                className={`h-full rounded-full transition-all ${progressBarClass}`}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs text-slate-500">Үлдсэн эрх</p>
                                <p className="mt-1 text-xl font-bold text-slate-900">{remaining}</p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs text-slate-500">Ашигласан хувь</p>
                                <p className="mt-1 text-xl font-bold text-slate-900">
                                    {Math.round(usagePercent)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Одоогийн багц</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{packageLabel}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Нийт бүтээгдэхүүн</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{usedProducts}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Үлдсэн эрх</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{remaining}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Нийт захиалга</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{orders.length}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Худалдагчийн үнэлгээ</p>
                    <div className="mt-2 flex items-end gap-2">
                        <p className="text-2xl font-bold text-slate-900">
                            {ratingSummary.reviewCount > 0
                                ? ratingSummary.averageRating.toFixed(1)
                                : "0.0"}
                        </p>
                        <p className="pb-1 text-sm text-slate-500">
                            ★ ({ratingSummary.reviewCount} сэтгэгдэл)
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Сүүлийн сэтгэгдлүүд</h3>
                    <span className="text-sm text-slate-500">
                        Нийт {ratingSummary.reviewCount}
                    </span>
                </div>

                {ratingSummary.latestReviews.length === 0 ? (
                    <p className="text-slate-500">Одоогоор сэтгэгдэл алга байна.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {ratingSummary.latestReviews.map((review, index) => (
                            <div
                                key={index}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <p className="mb-2 text-lg font-bold text-amber-500">
                                    {"★".repeat(review.rating)}
                                    <span className="text-slate-300">
                                        {"★".repeat(5 - review.rating)}
                                    </span>
                                </p>
                                <p className="text-sm text-slate-600">
                                    {review.review || "Бичсэн сэтгэгдэл байхгүй"}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Сүүлийн бүтээгдэхүүнүүд</h3>
                    <Link href="/seller/products" className="text-blue-600 hover:underline">
                        Бүгдийг харах
                    </Link>
                </div>

                {products.length === 0 ? (
                    <div className="py-10 text-center text-slate-500">
                        <p>Одоогоор бүтээгдэхүүн алга байна.</p>
                        <Link
                            href="/seller/add-product"
                            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white"
                        >
                            Анхны бүтээгдэхүүнээ нэмэх
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {products.slice(0, 6).map((product) => (
                            <div
                                key={product._id}
                                className="flex items-center gap-4 rounded-xl border border-slate-200 p-4"
                            >
                                <Image
                                    src={getImageSrc(product.images?.[0])}
                                    alt={product.name}
                                    width={80}
                                    height={80}
                                    unoptimized
                                    className="h-20 w-20 rounded-lg bg-slate-100 object-cover"
                                />

                                <div className="min-w-0">
                                    <h4 className="truncate font-semibold text-slate-900">
                                        {product.name}
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                        {formatPrice(product.price)}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Үлдэгдэл: {product.stock}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}