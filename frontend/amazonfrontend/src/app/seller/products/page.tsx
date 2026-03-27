"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/utils/format";

interface Product {
    _id: string;
    name: string;
    price: number;
    stock: number;
    isActive?: boolean;
    images?: string[];
}

interface SellerMe {
    storeName?: string;
    packageType: "free" | "basic" | "pro" | "premium";
    productLimit: number;
    canShowLocation: boolean;
}

export default function SellerProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [user, setUser] = useState<SellerMe | null>(null);
    const [loading, setLoading] = useState(true);

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
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");

                const [productsRes, userRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/my-products`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }),
                ]);

                const productsData = await productsRes.json();
                const userData = await userRes.json();

                setProducts(Array.isArray(productsData) ? productsData : []);
                setUser(userData);
            } catch (error) {
                console.error("SELLER PRODUCTS ERROR:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        const confirmDelete = confirm("Энэ бүтээгдэхүүнийг устгахдаа итгэлтэй байна уу?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error("Delete failed");
            }

            setProducts((prev) => prev.filter((p) => p._id !== id));
            alert("Бүтээгдэхүүн амжилттай устгагдлаа.");
        } catch (error) {
            console.error("DELETE ERROR:", error);
            alert("Бүтээгдэхүүн устгахад алдаа гарлаа.");
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}/toggle-active`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            setProducts((prev) =>
                prev.map((p) =>
                    p._id === id ? { ...p, isActive: data.product.isActive, stock: data.product.stock } : p
                )
            );

            alert(
                data.product.isActive
                    ? "Бүтээгдэхүүн дахин идэвхжлээ"
                    : "Бүтээгдэхүүн идэвхгүй боллоо"
            );
        } catch (error) {
            console.error("TOGGLE ERROR:", error);
            alert("Алдаа гарлаа");
        }
    };

    const usedProducts = products.length;
    const limit = user?.productLimit || 0;
    const remaining = Math.max(limit - usedProducts, 0);
    const usagePercent =
        limit > 0 ? Math.min((usedProducts / limit) * 100, 100) : 0;

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

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl p-10">
                <p className="text-slate-600">Бүтээгдэхүүнүүдийг ачааллаж байна...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Миний бүтээгдэхүүнүүд</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <p className="text-slate-500">
                            {user?.storeName?.trim() || "Миний дэлгүүр"}
                        </p>
                        <span
                            className={`rounded-full border px-3 py-1 text-sm font-semibold ${packageBadgeClass}`}
                        >
                            {packageLabel}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/seller"
                        className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Хяналтын самбар
                    </Link>

                    <Link
                        href="/seller/packages"
                        className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Багц шинэчлэх
                    </Link>

                    <Link
                        href="/seller/add-product"
                        className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800"
                    >
                        Бүтээгдэхүүн нэмэх
                    </Link>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Бүтээгдэхүүний ашиглалт</p>
                        <p className="mt-2 text-3xl font-extrabold text-slate-900">
                            {usedProducts} / {limit}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                            Үлдсэн эрх: <span className="font-semibold text-slate-900">{remaining}</span>
                        </p>
                    </div>

                    <div className="w-full md:w-[420px]">
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                                className={`h-full rounded-full transition-all ${progressBarClass}`}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                            Ашигласан хувь:{" "}
                            <span className="font-semibold text-slate-900">
                                {Math.round(usagePercent)}%
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <p className="text-slate-500">Одоогоор бүтээгдэхүүн алга байна.</p>
                    <Link
                        href="/seller/add-product"
                        className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-white transition hover:bg-slate-800"
                    >
                        Анхны бүтээгдэхүүнээ нэмэх
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {products.map((product) => {
                        const imageUrl = getImageSrc(product.images?.[0]);

                        return (
                            <div
                                key={product._id}
                                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="h-48 w-full overflow-hidden rounded-xl bg-slate-100">
                                    <Image
                                        src={imageUrl}
                                        alt={product.name}
                                        width={400}
                                        height={300}
                                        unoptimized
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                <h3 className="mt-3 line-clamp-1 font-semibold text-slate-900">
                                    {product.name}
                                </h3>
                                <p className="mt-1 text-lg font-bold text-slate-900">
                                    {formatPrice(product.price)}
                                </p>
                                <p
                                    className={`text-sm font-medium ${product.isActive ? "text-slate-500" : "text-red-500"
                                        }`}
                                >
                                    {product.isActive === false
                                        ? "🚫 Идэвхгүй (үлдэгдэл дууссан)"
                                        : `📦 Үлдэгдэл: ${product.stock}`}
                                </p>

                                <div className="mt-4 flex justify-between gap-4">
                                    <Link
                                        href={`/seller/products/${product._id}/edit`}
                                        className="text-sm font-medium text-blue-600 hover:underline"
                                    >
                                        Засах
                                    </Link>
                                    <button
                                        onClick={() => handleToggleActive(product._id)}
                                        className={`text-sm font-medium ${product.isActive === false
                                                ? "text-green-600 hover:underline"
                                                : "text-orange-600 hover:underline"
                                            }`}
                                    >
                                        {product.isActive === false
                                            ? "Дахин идэвхжүүлэх"
                                            : "Үлдэгдэл дууссан болгох"}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(product._id)}
                                        className="text-sm font-medium text-red-600 hover:underline"
                                    >
                                        Устгах
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}