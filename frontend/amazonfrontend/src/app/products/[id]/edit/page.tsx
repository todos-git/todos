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
    location: string;
    images?: string[];

    deliveryAvailable?: boolean;
    sameDayDelivery?: boolean;
    deliveryCutoffTime?: string;

    pickupAvailable?: boolean;
    pickupAddress?: string;
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
    const [location, setLocation] = useState("");

    const [deliveryAvailable, setDeliveryAvailable] = useState(false);
    const [sameDayDelivery, setSameDayDelivery] = useState(false);
    const [deliveryCutoffTime, setDeliveryCutoffTime] = useState("16:00");

    const [pickupAvailable, setPickupAvailable] = useState(false);
    const [pickupAddress, setPickupAddress] = useState("");
    const [pickupMapLink, setPickupMapLink] = useState("");

    const [images, setImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getImageSrc = (src?: string) => {
        if (!src) return "/no-image.png";

        return src.startsWith("http")
            ? src
            : `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith("/") ? src : `/${src}`}`;
    };

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
                setLocation(data.location || "");
                setImages(data.images || []);

                setDeliveryAvailable(Boolean(data.deliveryAvailable));
                setSameDayDelivery(Boolean(data.sameDayDelivery));
                setDeliveryCutoffTime(data.deliveryCutoffTime || "16:00");

                setPickupAvailable(Boolean(data.pickupAvailable));
                setPickupAddress(data.pickupAddress || "");
                setPickupMapLink(data.pickupMapLink || "");
            } catch (error) {
                console.error("FETCH PRODUCT ERROR:", error);
                alert("Failed to load product");
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
            alert("Maximum 5 images allowed in total");
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
            alert("Please fill in product name and description");
            return;
        }

        if (!price || Number(price) <= 0) {
            alert("Please enter a valid price");
            return;
        }

        if (stock === "" || Number(stock) < 0) {
            alert("Please enter a valid stock");
            return;
        }

        if (!deliveryAvailable && !pickupAvailable) {
            alert("Choose at least one option: delivery or pickup");
            return;
        }

        if (pickupAvailable && !pickupAddress.trim()) {
            alert("Please enter pickup address");
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
            formData.append("location", location);

            formData.append("deliveryAvailable", String(deliveryAvailable));
            formData.append("sameDayDelivery", String(sameDayDelivery));
            formData.append("deliveryCutoffTime", deliveryCutoffTime);

            formData.append("pickupAvailable", String(pickupAvailable));
            formData.append("pickupAddress", pickupAddress);
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
                alert(data.message || "Failed to update product");
                return;
            }

            alert("Product updated");
            router.push("/seller/products");
        } catch (error) {
            console.error("UPDATE PRODUCT ERROR:", error);
            alert("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 px-4 py-8 md:px-6">
                <div className="mx-auto max-w-5xl">
                    <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-200">
                        <p className="text-gray-500">Loading product...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-8 md:px-6">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
                        Seller Panel
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
                        Edit Product
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Update your product details, delivery settings, and images.
                    </p>
                </div>

                <form onSubmit={handleUpdate} className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-5">
                                Product Information
                            </h2>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Product Name
                                    </label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                        placeholder="Product name"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Price
                                    </label>
                                    <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 bg-white">
                                        <span className="border-r border-gray-300 bg-gray-50 px-4 py-3 text-gray-600">
                                            ₮
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={price}
                                            onChange={(e) => setPrice(Number(e.target.value))}
                                            className="w-full px-4 py-3 outline-none"
                                            placeholder="Price"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stock}
                                        onChange={(e) => setStock(Number(e.target.value))}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                        placeholder="Stock"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Category
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                    >
                                        <option value="All">All</option>
                                        <option value="Baby">Baby</option>
                                        <option value="Men">Men</option>
                                        <option value="Women">Women</option>
                                        <option value="Beauty & Personal care">Beauty & Personal care</option>
                                        <option value="Health">Health</option>
                                        <option value="Home & Kitchen">Home & Kitchen</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Travel">Travel</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        General Location
                                    </label>
                                    <input
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                        placeholder="Location"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                        placeholder="Description"
                                        rows={5}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-5">
                                Delivery & Pickup
                            </h2>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition">
                                    <input
                                        type="checkbox"
                                        checked={deliveryAvailable}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setDeliveryAvailable(checked);

                                            if (!checked) {
                                                setSameDayDelivery(false);
                                                setDeliveryCutoffTime("16:00");
                                            }
                                        }}
                                        className="h-5 w-5"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Delivery available
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Buyers can order this item with delivery.
                                        </p>
                                    </div>
                                </label>

                                {deliveryAvailable && (
                                    <div className="grid gap-4 md:grid-cols-2 rounded-2xl border border-gray-200 p-4 bg-gray-50">
                                        <label className="md:col-span-2 flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={sameDayDelivery}
                                                onChange={(e) => setSameDayDelivery(e.target.checked)}
                                                className="h-5 w-5"
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    Same day delivery
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Orders before cutoff time can arrive today.
                                                </p>
                                            </div>
                                        </label>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Delivery cutoff time
                                            </label>
                                            <input
                                                type="time"
                                                value={deliveryCutoffTime}
                                                onChange={(e) => setDeliveryCutoffTime(e.target.value)}
                                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">
                                                Suggested default: 16:00
                                            </p>
                                        </div>

                                        <div className="flex items-end">
                                            <div className="w-full rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                                                Buyer sees: Order before {deliveryCutoffTime || "16:00"} for same day delivery
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <label className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition">
                                    <input
                                        type="checkbox"
                                        checked={pickupAvailable}
                                        onChange={(e) => setPickupAvailable(e.target.checked)}
                                        className="h-5 w-5"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Pickup available
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Buyers can pick up this item from your location.
                                        </p>
                                    </div>
                                </label>

                                {pickupAvailable && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Pickup Address
                                            </label>
                                            <input
                                                value={pickupAddress}
                                                onChange={(e) => setPickupAddress(e.target.value)}
                                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                                placeholder="Pickup address"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Google Maps Link
                                            </label>
                                            <input
                                                value={pickupMapLink}
                                                onChange={(e) => setPickupMapLink(e.target.value)}
                                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                                                placeholder="Google Maps share link"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-5">
                                Images
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <p className="font-semibold mb-3 text-gray-800">
                                        Current Images
                                    </p>

                                    {images.length === 0 ? (
                                        <p className="text-sm text-gray-500">
                                            No current images
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                            {images.map((img, index) => (
                                                <div
                                                    key={`${img}-${index}`}
                                                    className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                                                >
                                                    <Image
                                                        src={getImageSrc(img)}
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
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="font-semibold mb-3 text-gray-800">
                                        Add New Images
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                        {newImages.map((img, index) => (
                                            <div
                                                key={`${img.name}-${index}`}
                                                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
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
                                                    Remove
                                                </button>
                                            </div>
                                        ))}

                                        {images.length + newImages.length < 5 && (
                                            <label className="flex h-32 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white text-3xl text-gray-400 hover:bg-gray-50">
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
                        <div className="sticky top-24 rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Update Product
                            </h2>

                            <div className="space-y-3 text-sm text-gray-600">
                                <p>• Keep at least one image if possible</p>
                                <p>• Choose delivery and/or pickup option</p>
                                <p>• Pickup address is required if pickup is enabled</p>
                                <p>• Delivery cutoff time defaults to 16:00</p>
                                <p>• Review your changes before saving</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`mt-6 w-full rounded-2xl py-3 text-white font-semibold transition ${isSubmitting
                                    ? "bg-gray-400"
                                    : "bg-black hover:opacity-90"
                                    }`}
                            >
                                {isSubmitting ? "Updating..." : "Update Product"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}