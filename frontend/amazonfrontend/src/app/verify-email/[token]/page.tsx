"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function VerifyEmailPage() {
    const params = useParams();
    const router = useRouter();

    const tokenParam = params.token;
    const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam ?? "";

    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setError("Баталгаажуулах токен олдсонгүй");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify/${token}`
                );

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Баталгаажуулалт амжилтгүй");
                }

                setSuccess(true);

                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } catch (error: unknown) {
                console.error("VERIFY EMAIL PAGE ERROR:", error);

                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("Баталгаажуулалт амжилтгүй");
                }
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, [token, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                {loading && (
                    <>
                        <h1 className="mb-4 text-xl font-bold text-slate-900">
                            Баталгаажуулж байна...
                        </h1>
                        <p className="text-slate-500">Түр хүлээнэ үү</p>
                    </>
                )}

                {!loading && success && (
                    <>
                        <h1 className="mb-3 text-2xl font-bold text-green-600">
                            ✅ Амжилттай!
                        </h1>

                        <p className="mb-4 text-slate-600">
                            Таны и-мэйл амжилттай баталгаажлаа.
                        </p>

                        <p className="text-sm text-slate-500">
                            Та одоо нэвтэрч болно. 3 секундийн дараа автоматаар шилжинэ.
                        </p>

                        <button
                            onClick={() => router.push("/login")}
                            className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-white transition hover:bg-slate-800"
                        >
                            Нэвтрэх
                        </button>
                    </>
                )}

                {!loading && error && (
                    <>
                        <h1 className="mb-3 text-2xl font-bold text-red-600">
                            ❌ Алдаа
                        </h1>

                        <p className="mb-4 text-slate-600">{error}</p>

                        <button
                            onClick={() => router.push("/login")}
                            className="mt-4 w-full rounded-xl bg-slate-900 py-3 text-white transition hover:bg-slate-800"
                        >
                            Нэвтрэх хуудас руу буцах
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}