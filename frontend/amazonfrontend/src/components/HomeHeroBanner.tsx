"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BannerAd = {
    _id: string;
    title: string;
    subtitle?: string;
    image: string;
    targetType: "store" | "product";
    targetLink: string;
    theme?: "blue" | "pink" | "dark" | "gold" | "clean";
    storeNameSnapshot?: string;
    locationSnapshot?: string;
    packageTypeSnapshot?: "free" | "basic" | "pro" | "premium";
    isAdminBanner?: boolean;
};

export default function HomeHeroBanner() {
    const router = useRouter();

    const [banners, setBanners] = useState<BannerAd[]>([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showBannerPrompt, setShowBannerPrompt] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    const activeBanner = banners[current];

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
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("token");
        const savedRole = localStorage.getItem("role");

        setIsLoggedIn(!!token);
        setRole(savedRole);
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % banners.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [banners]);

    const isBannerPlacementLink = useMemo(() => {
        return activeBanner?.targetLink === "/seller/banner-ads/create";
    }, [activeBanner?.targetLink]);

    const canGoDirectToBannerCreate = isLoggedIn && (role === "seller" || role === "admin" || role === "superadmin");

    const handleBannerPlacement = () => {
        if (canGoDirectToBannerCreate) {
            router.push("/seller/banner-ads/create");
            return;
        }

        setShowBannerPrompt(true);
    };

    const getImageSrc = (src?: string) => {
        if (!src) return "/no-image.png";

        if (src.startsWith("http://") || src.startsWith("https://")) {
            return src;
        }

        return `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith("/") ? src : `/${src}`}`;
    };

    if (loading) {
        return (
            <section className="relative w-full bg-transparent">
                <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-4 md:px-6 md:pt-5">
                    <div className="h-[320px] animate-pulse rounded-[32px] bg-slate-100 md:h-[420px]" />
                </div>
            </section>
        );
    }

    if (banners.length === 0) {
        return (
            <section className="relative w-full bg-transparent">
                <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-4 md:px-6 md:pt-5">
                    <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#eef2f7_100%)] shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.08),transparent_30%)]" />
                        <div className="relative flex min-h-[320px] items-center px-6 py-8 sm:px-8 md:min-h-[420px] md:px-12 lg:px-16">
                            <div className="max-w-[500px]">
                                <div className="inline-flex rounded-full border border-slate-300 bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm backdrop-blur">
                                    Sponsored Banner
                                </div>

                                <h1 className="mt-5 text-3xl font-black leading-[0.94] tracking-[-0.03em] text-slate-900 sm:text-4xl md:text-5xl lg:text-[58px]">
                                    Та энд бараа бүтээгдэхүүн сурталчлах боломжтой
                                </h1>

                                <p className="mt-4 max-w-md text-sm leading-6 text-slate-700 sm:text-base md:text-lg">
                                    Өөрийн дэлгүүрээ илүү олон хүнд хүргээрэй.
                                </p>

                                <div className="mt-7">
                                    <button
                                        type="button"
                                        onClick={handleBannerPlacement}
                                        className="inline-flex min-w-[190px] items-center justify-center rounded-2xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        Баннер байршуулах
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="relative w-full bg-transparent">
                <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-4 md:px-6 md:pt-5">
                    <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-100 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
                        <div className="absolute inset-0">
                            <Image
                                src={getImageSrc(activeBanner.image)}
                                alt={activeBanner.title}
                                fill
                                priority
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

                                <h1 className="mt-5 text-3xl font-black leading-[0.94] tracking-[-0.03em] text-slate-900 sm:text-4xl md:text-5xl lg:text-[58px]">
                                    {activeBanner.title}
                                </h1>

                                <p className="mt-4 max-w-md text-sm leading-6 text-slate-700 sm:text-base md:text-lg">
                                    {activeBanner.subtitle ||
                                        "Онцлох бараагаа нүүрэнд гаргаж, илүү олон худалдан авагчид хүргээрэй."}
                                </p>

                                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                    {!isBannerPlacementLink && (
                                        <Link
                                            href={activeBanner.targetLink || "/"}
                                            className="inline-flex min-w-[170px] items-center justify-center rounded-2xl bg-slate-900 px-6 py-3.5 text-base font-bold text-white transition hover:bg-slate-800"
                                        >
                                            {activeBanner.targetType === "store" ? "Дэлгүүр үзэх" : "Бараа үзэх"}
                                        </Link>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleBannerPlacement}
                                        className="inline-flex min-w-[190px] items-center justify-center rounded-2xl border border-slate-300 bg-white/85 px-6 py-3.5 text-base font-semibold text-slate-800 backdrop-blur transition hover:bg-white"
                                    >
                                        Баннер байршуулах
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {banners.length > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                            {banners.map((banner, index) => (
                                <button
                                    key={banner._id}
                                    onClick={() => setCurrent(index)}
                                    className={`h-2.5 rounded-full transition-all ${current === index ? "w-8 bg-slate-900" : "w-2.5 bg-slate-300"
                                        }`}
                                    aria-label={`Go to banner ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {showBannerPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
                    <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
                        <h3 className="text-2xl font-black text-slate-900">Баннер байршуулах уу?</h3>

                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Баннер байршуулахын тулд эхлээд нэвтэрч, дараа нь баннерын хүсэлтээ илгээнэ үү.
                        </p>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/login?redirect=/seller/banner-ads/create"
                                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Нэвтрэх
                            </Link>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowBannerPrompt(false)}
                            className="mt-4 w-full rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                        >
                            Хаах
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}