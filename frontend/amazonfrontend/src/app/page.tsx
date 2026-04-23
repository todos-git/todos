"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import HomeHeroBanner from "@/components/HomeHeroBanner";
import Image from "next/image";

type Seller = {
  _id?: string;
  storeName?: string;
  packageType?: "free" | "basic" | "pro" | "premium";
  isVerified?: boolean;
  sellerRating?: number;
  sellerReviewCount?: number;
};

type Product = {
  _id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  location?: string;
  images?: string[];
  sellerId?: Seller;
  sellerRating?: number;
  sellerReviewCount?: number;
};

type TopSellerItem = {
  _id: string;
  storeName: string;
  packageType: "free" | "basic" | "pro" | "premium";
  isVerified: boolean;
  sellerRating: number;
  sellerReviewCount: number;
  productCount: number;
  topProduct?: Product;
};

const categoryCards = [
  { label: "Эрэгтэй", filter: "Эрэгтэй хувцас", image: "/categories/men.jpg" },
  { label: "Эмэгтэй", filter: "Эмэгтэй хувцас", image: "/categories/women.jpg" },
  { label: "Хүүхдийн", filter: "Хүүхдийн бараа", image: "/categories/kids.jpg" },
  { label: "Спорт", filter: "Спорт хувцас", image: "/categories/sports.jpg" },
  { label: "Пүүз", filter: "Пүүз", image: "/categories/shoes.jpg" },
  { label: "Гутал", filter: "Гутал", image: "/categories/classic.jpg" },
  { label: "Цүнх", filter: "Цүнх", image: "/categories/bags.jpg" },
  { label: "Малгай", filter: "Малгай", image: "/categories/hats.jpg" },
  { label: "Гоо сайхан", filter: "Гоо сайхан", image: "/categories/beauty.jpg" },
  { label: "Арьс арчилгаа", filter: "Арьс арчилгаа", image: "/categories/skincare.jpg" },
  { label: "Үс арчилгаа", filter: "Үс арчилгаа", image: "/categories/haircare.jpg" },
  { label: "Эрүүл мэнд", filter: "Эрүүл мэнд", image: "/categories/health.jpg" },
];

function formatPrice(price?: number) {
  return `₮ ${Number(price || 0).toLocaleString()}`;
}

function getProductImage(src?: string) {
  if (!src) return "/no-image.png";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${process.env.NEXT_PUBLIC_API_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

function HomePageContent() {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "All";
  const isFiltering = search.trim() !== "" || filter !== "All";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const featuredScrollRef = useRef<HTMLDivElement | null>(null);
  const topSellerScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (search.trim()) {
          params.append("search", search);
        }

        if (filter !== "All") {
          params.append("category", filter);
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products?${params.toString()}`,
          { cache: "no-store" }
        );

        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, filter]);

  const featuredProducts = useMemo(() => {
    const premium = products.filter(
      (product) => product.sellerId?.packageType === "premium"
    );

    const pro = products.filter(
      (product) => product.sellerId?.packageType === "pro"
    );

    const basic = products.filter(
      (product) => product.sellerId?.packageType === "basic"
    );

    const free = products.filter(
      (product) =>
        !product.sellerId?.packageType || product.sellerId?.packageType === "free"
    );

    return [...premium, ...pro, ...basic, ...free].slice(0, 18);
  }, [products]);

  const topSellers = useMemo(() => {
    const sellerMap = new Map<string, TopSellerItem>();

    for (const product of products) {
      const seller = product.sellerId;
      if (!seller?._id) continue;

      const existing = sellerMap.get(seller._id);

      const packageType = seller.packageType || "free";
      const sellerRating = product.sellerRating || 0;
      const sellerReviewCount = product.sellerReviewCount || 0;

      if (!existing) {
        sellerMap.set(seller._id, {
          _id: seller._id,
          storeName: seller.storeName || "Дэлгүүр",
          packageType,
          isVerified: !!seller.isVerified,
          sellerRating,
          sellerReviewCount,
          productCount: 1,
          topProduct: product,
        });
      } else {
        existing.productCount += 1;

        if (!existing.topProduct && product) {
          existing.topProduct = product;
        }

        if (sellerRating > existing.sellerRating) {
          existing.sellerRating = sellerRating;
        }

        if (sellerReviewCount > existing.sellerReviewCount) {
          existing.sellerReviewCount = sellerReviewCount;
        }
      }
    }

    const packageScore = (type: TopSellerItem["packageType"]) => {
      switch (type) {
        case "premium":
          return 4;
        case "pro":
          return 3;
        case "basic":
          return 2;
        default:
          return 1;
      }
    };

    return Array.from(sellerMap.values())
      .sort((a, b) => {
        if (packageScore(b.packageType) !== packageScore(a.packageType)) {
          return packageScore(b.packageType) - packageScore(a.packageType);
        }

        if (b.sellerRating !== a.sellerRating) {
          return b.sellerRating - a.sellerRating;
        }

        if (b.sellerReviewCount !== a.sellerReviewCount) {
          return b.sellerReviewCount - a.sellerReviewCount;
        }

        if (Number(b.isVerified) !== Number(a.isVerified)) {
          return Number(b.isVerified) - Number(a.isVerified);
        }

        return b.productCount - a.productCount;
      })
      .slice(0, 10);
  }, [products]);

  const scrollRow = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right"
  ) => {
    if (!ref.current) return;

    ref.current.scrollBy({
      left: direction === "left" ? -760 : 760,
      behavior: "smooth",
    });
  };

  const getSellerPackageLabel = (packageType?: string) => {
    switch (packageType) {
      case "premium":
        return "Премиум";
      case "pro":
        return "Про";
      case "basic":
        return "Энгийн";
      default:
        return "Багц аваагүй";
    }
  };

  function getTopSellerTheme(packageType?: "free" | "basic" | "pro" | "premium") {
    switch (packageType) {
      case "basic":
        return {
          card: "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50 shadow-blue-100/60",
          rank: "text-blue-600",
          packageBadge: "bg-blue-600 text-white",
          statsBox: "bg-white ring-1 ring-blue-100",
          primaryButton: "bg-blue-600 text-white hover:bg-blue-700",
          secondaryButton: "border-blue-200 bg-white text-blue-700 hover:bg-blue-50",
        };
      case "pro":
        return {
          card: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50 shadow-emerald-100/60",
          rank: "text-emerald-600",
          packageBadge: "bg-emerald-600 text-white",
          statsBox: "bg-white ring-1 ring-emerald-100",
          primaryButton: "bg-emerald-600 text-white hover:bg-emerald-700",
          secondaryButton: "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
        };
      case "premium":
        return {
          card: "border-yellow-300 bg-gradient-to-br from-yellow-50 via-amber-50 to-white shadow-yellow-100/70",
          rank: "text-yellow-700",
          packageBadge: "bg-yellow-500 text-white",
          statsBox: "bg-white/90 ring-1 ring-yellow-200",
          primaryButton: "bg-yellow-500 text-white hover:bg-yellow-600",
          secondaryButton: "border-yellow-300 bg-white text-yellow-700 hover:bg-yellow-50",
        };
      default:
        return {
          card: "border-slate-200 bg-slate-50 shadow-slate-100/60",
          rank: "text-slate-400",
          packageBadge: "bg-slate-900 text-white",
          statsBox: "bg-white ring-1 ring-slate-200",
          primaryButton: "bg-slate-900 text-white hover:bg-slate-800",
          secondaryButton: "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
        };
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center text-lg text-slate-600">
        Бүтээгдэхүүнүүдийг ачааллаж байна...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fdf2f8_0%,#f8fafc_38%,#f8f1ff_100%)]">
      {!isFiltering && (
        <section className="mx-auto max-w-[1860px] px-3 pt-4 md:px-6 md:pt-6">
          <HomeHeroBanner />
        </section>
      )}

      {!isFiltering && (
        <section className="mx-auto max-w-[1860px] px-3 pt-8 md:px-6 md:pt-10">
          <div className="rounded-[36px] border border-white/70 bg-white/80 p-5 shadow-[0_25px_80px_rgba(15,23,42,0.06)] backdrop-blur md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 rounded-full bg-red-500" />
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 md:text-[34px]">
                    Ангиллаар дэлгүүр хэсэх
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Сонирхсон төрлөөрөө хялбар сонгоорой
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 md:grid-cols-4 xl:grid-cols-6">
              {categoryCards.map((category) => (
                <Link key={category.filter} href={`/?filter=${encodeURIComponent(category.filter)}`}>
                  <div className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative h-32 w-full overflow-hidden md:h-40">
                      <Image
                        src={category.image}
                        alt={category.label}
                        fill
                        sizes="(max-width: 1280px) 33vw, 240px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
                    </div>
                    <div className="p-4">
                      <p className="text-center text-sm font-bold text-slate-900 md:text-base">
                        {category.label}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {!isFiltering && (
        <section className="mx-auto max-w-[1860px] px-3 pt-8 md:px-6 md:pt-10">
          <div className="rounded-[36px] border border-white/70 bg-white/85 p-5 shadow-[0_25px_80px_rgba(15,23,42,0.06)] backdrop-blur md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 rounded-full bg-red-500" />
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 md:text-[34px]">
                    Онцлох бүтээгдэхүүн
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Премиум худалдагчдын бараа эхэнд харагдана
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <button
                  onClick={() => scrollRow(featuredScrollRef, "left")}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-xl text-white shadow-sm transition hover:bg-red-600"
                >
                  ‹
                </button>
                <button
                  onClick={() => scrollRow(featuredScrollRef, "right")}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-xl text-white shadow-sm transition hover:bg-red-600"
                >
                  ›
                </button>
              </div>
            </div>

            {featuredProducts.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-6 py-12 text-center text-slate-500">
                Одоогоор онцлох бүтээгдэхүүн алга байна.
              </div>
            ) : (
              <div
                ref={featuredScrollRef}
                className="grid grid-flow-col grid-rows-2 auto-cols-[190px] gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:auto-cols-[220px]"
              >
                {featuredProducts.map((product) => (
                  <Link
                    key={product._id}
                    href={`/products/${product._id}`}
                    className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative h-[170px] w-full overflow-hidden bg-slate-50 md:h-[190px]">
                      <Image
                        src={getProductImage(product.images?.[0])}
                        alt={product.name}
                        fill
                        unoptimized
                        sizes="220px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="space-y-2 p-3">
                      <p className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-slate-900">
                        {product.name}
                      </p>

                      <p className="line-clamp-1 text-xs text-slate-500">
                        {product.sellerId?.storeName || "Дэлгүүр"}
                      </p>

                      <p className="text-base font-black text-slate-900">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {!isFiltering && (
        <section className="mx-auto max-w-[1860px] px-3 pt-8 md:px-6 md:pt-10">
          <div className="rounded-[36px] border border-white/70 bg-white p-5 shadow-[0_25px_80px_rgba(15,23,42,0.06)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                  Шилдэг худалдагчид
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Үнэлгээ, баталгаажуулалт, багцаар эрэмбэлэв
                </p>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <button
                  onClick={() => scrollRow(topSellerScrollRef, "left")}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 transition hover:bg-slate-50"
                >
                  ‹
                </button>
                <button
                  onClick={() => scrollRow(topSellerScrollRef, "right")}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 transition hover:bg-slate-50"
                >
                  ›
                </button>
              </div>
            </div>

            {topSellers.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-6 py-12 text-center text-slate-500">
                Одоогоор худалдагчийн мэдээлэл алга байна.
              </div>
            ) : (
              <div
                ref={topSellerScrollRef}
                className="flex gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {topSellers.map((seller, index) => {
                  const theme = getTopSellerTheme(seller.packageType);

                  return (
                    <div
                      key={seller._id}
                      className={`min-w-[280px] max-w-[280px] flex-shrink-0 rounded-[28px] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg md:min-w-[320px] md:max-w-[320px] ${theme.card}`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${theme.rank}`}>
                            #{index + 1} худалдагч
                          </p>
                          <h3 className="mt-2 line-clamp-1 text-xl font-extrabold text-slate-900">
                            {seller.storeName}
                          </h3>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.packageBadge}`}>
                          {getSellerPackageLabel(seller.packageType)}
                        </span>
                      </div>

                      <div className={`space-y-2 rounded-2xl p-4 ${theme.statsBox}`}>
                        <p className="text-sm text-slate-600">
                          Үнэлгээ:{" "}
                          <span className="font-semibold text-slate-900">
                            {seller.sellerRating > 0
                              ? `★ ${seller.sellerRating.toFixed(1)}`
                              : "Одоогоор үнэлгээ байхгүй"}
                          </span>
                        </p>

                        <p className="text-sm text-slate-600">
                          Сэтгэгдэл:{" "}
                          <span className="font-semibold text-slate-900">
                            {seller.sellerReviewCount}
                          </span>
                        </p>

                        <p className="text-sm text-slate-600">
                          Бүтээгдэхүүн:{" "}
                          <span className="font-semibold text-slate-900">
                            {seller.productCount}
                          </span>
                        </p>

                        <p className="text-sm text-slate-600">
                          Баталгаажуулалт:{" "}
                          <span className="font-semibold text-slate-900">
                            {seller.isVerified ? "Тийм" : "Үгүй"}
                          </span>
                        </p>
                      </div>

                      <div className="mt-4 flex gap-3">
                        <Link
                          href={`/store/${seller._id}`}
                          className={`flex-1 rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${theme.primaryButton}`}
                        >
                          Дэлгүүр үзэх
                        </Link>

                        {seller.topProduct && (
                          <Link
                            href={`/products/${seller.topProduct._id}`}
                            className={`flex-1 rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition ${theme.secondaryButton}`}
                          >
                            Бараа үзэх
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1860px] px-3 py-8 md:px-6 md:py-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
              {search
                ? `"${search}" хайлтын үр дүн`
                : filter !== "All"
                  ? `${filter} ангилал`
                  : "Бүх бүтээгдэхүүн"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {search || filter !== "All"
                ? `${products.length} бүтээгдэхүүн олдлоо`
                : "Бүх барааг нэг дороос үзээрэй"}
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[32px] bg-white px-6 py-14 text-center text-slate-500 shadow-sm ring-1 ring-slate-200/70">
            Бүтээгдэхүүн олдсонгүй.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} showSeller />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-6 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1860px] px-3 py-10 md:px-6">
          <div className="flex flex-col gap-8 rounded-[32px] bg-slate-50 p-6 ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <div className="text-3xl font-black tracking-tight text-slate-900">
                TODOS
              </div>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Монгол хэрэглэгчдэд зориулсан маркетплейс.
                Бүтээгдэхүүнээ хялбар хайж, худалдагчийн дэлгүүрүүдийг нэг дороос сонирхоорой.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://www.facebook.com/people/TODOSmn/61578441274586/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Facebook
              </a>

              <a
                href="https://www.instagram.com/todos.mn/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:opacity-90"
              >
                Instagram
              </a>

              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-red-600 px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-red-700"
              >
                YouTube
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}