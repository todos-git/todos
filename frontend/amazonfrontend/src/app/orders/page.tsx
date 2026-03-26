"use client";

import { useEffect, useState } from "react";
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
    sameDayDelivery?: boolean;
    deliveryCutoffTime?: string;

    pickupAvailable?: boolean;
    pickupAddress?: string;
    pickupMapLink?: string;
};

type SellerInfo = {
    _id: string;
    storeName?: string;
    email?: string;
};

type OrderStatus =
    | "placed"
    | "delivering"
    | "ready_for_pickup"
    | "delivered"
    | "completed";

type Order = {
    _id: string;
    sellerId?: SellerInfo;
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    total: number;
    status: OrderStatus;
    createdAt: string;
    isRated?: boolean;
    rating?: number;
    review?: string;
};

export default function BuyerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    const [ratingOpen, setRatingOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [ratingValue, setRatingValue] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [submittingRating, setSubmittingRating] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/my-orders`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Failed to fetch orders");
                }

                setOrders(data);
            } catch (error) {
                console.error("BUYER ORDERS ERROR:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    useEffect(() => {
        const markSeen = async () => {
            try {
                const token = localStorage.getItem("token");

                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/orders/buyer-orders/mark-seen`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } catch (err) {
                console.error(err);
            }
        };

        markSeen();
    }, []);

    const confirmReceived = async (orderId: string) => {
        try {
            setConfirmingId(orderId);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/confirm`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to confirm order");
                return;
            }

            setOrders((prev) =>
                prev.map((order) =>
                    order._id === orderId
                        ? { ...order, status: "delivered" }
                        : order
                )
            );

            alert(data.message || "Order confirmed successfully");

            setSelectedOrderId(orderId);
            setRatingValue(5);
            setReviewText("");
            setRatingOpen(true);
        } catch (error) {
            console.error("CONFIRM ORDER ERROR:", error);
            alert("Something went wrong");
        } finally {
            setConfirmingId(null);
        }
    };

    const submitRating = async () => {
        if (!selectedOrderId) return;

        try {
            setSubmittingRating(true);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${selectedOrderId}/rate`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        rating: ratingValue,
                        review: reviewText,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to submit rating");
                return;
            }

            setOrders((prev) =>
                prev.map((order) =>
                    order._id === selectedOrderId
                        ? {
                            ...order,
                            isRated: true,
                            rating: ratingValue,
                            review: reviewText,
                        }
                        : order
                )
            );

            alert(data.message || "Rating submitted successfully");
            setRatingOpen(false);
            setSelectedOrderId(null);
            setReviewText("");
            setRatingValue(5);
        } catch (error) {
            console.error("RATING ERROR:", error);
            alert("Something went wrong");
        } finally {
            setSubmittingRating(false);
        }
    };

    const getStatusStyle = (status: OrderStatus) => {
        switch (status) {
            case "delivering":
                return "bg-blue-100 text-blue-700";
            case "ready_for_pickup":
                return "bg-purple-100 text-purple-700";
            case "delivered":
                return "bg-green-100 text-green-700";
            case "completed":
                return "bg-emerald-100 text-emerald-700";
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
            case "completed":
                return "Completed";
            default:
                return "Placed";
        }
    };

    const getHelperText = (order: Order) => {
        switch (order.status) {
            case "delivering": {
                const hasSameDay = order.items.some((item) => item.sameDayDelivery);
                if (hasSameDay) {
                    return "Arriving today or tomorrow depending on seller dispatch";
                }
                return "Arriving tomorrow";
            }

            case "ready_for_pickup":
                return "Ready for pickup from seller";

            case "delivered":
                return "Please confirm after you receive your order";

            case "completed":
                return order.isRated
                    ? "Thank you for confirming and rating this order"
                    : "Order completed successfully";

            default:
                return "Seller is preparing your order";
        }
    };

    const getItemDeliveryInfoText = (item: OrderItem) => {
        if (item.deliveryAvailable) {
            if (item.sameDayDelivery) {
                return `Same day delivery before ${item.deliveryCutoffTime || "16:00"}`;
            }

            return "Delivery starts tomorrow";
        }

        if (item.pickupAvailable) {
            return "Pickup available";
        }

        return "Delivery information unavailable";
    };

    const renderStars = (value: number, clickable = false, onPick?: (v: number) => void) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={!clickable}
                        onClick={() => onPick?.(star)}
                        className={`${clickable ? "cursor-pointer" : "cursor-default"} text-2xl`}
                    >
                        {star <= value ? "★" : "☆"}
                    </button>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-6 md:p-10 max-w-7xl mx-auto">
                <p>Loading orders...</p>
            </div>
        );
    }

    return (
        <>
            <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">My Orders</h1>
                        <p className="text-gray-500 mt-1">
                            Track your orders, delivery updates, and pickup details
                        </p>
                    </div>

                    <Link
                        href="/cart"
                        className="border px-4 py-2 rounded-lg w-fit"
                    >
                        Back to Cart
                    </Link>
                </div>

                <div className="bg-white border rounded-2xl p-6 shadow-sm">
                    {orders.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <p>No orders yet</p>
                            <Link
                                href="/"
                                className="inline-block mt-4 bg-black text-white px-4 py-2 rounded-lg"
                            >
                                Start shopping
                            </Link>
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
                                                <h2 className="text-lg font-bold">
                                                    Order #{order._id.slice(-6).toUpperCase()}
                                                </h2>

                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(order.status)}`}
                                                >
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-500">
                                                Seller:{" "}
                                                <span className="text-black font-medium">
                                                    {order.sellerId?.storeName ||
                                                        order.sellerId?.email ||
                                                        "Unknown seller"}
                                                </span>
                                            </p>

                                            <p className="text-sm text-gray-500">
                                                Date:{" "}
                                                <span className="text-black font-medium">
                                                    {new Date(order.createdAt).toLocaleString()}
                                                </span>
                                            </p>

                                            <p className="text-sm font-medium text-blue-600">
                                                {getHelperText(order)}
                                            </p>

                                            {order.status === "delivered" && (
                                                <button
                                                    onClick={() => confirmReceived(order._id)}
                                                    disabled={confirmingId === order._id}
                                                    className="mt-3 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                                                >
                                                    {confirmingId === order._id
                                                        ? "Confirming..."
                                                        : "Confirm Received"}
                                                </button>
                                            )}

                                            {order.status === "completed" && order.isRated && (
                                                <div className="mt-3 rounded-xl border bg-gray-50 p-3">
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        Your Rating
                                                    </p>
                                                    <div className="mt-1">
                                                        {renderStars(order.rating || 0)}
                                                    </div>
                                                    {order.review && (
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            {order.review}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {order.status === "completed" && !order.isRated && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrderId(order._id);
                                                        setRatingValue(5);
                                                        setReviewText("");
                                                        setRatingOpen(true);
                                                    }}
                                                    className="mt-3 px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
                                                >
                                                    Rate Seller
                                                </button>
                                            )}
                                        </div>

                                        <div className="min-w-[220px] border rounded-xl p-4 bg-gray-50">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-500">Subtotal</span>
                                                <span className="font-medium">
                                                    {formatPrice(order.subtotal)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-500">Shipping</span>
                                                <span className="font-medium">
                                                    {formatPrice(order.shipping)}
                                                </span>
                                            </div>

                                            <div className="border-t pt-3 mt-3 flex justify-between font-semibold">
                                                <span>Total</span>
                                                <span>{formatPrice(order.total)}</span>
                                            </div>
                                        </div>
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
                                                    <p className="font-semibold truncate">
                                                        {item.name}
                                                    </p>

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

                                                    <p className="text-xs text-blue-600 mt-2 font-medium">
                                                        {getItemDeliveryInfoText(item)}
                                                    </p>

                                                    {item.pickupAvailable && item.pickupAddress && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {item.pickupAddress}
                                                        </p>
                                                    )}

                                                    {item.pickupAvailable && item.pickupMapLink && (
                                                        <a
                                                            href={item.pickupMapLink}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-blue-600 underline mt-1 inline-block"
                                                        >
                                                            Open pickup location
                                                        </a>
                                                    )}
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

            {ratingOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => {
                            if (!submittingRating) {
                                setRatingOpen(false);
                                setSelectedOrderId(null);
                            }
                        }}
                    />

                    <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-2">Rate this seller</h2>
                        <p className="text-sm text-gray-500 mb-5">
                            Give your rating and optional review. You will get +2 points.
                        </p>

                        <div className="mb-5">
                            {renderStars(ratingValue, true, setRatingValue)}
                        </div>

                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={4}
                            placeholder="Write your review (optional)"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none"
                        />

                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={submitRating}
                                disabled={submittingRating}
                                className="flex-1 rounded-xl bg-black py-3 text-white hover:opacity-90 disabled:opacity-60"
                            >
                                {submittingRating ? "Submitting..." : "Submit Rating"}
                            </button>

                            <button
                                onClick={() => {
                                    if (!submittingRating) {
                                        setRatingOpen(false);
                                        setSelectedOrderId(null);
                                    }
                                }}
                                className="flex-1 rounded-xl border py-3"
                                disabled={submittingRating}
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}