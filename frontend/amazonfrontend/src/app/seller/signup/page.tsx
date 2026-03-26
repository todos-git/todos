"use client";

import { useState } from "react";
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


export default function SignupPage() {
    const router = useRouter();

    const [storeName, setStoreName] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const toggleCategory = (value: string) => {
        setSelectedCategories((prev) =>
            prev.includes(value)
                ? prev.filter((item) => item !== value)
                : [...prev, value]
        );
    };

    const handleSignup = async () => {
        if (!storeName.trim() || !email.trim() || !phone.trim() || !location.trim() || !password.trim()) {
            alert("Бүх талбарыг бөглөнө үү");
            return;
        }

        if (selectedCategories.length === 0) {
            alert("Дор хаяж 1 ангилал сонгоно уу");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    storeName,
                    categories: selectedCategories,
                    email,
                    phone,
                    location,
                    password,
                    role: "seller",
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message || "Амжилттай бүртгэгдлээ");
                router.push("/login");
            } else {
                alert(data.message || "Бүртгэхэд алдаа гарлаа");
            }
        } catch (error) {
            console.error("SIGNUP ERROR:", error);
            alert("Сервертэй холбогдоход алдаа гарлаа");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8">
            <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-8">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                        TODOS Seller
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
                        Худалдагчаар бүртгүүлэх
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Дэлгүүрийн мэдээллээ оруулаад зарах ангиллуудаа сонгоно уу.
                    </p>
                </div>

                <div className="grid gap-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Дэлгүүрийн нэр
                        </label>
                        <input
                            placeholder="Жишээ: Narantuul Fashion"
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                И-мэйл
                            </label>
                            <input
                                type="email"
                                placeholder="Gmail хаяг"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Утасны дугаар
                            </label>
                            <input
                                type="text"
                                placeholder="Жишээ: 99112233"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Байршил
                            </label>
                            <input
                                placeholder="Жишээ: Улаанбаатар, Нарантуул"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Нууц үг
                        </label>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-800">
                                    Зарах ангиллууд
                                </label>
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

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
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

                    <button
                        onClick={handleSignup}
                        disabled={loading}
                        className="mt-2 w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                        {loading ? "Бүртгэж байна..." : "Дэлгүүр бүртгүүлэх"}
                    </button>
                </div>
            </div>
        </div>
    );
}