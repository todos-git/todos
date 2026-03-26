"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function SellerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const navItems = [
        { href: "/seller", label: "Үндсэн" },
        { href: "/seller/products", label: "Миний бүтээгдэхүүн" },
        { href: "/seller/add-product", label: "Бүтээгдэхүүн нэмэх" },
        { href: "/seller/packages", label: "Багц" },
        { href: "/seller/banner-ads", label: "Миний баннер" },
        { href: "/seller/banner-ads/create", label: "Шинэ баннер нэмэх" },
    ];

    return (
        <div className="min-h-screen bg-gray-100">


            <div className="flex">
                {/* Desktop sidebar */}
                <aside className="hidden md:flex md:w-64 min-h-screen bg-[#07122b] text-white flex-col p-6">
                    <h2 className="text-3xl font-bold mb-8">Seller Panel</h2>

                    <nav className="flex flex-col gap-4">
                        {navItems.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`rounded-lg px-3 py-2 transition ${active
                                        ? "bg-white text-black font-semibold"
                                        : "hover:bg-white/10"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Mobile overlay */}
                {open && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        <div
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setOpen(false)}
                        />

                        <aside className="absolute left-0 top-0 h-full w-72 bg-[#07122b] text-white p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold">Seller Panel</h2>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="text-3xl"
                                >
                                    ×
                                </button>
                            </div>

                            <nav className="flex flex-col gap-4">
                                {navItems.map((item) => {
                                    const active = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            className={`rounded-lg px-3 py-2 transition ${active
                                                ? "bg-white text-black font-semibold"
                                                : "hover:bg-white/10"
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </aside>
                    </div>
                )}

                {/* Main content */}
                <main className="flex-1 min-w-0 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}