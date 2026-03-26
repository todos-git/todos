"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/utils/format";

interface Product {
    _id: string;
    name: string;
    price: number;
}


export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-6">Products</h1>

            <div className="grid grid-cols-3 gap-6">
                {products.map(product => (
                    <div
                        key={product._id}
                        className="border rounded-lg p-4 bg-white hover:shadow-xl transition duration-300 cursor-pointer"
                    >
                        <Link href={`/products/${product._id}`}>
                            <h2 className="font-semibold cursor-pointer hover:underline">
                                {product.name}
                            </h2>
                        </Link>


                        <p className="text-blue-600">
                            {formatPrice(product.price)}
                        </p>

                    </div>
                ))}
            </div>
        </div>
    );
}