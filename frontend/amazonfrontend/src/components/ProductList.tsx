"use client";

export default function ProductList() {
    const products = [
        { id: 1, name: "Nike Air", price: 120 },
        { id: 2, name: "Nike Jordan-1", price: 150 },
        { id: 3, name: "Basketball Ball", price: 90 },
    ];

    return (
        <div className="grid grid-cols-3 gap-6 p-8">
            {products.map((p) => (
                <div key={p.id} className="border p-4 rounded shadow">
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="text-blue-600">${p.price}</p>
                </div>
            ))}
        </div>
    );
}