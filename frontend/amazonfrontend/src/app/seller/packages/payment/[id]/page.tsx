"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Payment = {
    _id: string;
    packageType: string;
    amount: number;
    status: "pending" | "paid" | "failed";
};

export default function SellerPackagePaymentPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [deeplink, setDeeplink] = useState("");


    useEffect(() => {
        const fetchPayment = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
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

                setDeeplink(data.deeplink || "");
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

    const handleConfirm = async () => {
        try {
            setConfirming(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/confirm-demo/${id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            alert(`🎉 ${data.packageType} багц идэвхжлээ`);
            router.push("/seller");
        } catch (error) {
            console.error(error);
            alert("Төлбөр баталгаажуулж чадсангүй");
        } finally {
            setConfirming(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Ачааллаж байна...</div>;
    if (!payment) return <div className="p-8 text-center">Төлбөр олдсонгүй</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 space-y-6">

                <h1 className="text-2xl font-bold text-center">
                    Төлбөр баталгаажуулах
                </h1>

                <div className="border rounded-xl p-4 space-y-2 bg-gray-50">
                    <p><b>Багц:</b> {payment.packageType}</p>
                    <p><b>Үнэ:</b> ₮{payment.amount.toLocaleString()}</p>
                    <p>
                        <b>Төлөв:</b>{" "}
                        <span className={
                            payment.status === "paid"
                                ? "text-green-600"
                                : "text-yellow-600"
                        }>
                            {payment.status === "paid" ? "Төлөгдсөн" : "Хүлээгдэж байна"}
                        </span>
                    </p>
                </div>

                {/* QR */}
                <div className="border rounded p-4 text-center space-y-4">
                    <p className="font-semibold">QPay төлбөр</p>

                    {/* 🔥 QPAY BUTTON */}
                    <a
                        href={deeplink}
                        className="w-full block bg-black text-white py-3 rounded-xl"
                    >
                        📱 QPay-р төлөх
                    </a>

                    <p className="text-sm text-gray-500">
                        Төлбөр хийсний дараа доорх товчийг дарна уу
                    </p>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={confirming || payment.status === "paid"}
                    className={`w-full py-3 rounded-xl text-white font-semibold ${confirming || payment.status === "paid"
                        ? "bg-gray-400"
                        : "bg-black hover:opacity-90"
                        }`}
                >
                    {payment.status === "paid"
                        ? "Төлөгдсөн"
                        : confirming
                            ? "Шалгаж байна..."
                            : "Би төлсөн"}
                </button>
            </div>
        </div>
    );
}