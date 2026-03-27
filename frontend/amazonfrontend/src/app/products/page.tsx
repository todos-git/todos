"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/utils/format";

interface Product {
    _id: string;
    name: string;
    price: number;
    images?: string[];
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

    const getImageSrc = (src?: string) => {
        if (!src) return "/no-image.png";

        if (
            src.startsWith("http://") ||
            src.startsWith("https://") ||
            src.startsWith("blob:") ||
            src.startsWith("data:")
        ) {
            return src;
        }

        const normalizedSrc = src.startsWith("/") ? src : `/${src}`;

        return apiBaseUrl ? `${apiBaseUrl}${normalizedSrc}` : normalizedSrc;
    };

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
            .then((res) => res.json())
            .then((data) => setProducts(Array.isArray(data) ? data : []))
            .catch((err) => console.error(err));
    }, []);

    return (
        <div className="p-10">
            <h1 className="mb-6 text-2xl font-bold">Products</h1>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                    <div
                        key={product._id}
                        className="overflow-hidden rounded-lg border bg-white p-4 transition duration-300 hover:shadow-xl"
                    >
                        <Link href={`/products/${product._id}`}>
                            <div className="relative mb-4 h-52 w-full overflow-hidden rounded-lg bg-gray-100">
                                <Image
                                    src={getImageSrc(product.images?.[0])}
                                    alt={product.name}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            </div>

                            <h2 className="cursor-pointer font-semibold hover:underline">
                                {product.name}
                            </h2>
                        </Link>

                        <p className="mt-2 text-blue-600">{formatPrice(product.price)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}