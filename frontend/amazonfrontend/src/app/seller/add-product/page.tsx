"use client";

import Image from "next/image";
import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

type FormState = {
    name: string;
    description: string;
    price: string;
    stock: string;
    category: string;
    images: File[];

    deliveryAvailable: boolean;
    sameDayDelivery: boolean;
    deliveryCutoffTime: string;

    pickupAvailable: boolean;
    pickupMapLink: string;
};

const productCategories = [
    "All",
    "Хүүхдийн бараа",
    "Эрэгтэй хувцас",
    "Эмэгтэй хувцас",
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

export default function AddProductPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sizes, setSizes] = useState<string[]>([]);
    const [customSize, setCustomSize] = useState("");

    const [form, setForm] = useState<FormState>({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "All",
        images: [],

        deliveryAvailable: false,
        sameDayDelivery: false,
        deliveryCutoffTime: "16:00",

        pickupAvailable: true,
        pickupMapLink: "",
    });

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const target = e.target;
        const { name } = target;

        if (target instanceof HTMLInputElement && target.type === "checkbox") {
            const checked = target.checked;

            setForm((prev) => {
                if (name === "deliveryAvailable" && !checked) {
                    return {
                        ...prev,
                        deliveryAvailable: false,
                        sameDayDelivery: false,
                        deliveryCutoffTime: "16:00",
                    };
                }

                return {
                    ...prev,
                    [name]: checked,
                };
            });

            return;
        }

        setForm((prev) => ({
            ...prev,
            [name]: target.value,
        }));
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (form.images.length + files.length > 5) {
            alert("Хамгийн ихдээ 5 зураг оруулах боломжтой.");
            return;
        }

        setForm((prev) => ({
            ...prev,
            images: [...prev.images, ...files],
        }));

        e.target.value = "";
    };

    const removeImage = (index: number) => {
        setForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!form.name.trim() || !form.description.trim()) {
            alert("Бүтээгдэхүүний нэр болон тайлбараа бөглөнө үү.");
            return;
        }

        if (!form.price || Number(form.price) <= 0) {
            alert("Зөв үнэ оруулна уу.");
            return;
        }

        if (!form.stock || Number(form.stock) < 0) {
            alert("Зөв үлдэгдэл оруулна уу.");
            return;
        }

        if (form.images.length === 0) {
            alert("Хамгийн багадаа 1 зураг оруулна уу.");
            return;
        }

        if (!form.deliveryAvailable && !form.pickupAvailable) {
            alert("Хүргэлт эсвэл очиж авах сонголтоос ядаж нэгийг идэвхжүүлнэ үү.");
            return;
        }

        try {
            setIsSubmitting(true);

            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("description", form.description);
            formData.append("price", form.price);
            formData.append("stock", form.stock);
            formData.append("category", form.category);
            sizes.forEach((size) => {
                formData.append("sizes", size);
            });

            formData.append("deliveryAvailable", String(form.deliveryAvailable));
            formData.append("sameDayDelivery", String(form.sameDayDelivery));
            formData.append("deliveryCutoffTime", form.deliveryCutoffTime);

            formData.append("pickupAvailable", String(form.pickupAvailable));
            formData.append("pickupMapLink", form.pickupMapLink);

            form.images.forEach((file) => {
                formData.append("images", file);
            });

            const token = localStorage.getItem("token");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Бүтээгдэхүүн нэмэхэд алдаа гарлаа.");
                return;
            }

            alert("Бүтээгдэхүүн амжилттай нэмэгдлээ.");
            router.push("/seller");
        } catch (error) {
            console.error("ADD PRODUCT ERROR:", error);
            alert("Серверийн алдаа гарлаа.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
                        Худалдагчийн хэсэг
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
                        Шинэ бүтээгдэхүүн нэмэх
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Бүтээгдэхүүний мэдээллээ оруулж, зураг нэмээд хүргэлт эсвэл очиж авах сонголтоо тохируулна уу.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-xl font-bold text-gray-900">
                                Бүтээгдэхүүний мэдээлэл
                            </h2>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Бүтээгдэхүүний нэр
                                    </label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        placeholder="Бүтээгдэхүүний нэр оруулах"
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Тайлбар
                                    </label>
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        placeholder="Бүтээгдэхүүний тайлбар бичих"
                                        onChange={handleChange}
                                        rows={5}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Үнэ
                                    </label>
                                    <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 bg-white">
                                        <span className="border-r border-gray-300 bg-gray-50 px-4 py-3 text-gray-600">
                                            ₮
                                        </span>
                                        <input
                                            name="price"
                                            type="number"
                                            min="0"
                                            value={form.price}
                                            placeholder="Үнэ"
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Үлдэгдэл
                                    </label>
                                    <input
                                        name="stock"
                                        type="number"
                                        min="0"
                                        value={form.stock}
                                        placeholder="Үлдэгдэл"
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Ангилал
                                    </label>
                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                    >
                                        {productCategories.map((item) => (
                                            <option key={item} value={item}>
                                                {item === "All" ? "Бүгд" : item}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Хэмжээ (Size)
                                    </label>

                                    <div className="flex flex-wrap gap-2">
                                        {["S", "M", "L", "XL", "2XL", "3XL"].map((size) => {
                                            const isSelected = sizes.includes(size);

                                            return (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSizes((prev) => prev.filter((item) => item !== size));
                                                        } else {
                                                            setSizes((prev) => [...prev, size]);
                                                        }
                                                    }}
                                                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${isSelected
                                                        ? "border-black bg-black text-white"
                                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                        <input
                                            type="text"
                                            value={customSize}
                                            onChange={(e) => setCustomSize(e.target.value)}
                                            placeholder="Жишээ: 36, 37, 40, 36-40, One size"
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const value = customSize.trim();

                                                if (!value) return;

                                                if (!sizes.includes(value)) {
                                                    setSizes((prev) => [...prev, value]);
                                                }

                                                setCustomSize("");
                                            }}
                                            className="rounded-xl bg-black px-4 py-3 font-medium text-white hover:opacity-90"
                                        >
                                            Нэмэх
                                        </button>
                                    </div>

                                    {sizes.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {sizes.map((size) => (
                                                <span
                                                    key={size}
                                                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700"
                                                >
                                                    {size}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSizes((prev) => prev.filter((item) => item !== size))
                                                        }
                                                        className="text-gray-500 hover:text-red-500"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <p className="mt-2 text-xs text-gray-500">
                                        Хувцсанд S, M, L, XL ашиглаж болно. Гутал, пүүзэнд 36, 37, 40 эсвэл 36-40 гэж нэмнэ.
                                    </p>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Custom size (жишээ: 42, One size)"
                                    className="mt-3 w-full border rounded-lg p-2"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const value = e.currentTarget.value.trim();
                                            if (value && !sizes.includes(value)) {
                                                setSizes([...sizes, value]);
                                            }
                                            e.currentTarget.value = "";
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-xl font-bold text-gray-900">
                                Хүргэлт ба очиж авах
                            </h2>

                            <div className="space-y-4">
                                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 p-4 transition hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        name="deliveryAvailable"
                                        checked={form.deliveryAvailable}
                                        onChange={handleChange}
                                        className="h-5 w-5"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Хүргэлт боломжтой
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Худалдан авагч хүргэлтээр захиалах боломжтой.
                                        </p>
                                    </div>
                                </label>

                                {form.deliveryAvailable && (
                                    <div className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
                                        <label className="md:col-span-2 flex cursor-pointer items-center gap-3">
                                            <input
                                                type="checkbox"
                                                name="sameDayDelivery"
                                                checked={form.sameDayDelivery}
                                                onChange={handleChange}
                                                className="h-5 w-5"
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    Өдөртөө хүргэлт
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Тогтоосон цагаас өмнө орсон захиалга тухайн өдөртөө хүрнэ.
                                                </p>
                                            </div>
                                        </label>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Захиалга авах сүүлийн цаг
                                            </label>
                                            <input
                                                type="time"
                                                name="deliveryCutoffTime"
                                                value={form.deliveryCutoffTime}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                            />
                                            <p className="mt-2 text-xs text-gray-500">
                                                Санал болгож буй цаг: 16:00
                                            </p>
                                        </div>

                                        <div className="flex items-end">
                                            <div className="w-full rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                                                Хэрэглэгчид харагдах текст:{" "}
                                                {form.deliveryCutoffTime || "16:00"} цагаас өмнө
                                                захиалбал өдөртөө хүргэнэ
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 p-4 transition hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        name="pickupAvailable"
                                        checked={form.pickupAvailable}
                                        onChange={handleChange}
                                        className="h-5 w-5"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Очиж авах боломжтой
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Худалдан авагч таны оруулсан байршлын линкээр орж бараагаа очиж авч болно.
                                        </p>
                                    </div>
                                </label>

                                {form.pickupAvailable && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Байршлын линк
                                            </label>
                                            <input
                                                name="pickupMapLink"
                                                value={form.pickupMapLink}
                                                placeholder="Google Maps share link оруулах"
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Бүтээгдэхүүний зургууд
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Хамгийн ихдээ 5 зураг оруулна
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                {form.images.map((img, index) => (
                                    <div
                                        key={`${img.name}-${index}`}
                                        className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                                    >
                                        <Image
                                            src={URL.createObjectURL(img)}
                                            alt={`Preview ${index + 1}`}
                                            width={300}
                                            height={200}
                                            className="h-32 w-full object-cover"
                                            unoptimized
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute right-2 top-2 rounded-lg bg-black/80 px-2 py-1 text-xs text-white hover:bg-black"
                                        >
                                            Устгах
                                        </button>
                                    </div>
                                ))}

                                {form.images.length < 5 && (
                                    <label className="flex h-32 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white text-3xl text-gray-400 hover:bg-gray-50">
                                        +
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-xl font-bold text-gray-900">
                                Нийтлэхэд бэлэн үү?
                            </h2>

                            <div className="space-y-3 text-sm text-gray-600">
                                <p>• Бүтээгдэхүүний нэр, тайлбар заавал хэрэгтэй</p>
                                <p>• Хамгийн багадаа 1 зураг шаардлагатай</p>
                                <p>• Хүргэлт эсвэл очиж авахын аль нэгийг сонгоно</p>
                                <p>• Өдөртөө хүргэлтийн үндсэн цаг нь 16:00</p>
                                <p>• Байршлыг seller бүртгэл дээр нэг удаа бөглөсөн</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || form.images.length === 0}
                                className={`mt-6 w-full rounded-2xl py-3 font-semibold text-white transition ${isSubmitting || form.images.length === 0
                                    ? "bg-gray-400"
                                    : "bg-black hover:opacity-90"
                                    }`}
                            >
                                {isSubmitting ? "Нэмж байна..." : "Бүтээгдэхүүн нэмэх"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}