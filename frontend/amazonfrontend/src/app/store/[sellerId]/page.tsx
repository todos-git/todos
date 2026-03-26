"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { addToCart } from "@/utils/cart";
import { formatPrice } from "@/utils/format";

type Seller = {
    _id?: string;
    email?: string;
    phone?: string;
    storeName?: string;
    storeDescription?: string;
    storeLogo?: string;
    packageType?: "free" | "basic" | "pro" | "premium";
    isVerified?: boolean;
    location?: string;
    categories?: string[];
};

type Product = {
    _id: string;
    name: string;
    price: number;
    stock: number;
    images?: string[];
    category?: string;
    description?: string;
    sellerId?: string;

    deliveryAvailable?: boolean;
    sameDayDelivery?: boolean;
    deliveryCutoffTime?: string;

    pickupAvailable?: boolean;
    pickupAddress?: string;
    pickupMapLink?: string;

    createdAt?: string;
};

type StoreResponse = {
    seller: Seller;
    products: Product[];
};

type SortOption = "newest" | "price-low" | "price-high" | "name";

function getSellerTheme(packageType?: string) {
    switch (packageType) {
        case "premium":
            return {
                badge: "Premium Seller",
                badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
                heroClass:
                    "border-yellow-200 bg-gradient-to-r from-yellow-50 via-white to-amber-50",
                subtleClass: "bg-yellow-50 border-yellow-200",
                activeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
                accentText: "text-yellow-700",
            };
        case "pro":
            return {
                badge: "Pro Seller",
                badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
                heroClass:
                    "border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-lime-50",
                subtleClass: "bg-emerald-50 border-emerald-200",
                activeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
                accentText: "text-emerald-700",
            };
        case "basic":
            return {
                badge: "Basic Seller",
                badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
                heroClass:
                    "border-blue-200 bg-gradient-to-r from-blue-50 via-white to-sky-50",
                subtleClass: "bg-blue-50 border-blue-200",
                activeClass: "bg-blue-100 text-blue-800 border-blue-200",
                accentText: "text-blue-700",
            };
        default:
            return {
                badge: "Free Seller",
                badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
                heroClass:
                    "border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-100",
                subtleClass: "bg-slate-50 border-slate-200",
                activeClass: "bg-slate-200 text-slate-800 border-slate-300",
                accentText: "text-slate-700",
            };
    }
}

export default function StorePage() {
    const params = useParams();
    const router = useRouter();
    const sellerId = params.sellerId as string;

    const [seller, setSeller] = useState<Seller | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState("Бүгд");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("newest");

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            const savedRole = localStorage.getItem("role");

            setIsLoggedIn(!!token);
            setRole(savedRole);
        }
    }, []);

    useEffect(() => {
        const fetchStore = async () => {
            try {
                setLoading(true);

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/products/store/${sellerId}`,
                    { cache: "no-store" }
                );

                const data = (await res.json()) as StoreResponse;

                if (!res.ok) {
                    console.error("STORE FETCH ERROR:", data);
                    setSeller(null);
                    setProducts([]);
                    return;
                }

                setSeller(data.seller || null);
                setProducts(Array.isArray(data.products) ? data.products : []);
            } catch (error) {
                console.error("FETCH STORE ERROR:", error);
                setSeller(null);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        if (sellerId) {
            fetchStore();
        }
    }, [sellerId]);

    const theme = getSellerTheme(seller?.packageType);
    const isBuyer = isLoggedIn && role === "user";
    const isSeller = isLoggedIn && role === "seller";

    const categories = useMemo(() => {
        const unique = new Set<string>();

        products.forEach((product) => {
            if (product.category?.trim() && product.category !== "All") {
                unique.add(product.category.trim());
            }
        });

        return ["Бүгд", ...Array.from(unique)];
    }, [products]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { Бүгд: products.length };

        products.forEach((product) => {
            const category = product.category?.trim();
            if (category && category !== "All") {
                counts[category] = (counts[category] || 0) + 1;
            }
        });

        return counts;
    }, [products]);

    const filteredProducts = useMemo(() => {
        const filtered = products.filter((product) => {
            const matchesCategory =
                selectedCategory === "Бүгд" || product.category === selectedCategory;

            const q = search.trim().toLowerCase();
            const matchesSearch =
                !q ||
                product.name.toLowerCase().includes(q) ||
                product.description?.toLowerCase().includes(q) ||
                product.category?.toLowerCase().includes(q);

            return matchesCategory && matchesSearch;
        });

        const sorted = [...filtered];

        switch (sortBy) {
            case "price-low":
                sorted.sort((a, b) => a.price - b.price);
                break;
            case "price-high":
                sorted.sort((a, b) => b.price - a.price);
                break;
            case "name":
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "newest":
            default:
                sorted.sort((a, b) => {
                    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return bTime - aTime;
                });
                break;
        }

        return sorted;
    }, [products, selectedCategory, search, sortBy]);

    const handleAddToCart = (product: Product) => {
        if (!seller) return;

        if (!isLoggedIn) {
            router.push(`/login?redirect=/store/${sellerId}`);
            return;
        }

        if (role !== "user") {
            alert("Зөвхөн худалдан авагч хэрэглэгч сагслах боломжтой");
            return;
        }

        addToCart({
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            stock: product.stock,
            storeName: seller.storeName || "Seller Store",
            sellerId: seller._id,
            deliveryAvailable: product.deliveryAvailable,
            sameDayDelivery: product.sameDayDelivery,
            deliveryCutoffTime: product.deliveryCutoffTime,
            pickupAvailable: product.pickupAvailable,
            pickupAddress: product.pickupAddress,
            pickupMapLink: product.pickupMapLink,
        });

        window.dispatchEvent(new Event("cartUpdated"));
        alert("Сагсанд нэмэгдлээ");
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-56 rounded-3xl bg-slate-100" />
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
                        <div className="h-72 rounded-3xl bg-slate-100" />
                        <div className="h-[520px] rounded-3xl bg-slate-100" />
                    </div>
                </div>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 text-center">
                <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Дэлгүүр олдсонгүй
                    </h2>
                    <p className="mt-3 text-slate-500">
                        Уучлаарай, энэ дэлгүүрийн мэдээллийг уншиж чадсангүй.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-800"
                    >
                        Нүүр хуудас руу буцах
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
            <div className={`rounded-[30px] border p-5 shadow-sm md:p-7 ${theme.heroClass}`}>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/70 bg-white shadow-sm">
                                {seller.storeLogo ? (
                                    <Image
                                        src={seller.storeLogo}
                                        alt={seller.storeName || "Store Logo"}
                                        width={80}
                                        height={80}
                                        className="h-full w-full rounded-3xl object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="text-3xl font-black uppercase text-slate-800">
                                        {(seller.storeName?.trim()?.[0] || "S").toUpperCase()}
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
                                        {seller.storeName?.trim() || "Seller Store"}
                                    </h1>

                                    <span
                                        className={`rounded-full border px-3 py-1 text-sm font-semibold ${theme.badgeClass}`}
                                    >
                                        {theme.badge}
                                    </span>

                                    {seller.isVerified && (
                                        <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                                            Verified
                                        </span>
                                    )}
                                </div>

                                <p className="mt-3 break-all text-slate-600">{seller.email}</p>

                                {seller.phone && (
                                    <p className="mt-2 text-sm text-slate-600">
                                        📞 {seller.phone}
                                    </p>
                                )}

                                {seller.location && (
                                    <p className="mt-2 text-sm text-slate-500">
                                        📍 {seller.location}
                                    </p>
                                )}

                                {seller.storeDescription && (
                                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                                        {seller.storeDescription}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[420px]">
                            <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-wide text-slate-500">
                                    Нийт бараа
                                </p>
                                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                                    {products.length}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-wide text-slate-500">
                                    Ангилал
                                </p>
                                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                                    {categories.length - 1}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-wide text-slate-500">
                                    Одоогийн filter
                                </p>
                                <p className="mt-2 truncate text-lg font-bold text-slate-900">
                                    {selectedCategory}
                                </p>
                            </div>
                        </div>
                    </div>

                    {seller.categories && seller.categories.length > 0 && (
                        <div>
                            <p className="mb-3 text-sm font-semibold text-slate-700">
                                Дэлгүүрийн үндсэн ангиллууд
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {seller.categories.map((item) => (
                                    <span
                                        key={item}
                                        className={`rounded-full border px-3 py-1.5 text-sm font-medium ${theme.badgeClass}`}
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
                <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Ангилал</h2>
                        <span className="text-sm text-slate-500">{categories.length - 1}</span>
                    </div>

                    <div className="space-y-2">
                        {categories.map((category) => {
                            const isActive = selectedCategory === category;

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setSelectedCategory(category)}
                                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${isActive
                                        ? theme.activeClass
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <span>{category}</span>
                                    <span className="text-xs">{categoryCounts[category] || 0}</span>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <section>
                    <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={`${seller.storeName || "Дэлгүүр"} - бүтээгдэхүүн хайх`}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                            >
                                <option value="newest">Шинээр нэмэгдсэн</option>
                                <option value="price-low">Үнэ өсөхөөр</option>
                                <option value="price-high">Үнэ буурахаар</option>
                                <option value="name">Нэрээр</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Нийт бүтээгдэхүүн{" "}
                                <span className="font-semibold text-slate-900">
                                    {filteredProducts.length}
                                </span>
                            </p>

                            <h2 className="mt-1 text-3xl font-extrabold text-slate-900">
                                {selectedCategory === "Бүгд" ? "Бүх бүтээгдэхүүн" : selectedCategory}
                            </h2>
                        </div>

                        {selectedCategory !== "Бүгд" && (
                            <button
                                type="button"
                                onClick={() => setSelectedCategory("Бүгд")}
                                className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Бүгдийг харах
                            </button>
                        )}
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                            <p className="text-lg font-semibold text-slate-800">Илэрц олдсонгүй</p>
                            <p className="mt-2 text-slate-500">
                                Өөр ангилал сонгох эсвэл хайлтаа өөрчилж үзнэ үү.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredProducts.map((product) => {
                                const imageUrl =
                                    product.images && product.images.length > 0
                                        ? `${process.env.NEXT_PUBLIC_API_URL}${product.images[0]}`
                                        : "/no-image.png";

                                const isOutOfStock = product.stock <= 0;

                                return (
                                    <div
                                        key={product._id}
                                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <Link href={`/products/${product._id}`}>
                                            <div className="relative flex h-64 items-center justify-center overflow-hidden bg-slate-50">
                                                <Image
                                                    src={imageUrl}
                                                    alt={product.name}
                                                    width={500}
                                                    height={400}
                                                    unoptimized
                                                    className="h-full w-full object-cover"
                                                />

                                                {product.category && product.category !== "All" && (
                                                    <span
                                                        className={`absolute left-3 top-3 rounded-full border bg-white/90 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur ${theme.badgeClass}`}
                                                    >
                                                        {product.category}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>

                                        <div className="p-4">
                                            <Link href={`/products/${product._id}`}>
                                                <h3 className="line-clamp-2 text-xl font-bold text-slate-900 hover:text-slate-700">
                                                    {product.name}
                                                </h3>
                                            </Link>

                                            <p className="mt-3 text-2xl font-extrabold text-slate-900">
                                                {formatPrice(product.price)}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                                                <span
                                                    className={`rounded-full px-3 py-1 font-medium ${isOutOfStock
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-emerald-100 text-emerald-700"
                                                        }`}
                                                >
                                                    {isOutOfStock ? "Дууссан" : `Үлдэгдэл: ${product.stock}`}
                                                </span>

                                                {product.deliveryAvailable && (
                                                    <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
                                                        Хүргэлт
                                                    </span>
                                                )}

                                                {product.pickupAvailable && (
                                                    <span className="rounded-full bg-violet-100 px-3 py-1 font-medium text-violet-700">
                                                        Pickup
                                                    </span>
                                                )}
                                            </div>

                                            {!isSeller && (
                                                <div className="mt-4">
                                                    {isBuyer ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddToCart(product)}
                                                            disabled={isOutOfStock}
                                                            className="w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                        >
                                                            {isOutOfStock ? "Бараа дууссан" : "Сагслах"}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.push(`/login?redirect=/store/${sellerId}`)
                                                            }
                                                            className="w-full rounded-2xl border border-slate-300 bg-white py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
                                                        >
                                                            Нэвтэрч сагслах
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}