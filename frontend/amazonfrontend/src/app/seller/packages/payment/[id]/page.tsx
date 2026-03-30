"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

type Payment = {
    _id: string;
    packageType: "basic" | "pro" | "premium";
    amount: number;
    status: "pending" | "pending_approval" | "approved" | "failed" | "cancelled";
    qpayQrText?: string;
    qpayDeepLink?: string;
};

export default function SellerPackagePaymentPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        const fetchPayment = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                });

                const data = await res.json();

                if (!res.ok) throw new Error(data.message);

                setPayment(data);
            } catch (error) {
                console.error(error);
                alert("Төлбөрийн мэдээлэл авахад алдаа гарлаа");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPayment();
    }, [id]);

    useEffect(() => {
        if (!payment) return;

        const createQpay = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/payments/qpay/create`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ paymentId: payment._id }),
                    }
                );

                const text = await res.text();
                let data;

                try {
                    data = JSON.parse(text);
                } catch {
                    console.error("Non-JSON response:", text);
                    throw new Error("Сервер JSON биш хариу буцаалаа");
                }

                if (!res.ok) {
                    throw new Error(data.message || "QPay үүсгэхэд алдаа гарлаа");
                }
            } catch (error) {
                console.error(error);
                alert(
                    error instanceof Error
                        ? error.message
                        : "QPay мэдээлэл авахад алдаа гарлаа"
                );
            }
        };

        createQpay();
    }, [payment]);

    const packageDisplay = useMemo(() => {
        switch (payment?.packageType) {
            case "basic":
                return {
                    label: "Basic",
                    oldPrice: 39000,
                    promoPrice: 19000,
                    color: "text-blue-600",
                };
            case "pro":
                return {
                    label: "Pro",
                    oldPrice: 59000,
                    promoPrice: 39000,
                    color: "text-green-600",
                };
            case "premium":
                return {
                    label: "Premium",
                    oldPrice: 89000,
                    promoPrice: 59000,
                    color: "text-yellow-600",
                };
            default:
                return {
                    label: "",
                    oldPrice: 0,
                    promoPrice: 0,
                    color: "text-slate-900",
                };
        }
    }, [payment?.packageType]);

    const handleConfirm = async () => {
        try {
            setConfirming(true);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/payments/confirm-demo/${id}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            alert("Төлбөр шалгах хүлээгдэж байна");
            router.push("/seller");
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Төлбөр баталгаажуулж чадсангүй");
        } finally {
            setConfirming(false);
        }
    };

    const handleCancel = async () => {
        const confirmed = window.confirm("Энэ төлбөрийг болих уу?");
        if (!confirmed) return;

        try {
            setCancelling(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Цуцалж чадсангүй");

            alert("Төлбөр цуцлагдлаа");
            router.push("/seller/packages");
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Төлбөр цуцлахад алдаа гарлаа");
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Ачааллаж байна...</div>;
    if (!payment) return <div className="p-8 text-center">Төлбөр олдсонгүй</div>;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-black text-slate-900">Package Payment</h1>
                    <p className="mt-2 text-slate-500">
                        Багцын төлбөрөө шалгаад үргэлжлүүлнэ үү.
                    </p>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Багц</span>
                            <span className={`font-bold ${packageDisplay.color}`}>
                                {packageDisplay.label}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Урамшууллын үнэ</span>
                            <div className="text-right">
                                <p className="text-sm text-slate-400 line-through">
                                    ₮{packageDisplay.oldPrice.toLocaleString()}
                                </p>
                                <span className="text-4xl font-black text-slate-900">
                                    ₮{packageDisplay.promoPrice.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Төлөв</span>
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${payment.status === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : payment.status === "pending_approval"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                            >
                                {payment.status === "approved"
                                    ? "Баталгаажсан"
                                    : payment.status === "pending_approval"
                                        ? "Шалгаж байна"
                                        : "Хүлээгдэж байна"}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-200 p-5 text-center space-y-4">
                        <h2 className="text-xl font-bold">QR кодоор төлөх</h2>

                        <div className="mx-auto h-56 w-56 overflow-hidden rounded-2xl border bg-white p-2">
                            <div className="relative h-full w-full">
                                <Image
                                    src="/qr/tdb-qr.jpg"
                                    alt="QR"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                        </div>

                        <p className="text-red-500 mt-6 rounded-2xl bg-grey-100 p-5">
                            QR кодыг уншуулж төлбөрөө төлсөний дараа нь “Би төлсөн” товчийг дарна уу.
                        </p>



                    </div>

                    <div className="mt-6 space-y-3">
                        <button
                            onClick={handleConfirm}
                            disabled={
                                confirming ||
                                cancelling ||
                                payment.status === "approved" ||
                                payment.status === "pending_approval"
                            }
                            className={`w-full rounded-xl py-3 font-semibold text-white ${confirming ||
                                cancelling ||
                                payment.status === "approved" ||
                                payment.status === "pending_approval"
                                ? "bg-gray-400"
                                : "bg-black hover:opacity-90"
                                }`}
                        >
                            {payment.status === "approved"
                                ? "Төлбөр баталгаажсан"
                                : payment.status === "pending_approval"
                                    ? "Шалгаж байна..."
                                    : confirming
                                        ? "Илгээж байна..."
                                        : "Би төлсөн"}
                        </button>

                        {payment.status !== "approved" && payment.status !== "pending_approval" && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={cancelling || confirming}
                                className="w-full rounded-xl border border-red-300 bg-red-50 py-3 font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            >
                                {cancelling ? "Цуцалж байна..." : "Болих"}
                            </button>
                        )}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                        🔥 Нээлтийн урамшуулал
                    </div>

                    <h2 className={`mt-4 text-3xl font-black ${packageDisplay.color}`}>
                        {packageDisplay.label} Package
                    </h2>

                    <p className="text-sm text-slate-400 line-through">
                        ₮{packageDisplay.oldPrice.toLocaleString()}
                    </p>
                    <p className="text-xl font-black text-slate-900">
                        ₮{packageDisplay.promoPrice.toLocaleString()}
                    </p>



                    <div className="mt-6 rounded-2xl bg-red-100 p-5">
                        <p className="text-sm font-semibold text-slate-800">Анхаарах зүйлс</p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>• Гүйлгээний утга дээр бүртгэлтэй Gmail-ээ бичиж болно</li>
                            <li>• “Би төлсөн” дарсны дараа төлөв шалгах горимд орно</li>
                            <li>• Админ баталгаажуулсны дараа багц идэвхжинэ</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}