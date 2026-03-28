"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PACKAGE_TERMS_TEXT = `
ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ — ХУДАЛДАГЧИЙН БАГЦ

1. Энэхүү төлбөр нь TODOS marketplace платформ дээр худалдагчийн багц үйлчилгээ идэвхжүүлэх дижитал үйлчилгээний төлбөр болно.

2. Таны сонгосон багц идэвхжсэний дараа тухайн багцын боломж, эрх, хугацаа таны бүртгэл дээр шууд эсвэл богино хугацаанд идэвхжинэ.

3. Энэхүү үйлчилгээ нь биет бараа бус, дижитал үйлчилгээ тул багц идэвхжсэний дараа ердийн нөхцөлд төлбөрийг буцаах боломжгүй.

4. Багц худалдан авахаас өмнө та багцын төрөл, үнэ, боломж, хугацаа болон өөрийн хэрэгцээнд тохирч байгаа эсэхийг өөрөө нягталж зөвшөөрнө.

5. Хэрэглэгчийн өөрийн буруу сонголт, буруу ашиглалт, дансны мэдээллийн алдаа, платформын дүрэм зөрчсөнөөс шалтгаалан үүссэн ашиглалтын боломжгүй байдалд төлбөр буцаагдахгүй.

6. Платформын үйл ажиллагааны түр саатал, техникийн шинэчлэл, гуравдагч талын үйлчилгээний доголдол, давагдашгүй хүчин зүйл болон бусад онцгой нөхцөлд асуудлыг компанийн тухайн үеийн журам болон холбогдох хууль тогтоомжийн дагуу шийдвэрлэнэ.

7. Энэхүү зөвшөөрөл нь таны хуульд заасан заавал эдлэх хэрэглэгчийн эрхийг хязгаарлах зорилгогүй болно.
`.trim();

const PACKAGE_CHECKBOX_LABEL =
    "Би үйлчилгээний нөхцөлтэй бүрэн танилцаж, багц идэвхжсэний дараа ердийн нөхцөлд төлбөр буцаагдахгүй болохыг ойлгож зөвшөөрч байна.";

type PackageType = "basic" | "pro" | "premium";

export default function SellerPackages() {
    const router = useRouter();

    const [pendingPackageType, setPendingPackageType] = useState<PackageType | null>(null);
    const [termsOpen, setTermsOpen] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const openTerms = (type: PackageType) => {
        setPendingPackageType(type);
        setAccepted(false);
        setTermsOpen(true);
    };

    const handleContinue = async () => {
        if (!pendingPackageType) return;

        try {
            setSubmitting(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ packageType: pendingPackageType }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Төлбөр үүсгэж чадсангүй");
            }

            const acceptRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/payments/accept-terms`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ paymentId: data._id }),
                }
            );

            const acceptData = await acceptRes.json();

            if (!acceptRes.ok) {
                throw new Error(acceptData.message || "Нөхцөл хадгалж чадсангүй");
            }

            setTermsOpen(false);
            router.push(`/seller/packages/payment/${data._id}`);
        } catch (error) {
            console.error("PACKAGE CONTINUE ERROR:", error);
            alert(error instanceof Error ? error.message : "Алдаа гарлаа");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-10 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-red-500">
                            Launch Promotion
                        </p>
                        <h1 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
                            Нээлтийн урамшуулалтай багцууд
                        </h1>
                        <p className="mt-3 text-slate-500">
                            Хязгаарлагдмал хугацаанд хямдарсан үнээр багцаа идэвхжүүлээрэй.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* BASIC */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                            <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                                🔥 Нээлтийн урамшуулал
                            </div>

                            <h2 className="mt-4 text-2xl font-black text-blue-600">Basic</h2>

                            <div className="mt-4 flex items-end gap-3">
                                <span className="text-lg text-slate-400 line-through">
                                    ₮39,000
                                </span>
                                <span className="text-3xl font-black text-slate-900">
                                    ₮19,000
                                </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-500">3 сарын хугацаа</p>

                            <ul className="mt-6 space-y-3 text-sm text-slate-600">
                                <li>• 30 бүтээгдэхүүн</li>
                                <li>• Байршил харах боломжтой</li>
                                <li>• Илүү найдвартай дэлгүүрийн дүр төрх</li>
                            </ul>

                            <button
                                type="button"
                                onClick={() => openTerms("basic")}
                                className="mt-8 w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
                            >
                                Сонгох
                            </button>
                        </div>

                        {/* PRO */}
                        <div className="relative rounded-3xl border-2 border-green-500 bg-white p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
                            <span className="absolute right-4 top-4 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                                Best Value
                            </span>

                            <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                                🔥 Нээлтийн урамшуулал
                            </div>

                            <h2 className="mt-4 text-2xl font-black text-green-600">Pro</h2>

                            <div className="mt-4 flex items-end gap-3">
                                <span className="text-lg text-slate-400 line-through">
                                    ₮59,000
                                </span>
                                <span className="text-3xl font-black text-slate-900">
                                    ₮39,000
                                </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-500">3 сарын хугацаа</p>

                            <ul className="mt-6 space-y-3 text-sm text-slate-600">
                                <li>• 60 бүтээгдэхүүн</li>
                                <li>• Байршил харах боломжтой</li>
                                <li>• Илүү өндөр эрэмбэ</li>
                                <li>• Илүү мэргэжлийн харагдац</li>
                            </ul>

                            <button
                                type="button"
                                onClick={() => openTerms("pro")}
                                className="mt-8 w-full rounded-2xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
                            >
                                Сонгох
                            </button>
                        </div>

                        {/* PREMIUM */}
                        <div className="relative rounded-3xl border-2 border-yellow-400 bg-gradient-to-br from-yellow-100 to-yellow-50 p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
                            <span className="absolute right-4 top-4 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-white">
                                👑 Premium
                            </span>

                            <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                                🔥 Нээлтийн урамшуулал
                            </div>

                            <h2 className="mt-4 text-2xl font-black text-yellow-700">Premium</h2>

                            <div className="mt-4 flex items-end gap-3">
                                <span className="text-lg text-slate-400 line-through">
                                    ₮89,000
                                </span>
                                <span className="text-3xl font-black text-slate-900">
                                    ₮59,000
                                </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-600">3 сарын хугацаа</p>

                            <ul className="mt-6 space-y-3 text-sm text-slate-700">
                                <li>• 100 бүтээгдэхүүн</li>
                                <li>• Байршил харагдана</li>
                                <li>• Featured боломж</li>
                                <li>• Top seller боломж</li>
                                <li>• Илүү хүчтэй борлуулалтын байрлал</li>
                            </ul>

                            <button
                                type="button"
                                onClick={() => openTerms("premium")}
                                className="mt-8 w-full rounded-2xl bg-yellow-500 py-3 font-semibold text-white transition hover:bg-yellow-600"
                            >
                                Сонгох
                            </button>
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
                        <h2 className="mb-4 text-2xl font-bold">Үйлчилгээний нөхцөл</h2>

                        <div className="max-h-[360px] overflow-y-auto whitespace-pre-line rounded-xl border bg-gray-50 p-4 text-sm leading-7 text-gray-700">
                            {PACKAGE_TERMS_TEXT}
                        </div>

                        <label className="mt-5 flex items-start gap-3">
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                className="mt-1 h-4 w-4"
                            />
                            <span className="text-sm text-gray-700">
                                {PACKAGE_CHECKBOX_LABEL}
                            </span>
                        </label>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={handleContinue}
                                disabled={!accepted || submitting}
                                className={`flex-1 rounded-xl py-3 font-semibold text-white ${!accepted || submitting
                                    ? "bg-gray-400"
                                    : "bg-black hover:opacity-90"
                                    }`}
                            >
                                {submitting ? "Үүсгэж байна..." : "Зөвшөөрч, үргэлжлүүлэх"}
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