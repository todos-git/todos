"use client";

import { useEffect, useMemo, useState } from "react";

type PaymentItem = {
    _id: string;
    packageType: "basic" | "pro" | "premium";
    amount: number;
    status:
    | "pending"
    | "pending_approval"
    | "screenshot_requested"
    | "screenshot_uploaded"
    | "approved"
    | "failed"
    | "cancelled";
    paidAt?: string;
    createdAt?: string;
    approvedAt?: string;
    cancelledAt?: string;
    cancelReason?: string;
    screenshotImage?: string;
    userId?: {
        _id?: string;
        email?: string;
        phone?: string;
        storeName?: string;
    };
};

type BannerRequestItem = {
    _id: string;
    title: string;
    subtitle?: string;
    image?: string;
    amount: number;
    durationDays: number;
    status:
    | "pending_payment"
    | "pending_approval"
    | "screenshot_requested"
    | "screenshot_uploaded"
    | "active"
    | "expired"
    | "rejected"
    | "cancelled";
    createdAt?: string;
    paidAt?: string;
    approvedAt?: string;
    cancelledAt?: string;
    cancelReason?: string;
    screenshotImage?: string;
    sellerId?: {
        _id?: string;
        email?: string;
        phone?: string;
        storeName?: string;
    };
};

type AdminBanner = {
    _id: string;
    title: string;
    subtitle?: string;
    image?: string;
    targetLink?: string;
    isActive?: boolean;
    startsAt?: string;
    endsAt?: string;
    createdAt?: string;
};

type Stats = {
    pendingCount: number;
    approvedCount: number;
    cancelledCount: number;
    sellerCount: number;
};

type TabType = "approve" | "approved" | "cancelled" | "banner" | "stats";

function packageLabel(type: string) {
    switch (type) {
        case "basic":
            return "Basic";
        case "pro":
            return "Pro";
        case "premium":
            return "Premium";
        default:
            return type;
    }
}

function getImageSrc(src?: string) {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    return `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

export default function AdminPaymentsPage() {
    const [tab, setTab] = useState<TabType>("approve");

    const [pendingPayments, setPendingPayments] = useState<PaymentItem[]>([]);
    const [approvedPayments, setApprovedPayments] = useState<PaymentItem[]>([]);
    const [cancelledPayments, setCancelledPayments] = useState<PaymentItem[]>([]);

    const [pendingBannerRequests, setPendingBannerRequests] = useState<BannerRequestItem[]>([]);

    const [stats, setStats] = useState<Stats>({
        pendingCount: 0,
        approvedCount: 0,
        cancelledCount: 0,
        sellerCount: 0,
    });

    const [loading, setLoading] = useState(true);

    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [requestingId, setRequestingId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const [bannerApprovingId, setBannerApprovingId] = useState<string | null>(null);
    const [bannerRequestingId, setBannerRequestingId] = useState<string | null>(null);
    const [bannerCancellingId, setBannerCancellingId] = useState<string | null>(null);

    const [seenTabs, setSeenTabs] = useState<Record<string, boolean>>({
        approve: false,
        approved: false,
        cancelled: false,
    });

    const [bannerTitle, setBannerTitle] = useState("");
    const [bannerSubtitle, setBannerSubtitle] = useState("");
    const [bannerTargetLink, setBannerTargetLink] = useState("/seller/banner-ads/create");
    const [bannerImage, setBannerImage] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState("");
    const [bannerSubmitting, setBannerSubmitting] = useState(false);
    const [adminBanners, setAdminBanners] = useState<AdminBanner[]>([]);

    const fetchAll = async () => {
        try {
            const token = localStorage.getItem("token");

            const [
                pendingRes,
                approvedRes,
                cancelledRes,
                statsRes,
                bannerListRes,
                pendingBannerRes,
            ] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/admin/pending`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/admin/approved`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/admin/cancelled`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/admin/list`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/admin/pending`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }),
            ]);

            const pendingData = await pendingRes.json();
            const approvedData = await approvedRes.json();
            const cancelledData = await cancelledRes.json();
            const statsData = await statsRes.json();
            const bannerListData = await bannerListRes.json();
            const pendingBannerData = await pendingBannerRes.json();

            if (!pendingRes.ok) throw new Error(pendingData.message || "Pending авч чадсангүй");
            if (!approvedRes.ok) throw new Error(approvedData.message || "Approved авч чадсангүй");
            if (!cancelledRes.ok) throw new Error(cancelledData.message || "Cancelled авч чадсангүй");
            if (!statsRes.ok) throw new Error(statsData.message || "Stats авч чадсангүй");
            if (!bannerListRes.ok) throw new Error(bannerListData.message || "Banner list авч чадсангүй");
            if (!pendingBannerRes.ok) throw new Error(pendingBannerData.message || "Pending banners авч чадсангүй");

            setPendingPayments(Array.isArray(pendingData) ? pendingData : []);
            setApprovedPayments(Array.isArray(approvedData) ? approvedData : []);
            setCancelledPayments(Array.isArray(cancelledData) ? cancelledData : []);
            setAdminBanners(Array.isArray(bannerListData) ? bannerListData : []);
            setPendingBannerRequests(Array.isArray(pendingBannerData) ? pendingBannerData : []);

            setStats(
                statsData || {
                    pendingCount: 0,
                    approvedCount: 0,
                    cancelledCount: 0,
                    sellerCount: 0,
                }
            );
        } catch (error) {
            console.error("ADMIN FETCH ERROR:", error);
            alert(error instanceof Error ? error.message : "Алдаа гарлаа");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (!bannerImage) {
            setBannerPreview("");
            return;
        }

        const objectUrl = URL.createObjectURL(bannerImage);
        setBannerPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [bannerImage]);

    useEffect(() => {
        if (tab === "approve" || tab === "approved" || tab === "cancelled") {
            setSeenTabs((prev) => ({
                ...prev,
                [tab]: true,
            }));
        }
    }, [tab]);

    const handleApprove = async (paymentId: string) => {
        if (!window.confirm("Энэ төлбөрийг баталгаажуулах уу?")) return;

        try {
            setApprovingId(paymentId);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/payments/${paymentId}/admin-approve`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Approve хийж чадсангүй");
            }

            await fetchAll();

            setSeenTabs((prev) => ({
                ...prev,
                approve: false,
                approved: false,
            }));

            alert("Төлбөр баталгаажлаа");
        } catch (error) {
            console.error("ADMIN APPROVE ERROR:", error);
            alert(error instanceof Error ? error.message : "Approve хийхэд алдаа гарлаа");
        } finally {
            setApprovingId(null);
        }
    };

    const handleRequestScreenshot = async (paymentId: string) => {
        if (!window.confirm("Screenshot нэхэх үү?")) return;

        try {
            setRequestingId(paymentId);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/payments/${paymentId}/request-screenshot`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Screenshot request хийж чадсангүй");
            }

            await fetchAll();

            setSeenTabs((prev) => ({
                ...prev,
                approve: false,
                approved: false,
            }));

            alert("Screenshot хүсэлт илгээгдлээ");
        } catch (error) {
            console.error("REQUEST SCREENSHOT ERROR:", error);
            alert(error instanceof Error ? error.message : "Алдаа гарлаа");
        } finally {
            setRequestingId(null);
        }
    };

    const handleCancel = async (paymentId: string) => {
        const reason = window.prompt("Яагаад цуцалж байгаагаа бичнэ үү:");
        if (reason === null) return;

        try {
            setCancellingId(paymentId);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/payments/${paymentId}/admin-cancel`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Cancel хийж чадсангүй");
            }

            await fetchAll();
            alert("Төлбөр цуцлагдлаа");
        } catch (error) {
            console.error("ADMIN CANCEL ERROR:", error);
            alert(error instanceof Error ? error.message : "Cancel хийхэд алдаа гарлаа");
        } finally {
            setCancellingId(null);
        }
    };

    const handleBannerApprove = async (bannerId: string) => {
        if (!window.confirm("Энэ баннерыг баталгаажуулах уу?")) return;

        try {
            setBannerApprovingId(bannerId);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/admin/${bannerId}/approve`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Banner approve хийж чадсангүй");
            }

            await fetchAll();
            alert("Баннер баталгаажлаа");
        } catch (error) {
            console.error("ADMIN BANNER APPROVE ERROR:", error);
            alert(error instanceof Error ? error.message : "Banner approve хийхэд алдаа гарлаа");
        } finally {
            setBannerApprovingId(null);
        }
    };

    const handleBannerScreenshot = async (bannerId: string) => {
        if (!window.confirm("Banner screenshot нэхэх үү?")) return;

        try {
            setBannerRequestingId(bannerId);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/admin/${bannerId}/request-screenshot`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Banner screenshot request хийж чадсангүй");
            }

            await fetchAll();
            alert("Banner screenshot хүсэлт илгээгдлээ");
        } catch (error) {
            console.error("ADMIN BANNER SCREENSHOT ERROR:", error);
            alert(error instanceof Error ? error.message : "Banner screenshot хүсэлтэд алдаа гарлаа");
        } finally {
            setBannerRequestingId(null);
        }
    };

    const handleBannerCancel = async (bannerId: string) => {
        const reason = window.prompt("Яагаад цуцалж байгаагаа бичнэ үү:");
        if (reason === null) return;

        try {
            setBannerCancellingId(bannerId);

            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/admin/${bannerId}/cancel`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Banner cancel хийж чадсангүй");
            }

            await fetchAll();
            alert("Баннер цуцлагдлаа");
        } catch (error) {
            console.error("ADMIN BANNER CANCEL ERROR:", error);
            alert(error instanceof Error ? error.message : "Banner cancel хийхэд алдаа гарлаа");
        } finally {
            setBannerCancellingId(null);
        }
    };

    const handleCreateAdminBanner = async () => {
        try {
            if (!bannerTitle.trim()) {
                alert("Гарчиг оруулна уу");
                return;
            }

            if (!bannerImage) {
                alert("Баннер зураг оруулна уу");
                return;
            }

            setBannerSubmitting(true);

            const token = localStorage.getItem("token");

            const formData = new FormData();
            formData.append("title", bannerTitle.trim());
            formData.append("subtitle", bannerSubtitle.trim());
            formData.append("targetLink", bannerTargetLink.trim() || "/");
            formData.append("image", bannerImage);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/admin/create`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Admin banner үүсгэж чадсангүй");
            }

            alert("Admin banner амжилттай үүслээ");

            setBannerTitle("");
            setBannerSubtitle("");
            setBannerTargetLink("/seller/banner-ads/create");
            setBannerImage(null);
            setBannerPreview("");

            await fetchAll();
        } catch (error) {
            console.error("ADMIN BANNER CREATE ERROR:", error);
            alert(error instanceof Error ? error.message : "Алдаа гарлаа");
        } finally {
            setBannerSubmitting(false);
        }
    };

    const handleDeleteAdminBanner = async (bannerId: string) => {
        if (!window.confirm("Энэ баннерыг устгах уу?")) return;

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/banner-ads/admin/${bannerId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Banner устгаж чадсангүй");
            }

            await fetchAll();
        } catch (error) {
            console.error("ADMIN BANNER DELETE ERROR:", error);
            alert(error instanceof Error ? error.message : "Устгах үед алдаа гарлаа");
        }
    };

    const sidebarItems = [
        {
            key: "approve",
            label: "Approve",
            count: seenTabs.approve ? 0 : stats.pendingCount + pendingBannerRequests.length,
        },
        {
            key: "approved",
            label: "Approved",
            count: seenTabs.approved ? 0 : stats.approvedCount,
        },
        {
            key: "cancelled",
            label: "Cancel",
            count: seenTabs.cancelled ? 0 : stats.cancelledCount,
        },
        { key: "banner", label: "Banner", count: 0 },
        { key: "stats", label: "Statistic", count: 0 },
    ] as const;

    const statCards = useMemo(
        () => [
            { label: "Хүлээгдэж буй", value: stats.pendingCount, className: "bg-orange-50 text-orange-700" },
            { label: "Баталгаажсан", value: stats.approvedCount, className: "bg-green-50 text-green-700" },
            { label: "Цуцлагдсан", value: stats.cancelledCount, className: "bg-red-50 text-red-700" },
            { label: "Нийт seller", value: stats.sellerCount, className: "bg-blue-50 text-blue-700" },
        ],
        [stats]
    );

    if (loading) {
        return <div className="p-10 text-center">Ачааллаж байна...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="flex">
                <aside className="hidden min-h-screen w-64 flex-col bg-[#07122b] p-6 text-white md:flex">
                    <h2 className="mb-8 text-3xl font-bold">Admin Panel</h2>

                    <nav className="flex flex-col gap-3">
                        {sidebarItems.map((item) => {
                            const active = tab === item.key;

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setTab(item.key)}
                                    className={`flex items-center justify-between rounded-lg px-3 py-3 text-left transition ${active
                                        ? "bg-white font-semibold text-black"
                                        : "hover:bg-white/10"
                                        }`}
                                >
                                    <span>{item.label}</span>
                                    {item.count > 0 && (
                                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                                            {item.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <main className="flex-1 min-w-0 p-4 md:p-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                        <p className="mt-2 text-slate-500">
                            Package approvals, banner approvals, cancelled requests, banner tools, statistics.
                        </p>
                    </div>

                    {tab === "approve" && (
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1.5 rounded-full bg-orange-500" />
                                    <h2 className="text-2xl font-bold text-slate-900">Package Approve Requests</h2>
                                </div>

                                {pendingPayments.length === 0 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                        Хүлээгдэж буй package approve хүсэлт алга байна.
                                    </div>
                                ) : (
                                    pendingPayments.map((payment) => (
                                        <div
                                            key={payment._id}
                                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                        >
                                            <div className="grid gap-4 lg:grid-cols-5">
                                                <div>
                                                    <p className="text-xs text-slate-500">Дэлгүүр</p>
                                                    <p className="font-semibold text-slate-900">
                                                        {payment.userId?.storeName || "-"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">Gmail</p>
                                                    <p className="break-all font-medium text-slate-800">
                                                        {payment.userId?.email || "-"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">Утас</p>
                                                    <p className="font-medium text-slate-800">
                                                        {payment.userId?.phone || "-"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">Багц / Дүн</p>
                                                    <p className="font-semibold text-slate-900">
                                                        {packageLabel(payment.packageType)} / ₮{payment.amount.toLocaleString()}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">Төлөв</p>
                                                    <p className="font-semibold text-orange-700">{payment.status}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="space-y-1 text-sm text-slate-500">
                                                    <p>Үүссэн: {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "-"}</p>
                                                    <p>Би төлсөн: {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "-"}</p>
                                                </div>

                                                {payment.screenshotImage && (
                                                    <a
                                                        href={getImageSrc(payment.screenshotImage)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-sm font-medium text-blue-600 underline"
                                                    >
                                                        Screenshot харах
                                                    </a>
                                                )}

                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApprove(payment._id)}
                                                        disabled={approvingId === payment._id}
                                                        className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
                                                    >
                                                        {approvingId === payment._id ? "Approving..." : "Approve"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRequestScreenshot(payment._id)}
                                                        disabled={requestingId === payment._id}
                                                        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 disabled:opacity-50"
                                                    >
                                                        {requestingId === payment._id ? "Requesting..." : "Screenshot"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancel(payment._id)}
                                                        disabled={cancellingId === payment._id}
                                                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700 disabled:opacity-50"
                                                    >
                                                        {cancellingId === payment._id ? "Cancelling..." : "Cancel"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1.5 rounded-full bg-violet-500" />
                                    <h2 className="text-2xl font-bold text-slate-900">Banner Approve Requests</h2>
                                </div>

                                {pendingBannerRequests.length === 0 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                        Хүлээгдэж буй banner approve хүсэлт алга байна.
                                    </div>
                                ) : (
                                    pendingBannerRequests.map((banner) => (
                                        <div
                                            key={banner._id}
                                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                        >
                                            <div className="grid gap-4 lg:grid-cols-5">
                                                <div>
                                                    <p className="text-xs text-slate-500">Баннер</p>
                                                    <p className="font-semibold text-slate-900">
                                                        {banner.title || "-"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">Gmail</p>
                                                    <p className="break-all font-medium text-slate-800">
                                                        {banner.sellerId?.email || "-"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">Утас</p>
                                                    <p className="font-medium text-slate-800">
                                                        {banner.sellerId?.phone || "-"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">Хугацаа / Дүн</p>
                                                    <p className="font-semibold text-slate-900">
                                                        {banner.durationDays} хоног / ₮{banner.amount.toLocaleString()}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-slate-500">Төлөв</p>
                                                    <p className="font-semibold text-violet-700">{banner.status}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="space-y-1 text-sm text-slate-500">
                                                    <p>Үүссэн: {banner.createdAt ? new Date(banner.createdAt).toLocaleString() : "-"}</p>
                                                    <p>Би төлсөн: {banner.paidAt ? new Date(banner.paidAt).toLocaleString() : "-"}</p>
                                                    <p>Дэлгүүр: {banner.sellerId?.storeName || "-"}</p>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    {banner.image && (
                                                        <a
                                                            href={getImageSrc(banner.image)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-sm font-medium text-slate-700 underline"
                                                        >
                                                            Banner харах
                                                        </a>
                                                    )}

                                                    {banner.screenshotImage && (
                                                        <a
                                                            href={getImageSrc(banner.screenshotImage)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-sm font-medium text-blue-600 underline"
                                                        >
                                                            Screenshot харах
                                                        </a>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleBannerApprove(banner._id)}
                                                        disabled={bannerApprovingId === banner._id}
                                                        className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
                                                    >
                                                        {bannerApprovingId === banner._id ? "Approving..." : "Approve"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleBannerScreenshot(banner._id)}
                                                        disabled={bannerRequestingId === banner._id}
                                                        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 disabled:opacity-50"
                                                    >
                                                        {bannerRequestingId === banner._id ? "Requesting..." : "Screenshot"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleBannerCancel(banner._id)}
                                                        disabled={bannerCancellingId === banner._id}
                                                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700 disabled:opacity-50"
                                                    >
                                                        {bannerCancellingId === banner._id ? "Cancelling..." : "Cancel"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "approved" && (
                        <div className="space-y-4">
                            {approvedPayments.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    Баталгаажсан төлбөр алга байна.
                                </div>
                            ) : (
                                approvedPayments.map((payment) => (
                                    <div
                                        key={payment._id}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                    >
                                        <div className="grid gap-4 lg:grid-cols-5">
                                            <div>
                                                <p className="text-xs text-slate-500">Дэлгүүр</p>
                                                <p className="font-semibold text-slate-900">{payment.userId?.storeName || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Gmail</p>
                                                <p className="break-all font-medium text-slate-800">{payment.userId?.email || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Утас</p>
                                                <p className="font-medium text-slate-800">{payment.userId?.phone || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Багц / Дүн</p>
                                                <p className="font-semibold text-slate-900">
                                                    {packageLabel(payment.packageType)} / ₮{payment.amount.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Баталгаажсан огноо</p>
                                                <p className="font-medium text-green-700">
                                                    {payment.approvedAt ? new Date(payment.approvedAt).toLocaleString() : "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {tab === "cancelled" && (
                        <div className="space-y-4">
                            {cancelledPayments.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    Цуцлагдсан хүсэлт алга байна.
                                </div>
                            ) : (
                                cancelledPayments.map((payment) => (
                                    <div
                                        key={payment._id}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                    >
                                        <div className="grid gap-4 lg:grid-cols-5">
                                            <div>
                                                <p className="text-xs text-slate-500">Дэлгүүр</p>
                                                <p className="font-semibold text-slate-900">{payment.userId?.storeName || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Gmail</p>
                                                <p className="break-all font-medium text-slate-800">{payment.userId?.email || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Утас</p>
                                                <p className="font-medium text-slate-800">{payment.userId?.phone || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Багц / Дүн</p>
                                                <p className="font-semibold text-slate-900">
                                                    {packageLabel(payment.packageType)} / ₮{payment.amount.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Цуцалсан огноо</p>
                                                <p className="font-medium text-red-700">
                                                    {payment.cancelledAt ? new Date(payment.cancelledAt).toLocaleString() : "-"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                            Шалтгаан: {payment.cancelReason || "No reason"}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {tab === "banner" && (
                        <div className="grid gap-6 xl:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-2xl font-bold text-slate-900">Admin Banner</h2>
                                <p className="mt-2 text-slate-500">
                                    Нүүр хуудсанд харагдах promotional banner-аа эндээс үнэгүй үүсгэнэ.
                                </p>

                                <div className="mt-6 space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Гарчиг
                                        </label>
                                        <input
                                            value={bannerTitle}
                                            onChange={(e) => setBannerTitle(e.target.value)}
                                            placeholder="Жишээ: Та энд бараа бүтээгдэхүүн сурталчлах боломжтой"
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Тайлбар
                                        </label>
                                        <input
                                            value={bannerSubtitle}
                                            onChange={(e) => setBannerSubtitle(e.target.value)}
                                            placeholder="Жишээ: Өөрийн дэлгүүрээ илүү олон хүнд хүргээрэй"
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Чиглүүлэх link
                                        </label>
                                        <input
                                            value={bannerTargetLink}
                                            onChange={(e) => setBannerTargetLink(e.target.value)}
                                            placeholder="/seller/banner-ads/create"
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Зураг
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setBannerImage(e.target.files?.[0] || null)}
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCreateAdminBanner}
                                        disabled={bannerSubmitting}
                                        className="w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {bannerSubmitting ? "Үүсгэж байна..." : "Admin Banner Үүсгэх"}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="text-2xl font-bold text-slate-900">Live Preview</h2>
                                    <p className="mt-2 text-slate-500">
                                        Нүүр хуудсанд харагдах урьдчилсан дүрслэл
                                    </p>

                                    <div className="relative mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-slate-100 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
                                        {bannerPreview ? (
                                            <div
                                                className="absolute inset-0 bg-cover bg-center"
                                                style={{ backgroundImage: `url(${bannerPreview})` }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#eef2f7_100%)]" />
                                        )}

                                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.85)_24%,rgba(255,255,255,0.50)_42%,rgba(255,255,255,0.10)_62%,rgba(255,255,255,0)_100%)]" />

                                        <div className="relative z-10 flex min-h-[320px] items-center px-6 py-8 md:min-h-[420px] md:px-12">
                                            <div className="max-w-[460px]">
                                                <div className="inline-flex rounded-full border border-slate-300 bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm backdrop-blur">
                                                    TODOS PROMO
                                                </div>

                                                <h3 className="mt-5 text-3xl font-black leading-[0.94] tracking-[-0.03em] text-slate-900 md:text-5xl">
                                                    {bannerTitle.trim() || "Та энд бараа бүтээгдэхүүн сурталчлах боломжтой"}
                                                </h3>

                                                <p className="mt-4 max-w-md text-sm leading-6 text-slate-700 md:text-lg">
                                                    {bannerSubtitle.trim() || "Өөрийн дэлгүүрээ илүү олон худалдан авагчид хүргээрэй."}
                                                </p>

                                                <div className="mt-7">
                                                    <button
                                                        type="button"
                                                        className="inline-flex min-w-[165px] items-center justify-center rounded-2xl bg-slate-900 px-6 py-3.5 text-base font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]"
                                                    >
                                                        Дэлгэрэнгүй
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h3 className="text-xl font-bold text-slate-900">Үүсгэсэн banner-ууд</h3>

                                    <div className="mt-4 space-y-3">
                                        {adminBanners.length === 0 ? (
                                            <p className="text-slate-500">Одоогоор admin banner алга байна.</p>
                                        ) : (
                                            adminBanners.map((banner) => (
                                                <div
                                                    key={banner._id}
                                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{banner.title}</p>
                                                        <p className="text-sm text-slate-500">{banner.targetLink || "/"}</p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAdminBanner(banner._id)}
                                                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
                                                    >
                                                        Устгах
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "stats" && (
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {statCards.map((item) => (
                                    <div
                                        key={item.label}
                                        className={`rounded-2xl p-5 shadow-sm ${item.className}`}
                                    >
                                        <p className="text-sm opacity-80">{item.label}</p>
                                        <p className="mt-2 text-3xl font-black">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-xl font-bold text-slate-900">Төлбөрийн байдал</h3>

                                <div className="mt-6 space-y-5">
                                    <div>
                                        <div className="mb-2 flex items-center justify-between text-sm">
                                            <span className="text-slate-600">Approved</span>
                                            <span className="font-semibold text-slate-900">{stats.approvedCount}</span>
                                        </div>
                                        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-green-500"
                                                style={{
                                                    width: `${Math.min(
                                                        (stats.approvedCount / Math.max(stats.sellerCount || 1, 1)) * 100,
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between text-sm">
                                            <span className="text-slate-600">Pending</span>
                                            <span className="font-semibold text-slate-900">{stats.pendingCount}</span>
                                        </div>
                                        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-orange-500"
                                                style={{
                                                    width: `${Math.min(
                                                        (stats.pendingCount / Math.max(stats.sellerCount || 1, 1)) * 100,
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between text-sm">
                                            <span className="text-slate-600">Cancelled</span>
                                            <span className="font-semibold text-slate-900">{stats.cancelledCount}</span>
                                        </div>
                                        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-red-500"
                                                style={{
                                                    width: `${Math.min(
                                                        (stats.cancelledCount / Math.max(stats.sellerCount || 1, 1)) * 100,
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}