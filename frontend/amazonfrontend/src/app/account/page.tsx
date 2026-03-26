"use client";

export default function AccountPage() {
    return (
        <div className="p-10">

            <h1 className="text-3xl font-bold mb-6">
                My Account
            </h1>

            <div className="grid grid-cols-3 gap-6">

                <div className="border p-6 rounded shadow">
                    <h2 className="font-semibold mb-2">Orders</h2>
                    <p>View your order history</p>
                </div>

                <div className="border p-6 rounded shadow">
                    <h2 className="font-semibold mb-2">Cart</h2>
                    <p>Your saved cart items</p>
                </div>

                <div className="border p-6 rounded shadow">
                    <h2 className="font-semibold mb-2">Search History</h2>
                    <p>Previously searched products</p>
                </div>

            </div>

        </div>
    );
}