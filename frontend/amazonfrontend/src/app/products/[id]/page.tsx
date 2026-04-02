"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { addToCart } from "@/utils/cart";
import { addToPickup } from "@/utils/pickup";

type Seller = {
    _id?: string;
    email?: string;
    storeName?: string;
    packageType?: "free" | "basic" | "pro" | "premium";
    isVerified?: boolean;
    canShowLocation?: boolean;
    location?: string;
};

type Product = {
    _id: string;
    name: string;
    price: number;
    stock: number;
    sizes?: string[];
    description?: string;
    location?: string;
    images?: string[];
    sellerId?: Seller | string;

    deliveryAvailable?: boolean;
    sameDayDelivery?: boolean;
    deliveryCutoffTime?: string;

    pickupAvailable?: boolean;
    pickupAddress?: string;
    pickupMapLink?: string;

    sellerRating?: number;
    sellerReviewCount?: number;
};



function formatPrice(price?: number) {
    return `₮ ${Number(price || 0).toLocaleString()}`;
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLocation, setShowLocation] = useState(false);
    const [selectedSize, setSelectedSize] = useState<string>("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            const role = localStorage.getItem("role");

            setIsLoggedIn(!!token);
            setUserRole(role);
        }
    }, []);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`, {
                    cache: "no-store",
                });

                const data = await res.json();

                if (!res.ok) {
                    console.error("FETCH PRODUCT FAILED:", data?.message);
                    setProduct(null);
                    return;
                }

                setProduct(data);
                setSelectedImage(0);
                setSelectedSize("");
            } catch (error) {
                console.error("FETCH PRODUCT ERROR:", error);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const seller =
        product?.sellerId && typeof product.sellerId === "object"
            ? product.sellerId
            : undefined;



    const imageList = useMemo(() => {
        if (!product?.images || product.images.length === 0) {
            return ["/no-image.png"];
        }

        return product.images.map((img) =>
            img.startsWith("http") ? img : `${process.env.NEXT_PUBLIC_API_URL}${img}`
        );
    }, [product]);

    const activeImage = imageList[selectedImage] || "/no-image.png";

    const isSellerLoggedIn = userRole === "seller";
    const isBuyerLoggedIn = isLoggedIn && userRole === "user";
    const isOutOfStock = (product?.stock || 0) <= 0;
    const requiresSize = !!product?.sizes && product.sizes.length > 0;
    const isSizeMissing = requiresSize && !selectedSize;

    const handleAddToCart = () => {
        if (!product) return;

        if (!isLoggedIn) {
            router.push(`/login?redirect=/products/${product._id}`);
            return;
        }

        if (userRole !== "user") {
            alert("Зөвхөн худалдан авагч хэрэглэгч сагслах боломжтой");
            return;
        }

        if ((product.stock || 0) <= 0) {
            alert("Энэ барааны үлдэгдэл дууссан байна");
            return;
        }

        if (product.sizes && product.sizes.length > 0 && !selectedSize) {
            alert("Хэмжээ сонгоно уу");
            return;
        }

        if (!product.deliveryAvailable) {
            alert("Энэ бараа хүргэлтгүй тул сагсанд хийх боломжгүй");
            return;
        }

        addToCart({
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            stock: product.stock,
            storeName: seller?.storeName || "Seller Store",
            sellerId: seller?._id || "",
            selectedSize: selectedSize || undefined,
            purchaseMode: "delivery",
            deliveryAvailable: product.deliveryAvailable,
            sameDayDelivery: product.sameDayDelivery,
            deliveryCutoffTime: product.deliveryCutoffTime,
            pickupAvailable: product.pickupAvailable,
            pickupAddress: product.pickupAddress,
            pickupMapLink: product.pickupMapLink,
        });

        window.dispatchEvent(new Event("storage"));
        alert("Сагсанд нэмэгдлээ");
    };

    const handleAddToPickup = () => {
        if (!product) return;

        if (!isLoggedIn) {
            router.push(`/login?redirect=/products/${product._id}`);
            return;
        }

        if (userRole !== "user") {
            alert("Зөвхөн худалдан авагч хэрэглэгч pickup ашиглах боломжтой");
            return;
        }

        if ((product.stock || 0) <= 0) {
            alert("Энэ барааны үлдэгдэл дууссан байна");
            return;
        }

        if (!product.pickupAvailable) {
            alert("Энэ бараанд pickup боломжгүй байна");
            return;
        }

        addToPickup({
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            stock: product.stock,
            storeName: seller?.storeName || "Seller Store",
            sellerId: seller?._id || "",
            pickupAvailable: product.pickupAvailable,
            pickupAddress: product.pickupAddress,
            pickupMapLink: product.pickupMapLink,
        });

        window.dispatchEvent(new Event("pickupUpdated"));
        alert("Pickup жагсаалтанд нэмэгдлээ");
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-5 rounded-3xl border bg-white p-4">
                        <div className="h-[480px] w-full animate-pulse rounded-2xl bg-slate-100" />
                    </div>

                    <div className="xl:col-span-4 rounded-3xl border bg-white p-6">
                        <div className="h-10 w-3/4 animate-pulse rounded bg-slate-100" />
                        <div className="mt-4 h-6 w-1/3 animate-pulse rounded bg-slate-100" />
                        <div className="mt-6 space-y-3">
                            <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                            <div className="h-5 w-5/6 animate-pulse rounded bg-slate-100" />
                            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
                        </div>
                    </div>

                    <div className="xl:col-span-3 rounded-3xl border bg-white p-6">
                        <div className="h-10 w-1/2 animate-pulse rounded bg-slate-100" />
                        <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-slate-100" />
                        <div className="mt-6 h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
                    </div>
                </div>
            </div>

        );
    }

    if (!product) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="rounded-3xl border bg-white p-10 shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Бараа олдсонгүй
                    </h2>
                    <p className="mt-3 text-slate-500">
                        Уучлаарай, энэ барааны мэдээллийг уншиж чадсангүй.
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
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="relative flex items-center justify-center rounded-2xl bg-slate-50 h-[360px] md:h-[460px] overflow-hidden">
                        <Image
                            src={activeImage}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-contain p-4"
                            sizes="(max-width: 1280px) 100vw, 40vw"
                        />
                    </div>

                    {imageList.length > 1 && (
                        <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-3">
                            {imageList.map((img, index) => (
                                <button
                                    key={`${img}-${index}`}
                                    type="button"
                                    onClick={() => setSelectedImage(index)}
                                    className={`relative h-20 rounded-2xl border overflow-hidden bg-slate-50 transition ${selectedImage === index
                                        ? "border-slate-900 ring-2 ring-slate-200"
                                        : "border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    <Image
                                        src={img}
                                        alt={`${product.name} ${index + 1}`}
                                        fill
                                        unoptimized
                                        className="object-contain p-2"
                                        sizes="120px"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>


                <div className="xl:col-span-4 space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                                    {product.name}
                                </h1>

                                {(product.sellerReviewCount || 0) > 0 && (
                                    <p className="mt-3 text-amber-600 font-medium">
                                        ★ {product.sellerRating?.toFixed(1)} (
                                        {product.sellerReviewCount} Сэтгэгдэл)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 space-y-3 text-[15px] text-slate-600">

                            {product.sizes && product.sizes.length > 0 && (
                                <div>
                                    <p className="mb-2 font-medium text-slate-900">Хэмжээ:</p>

                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map((size) => {
                                            const active = selectedSize === size;

                                            return (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`rounded-lg border px-3 py-1 text-sm font-medium transition ${active
                                                        ? "border-slate-900 bg-slate-900 text-white"
                                                        : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400"
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {!selectedSize && (
                                        <p className="mt-2 text-sm text-slate-500">
                                            Хэмжээ сонгосны дараа сагслах эсвэл pickup хийх боломжтой.
                                        </p>
                                    )}
                                </div>
                            )}



                            {product.deliveryAvailable && (
                                <p className="text-emerald-600 font-medium">
                                    <span className="mr-2">🚚</span>
                                    Хүргэлт боломжтой
                                    {product.sameDayDelivery ? " • Өдөртөө" : ""}
                                    {product.deliveryCutoffTime
                                        ? ` • Cutoff: ${product.deliveryCutoffTime}`
                                        : ""}
                                </p>
                            )}

                            {product.pickupAvailable && (
                                <p className="text-blue-600 font-medium">
                                    <span className="mr-2">📍</span>
                                    Очиж авах боломжтой
                                </p>
                            )}
                        </div>

                        <div className="mt-6 border-t border-slate-200 pt-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">
                                Дэлгэрэнгүй мэдээлэл
                            </h3>

                            <p className="text-slate-600 leading-7 whitespace-pre-line">
                                {product.description?.trim() || "Тайлбар байхгүй"}
                            </p>
                        </div>
                    </div>

                    {!isSellerLoggedIn && seller && (
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="flex gap-3">

                                {seller._id && (
                                    <Link
                                        href={`/store/${seller._id}`}
                                        className="items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-base font-medium text-white hover:bg-slate-800"
                                    >
                                        Дэлгүүр үзэх
                                    </Link>
                                )}

                                <button
                                    onClick={() => setShowLocation(true)}
                                    className="flex-1 rounded-2xl bg-red-600 px-5 py-3.5 text-base font-medium text-white hover:bg-slate-800"
                                >
                                    Байршил харах
                                </button>

                            </div>

                        </div>
                    )}
                    {showLocation && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">

                            <div
                                className="absolute inset-0 bg-black/50"
                                onClick={() => setShowLocation(false)}
                            />

                            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

                                <h3 className="text-lg font-bold mb-4">
                                    Дэлгүүрийн байршил
                                </h3>

                                <div className="grid grid-cols-2 gap-4">

                                    <div>
                                        <p className="text-lg text-gray-800">
                                            <span className="mr-2">📍</span>
                                            {seller?.location || "Байршил байхгүй"}
                                        </p>
                                    </div>

                                    <div>
                                        {product?.pickupMapLink && (
                                            <a
                                                href={product.pickupMapLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-center rounded-xl bg-slate-900 text-white py-3"
                                            >
                                                Газрын зураг харах
                                            </a>
                                        )}
                                    </div>

                                </div>

                                <button
                                    onClick={() => setShowLocation(false)}
                                    className="mt-4 w-full border rounded-xl py-3"
                                >
                                    Хаах
                                </button>

                            </div>

                        </div>
                    )}
                </div>

                {/* RIGHT: PRICE / ACTION / SHIPPING */}
                {!isSellerLoggedIn && (
                    <div className="xl:col-span-3 space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-24">
                            <p className="text-3xl font-bold text-slate-900">
                                {formatPrice(product.price)}
                            </p>

                            <div className="mt-4">
                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${isOutOfStock
                                        ? "bg-red-100 text-red-700"
                                        : "bg-emerald-100 text-emerald-700"
                                        }`}
                                >
                                    {isOutOfStock
                                        ? "Дууссан"
                                        : `Үлдэгдэл: ${product.stock}`}
                                </span>
                            </div>

                            <div className="mt-6 space-y-3">
                                {isBuyerLoggedIn ? (
                                    <>
                                        {isSizeMissing && (
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                                Та эхлээд хэмжээ сонгоно уу.
                                            </div>
                                        )}
                                        {/* CART BUTTON */}
                                        <button
                                            type="button"
                                            onClick={handleAddToCart}
                                            disabled={isOutOfStock || !product.deliveryAvailable || isSizeMissing}
                                            className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isOutOfStock
                                                ? "Бараа дууссан"
                                                : !product.deliveryAvailable
                                                    ? "Хүргэлтгүй"
                                                    : isSizeMissing
                                                        ? "Хэмжээ сонгоно уу"
                                                        : "Сагслах"}
                                        </button>

                                        {/* PICKUP BUTTON */}
                                        {product.pickupAvailable && (
                                            <button
                                                type="button"
                                                onClick={handleAddToPickup}
                                                disabled={isOutOfStock || isSizeMissing}
                                                className="w-full rounded-2xl border border-violet-300 bg-violet-50 px-5 py-3.5 text-base font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isOutOfStock
                                                    ? "Pickup боломжгүй"
                                                    : isSizeMissing
                                                        ? "Хэмжээ сонгоно уу"
                                                        : "📍 Pickup жагсаалтанд нэмэх"}
                                            </button>
                                        )}
                                    </>
                                ) : !isLoggedIn ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.push(`/login?redirect=/products/${product._id}`)
                                        }
                                        className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        {product.pickupAvailable && !product.deliveryAvailable
                                            ? "Нэвтэрч pickup хийх"
                                            : "Нэвтэрч сагслах"}
                                    </button>
                                ) : (
                                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        Худалдагч хэрэглэгч сагслах боломжгүй
                                    </div>
                                )}
                            </div>


                        </div>
                    </div>
                )}
            </div>
        </div>

    );
}