"use client";

import { useEffect, useState } from "react";

type PaymentItem = {
    _id: string;
    packageType: "basic" | "pro" | "premium";
    amount: number;
    status: "pending" | "pending_approval" | "approved" | "failed" | "cancelled";
    paidAt?: string;
    createdAt?: string;
    userId?: {
        _id?: string;
        email?: string;
        phone?: string;
        storeName?: string;
    };
};

function packageLabel(type: string) {
    switch (type) {
        case "basic":
            return "Basic";
        case "pro":
            return "Pro";
        case "premium":
            return "Premium";
        default:
            return type;
    }
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/payments/admin/pending`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Pending payments авч чадсангүй");
            }

            setPayments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("ADMIN PAYMENTS FETCH ERROR:", error);
            alert(error instanceof Error ? error.message : "Алдаа гарлаа");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleApprove = async (paymentId: string) => {
        const confirmed = window.confirm("Энэ төлбөрийг баталгаажуулах уу?");
        if (!confirmed) return;

        try {
            setApprovingId(paymentId);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/payments/${paymentId}/admin-approve`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Approve хийж чадсангүй");
            }

            alert("Төлбөр баталгаажлаа");
            setPayments((prev) => prev.filter((p) => p._id !== paymentId));
        } catch (error) {
            console.error("ADMIN APPROVE ERROR:", error);
            alert(error instanceof Error ? error.message : "Approve хийхэд алдаа гарлаа");
        } finally {
            setApprovingId(null);
        }
    };

    if (loading) {
        return <div className="p-10 text-center">Ачааллаж байна...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Admin төлбөр баталгаажуулалт
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Худалдагчдын package төлбөрийг эндээс шалгаж баталгаажуулна.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Хүлээгдэж буй төлбөрүүд</h2>
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                            {payments.length}
                        </span>
                    </div>

                    {payments.length === 0 ? (
                        <p className="text-slate-500">Одоогоор хүлээгдэж буй төлбөр алга байна.</p>
                    ) : (
                        <div className="space-y-4">
                            {payments.map((payment) => (
                                <div
                                    key={payment._id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                        <div>
                                            <p className="text-xs text-slate-500">Дэлгүүр</p>
                                            <p className="font-semibold text-slate-900">
                                                {payment.userId?.storeName || "Store name байхгүй"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">И-мэйл</p>
                                            <p className="break-all font-medium text-slate-800">
                                                {payment.userId?.email || "-"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">Утас</p>
                                            <p className="font-medium text-slate-800">
                                                {payment.userId?.phone || "-"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">Багц / үнэ</p>
                                            <p className="font-semibold text-slate-900">
                                                {packageLabel(payment.packageType)} / ₮
                                                {payment.amount.toLocaleString()}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">Төлөв</p>
                                            <p className="font-semibold text-orange-700">
                                                {payment.status}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="text-sm text-slate-500">
                                            <p>
                                                Үүссэн:{" "}
                                                {payment.createdAt
                                                    ? new Date(payment.createdAt).toLocaleString()
                                                    : "-"}
                                            </p>
                                            <p>
                                                Би төлсөн дарсан:{" "}
                                                {payment.paidAt
                                                    ? new Date(payment.paidAt).toLocaleString()
                                                    : "-"}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleApprove(payment._id)}
                                            disabled={approvingId === payment._id}
                                            className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                                        >
                                            {approvingId === payment._id
                                                ? "Баталгаажуулж байна..."
                                                : "Approve"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}