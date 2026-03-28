"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const sellerCategories = [
    "Эрэгтэй хувцас",
    "Эмэгтэй хувцас",
    "Хүүхдийн хувцас",
    "Пүүз",
    "Гутал",
    "Цүнх",
    "Малгай",
    "Дотуур хувцас",
    "Спорт хувцас",
    "Аксессуар",
    "Гоо сайхан",
    "Арьс арчилгаа",
    "Үс арчилгаа",
    "Эрүүл мэнд",
    "Гэр ахуй",
    "Гал тогоо",
    "Цахилгаан бараа",
    "Гар утас, дагалдах хэрэгсэл",
    "Авто бараа",
    "Аялал",
    "Оффис, бичиг хэрэг",
    "Хүнс",
    "Амьтны хэрэгсэл",
    "Бусад",
];

export default function RegisterPage() {
    const router = useRouter();

    const [step, setStep] = useState<1 | 2>(1);
    const [role, setRole] = useState<"user" | "seller">("user");

    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [storeName, setStoreName] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const [city, setCity] = useState("");
    const [district, setDistrict] = useState("");
    const [khoroo, setKhoroo] = useState("");
    const [building, setBuilding] = useState("");
    const [detailAddress, setDetailAddress] = useState("");

    const [loading, setLoading] = useState(false);

    const toggleCategory = (value: string) => {
        setSelectedCategories((prev) =>
            prev.includes(value)
                ? prev.filter((item) => item !== value)
                : [...prev, value]
        );
    };

    const handleContinue = () => {
        if (!email.trim()) {
            alert("Gmail хаягаа оруулна уу.");
            return;
        }

        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!isValidEmail) {
            alert("Зөв Gmail эсвэл и-мэйл хаяг оруулна уу.");
            return;
        }

        setStep(2);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone.trim()) {
            alert("Утасны дугаараа оруулна уу.");
            return;
        }

        if (!password || !confirmPassword) {
            alert("Нууц үгээ бүрэн оруулна уу.");
            return;
        }

        if (password.length < 6) {
            alert("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Нууц үг таарахгүй байна.");
            return;
        }

        if (role === "seller") {
            if (!storeName.trim() || selectedCategories.length === 0) {
                alert("Худалдагчийн мэдээллийг бүрэн бөглөнө үү.");
                return;
            }

            if (
                !city.trim() ||
                !district.trim() ||
                !khoroo.trim() ||
                !building.trim() ||
                !detailAddress.trim()
            ) {
                alert("Байршлын бүх мэдээллийг бөглөнө үү.");
                return;
            }
        }

        const fullLocation =
            role === "seller"
                ? `${city}, ${district}, ${khoroo}, ${building}, ${detailAddress}`
                : "";

        const body =
            role === "seller"
                ? {
                    email,
                    phone,
                    password,
                    role,
                    storeName,
                    categories: selectedCategories,
                    location: fullLocation,
                }
                : {
                    email,
                    phone,
                    password,
                    role: "user",
                };

        try {
            setLoading(true);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Бүртгүүлэхэд алдаа гарлаа.");
                return;
            }

            alert("Та GMAIL шалган бүртгэлээ баталгаажуулна уу.");
            router.push("/login");
        } catch (error) {
            console.error("Register error:", error);
            alert("Серверийн алдаа гарлаа.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <form
                onSubmit={handleSignup}
                className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
                <h1 className="mb-2 text-center text-3xl font-bold text-slate-900">
                    Бүртгүүлэх
                </h1>

                <p className="mb-6 text-center text-sm text-slate-500">
                    Шинэ бүртгэлээ үүсгэнэ үү
                </p>

                <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                    <button
                        type="button"
                        onClick={() => setRole("user")}
                        className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${role === "user"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-700 hover:bg-white"
                            }`}
                    >
                        Хэрэглэгч
                    </button>

                    <button
                        type="button"
                        onClick={() => setRole("seller")}
                        className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${role === "seller"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-700 hover:bg-white"
                            }`}
                    >
                        Худалдагч
                    </button>
                </div>

                {step === 1 && (
                    <>
                        <div className="space-y-4">
                            <input
                                type="email"
                                placeholder="Gmail хаяг"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleContinue}
                            className="mt-6 w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800"
                        >
                            Үргэлжлүүлэх
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Gmail: <span className="font-medium text-slate-900">{email}</span>
                        </div>

                        <div className="space-y-4">
                            {role === "seller" && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Дэлгүүрийн нэр"
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        required
                                    />

                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="mb-4 flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    Зарах ангиллууд
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Нэгээс олон ангилал сонгож болно
                                                </p>
                                            </div>

                                            <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                                                {selectedCategories.length} сонгосон
                                            </div>
                                        </div>

                                        {selectedCategories.length > 0 && (
                                            <div className="mb-4">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Сонгосон ангиллууд
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {selectedCategories.map((item) => (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            onClick={() => toggleCategory(item)}
                                                            className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
                                                        >
                                                            {item} ×
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                            {sellerCategories.map((item) => {
                                                const checked = selectedCategories.includes(item);

                                                return (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        onClick={() => toggleCategory(item)}
                                                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${checked
                                                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-100"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="leading-5">{item}</span>
                                                            <span
                                                                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${checked
                                                                    ? "bg-white text-slate-900"
                                                                    : "bg-slate-100 text-slate-500"
                                                                    }`}
                                                            >
                                                                {checked ? "✓" : "+"}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}


                            <input
                                type="text"
                                placeholder="Утасны дугаар"
                                maxLength={8}
                                inputMode="numeric"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />

                            <input
                                type="password"
                                placeholder="Нууц үг"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            <input
                                type="password"
                                placeholder="Нууц үг давтах"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />

                            {role === "seller" && (
                                <>
                                    <div className="pt-2">
                                        <p className="mb-3 text-sm font-semibold text-slate-700">
                                            Дэлгүүрийн байршил
                                        </p>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Хот"
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        required
                                    />

                                    <input
                                        type="text"
                                        placeholder="Дүүрэг"
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                        required
                                    />

                                    <input
                                        type="text"
                                        placeholder="Хороо"
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                        value={khoroo}
                                        onChange={(e) => setKhoroo(e.target.value)}
                                        required
                                    />

                                    <input
                                        type="text"
                                        placeholder="Барилга / байрны нэр"
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                        value={building}
                                        onChange={(e) => setBuilding(e.target.value)}
                                        required
                                    />

                                    <input
                                        type="text"
                                        placeholder="Тоот, орц, давхар, дэлгэрэнгүй хаяг"
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                        value={detailAddress}
                                        onChange={(e) => setDetailAddress(e.target.value)}
                                        required
                                    />
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-1/3 rounded-2xl border border-slate-300 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Буцах
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-2/3 rounded-2xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
                            </button>
                        </div>
                    </>
                )}

                <p className="mt-5 text-center text-sm text-slate-600">
                    Танд бүртгэл байгаа юу?{" "}
                    <Link href="/login" className="font-medium text-blue-600 hover:underline">
                        Нэвтрэх
                    </Link>
                </p>
            </form>
        </div>
    );
}