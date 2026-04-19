"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type BannerAd = {
    _id: string;
    title: string;
    subtitle?: string;
    image: string;
    targetType: "store" | "product";
    durationDays: 7 | 14 | 21;
    amount: number;
    status: "draft" | "pending_payment" | "pending_approval" | "active" | "expired" | "rejected" | "cancelled";
    storeNameSnapshot?: string;
    locationSnapshot?: string;
    packageTypeSnapshot?: "free" | "basic" | "pro" | "premium";
    targetLink?: string;
};

export default function BannerAdPaymentPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [ad, setAd] = useState<BannerAd | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);

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
        const fetchAd = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Banner ad oldsongui");
                }

                setAd(data);
            } catch (error) {
                console.error("GET BANNER PAYMENT PAGE ERROR:", error);
                alert("Banner ad medeellee avch chadsangui");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchAd();
        }
    }, [id]);

    const packageBadge = useMemo(() => {
        switch (ad?.packageTypeSnapshot) {
            case "premium":
                return {
                    label: "Premium Seller",
                    className: "bg-yellow-100 text-yellow-700",
                };
            case "pro":
                return {
                    label: "Pro Seller",
                    className: "bg-emerald-100 text-emerald-700",
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
    }, [ad?.packageTypeSnapshot]);

    const durationLabel = useMemo(() => {
        switch (ad?.durationDays) {
            case 7:
                return "Starter";
            case 14:
                return "Best Value";
            case 21:
                return "Maximum Reach";
            default:
                return "";
        }
    }, [ad?.durationDays]);

    const handleConfirmPayment = async () => {
        try {
            setConfirming(true);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/${id}/confirm-demo`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Payment batalgaajuulj chadsangui");
            }

            alert("Төлбөр шалгах хүлээгдэж байна. Админ баталгаажуулсны дараа баннер идэвхжинэ.");
            router.push("/seller/banner-ads");
        } catch (error) {
            console.error("CONFIRM BANNER PAYMENT ERROR:", error);
            alert("Payment batalgaajuulj chadsangui");
        } finally {
            setConfirming(false);
        }
    };

    const handleCancelPayment = async () => {
        const confirmed = window.confirm("Баннер үүсгэхийг болих уу?");
        if (!confirmed) return;

        try {
            setConfirming(true);

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
                throw new Error(data.message || "Болих үед алдаа гарлаа");
            }

            alert("Баннер үүсгэх цуцлагдлаа");
            router.push("/seller/banner-ads");
        } catch (error) {
            console.error("CANCEL BANNER PAYMENT ERROR:", error);
            alert(error instanceof Error ? error.message : "Болих үед алдаа гарлаа");
        } finally {
            setConfirming(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl p-4 md:p-8">
                <p>Loading payment...</p>
            </div>
        );
    }

    if (!ad) {
        return (
            <div className="mx-auto max-w-7xl p-4 md:p-8">
                <p>Banner ad not found</p>
            </div>
        );
    }

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 p-4 md:p-8 xl:grid-cols-2">
            <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div>
                    <h1 className="text-2xl font-bold md:text-3xl">Баннер төлбөрийн хэсэг</h1>
                    <p className="mt-2 text-gray-500">
                        Баннер зараа шалгаад төлбөрөө үргэлжлүүлээрэй.
                    </p>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-500">Status</p>
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700">
                            {ad.status}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-gray-500">Duration</p>
                        <p className="font-semibold">
                            {ad.durationDays} Days • {durationLabel}
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-gray-500">Target</p>
                        <p className="font-semibold">
                            {ad.targetType === "store" ? "Store Page" : "Specific Product"}
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-gray-500">Amount</p>
                        <p className="text-xl font-bold">₮{ad.amount.toLocaleString()}</p>
                    </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-slate-200 p-5 text-center">
                    <h2 className="text-xl font-bold">QR уншуулж төлбөрөө төлнө үү. </h2>

                    <div className="mx-auto h-56 w-56 overflow-hidden rounded-2xl border bg-white p-2">
                        <div className="relative h-full w-full">
                            <Image
                                src="/qr/tdb-qr.jpg"
                                alt="QR"
                                fill
                                unoptimized
                                className="object-contain"
                            />
                        </div>
                    </div>

                    <p className="text-sm text-gray-500">
                        Гүйлгээний утга дээр бүртгэлтэй Gmail-ээ бичиж “Би төлсөн” дарсны дараа админ шалгаж баталгаажуулна.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={confirming || ad.status === "active" || ad.status === "pending_approval"}
                    className={`w-full rounded-xl py-3 text-white ${confirming || ad.status === "active" ? "bg-gray-400" : "bg-black"
                        }`}
                >
                    {ad.status === "active"
                        ? "Banner Already Active"
                        : ad.status === "pending_approval"
                            ? "Админ шалгаж байна"
                            : confirming
                                ? "Confirming..."
                                : "Би төлсөн"}
                </button>

                {ad.status !== "active" && (
                    <button
                        type="button"
                        onClick={handleCancelPayment}
                        disabled={confirming}
                        className="w-full rounded-xl border border-red-300 bg-red-50 py-3 font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                        Болих
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold">Баннер урьдчилж харах</h2>
                    <p className="mt-1 text-gray-500">
                        Ингэснээр таны зар нүүр хуудсан дээр гарч ирнэ.
                    </p>
                </div>

                <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-100 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
                    <div className="absolute inset-0">
                        <Image
                            src={getImageSrc(ad.image)}
                            alt={ad.title}
                            fill
                            unoptimized
                            className="object-cover object-center"
                        />
                    </div>

                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.85)_24%,rgba(255,255,255,0.50)_42%,rgba(255,255,255,0.10)_62%,rgba(255,255,255,0)_100%)]" />
                    <div className="absolute inset-y-0 left-0 w-full max-w-[720px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.10),transparent_30%)]" />

                    <div className="relative z-10 flex min-h-[320px] items-center px-6 py-8 sm:px-8 md:min-h-[420px] md:px-12 lg:px-16">
                        <div className="max-w-[460px]">
                            <div className="inline-flex rounded-full border border-slate-300 bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm backdrop-blur">
                                Sponsored Banner
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${packageBadge.className}`}
                                >
                                    {packageBadge.label}
                                </span>

                                <span className="rounded-full bg-white px-3 py-1 text-xs text-black">
                                    {durationLabel}
                                </span>
                            </div>

                            <h3 className="mt-5 text-3xl font-black leading-[0.94] tracking-[-0.03em] text-slate-900 sm:text-4xl md:text-5xl lg:text-[58px]">
                                {ad.title}
                            </h3>

                            <p className="mt-4 max-w-md text-sm leading-6 text-slate-700 sm:text-base md:text-lg">
                                {ad.subtitle || "Your banner subtitle will appear here."}
                            </p>

                            <div className="mt-6 space-y-1">
                                <p className="text-sm font-semibold text-slate-900">
                                    {ad.storeNameSnapshot || "My Store"}
                                </p>
                                <p className="text-sm text-slate-600">
                                    {ad.locationSnapshot || "Store location"}
                                </p>
                            </div>

                            <div className="mt-7">
                                <button
                                    type="button"
                                    className="inline-flex min-w-[165px] items-center justify-center rounded-2xl bg-slate-900 px-6 py-3.5 text-base font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]"
                                >
                                    {ad.targetType === "store" ? "Дэлгүүр үзэх" : "Shop Now"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}