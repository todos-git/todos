"use client";

import Image from "next/image";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";

interface Product {
    name: string;
    price: number;
    stock: number;
    description: string;
    category: string;
    images?: string[];
    deliveryAvailable?: boolean;
    pickupAvailable?: boolean;
    pickupMapLink?: string;
}

export default function EditProduct() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [name, setName] = useState("");
    const [price, setPrice] = useState<number | string>("");
    const [stock, setStock] = useState<number | string>("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("All");

    const [deliveryAvailable, setDeliveryAvailable] = useState(false);
    const [pickupAvailable, setPickupAvailable] = useState(false);
    const [pickupMapLink, setPickupMapLink] = useState("");

    const [images, setImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        const fetchProduct = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data: Product = await res.json();

                setName(data.name || "");
                setPrice(data.price ?? "");
                setStock(data.stock ?? "");
                setDescription(data.description || "");
                setCategory(data.category || "All");
                setImages(data.images || []);
                setDeliveryAvailable(Boolean(data.deliveryAvailable));
                setPickupAvailable(Boolean(data.pickupAvailable));
                setPickupMapLink(data.pickupMapLink || "");
            } catch (error) {
                console.error("FETCH PRODUCT ERROR:", error);
                alert("Бүтээгдэхүүний мэдээлэл ачаалахад алдаа гарлаа.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleNewImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (files.length === 0) return;

        const totalCount = images.length + newImages.length + files.length;

        if (totalCount > 5) {
            alert("Нийтдээ хамгийн ихдээ 5 зураг байж болно.");
            return;
        }

        setNewImages((prev) => [...prev, ...files]);
        e.target.value = "";
    };

    const removeExistingImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index: number) => {
        setNewImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!name.trim() || !description.trim()) {
            alert("Бүтээгдэхүүний нэр болон тайлбараа бөглөнө үү.");
            return;
        }

        if (!price || Number(price) <= 0) {
            alert("Зөв үнэ оруулна уу.");
            return;
        }

        if (stock === "" || Number(stock) < 0) {
            alert("Зөв үлдэгдэл оруулна уу.");
            return;
        }

        if (!deliveryAvailable && !pickupAvailable) {
            alert("Хүргэлт эсвэл очиж авах сонголтоос ядаж нэгийг сонгоно уу.");
            return;
        }

        try {
            setIsSubmitting(true);

            const token = localStorage.getItem("token");
            const formData = new FormData();

            formData.append("name", name);
            formData.append("price", String(price));
            formData.append("stock", String(stock));
            formData.append("description", description);
            formData.append("category", category);
            formData.append("deliveryAvailable", String(deliveryAvailable));
            formData.append("pickupAvailable", String(pickupAvailable));
            formData.append("pickupMapLink", pickupMapLink);

            images.forEach((img) => {
                formData.append("existingImages", img);
            });

            newImages.forEach((file) => {
                formData.append("images", file);
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Бүтээгдэхүүнийг шинэчлэхэд алдаа гарлаа.");
                return;
            }

            alert("Бүтээгдэхүүн амжилттай шинэчлэгдлээ.");
            router.push("/seller/products");
        } catch (error) {
            console.error("UPDATE PRODUCT ERROR:", error);
            alert("Серверийн алдаа гарлаа.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
                <div className="mx-auto max-w-5xl">
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                        <p className="text-slate-500">Бүтээгдэхүүнийг ачааллаж байна...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                        Худалдагчийн хэсэг
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
                        Бүтээгдэхүүн засах
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Бүтээгдэхүүний мэдээлэл, хүргэлтийн тохиргоо болон зургуудыг шинэчилнэ үү.
                    </p>
                </div>

                <form onSubmit={handleUpdate} className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-xl font-bold text-slate-900">
                                Бүтээгдэхүүний мэдээлэл
                            </h2>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Бүтээгдэхүүний нэр
                                    </label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                        placeholder="Бүтээгдэхүүний нэр"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Үнэ
                                    </label>
                                    <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white">
                                        <span className="border-r border-slate-300 bg-slate-50 px-4 py-3 text-slate-600">
                                            ₮
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={price}
                                            onChange={(e) =>
                                                setPrice(
                                                    e.target.value === "" ? "" : Number(e.target.value)
                                                )
                                            }
                                            className="w-full px-4 py-3 outline-none"
                                            placeholder="Үнэ"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Үлдэгдэл
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stock}
                                        onChange={(e) =>
                                            setStock(
                                                e.target.value === "" ? "" : Number(e.target.value)
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                        placeholder="Үлдэгдэл"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Ангилал
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                    >
                                        <option value="All">Бүгд</option>
                                        <option value="Baby">Хүүхдийн бараа</option>
                                        <option value="Men">Эрэгтэй</option>
                                        <option value="Women">Эмэгтэй</option>
                                        <option value="Beauty & Personal care">Гоо сайхан, арчилгаа</option>
                                        <option value="Health">Эрүүл мэнд</option>
                                        <option value="Home & Kitchen">Гэр ахуй, гал тогоо</option>
                                        <option value="Sports">Спорт</option>
                                        <option value="Travel">Аялал</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Тайлбар
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                        placeholder="Бүтээгдэхүүний тайлбар"
                                        rows={5}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-xl font-bold text-slate-900">
                                Хүргэлт ба очиж авах
                            </h2>

                            <div className="space-y-4">
                                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        checked={deliveryAvailable}
                                        onChange={(e) => setDeliveryAvailable(e.target.checked)}
                                        className="h-5 w-5"
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            Хүргэлт боломжтой
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Худалдан авагч хүргэлтээр захиалах боломжтой.
                                        </p>
                                    </div>
                                </label>

                                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        checked={pickupAvailable}
                                        onChange={(e) => setPickupAvailable(e.target.checked)}
                                        className="h-5 w-5"
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            Очиж авах боломжтой
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Худалдан авагч байршлын линк ашиглан очиж авч болно.
                                        </p>
                                    </div>
                                </label>

                                {pickupAvailable && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                Байршлын линк
                                            </label>
                                            <input
                                                value={pickupMapLink}
                                                onChange={(e) => setPickupMapLink(e.target.value)}
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                                placeholder="Google Maps share link"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-xl font-bold text-slate-900">
                                Зургууд
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <p className="mb-3 font-semibold text-slate-800">
                                        Одоогийн зургууд
                                    </p>

                                    {images.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            Одоогийн зураг алга байна.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                            {images.map((img, index) => (
                                                <div
                                                    key={`${img}-${index}`}
                                                    className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                                                >
                                                    <Image
                                                        src={`${process.env.NEXT_PUBLIC_API_URL}${img}`}
                                                        alt={`Current product ${index + 1}`}
                                                        width={300}
                                                        height={200}
                                                        className="h-32 w-full object-cover"
                                                        unoptimized
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingImage(index)}
                                                        className="absolute right-2 top-2 rounded-lg bg-black/80 px-2 py-1 text-xs text-white hover:bg-black"
                                                    >
                                                        Устгах
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="mb-3 font-semibold text-slate-800">
                                        Шинэ зураг нэмэх
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                        {newImages.map((img, index) => (
                                            <div
                                                key={`${img.name}-${index}`}
                                                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                                            >
                                                <Image
                                                    src={URL.createObjectURL(img)}
                                                    alt={`New preview ${index + 1}`}
                                                    width={300}
                                                    height={200}
                                                    className="h-32 w-full object-cover"
                                                    unoptimized
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => removeNewImage(index)}
                                                    className="absolute right-2 top-2 rounded-lg bg-black/80 px-2 py-1 text-xs text-white hover:bg-black"
                                                >
                                                    Устгах
                                                </button>
                                            </div>
                                        ))}

                                        {images.length + newImages.length < 5 && (
                                            <label className="flex h-32 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white text-3xl text-slate-400 hover:bg-slate-50">
                                                +
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleNewImagesChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-xl font-bold text-slate-900">
                                Өөрчлөлт хадгалах
                            </h2>

                            <div className="space-y-3 text-sm text-slate-600">
                                <p>• Боломжтой бол ядаж 1 зураг үлдээнэ үү</p>
                                <p>• Хүргэлт эсвэл очиж авах сонголтоос нэгийг сонгоно уу</p>
                                <p>• Байршил seller бүртгэл дээр хадгалагдсан байгаа</p>
                                <p>• Хадгалахаасаа өмнө өөрчлөлтөө шалгана уу</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`mt-6 w-full rounded-2xl py-3 font-semibold text-white transition ${isSubmitting
                                    ? "bg-slate-400"
                                    : "bg-slate-900 hover:opacity-90"
                                    }`}
                            >
                                {isSubmitting ? "Шинэчилж байна..." : "Өөрчлөлт хадгалах"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}