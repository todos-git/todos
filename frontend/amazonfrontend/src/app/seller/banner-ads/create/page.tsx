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
                    banner.image
                        ? `${process.env.NEXT_PUBLIC_API_URL}${banner.image}`
                        : ""
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
            formData.append("title", title);
            formData.append("subtitle", subtitle);
            formData.append("targetType", targetType);
            formData.append("durationDays", String(durationDays));
            if (existingImagePath) {
                formData.append("existingImage", existingImagePath);
            }

            if (existingImagePath) {
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
                <div className="mx-auto max-w-7xl grid gap-8 xl:grid-cols-2">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
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
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                                            }`}
                                    >
                                        Дэлгүүр
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTargetType("product")}
                                        className={`rounded-2xl border px-4 py-3 font-medium transition ${targetType === "product"
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
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
                                className="w-full rounded-2xl bg-black text-white py-3 font-semibold transition hover:opacity-90 disabled:opacity-50"
                            >
                                {submitting
                                    ? "Үүсгэж байна..."
                                    : `Үргэлжлүүлэх - ₮${selectedDuration?.price.toLocaleString()}`}
                            </button>
                        </form>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Live Preview
                            </h2>
                            <p className="mt-1 text-slate-500">
                                Нүүр хуудсан дээр харагдах урьдчилсан дүрслэл
                            </p>
                        </div>

                        <div className="rounded-[28px] overflow-hidden shadow-xl bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 min-h-[260px] md:min-h-[420px]">
                            <div className="grid h-full grid-cols-1 md:grid-cols-2">
                                <div className="p-6 md:p-8 flex flex-col justify-center">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="text-xs px-3 py-1 rounded-full bg-white text-black font-medium">
                                            {selectedDuration?.label}
                                        </span>

                                        <span className="text-xs px-3 py-1 rounded-full bg-black text-white font-medium">
                                            {durationDays} хоног
                                        </span>

                                        <span className="text-xs px-3 py-1 rounded-full bg-white/80 text-slate-800 font-medium">
                                            {targetType === "store" ? "Дэлгүүр" : "Бараа"}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">
                                        {title.trim() || "Таны баннерын гарчиг энд харагдана"}
                                    </h3>

                                    <p className="mt-3 text-sm md:text-base text-slate-800 line-clamp-3">
                                        {subtitle.trim() || "Баннерын тайлбар энд харагдана"}
                                    </p>

                                    <div className="mt-5">
                                        <p className="font-semibold text-slate-900">
                                            {targetType === "store"
                                                ? "Таны дэлгүүр"
                                                : selectedProductName || "Сонгосон бараа"}
                                        </p>
                                        <p className="text-sm text-slate-700">
                                            {targetType === "store"
                                                ? "Дэлгүүрийн хуудас руу чиглүүлнэ"
                                                : "Бүтээгдэхүүний хуудас руу чиглүүлнэ"}
                                        </p>
                                    </div>

                                    <div className="mt-6">
                                        <button
                                            type="button"
                                            className="bg-black text-white px-5 py-3 rounded-xl font-medium"
                                        >
                                            {targetType === "store" ? "Дэлгүүр үзэх" : "Одоо үзэх"}
                                        </button>
                                    </div>
                                </div>

                                <div className="relative min-h-[260px] md:min-h-[420px]">
                                    {imagePreview ? (
                                        <Image
                                            src={imagePreview}
                                            alt="preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 text-slate-600">
                                            Баннерын зураг энд харагдана
                                        </div>
                                    )}
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
                        <h2 className="text-2xl font-bold mb-4">Баннер үйлчилгээний нөхцөл</h2>

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
                            <span className="text-sm text-gray-700">
                                {BANNER_CHECKBOX_LABEL}
                            </span>
                        </label>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={handleAcceptTerms}
                                disabled={!accepted || submitting}
                                className={`flex-1 rounded-xl py-3 font-semibold text-white ${!accepted || submitting
                                    ? "bg-gray-400"
                                    : "bg-black hover:opacity-90"
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