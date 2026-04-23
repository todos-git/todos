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
        }, 5000);

        return () => clearInterval(interval);
    }, [banners]);

    const isBannerPlacementLink = useMemo(() => {
        return activeBanner?.targetLink === "/seller/banner-ads/create";
    }, [activeBanner?.targetLink]);

    const canGoDirectToBannerCreate =
        isLoggedIn && (role === "seller" || role === "admin" || role === "superadmin");

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
            <section className="relative w-full">
                <div className="mx-auto max-w-[1800px]">
                    <div className="h-[360px] animate-pulse rounded-[40px] bg-slate-100 md:h-[480px]" />
                </div>
            </section>
        );
    }

    if (banners.length === 0) {
        return (
            <section className="relative w-full">
                <div className="mx-auto max-w-[1800px]">
                    <div className="relative overflow-hidden rounded-[40px] border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#faf5ff_30%,#eff6ff_100%)] shadow-[0_30px_100px_rgba(15,23,42,0.08)]">
                        <div className="absolute -left-16 top-[-60px] h-56 w-56 rounded-full bg-pink-200/40 blur-3xl" />
                        <div className="absolute right-[-40px] top-16 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
                        <div className="absolute bottom-[-80px] left-1/3 h-56 w-56 rounded-full bg-violet-200/30 blur-3xl" />

                        <div className="relative flex min-h-[360px] items-center px-8 py-10 md:min-h-[480px] md:px-14 lg:px-20">
                            <div className="relative z-10 max-w-[620px]">
                                <div className="inline-flex rounded-full border border-white/70 bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm backdrop-blur">
                                    Sponsored Banner
                                </div>

                                <h1 className="mt-6 text-4xl font-black leading-[0.92] tracking-[-0.04em] text-slate-900 md:text-6xl xl:text-[84px]">
                                    Та энд бараа бүтээгдэхүүн сурталчлах боломжтой
                                </h1>

                                <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
                                    Нүүр хуудсын онцлох хэсэгт баннераа байршуулаад илүү олон худалдан авагчид
                                    хүргээрэй.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-4">
                                    <button
                                        type="button"
                                        onClick={handleBannerPlacement}
                                        className="inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-slate-900 px-7 py-4 text-base font-bold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                                    >
                                        Баннер байршуулах
                                    </button>

                                    <Link
                                        href="/seller/packages"
                                        className="inline-flex min-w-[190px] items-center justify-center rounded-2xl border border-slate-300 bg-white/80 px-7 py-4 text-base font-semibold text-slate-800 backdrop-blur transition hover:bg-white"
                                    >
                                        Багц үзэх
                                    </Link>
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
            <section className="relative w-full">
                <div className="mx-auto max-w-[1800px]">
                    <div className="relative overflow-hidden rounded-[40px] border border-white/70 bg-slate-100 shadow-[0_30px_100px_rgba(15,23,42,0.08)]">
                        <div className="absolute inset-0">
                            <Image
                                src={getImageSrc(activeBanner.image)}
                                alt={activeBanner.title}
                                fill
                                priority
                                unoptimized
                                className="object-cover object-right md:object-center scale-100"
                            />
                        </div>

                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.90)_22%,rgba(255,255,255,0.58)_44%,rgba(255,255,255,0.14)_68%,rgba(255,255,255,0)_100%)]" />
                        <div className="absolute -left-8 top-[-60px] h-60 w-60 rounded-full bg-pink-200/25 blur-3xl" />
                        <div className="absolute left-[22%] bottom-[-80px] h-60 w-60 rounded-full bg-violet-200/20 blur-3xl" />

                        <div className="relative z-10 flex min-h-[360px] items-center px-8 py-10 md:min-h-[480px] md:px-14 lg:px-20">
                            <div className="max-w-[620px]">
                                <div className="inline-flex rounded-full border border-white/70 bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm backdrop-blur">
                                    Sponsored Banner
                                </div>

                                <h1 className="mt-6 text-4xl font-black leading-[0.95] tracking-[-0.04em] text-slate-900 md:text-5xl xl:text-[68px]">
                                    {activeBanner.title}
                                </h1>

                                <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
                                    {activeBanner.subtitle ||
                                        "Онцлох бараагаа нүүрэнд гаргаж, илүү олон худалдан авагчид хүргээрэй."}
                                </p>

                                <div className="mt-8 flex flex-wrap gap-4">
                                    {!isBannerPlacementLink && (
                                        <Link
                                            href={activeBanner.targetLink || "/"}
                                            className="inline-flex min-w-[210px] items-center justify-center rounded-2xl bg-slate-900 px-7 py-4 text-base font-bold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                                        >
                                            {activeBanner.targetType === "store" ? "Дэлгүүр үзэх" : "Бараа үзэх"}
                                        </Link>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleBannerPlacement}
                                        className="inline-flex min-w-[220px] items-center justify-center rounded-2xl border border-slate-300 bg-white/80 px-7 py-4 text-base font-semibold text-slate-800 backdrop-blur transition hover:bg-white"
                                    >
                                        Баннер байршуулах
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {banners.length > 1 && (
                        <div className="mt-5 flex items-center justify-center gap-3">
                            {banners.map((banner, index) => (
                                <button
                                    key={banner._id}
                                    onClick={() => setCurrent(index)}
                                    className={`rounded-full transition-all ${current === index ? "h-2.5 w-10 bg-red-500" : "h-2.5 w-2.5 bg-slate-300"
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