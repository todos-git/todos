"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
    _id: string;
    name: string;
};

type ExistingBannerAd = {
    _id: string;
    title: string;
    subtitle?: string;
    image: string;
    targetType: "store" | "product";
    targetProductId?: string;
    durationDays: 7 | 14 | 21;
    theme?: "blue" | "pink" | "dark" | "gold" | "clean";
};

type DurationOption = 7 | 14 | 21;

type DurationItem = {
    days: DurationOption;
    label: string;
    price: number;
};

const durationOptions: DurationItem[] = [
    { days: 7, label: "Эхлэл", price: 19000 },
    { days: 14, label: "Шилдэг", price: 29000 },
    { days: 21, label: "Premium", price: 39000 },
];

const BANNER_TERMS_TEXT = `
ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ — БАННЕР СУРТАЛЧИЛГАА

1. Энэхүү төлбөр нь TODOS marketplace платформ дээр баннер сурталчилгаа байрлуулах дижитал үйлчилгээний төлбөр болно.

2. Баннер төлбөр баталгаажиж, үйлчилгээ идэвхжсэний дараа сурталчилгаа тодорхой хугацаанд платформ дээр байршина.

3. Баннер үйлчилгээ нь дижитал байршуулах үйлчилгээ тул идэвхжсэний дараа ердийн нөхцөлд төлбөрийг буцаах боломжгүй.

4. Баннерын зураг, гарчиг, тайлбар, чиглүүлэх холбоос болон хугацааны мэдээллийг төлбөрийн өмнө хэрэглэгч өөрөө шалгаж баталгаажуулна.

5. Хэрэглэгчийн оруулсан зураг, агуулга, буруу холбоос, дүрэм зөрчсөн контент, эсвэл хэрэглэгчийн буруугаас үүдэлтэй ашиглалтын асуудалд төлбөр буцаагдахгүй.

6. Платформын техникийн саатал, гуравдагч талын үйлчилгээний доголдол, давагдашгүй хүчин зүйл болон бусад онцгой нөхцөлд асуудлыг компанийн тухайн үеийн журам болон холбогдох хууль тогтоомжийн дагуу шийдвэрлэнэ.

7. Энэхүү зөвшөөрөл нь таны хуульд заасан заавал эдлэх хэрэглэгчийн эрхийг хязгаарлах зорилгогүй болно.
`.trim();

const BANNER_CHECKBOX_LABEL =
    "Би баннер үйлчилгээний нөхцөлтэй бүрэн танилцаж, баннер идэвхжсэний дараа ердийн нөхцөлд төлбөр буцаагдахгүй болохыг ойлгож зөвшөөрч байна.";

export default function CreateBannerAdPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [targetType, setTargetType] = useState<"store" | "product">("store");
    const bannerTone = "clean";
    const [targetProductId, setTargetProductId] = useState("");
    const [durationDays, setDurationDays] = useState<DurationOption>(7);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState("");

    const [products, setProducts] = useState<Product[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [termsOpen, setTermsOpen] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [createdAdId, setCreatedAdId] = useState<string | null>(null);
    const [renewingFromId, setRenewingFromId] = useState("");
    const [existingImagePath, setExistingImagePath] = useState("");
    const [existingImagePreview, setExistingImagePreview] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/products/my-products`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        cache: "no-store",
                    }
                );

                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const params = new URLSearchParams(window.location.search);
        const renewId = params.get("renew") || "";

        if (renewId) {
            setRenewingFromId(renewId);
        }
    }, []);

    useEffect(() => {
        const fetchRenewBanner = async () => {
            if (!renewingFromId) return;

            try {
                const token = localStorage.getItem("token");

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/${renewingFromId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }
                );

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Banner мэдээлэл уншиж чадсангүй");
                }

                const banner = data as ExistingBannerAd;

                setTitle(banner.title || "");
                setSubtitle(banner.subtitle || "");
                setTargetType(banner.targetType || "store");
                setTargetProductId(banner.targetProductId || "");
                setDurationDays((banner.durationDays || 7) as DurationOption);
                setExistingImagePath(banner.image || "");
                setExistingImagePreview(
                    banner.image ? `${process.env.NEXT_PUBLIC_API_URL}${banner.image}` : ""
                );
            } catch (error) {
                console.error("FETCH RENEW BANNER ERROR:", error);
                alert(error instanceof Error ? error.message : "Баннер уншиж чадсангүй");
            }
        };

        fetchRenewBanner();
    }, [renewingFromId]);

    useEffect(() => {
        if (!image) {
            setImagePreview(existingImagePreview);
            return;
        }

        const objectUrl = URL.createObjectURL(image);
        setImagePreview(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [image, existingImagePreview]);

    const selectedDuration = useMemo(() => {
        return durationOptions.find((d) => d.days === durationDays);
    }, [durationDays]);

    const selectedProductName = useMemo(() => {
        if (targetType !== "product") return "";
        return products.find((p) => p._id === targetProductId)?.name || "";
    }, [products, targetProductId, targetType]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!title.trim()) return alert("Гарчиг оруулна уу");
        if (!image && !existingImagePath) return alert("Зураг шаардлагатай");

        if (targetType === "product" && !targetProductId) {
            return alert("Бараа сонгоно уу");
        }

        try {
            setSubmitting(true);

            const token = localStorage.getItem("token");

            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("subtitle", subtitle.trim());
            formData.append("targetType", targetType);
            formData.append("theme", bannerTone);
            formData.append("durationDays", String(durationDays));

            if (image) {
                formData.append("image", image);
            } else if (existingImagePath) {
                formData.append("existingImage", existingImagePath);
            }

            if (targetType === "product") {
                formData.append("targetProductId", targetProductId);
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Баннер үүсгэхэд алдаа гарлаа");
            }

            setCreatedAdId(data._id);
            setAccepted(false);
            setTermsOpen(true);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Алдаа гарлаа");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAcceptTerms = async () => {
        if (!createdAdId) return;

        try {
            setSubmitting(true);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/${createdAdId}/accept-terms`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Нөхцөл хадгалж чадсангүй");
            }

            setTermsOpen(false);
            router.push(`/seller/banner-ads/payment/${createdAdId}`);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Алдаа гарлаа");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-slate-50 p-6 md:p-10">
                <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                                Seller Banner Ads
                            </p>
                            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
                                Баннер үүсгэх
                            </h1>
                            <p className="mt-2 text-slate-500">
                                Баннерын текст, зураг, хугацаа болон чиглүүлэх хуудсаа сонгоно уу.
                            </p>
                            {renewingFromId && (
                                <p className="mt-2 text-sm font-medium text-blue-600">
                                    Өмнөх баннерын мэдээллээр дахин сунгаж байна
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Гарчиг
                                </label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Жишээ: Зуны онцлох хямдрал"
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Тайлбар
                                </label>
                                <input
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    placeholder="Жишээ: Шинэ бараанууд хямд үнээр"
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Зураг
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                                />
                            </div>

                            <div>
                                <p className="mb-3 text-sm font-medium text-slate-700">
                                    Чиглүүлэх төрөл
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTargetType("store");
                                            setTargetProductId("");
                                        }}
                                        className={`rounded-2xl border px-4 py-3 font-medium transition ${targetType === "store"
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                                            }`}
                                    >
                                        Дэлгүүр
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTargetType("product")}
                                        className={`rounded-2xl border px-4 py-3 font-medium transition ${targetType === "product"
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                                            }`}
                                    >
                                        Бараа
                                    </button>
                                </div>
                            </div>

                            {targetType === "product" && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Бараа сонгох
                                    </label>
                                    <select
                                        value={targetProductId}
                                        onChange={(e) => setTargetProductId(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                    >
                                        <option value="">Бараа сонгох</option>
                                        {products.map((p) => (
                                            <option key={p._id} value={p._id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <p className="mb-3 text-sm font-medium text-slate-700">
                                    Хугацаа сонгох
                                </p>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {durationOptions.map((d) => (
                                        <button
                                            key={d.days}
                                            type="button"
                                            onClick={() => setDurationDays(d.days)}
                                            className={`rounded-2xl border p-4 text-left transition ${durationDays === d.days
                                                    ? "border-slate-900 bg-slate-900 text-white"
                                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                                }`}
                                        >
                                            <p className="text-sm font-medium">{d.label}</p>
                                            <p className="mt-1 text-sm">{d.days} хоног</p>
                                            <p className="mt-3 text-lg font-bold">
                                                ₮{d.price.toLocaleString()}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                disabled={submitting}
                                className="w-full rounded-2xl bg-black py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                                {submitting
                                    ? "Үүсгэж байна..."
                                    : `Үргэлжлүүлэх - ₮${selectedDuration?.price.toLocaleString()}`}
                            </button>
                        </form>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Live Preview</h2>
                            <p className="mt-1 text-slate-500">
                                Нүүр хуудсан дээр харагдах урьдчилсан дүрслэл
                            </p>
                        </div>

                        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-100 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
                            {imagePreview ? (
                                <div className="absolute inset-0">
                                    <Image
                                        src={imagePreview}
                                        alt="preview"
                                        fill
                                        unoptimized
                                        className="object-cover object-center"
                                    />
                                </div>
                            ) : (
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#eef2f7_100%)]" />
                            )}

                            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.85)_24%,rgba(255,255,255,0.50)_42%,rgba(255,255,255,0.10)_62%,rgba(255,255,255,0)_100%)]" />
                            <div className="absolute inset-y-0 left-0 w-full max-w-[720px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.10),transparent_30%)]" />

                            <div className="relative z-10 flex min-h-[320px] items-center px-6 py-8 sm:px-8 md:min-h-[420px] md:px-12 lg:px-16">
                                <div className="max-w-[460px]">
                                    <div className="inline-flex rounded-full border border-slate-300 bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm backdrop-blur">
                                        Sponsored Banner
                                    </div>

                                    <h3 className="mt-5 text-3xl font-black leading-[0.94] tracking-[-0.03em] text-slate-900 sm:text-4xl md:text-5xl lg:text-[58px]">
                                        {title.trim() || "Таны баннерын гарчиг энд харагдана"}
                                    </h3>

                                    <p className="mt-4 max-w-md text-sm leading-6 text-slate-700 sm:text-base md:text-lg">
                                        {subtitle.trim() ||
                                            "Онцлох бараагаа нүүрэнд гаргаж, илүү олон худалдан авагчид хүргээрэй."}
                                    </p>

                                    <div className="mt-6 space-y-1">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {targetType === "store"
                                                ? "Таны дэлгүүр"
                                                : selectedProductName || "Сонгосон бараа"}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {targetType === "store"
                                                ? "Дэлгүүрийн хуудас руу чиглүүлнэ"
                                                : "Бүтээгдэхүүний хуудас руу чиглүүлнэ"}
                                        </p>
                                    </div>

                                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            type="button"
                                            className="inline-flex min-w-[165px] items-center justify-center rounded-2xl bg-slate-900 px-6 py-3.5 text-base font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5"
                                        >
                                            {targetType === "store" ? "Дэлгүүр үзэх" : "Бараа үзэх"}
                                        </button>

                                        <button
                                            type="button"
                                            className="inline-flex min-w-[185px] items-center justify-center rounded-2xl border border-slate-300 bg-white/85 px-6 py-3.5 text-base font-semibold text-slate-800 backdrop-blur"
                                        >
                                            Нүүрэнд харагдана
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                            <p>• Баннер үүсгэсний дараа үйлчилгээний нөхцөл баталгаажуулна.</p>
                            <p>• Үүний дараа төлбөрийн хуудас руу шилжинэ.</p>
                            <p>• Төлбөр баталгаажсаны дараа баннер идэвхжинэ.</p>
                        </div>
                    </div>
                </div>
            </div>

            {termsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => {
                            if (!submitting) setTermsOpen(false);
                        }}
                    />

                    <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="mb-4 text-2xl font-bold">Баннер үйлчилгээний нөхцөл</h2>

                        <div className="max-h-[360px] overflow-y-auto rounded-xl border bg-gray-50 p-4 whitespace-pre-line text-sm leading-7 text-gray-700">
                            {BANNER_TERMS_TEXT}
                        </div>

                        <label className="mt-5 flex items-start gap-3">
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                className="mt-1 h-4 w-4"
                            />
                            <span className="text-sm text-gray-700">{BANNER_CHECKBOX_LABEL}</span>
                        </label>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={handleAcceptTerms}
                                disabled={!accepted || submitting}
                                className={`flex-1 rounded-xl py-3 font-semibold text-white ${!accepted || submitting ? "bg-gray-400" : "bg-black hover:opacity-90"
                                    }`}
                            >
                                {submitting ? "Хадгалж байна..." : "Зөвшөөрч, үргэлжлүүлэх"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setTermsOpen(false)}
                                disabled={submitting}
                                className="flex-1 rounded-xl border py-3 font-semibold"
                            >
                                Болих
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}