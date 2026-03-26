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

export default function SellerPackages() {
    const router = useRouter();

    const [pendingPackageType, setPendingPackageType] = useState<string | null>(null);
    const [termsOpen, setTermsOpen] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const openTerms = (type: string) => {
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
            console.error(error);
            alert(error instanceof Error ? error.message : "Алдаа гарлаа");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8 text-center">
                        Багц сонгох
                    </h1>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="rounded-2xl p-6 shadow bg-white border hover:shadow-xl transition">
                            <h2 className="text-xl font-bold text-blue-600">Basic</h2>
                            <p className="text-2xl font-bold mt-2">₮39,000</p>

                            <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                <li>• 30 бүтээгдэхүүн</li>
                                <li>• Байршил харах боломжтой</li>
                                <li>• 3 сарын хугацаа</li>
                            </ul>

                            <button
                                onClick={() => openTerms("basic")}
                                className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                            >
                                Сонгох
                            </button>
                        </div>

                        <div className="rounded-2xl p-6 shadow bg-white border hover:shadow-xl transition">
                            <h2 className="text-xl font-bold text-green-600">Pro</h2>
                            <p className="text-2xl font-bold mt-2">₮59,000</p>

                            <ul className="mt-4 space-y-2 text-sm text-gray-600">
                                <li>• 60 бүтээгдэхүүн</li>
                                <li>• Байршил харах боломжтой</li>
                                <li>• Илүү өндөр эрэмбэ</li>
                                <li>• 3 сарын хугацаа</li>
                            </ul>

                            <button
                                onClick={() => openTerms("pro")}
                                className="mt-6 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                            >
                                Сонгох
                            </button>
                        </div>

                        <div className="rounded-2xl p-6 shadow-lg bg-gradient-to-br from-yellow-100 to-yellow-50 border-2 border-yellow-400 relative hover:scale-[1.02] transition">
                            <span className="absolute top-2 right-2 text-xs bg-yellow-400 text-white px-2 py-1 rounded-full">
                                TOP
                            </span>

                            <h2 className="text-xl font-bold text-yellow-700">Premium</h2>
                            <p className="text-2xl font-bold mt-2">₮89,000</p>

                            <ul className="mt-4 space-y-2 text-sm text-gray-700">
                                <li>• 100 бүтээгдэхүүн</li>
                                <li>• Байршил харагдана</li>
                                <li>• Featured дээр гарна</li>
                                <li>• Top seller боломж</li>
                                <li>• 3 сарын хугацаа</li>
                            </ul>

                            <button
                                onClick={() => openTerms("premium")}
                                className="mt-6 w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600"
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
                        <h2 className="text-2xl font-bold mb-4">Үйлчилгээний нөхцөл</h2>

                        <div className="max-h-[360px] overflow-y-auto rounded-xl border bg-gray-50 p-4 whitespace-pre-line text-sm leading-7 text-gray-700">
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