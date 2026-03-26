"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage("");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            setMessage(
                data.message ||
                "Хэрвээ энэ и-мэйл бүртгэлтэй бол нууц үг сэргээх холбоос илгээгдлээ"
            );
        } catch (error) {
            console.error("FORGOT PASSWORD PAGE ERROR:", error);
            setMessage("Хүсэлт илгээхэд алдаа гарлаа");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
                <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">
                    Нууц үг сэргээх
                </h1>

                <p className="mb-6 text-center text-sm text-slate-500">
                    Бүртгэлтэй и-мэйл хаягаа оруулна уу
                </p>

                <input
                    type="email"
                    placeholder="И-мэйл хаяг"
                    className="mb-4 w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-slate-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                    {loading ? "Илгээж байна..." : "Сэргээх холбоос илгээх"}
                </button>

                {message && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        {message}
                    </div>
                )}

                <p className="mt-5 text-center text-sm text-slate-600">
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Нэвтрэх хуудас руу буцах
                    </Link>
                </p>
            </form>
        </div>
    );
}