"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginContent() {
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    const redirect = searchParams.get("redirect");

    const normalizePhone = (value: string) => {
        return value.replace(/\s+/g, "").replace(/^\+976/, "").trim();
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const cleanPhone = normalizePhone(phone);

        if (!/^[0-9]{8}$/.test(cleanPhone)) {
            alert("Утасны дугаар 8 оронтой байх ёстой");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phone: cleanPhone, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Нэвтрэхэд алдаа гарлаа");
                setLoading(false);
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.user.role);
            localStorage.setItem("userId", data.user._id);

            if (redirect) {
                router.push(redirect);
                return;
            }

            if (data.user.role === "seller") {
                router.push("/seller");
            } else {
                router.push("/");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Нэвтрэхэд алдаа гарлаа");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <form
                onSubmit={handleLogin}
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
                <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">
                    Нэвтрэх
                </h1>

                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Утасны дугаар"
                    className="mb-4 w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-slate-500"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                    required
                />

                <input
                    type="password"
                    placeholder="Нууц үг"
                    className="mb-4 w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-slate-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <div className="mb-4 text-right">
                    <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Нууц үгээ мартсан уу?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                    {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
                </button>

                <p className="mt-4 text-center text-sm text-slate-600">
                    Шинэ хэрэглэгч бол{" "}
                    <Link href="/register" className="text-blue-600 hover:underline">
                        Бүртгүүлэх
                    </Link>
                </p>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}