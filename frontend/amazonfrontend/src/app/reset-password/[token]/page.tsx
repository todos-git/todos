"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.trim().length < 6) {
            alert("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
            return;
        }

        if (password !== confirmPassword) {
            alert("Нууц үг таарахгүй байна");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password/${token}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ password }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Нууц үг шинэчлэхэд алдаа гарлаа");
                return;
            }

            alert(data.message || "Нууц үг амжилттай шинэчлэгдлээ");
            router.push("/login");
        } catch (error) {
            console.error("RESET PASSWORD PAGE ERROR:", error);
            alert("Нууц үг шинэчлэхэд алдаа гарлаа");
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
                    Шинэ нууц үг
                </h1>

                <p className="mb-6 text-center text-sm text-slate-500">
                    Шинэ нууц үгээ оруулна уу
                </p>

                <input
                    type="password"
                    placeholder="Шинэ нууц үг"
                    className="mb-4 w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-slate-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Шинэ нууц үг давтах"
                    className="mb-4 w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-slate-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                    {loading ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}
                </button>

                <p className="mt-5 text-center text-sm text-slate-600">
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Нэвтрэх хуудас руу буцах
                    </Link>
                </p>
            </form>
        </div>
    );
}