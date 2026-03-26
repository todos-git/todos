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
    status: "pending_payment" | "paid" | "active" | "expired" | "rejected";
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
    const [deeplink, setDeeplink] = useState("");

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

    useEffect(() => {
        const fetchQpay = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/${id}/qpay-create`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await res.json();
                setDeeplink(data.deeplink);
            } catch (err) {
                console.error("QPAY ERROR:", err);
            }
        };

        if (id) fetchQpay();
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

            alert("Banner ad active bolлоо");
            router.push("/seller");
        } catch (error) {
            console.error("CONFIRM BANNER PAYMENT ERROR:", error);
            alert("Payment batalgaajuulj chadsangui");
        } finally {
            setConfirming(false);
        }
    };



    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6 md:p-10">
                <p>Loading payment...</p>
            </div>
        );
    }

    if (!ad) {
        return (
            <div className="max-w-6xl mx-auto p-6 md:p-10">
                <p>Banner ad not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* LEFT - PAYMENT INFO */}
            <div className="bg-white border rounded-2xl shadow p-5 md:p-6 space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        Banner Ad Payment
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Review your banner ad and continue with payment.
                    </p>
                </div>

                <div className="border rounded-2xl p-4 bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-500">Status</p>
                        <span className="px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700">
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
                        <p className="text-xl font-bold">
                            ₮{ad.amount.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="border rounded-2xl p-5 text-center space-y-4">
                    <h2 className="text-xl font-bold">Scan QR to Pay</h2>

                    <div className="w-56 h-56 mx-auto border rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500">
                        QR CODE ENDUUR ORNO
                    </div>

                    <p className="text-sm text-gray-500">
                        Odoogoor demo payment flow. Daraa ni bank app deeplink /
                        QPay holboj bolno.
                    </p>

                    <a
                        href={deeplink}
                        className="w-full block text-center border py-3 rounded-xl hover:bg-gray-50"
                    >
                        📱 Bank App нээх
                    </a>
                </div>

                <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={confirming || ad.status === "active"}
                    className={`w-full py-3 rounded-xl text-white ${confirming || ad.status === "active"
                        ? "bg-gray-400"
                        : "bg-black"
                        }`}
                >
                    {ad.status === "active"
                        ? "Banner Already Active"
                        : confirming
                            ? "Confirming..."
                            : "I Have Paid"}
                </button>
            </div>

            {/* RIGHT - PREVIEW */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold">Banner Preview</h2>
                    <p className="text-gray-500 mt-1">
                        This is how your ad can appear on the homepage.
                    </p>
                </div>

                <div className="rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 min-h-[220px] md:min-h-[360px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                        <div className="p-5 md:p-8 flex flex-col justify-center">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span
                                    className={`text-xs px-3 py-1 rounded-full ${packageBadge.className}`}
                                >
                                    {packageBadge.label}
                                </span>

                                <span className="text-xs px-3 py-1 rounded-full bg-white text-black">
                                    {durationLabel}
                                </span>
                            </div>

                            <h3 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                                {ad.title}
                            </h3>

                            <p className="mt-3 text-gray-800 text-sm md:text-base line-clamp-3">
                                {ad.subtitle || "Your banner subtitle will appear here."}
                            </p>

                            <div className="mt-5">
                                <p className="font-semibold text-gray-900">
                                    {ad.storeNameSnapshot || "My Store"}
                                </p>
                                <p className="text-sm text-gray-700">
                                    {ad.locationSnapshot || "Store location"}
                                </p>
                            </div>

                            <div className="mt-5">
                                <button
                                    type="button"
                                    className="bg-black text-white px-5 py-3 rounded-lg"
                                >
                                    {ad.targetType === "store" ? "Visit Store" : "Shop Now"}
                                </button>
                            </div>
                        </div>

                        <div className="relative min-h-[220px] md:min-h-[360px]">
                            <Image
                                src={`${process.env.NEXT_PUBLIC_API_URL}${ad.image}`}
                                alt={ad.title}
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}