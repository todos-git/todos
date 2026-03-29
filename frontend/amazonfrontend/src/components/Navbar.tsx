"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MapPin, Search, ShoppingCart } from "lucide-react";
import { getCart } from "@/utils/cart";
import { getPickupItems } from "@/utils/pickup";

type CategoryItem = {
    label: string;
    value: string;
    icon: string;
};

const categories: CategoryItem[] = [
    { label: "Бүх ангилал", value: "All", icon: "☰" },
    { label: "Эрэгтэй хувцас", value: "Эрэгтэй хувцас", icon: "👔" },
    { label: "Эмэгтэй хувцас", value: "Эмэгтэй хувцас", icon: "👜" },
    { label: "Хүүхдийн бараа", value: "Хүүхдийн бараа", icon: "🍼" },
    { label: "Спорт хувцас", value: "Спорт хувцас", icon: "🏋️" },
    { label: "Аксессуар", value: "Аксессуар", icon: "⌚" },
    { label: "Пүүз", value: "Пүүз", icon: "👟" },
    { label: "Гутал", value: "Гутал", icon: "🥾" },
    { label: "Цүнх", value: "Цүнх", icon: "👜" },
    { label: "Малгай", value: "Малгай", icon: "🧢" },
    { label: "Дотуур хувцас", value: "Дотуур хувцас", icon: "🩳" },
    { label: "Гоо сайхан", value: "Гоо сайхан", icon: "✨" },
    { label: "Арьс арчилгаа", value: "Арьс арчилгаа", icon: "🧴" },
    { label: "Үс арчилгаа", value: "Үс арчилгаа", icon: "💇" },
    { label: "Эрүүл мэнд", value: "Эрүүл мэнд", icon: "💊" },
    { label: "Гэр ахуй", value: "Гэр ахуй", icon: "🏠" },
    { label: "Гал тогоо", value: "Гал тогоо", icon: "🍳" },
    { label: "Цахилгаан бараа", value: "Цахилгаан бараа", icon: "📺" },
    { label: "Гар утас, дагалдах хэрэгсэл", value: "Гар утас, дагалдах хэрэгсэл", icon: "📱" },
    { label: "Авто бараа", value: "Авто бараа", icon: "🚗" },
    { label: "Аялал", value: "Аялал", icon: "✈️" },
    { label: "Оффис, бичиг хэрэг", value: "Оффис, бичиг хэрэг", icon: "📝" },
    { label: "Хүнс", value: "Хүнс", icon: "🍱" },
    { label: "Амьтны хэрэгсэл", value: "Амьтны хэрэгсэл", icon: "🐶" },
    { label: "Бусад", value: "Бусад", icon: "📦" },
];

function NavbarContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isSellerPage = pathname.startsWith("/seller");
    const isAuthPage =
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/register";

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [mobileMenu, setMobileMenu] = useState(false);
    const [sellerMenuOpen, setSellerMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [pickupCount, setPickupCount] = useState(0);
    const [showFilterRow, setShowFilterRow] = useState(true);
    const [sellerOrderCount, setSellerOrderCount] = useState(0);
    const [buyerOrderCount, setBuyerOrderCount] = useState(0);
    const [adminPendingCount, setAdminPendingCount] = useState(0);


    const isBuyer = isLoggedIn && role === "user";
    const showCart = isBuyer;

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            const currentSearch = searchParams.get("search") || "";
            const currentFilter = searchParams.get("filter") || "All";

            setSearch((prev) => (prev === currentSearch ? prev : currentSearch));
            setFilter((prev) => (prev === currentFilter ? prev : currentFilter));
        });

        return () => cancelAnimationFrame(frame);
    }, [searchParams]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            const token = localStorage.getItem("token");
            const savedRole = localStorage.getItem("role");

            setIsLoggedIn((prev) => (prev === !!token ? prev : !!token));
            setRole((prev) => (prev === savedRole ? prev : savedRole));
        });

        return () => cancelAnimationFrame(frame);
    }, [pathname]);

    useEffect(() => {
        const updateCounts = () => {
            const cartItems = getCart();
            const pickupItems = getPickupItems();

            setCartCount(
                Array.isArray(cartItems)
                    ? cartItems.reduce((total, item) => total + item.quantity, 0)
                    : 0
            );

            setPickupCount(
                Array.isArray(pickupItems)
                    ? pickupItems.reduce((total, item) => total + item.quantity, 0)
                    : 0
            );
        };

        const frame = requestAnimationFrame(updateCounts);
        window.addEventListener("cartUpdated", updateCounts);
        window.addEventListener("pickupUpdated", updateCounts);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("cartUpdated", updateCounts);
            window.removeEventListener("pickupUpdated", updateCounts);
        };
    }, [pathname]);

    useEffect(() => {
        const fetchOrderCounts = async () => {
            try {
                const token = localStorage.getItem("token");
                const savedRole = localStorage.getItem("role");

                if (!token) {
                    setSellerOrderCount(0);
                    setBuyerOrderCount(0);
                    return;
                }

                if (savedRole === "seller") {
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller-orders/unread-count`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            cache: "no-store",
                        }
                    );

                    const data = await res.json();
                    setSellerOrderCount(res.ok ? data.count || 0 : 0);
                    setBuyerOrderCount(0);
                    return;
                }

                if (savedRole === "user") {
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/buyer-orders/unread-count`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            cache: "no-store",
                        }
                    );

                    const data = await res.json();
                    setBuyerOrderCount(res.ok ? data.count || 0 : 0);
                    setSellerOrderCount(0);
                    return;
                }

                setSellerOrderCount(0);
                setBuyerOrderCount(0);
            } catch (error) {
                console.error("ORDER COUNT ERROR:", error);
                setSellerOrderCount(0);
                setBuyerOrderCount(0);
            }
        };

        fetchOrderCounts();



        const interval = setInterval(fetchOrderCounts, 5000);

        return () => clearInterval(interval);
    }, [pathname, isLoggedIn, role]);

    useEffect(() => {
        const fetchAdminPendingCount = async () => {
            try {
                const token = localStorage.getItem("token");
                const savedRole = localStorage.getItem("role");

                if (!token || (savedRole !== "admin" && savedRole !== "superadmin")) {
                    setAdminPendingCount(0);
                    return;
                }

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/payments/admin/pending-count`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }
                );

                const data = await res.json();
                setAdminPendingCount(res.ok ? data.count || 0 : 0);
            } catch (error) {
                console.error("ADMIN PENDING COUNT ERROR:", error);
                setAdminPendingCount(0);
            }
        };

        fetchAdminPendingCount();
        const interval = setInterval(fetchAdminPendingCount, 5000);

        return () => clearInterval(interval);
    }, [pathname, isLoggedIn, role]);





    const buildQueryUrl = (searchValue: string, filterValue: string) => {
        const params = new URLSearchParams();

        if (searchValue.trim()) {
            params.set("search", searchValue.trim());
        }

        if (filterValue !== "All") {
            params.set("filter", filterValue);
        }

        const queryString = params.toString();
        return queryString ? `/?${queryString}` : "/";
    };

    useEffect(() => {
        if (isSellerPage || isAuthPage) return;

        const timeout = setTimeout(() => {
            const targetUrl = buildQueryUrl(search, filter);
            const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

            if (pathname === "/" && currentUrl !== targetUrl) {
                router.push(targetUrl);
            } else if (pathname !== "/" && (search.trim() || filter !== "All")) {
                router.push(targetUrl);
            }
        }, 350);

        return () => clearTimeout(timeout);
    }, [search, filter, pathname, router, searchParams, isSellerPage, isAuthPage]);
    useEffect(() => {

        const fetchCounts = async () => {
            try {

                const token = localStorage.getItem("token");
                const role = localStorage.getItem("role");

                if (!token) return;

                if (role === "seller") {

                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller-orders/unread-count`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                    const data = await res.json();
                    setSellerOrderCount(data.count || 0);

                } else {

                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/buyer-orders/unread-count`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                    const data = await res.json();
                    setBuyerOrderCount(data.count || 0);

                }

            } catch (error) {
                console.error(error);
            }
        };

        fetchCounts();

        const interval = setInterval(fetchCounts, 5000);

        return () => clearInterval(interval);

    }, []);

    const activeCategory = useMemo(
        () => categories.find((item) => item.value === filter)?.label || "Бүх ангилал",
        [filter]
    );

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");

        setIsLoggedIn(false);
        setRole(null);
        setCartCount(0);
        setMobileMenu(false);
        setSellerMenuOpen(false);

        router.push("/");
    };

    return (
        <>
            <header
                className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl"
                onMouseEnter={() => {
                    if (!isSellerPage && !isAuthPage) {
                        setShowFilterRow(true);
                    }
                }}
                onMouseLeave={() => {
                    if (!isSellerPage && !isAuthPage) {
                        setShowFilterRow(false);
                    }
                }}
            >
                <div className="mx-auto max-w-[1600px] px-3 md:px-6">
                    <div
                        className={`flex gap-3 py-3 md:py-4 ${isAuthPage ? "items-center justify-center" : "items-center justify-between"
                            }`}
                    >
                        <button
                            onClick={() => {
                                setMobileMenu(false);
                                setSellerMenuOpen(false);

                                if (pathname === "/") {
                                    window.scrollTo({
                                        top: 0,
                                        behavior: "smooth",
                                    });
                                    return;
                                }

                                router.push("/");
                            }}
                            className={`shrink-0 rounded-2xl px-2 py-1 text-left transition hover:bg-slate-50 ${isAuthPage ? "text-center hover:bg-transparent" : ""
                                }`}
                        >
                            <div className="text-[26px] font-black tracking-tight text-slate-900 md:text-[34px]">
                                TODOS
                            </div>
                            <div className="mt-[-4px] text-[11px] font-medium text-slate-500 md:text-xs">
                                Монгол маркетплейс
                            </div>
                        </button>

                        {!isSellerPage && !isAuthPage && (
                            <div className="hidden flex-1 items-center justify-center md:flex">
                                <div className="flex w-full max-w-3xl items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md">
                                    <Search size={20} className="mr-3 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Бүтээгдэхүүн хайх..."
                                        className="w-full bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        )}

                        {!isAuthPage && (
                            <div className="hidden items-center gap-3 md:flex">
                                {!isLoggedIn && (
                                    <>
                                        <button
                                            onClick={() => router.push("/register")}
                                            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            Бүртгүүлэх
                                        </button>

                                        <button
                                            onClick={() => router.push("/login")}
                                            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                        >
                                            Нэвтрэх
                                        </button>
                                    </>
                                )}

                                {showCart && (
                                    <button
                                        onClick={() => router.push("/pickup")}
                                        className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 transition hover:bg-slate-50"
                                    >
                                        <MapPin size={23} />
                                        {pickupCount > 0 && (
                                            <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-violet-600 px-1 text-[11px] font-bold text-white">
                                                {pickupCount}
                                            </span>
                                        )}
                                    </button>
                                )}

                                {showCart && (
                                    <button
                                        onClick={() => router.push("/cart")}
                                        className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 transition hover:bg-slate-50"
                                    >
                                        <ShoppingCart size={23} />
                                        {cartCount > 0 && (
                                            <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                                                {cartCount}
                                            </span>
                                        )}
                                    </button>
                                )}

                                {isLoggedIn && role === "seller" && (
                                    <>
                                        <button
                                            onClick={() => router.push("/seller")}
                                            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                        >
                                            Худалдагчийн хэсэг
                                        </button>

                                        <button
                                            onClick={() => router.push("/seller/orders")}
                                            className="relative rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                                        >
                                            Захиалгууд

                                            {sellerOrderCount > 0 && (
                                                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                                                    {sellerOrderCount}
                                                </span>
                                            )}
                                        </button>
                                    </>
                                )}

                                {isLoggedIn && role === "user" && (
                                    <button
                                        onClick={() => router.push("/orders")}
                                        className="relative rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                                    >
                                        Миний захиалгууд

                                        {buyerOrderCount > 0 && (
                                            <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                                                {buyerOrderCount}
                                            </span>
                                        )}
                                    </button>
                                )}

                                {isLoggedIn && (role === "admin" || role === "superadmin") && (
                                    <button
                                        onClick={() => router.push("/admin/payments")}
                                        className="relative rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                                    >
                                        Админ самбар
                                        {adminPendingCount > 0 && (
                                            <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                                                {adminPendingCount}
                                            </span>
                                        )}
                                    </button>
                                )}

                                {isLoggedIn && (
                                    <button
                                        onClick={handleLogout}
                                        className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                                    >
                                        Гарах
                                    </button>
                                )}
                            </div>
                        )}

                        {!isAuthPage && (
                            <div className="flex items-center gap-2 md:hidden">

                                {showCart && (
                                    <button
                                        onClick={() => router.push("/pickup")}
                                        className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-800 transition hover:bg-slate-50"
                                    >
                                        <MapPin size={21} />
                                        {pickupCount > 0 && (
                                            <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
                                                {pickupCount}
                                            </span>
                                        )}
                                    </button>
                                )}
                                {showCart && (
                                    <button
                                        onClick={() => router.push("/cart")}
                                        className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-800 transition hover:bg-slate-50"
                                    >
                                        <ShoppingCart size={21} />
                                        {cartCount > 0 && (
                                            <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                                {cartCount}
                                            </span>
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        if (isSellerPage) {
                                            setSellerMenuOpen(true);
                                        } else {
                                            setMobileMenu((prev) => !prev);
                                        }
                                    }}
                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-2xl text-slate-800 transition hover:bg-slate-50"
                                >
                                    ☰
                                </button>
                            </div>
                        )}
                    </div>

                    {!isSellerPage && !isAuthPage && (
                        <div
                            className={`hidden overflow-hidden border-t border-slate-100 transition-all duration-200 ease-out md:block ${showFilterRow
                                ? "max-h-24 opacity-100 py-3"
                                : "max-h-0 opacity-0 py-0"
                                }`}
                        >
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                                {categories.map((item) => {
                                    const isActive = filter === item.value;

                                    return (
                                        <button
                                            key={item.value}
                                            onClick={() => setFilter(item.value)}
                                            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition ${isActive
                                                ? "bg-slate-900 text-white shadow-sm"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                }`}
                                        >
                                            <span className="mr-2">{item.icon}</span>
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {mobileMenu && !isSellerPage && !isAuthPage && (
                    <div className="border-t border-slate-100 bg-white px-3 pb-4 pt-3 md:hidden">
                        <div className="mb-3 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <Search size={18} className="mr-3 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Бүтээгдэхүүн хайх..."
                                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                            />
                        </div>

                        <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-none">
                            {categories.map((item) => {
                                const isActive = filter === item.value;

                                return (
                                    <button
                                        key={item.value}
                                        onClick={() => setFilter(item.value)}
                                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${isActive
                                            ? "bg-slate-900 text-white"
                                            : "bg-slate-100 text-slate-700"
                                            }`}
                                    >
                                        <span className="mr-2">{item.icon}</span>
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Одоогийн ангилал
                            </p>
                            <div className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm">
                                {activeCategory}
                            </div>

                            <div className="mt-4 flex flex-col gap-2">
                                {!isLoggedIn && (
                                    <>
                                        <button
                                            onClick={() => {
                                                router.push("/register");
                                                setMobileMenu(false);
                                            }}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800"
                                        >
                                            Бүртгүүлэх
                                        </button>

                                        <button
                                            onClick={() => {
                                                router.push("/login");
                                                setMobileMenu(false);
                                            }}
                                            className="rounded-2xl bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white"
                                        >
                                            Нэвтрэх
                                        </button>
                                    </>
                                )}

                                {isLoggedIn && role === "user" && (
                                    <button
                                        onClick={() => {
                                            router.push("/orders");
                                            setMobileMenu(false);
                                        }}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800"
                                    >
                                        Миний захиалгууд
                                    </button>
                                )}

                                {isLoggedIn && role === "seller" && (
                                    <>
                                        <button
                                            onClick={() => {
                                                router.push("/seller");
                                                setMobileMenu(false);
                                            }}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800"
                                        >
                                            Худалдагчийн хэсэг
                                        </button>

                                        <button
                                            onClick={() => {
                                                router.push("/seller/orders");
                                                setMobileMenu(false);
                                            }}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800"
                                        >
                                            Захиалгууд
                                        </button>
                                    </>
                                )}

                                {isLoggedIn && (role === "admin" || role === "superadmin") && (
                                    <button
                                        onClick={() => {
                                            router.push("/admin/payments");
                                            setMobileMenu(false);
                                        }}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800"
                                    >
                                        Админ самбар
                                    </button>
                                )}

                                {isLoggedIn && (
                                    <button
                                        onClick={handleLogout}
                                        className="rounded-2xl bg-red-500 px-4 py-3 text-left text-sm font-semibold text-white"
                                    >
                                        Гарах
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {sellerMenuOpen && (
                <div className="fixed inset-0 z-[80] md:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSellerMenuOpen(false)}
                    />

                    <aside className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl">
                        <div className="border-b border-slate-200 px-5 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                                        Худалдагч
                                    </p>
                                    <h2 className="mt-2 text-3xl font-black text-slate-900">
                                        Самбарын цэс
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Дэлгүүр, бүтээгдэхүүн, багц, сурталчилгаа, захиалгаа эндээс удирдана.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setSellerMenuOpen(false)}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-2xl text-slate-700"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="px-4 py-5">
                            <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                                <button
                                    onClick={() => {
                                        router.push("/seller");
                                        setSellerMenuOpen(false);
                                    }}
                                    className="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                                >
                                    Хяналтын самбар
                                </button>

                                <button
                                    onClick={() => {
                                        router.push("/seller/orders");
                                        setSellerMenuOpen(false);
                                    }}
                                    className="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                                >
                                    Захиалгууд
                                </button>

                                <button
                                    onClick={() => {
                                        router.push("/seller/products");
                                        setSellerMenuOpen(false);
                                    }}
                                    className="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                                >
                                    Миний бүтээгдэхүүнүүд
                                </button>

                                <button
                                    onClick={() => {
                                        router.push("/seller/add-product");
                                        setSellerMenuOpen(false);
                                    }}
                                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Бүтээгдэхүүн нэмэх
                                </button>

                                <button
                                    onClick={() => {
                                        router.push("/seller/packages");
                                        setSellerMenuOpen(false);
                                    }}
                                    className="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                                >
                                    Багцууд
                                </button>

                                <button
                                    onClick={() => {
                                        router.push("/seller/banner-ads");
                                        setSellerMenuOpen(false);
                                    }}
                                    className="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                                >
                                    Миний баннер зарууд
                                </button>

                                <button
                                    onClick={() => {
                                        router.push("/seller/banner-ads/create");
                                        setSellerMenuOpen(false);
                                    }}
                                    className="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                                >
                                    Баннер зар үүсгэх
                                </button>
                            </div>

                            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm leading-6 text-slate-600">
                                    Худалдагчийн бүх хэрэгслийг нэг цэснээс хурдан ашиглаарай.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}

export default function Navbar() {
    return (
        <Suspense fallback={null}>
            <NavbarContent />
        </Suspense>
    );
}