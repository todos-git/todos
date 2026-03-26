"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/utils/format";

type OrderItem = {
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    images?: string[];
    deliveryAvailable?: boolean;
    pickupAvailable?: boolean;
    pickupAddress?: string;
    pickupMapLink?: string;
};

type SellerInfo = {
    _id: string;
    storeName?: string;
    email?: string;
};

type BuyerInfo = {
    _id: string;
    email?: string;
    phone?: string;
};

type OrderStatus = "placed" | "delivering" | "ready_for_pickup" | "delivered";

type Order = {
    _id: string;
    buyerId?: BuyerInfo;
    sellerId?: SellerInfo;
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    total: number;
    status: OrderStatus;
    createdAt: string;
};

export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller-orders`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Failed to fetch seller orders");
                }

                setOrders(data);
            } catch (error) {
                console.error("SELLER ORDERS ERROR:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const totalOrders = orders.length;

    const totalRevenue = useMemo(() => {
        return orders.reduce((sum, order) => sum + (order.total || 0), 0);
    }, [orders]);

    const placedCount = useMemo(() => {
        return orders.filter((order) => order.status === "placed").length;
    }, [orders]);

    const deliveringCount = useMemo(() => {
        return orders.filter(
            (order) =>
                order.status === "delivering" || order.status === "ready_for_pickup"
        ).length;
    }, [orders]);

    const getStatusStyle = (status: OrderStatus) => {
        switch (status) {
            case "delivering":
                return "bg-blue-100 text-blue-700";
            case "ready_for_pickup":
                return "bg-purple-100 text-purple-700";
            case "delivered":
                return "bg-green-100 text-green-700";
            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };

    const getStatusLabel = (status: OrderStatus) => {
        switch (status) {
            case "delivering":
                return "Out for delivery";
            case "ready_for_pickup":
                return "Ready for pickup";
            case "delivered":
                return "Delivered";
            default:
                return "Placed";
        }
    };

    const orderHasDelivery = (order: Order) => {
        return order.items.some((item) => item.deliveryAvailable);
    };

    const orderHasOnlyPickup = (order: Order) => {
        return order.items.every(
            (item) => !item.deliveryAvailable && item.pickupAvailable
        );
    };

    const updateStatus = async (orderId: string, status: OrderStatus) => {
        try {
            setUpdatingId(orderId);

            const token = localStorage.getItem("token");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to update status");
                return;
            }

            setOrders((prev) =>
                prev.map((order) =>
                    order._id === orderId ? { ...order, status } : order
                )
            );
        } catch (error) {
            console.error("UPDATE STATUS ERROR:", error);
            alert("Something went wrong");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="p-6 md:p-10 max-w-7xl mx-auto">
                <p>Loading orders...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Seller Orders</h1>
                    <p className="text-gray-500 mt-1">
                        Review new orders, buyer details, and delivery information
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/seller"
                        className="border px-4 py-2 rounded-lg"
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/seller/products"
                        className="border px-4 py-2 rounded-lg"
                    >
                        My Products
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold mt-2">{totalOrders}</p>
                </div>

                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500">New Orders</p>
                    <p className="text-2xl font-bold mt-2">{placedCount}</p>
                </div>

                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Active Delivery/Pickup</p>
                    <p className="text-2xl font-bold mt-2">{deliveringCount}</p>
                </div>

                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold mt-2">{formatPrice(totalRevenue)}</p>
                </div>
            </div>

            <div className="bg-white border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold">Recent Orders</h2>
                    <span className="text-sm text-gray-500">
                        {orders.length} order{orders.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p>No orders yet</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {orders.map((order) => (
                            <div
                                key={order._id}
                                className="border rounded-2xl p-4 md:p-6"
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="text-lg font-bold">
                                                Order #{order._id.slice(-6).toUpperCase()}
                                            </h3>

                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(order.status)}`}
                                            >
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-500">
                                            Buyer:{" "}
                                            <span className="text-black font-medium">
                                                {order.buyerId?.email || "Unknown buyer"}
                                            </span>
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            Phone:{" "}
                                            <span className="text-black font-medium">
                                                {order.buyerId?.phone || "No phone"}
                                            </span>
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            Date:{" "}
                                            <span className="text-black font-medium">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="min-w-[220px] border rounded-xl p-4 bg-gray-50">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span className="font-medium">{formatPrice(order.subtotal)}</span>
                                        </div>

                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-500">Shipping</span>
                                            <span className="font-medium">{formatPrice(order.shipping)}</span>
                                        </div>

                                        <div className="border-t pt-3 mt-3 flex justify-between font-semibold">
                                            <span>Total</span>
                                            <span>{formatPrice(order.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-3">
                                    {order.status === "placed" && orderHasDelivery(order) && (
                                        <button
                                            onClick={() => updateStatus(order._id, "delivering")}
                                            disabled={updatingId === order._id}
                                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                                        >
                                            {updatingId === order._id
                                                ? "Updating..."
                                                : "Mark as Delivering"}
                                        </button>
                                    )}

                                    {order.status === "placed" && orderHasOnlyPickup(order) && (
                                        <button
                                            onClick={() =>
                                                updateStatus(order._id, "ready_for_pickup")
                                            }
                                            disabled={updatingId === order._id}
                                            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                                        >
                                            {updatingId === order._id
                                                ? "Updating..."
                                                : "Ready for Pickup"}
                                        </button>
                                    )}

                                    {(order.status === "delivering" ||
                                        order.status === "ready_for_pickup") && (
                                            <button
                                                onClick={() => updateStatus(order._id, "delivered")}
                                                disabled={updatingId === order._id}
                                                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                                            >
                                                {updatingId === order._id
                                                    ? "Updating..."
                                                    : "Mark as Delivered"}
                                            </button>
                                        )}
                                </div>

                                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {order.items.map((item, index) => (
                                        <div
                                            key={`${order._id}-${index}`}
                                            className="border rounded-xl p-4 flex gap-4"
                                        >
                                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                <Image
                                                    src={
                                                        item.images && item.images.length > 0
                                                            ? `${process.env.NEXT_PUBLIC_API_URL}${item.images[0]}`
                                                            : "/no-image.png"
                                                    }
                                                    alt={item.name}
                                                    width={80}
                                                    height={80}
                                                    unoptimized
                                                    className="w-20 h-20 object-cover"
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-semibold truncate">{item.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    Qty: {item.quantity}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Unit: {formatPrice(item.price)}
                                                </p>
                                                <p className="text-sm font-medium mt-1">
                                                    {formatPrice(item.price * item.quantity)}
                                                </p>

                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {item.deliveryAvailable && (
                                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                            🚚 Delivery
                                                        </span>
                                                    )}

                                                    {item.pickupAvailable && (
                                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                            📍 Pickup
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}