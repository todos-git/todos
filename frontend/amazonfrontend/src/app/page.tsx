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

function HomePageContent() {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "All";
  const isFiltering = search.trim() !== "" || filter !== "All";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const featuredScrollRef = useRef<HTMLDivElement | null>(null);
  const topSellerScrollRef = useRef<HTMLDivElement | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);

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
          `${process.env.NEXT_PUBLIC_API_URL}/api/products?${params.toString()}`
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

    return [...premium, ...pro, ...basic, ...free].slice(0, 12);
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
      left: direction === "left" ? -360 : 360,
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
    <div className="min-h-screen bg-[#f7f2fb]">
      {!isFiltering && (
        <section className="mx-auto max-w-[1700px] px-4 pt-5 md:px-6 md:pt-6">
          <div className="overflow-hidden rounded-[36px] shadow-sm">
            <HomeHeroBanner />
          </div>
        </section>
      )}

      {!isFiltering && (
        <section className="mx-auto max-w-[1600px] px-4 pt-8 md:px-6 md:pt-10">
          <div className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-slate-200/70 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                  Онцлох бүтээгдэхүүнүүд
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Премиум худалдагчдын бүтээгдэхүүн эхэнд харагдана
                </p>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <button
                  onClick={() => scrollRow(featuredScrollRef, "left")}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 transition hover:bg-slate-50"
                >
                  ‹
                </button>
                <button
                  onClick={() => scrollRow(featuredScrollRef, "right")}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 transition hover:bg-slate-50"
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
                className="flex gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {featuredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="min-w-[280px] max-w-[280px] flex-shrink-0 md:min-w-[320px] md:max-w-[320px]"
                  >
                    <ProductCard product={product} showSeller featured />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {!isFiltering && (
        <section className="mx-auto max-w-[1600px] px-4 pt-8 md:px-6 md:pt-10">
          <div className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-slate-200/70 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                  Ангиллаар дэлгүүр хэсэх
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Ангиллаар бараагаа хялбар олоорой
                </p>
              </div>

              <div className="hidden shrink-0 items-center gap-2 md:flex">
                <button
                  onClick={() => scrollRow(categoryScrollRef, "left")}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 transition hover:bg-slate-50"
                >
                  ‹
                </button>

                <button
                  onClick={() => scrollRow(categoryScrollRef, "right")}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 transition hover:bg-slate-50"
                >
                  ›
                </button>
              </div>
            </div>

            <div
              ref={categoryScrollRef}
              className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <Link href="/?filter=Эрэгтэй хувцас">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/men.jpg"
                      alt="Эрэгтэй"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Эрэгтэй</div>
                </div>
              </Link>

              <Link href="/?filter=Эмэгтэй хувцас">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/women.jpg"
                      alt="Эмэгтэй"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Эмэгтэй</div>
                </div>
              </Link>

              <Link href="/?filter=Хүүхдийн бараа">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/kids.jpg"
                      alt="Хүүхдийн бараа"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Хүүхдийн</div>
                </div>
              </Link>

              <Link href="/?filter=Спорт хувцас">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/sports.jpg"
                      alt="Спорт хувцас"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Спорт хувцас</div>
                </div>
              </Link>

              <Link href="/?filter=Пүүз">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/shoes.jpg"
                      alt="Пүүз"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Пүүз</div>
                </div>
              </Link>

              <Link href="/?filter=Гутал">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/classic.jpg"
                      alt="Гутал"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Гутал</div>
                </div>
              </Link>

              <Link href="/?filter=Цүнх">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/bags.jpg"
                      alt="Цүнх"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Цүнх</div>
                </div>
              </Link>

              <Link href="/?filter=Малгай">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/hats.jpg"
                      alt="Малгай"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Малгай</div>
                </div>
              </Link>

              <Link href="/?filter=Дотуур хувцас">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/underwear.jpg"
                      alt="Дотуур хувцас"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Дотуур хувцас</div>
                </div>
              </Link>

              <Link href="/?filter=Гоо сайхан">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/beauty.jpg"
                      alt="Гоо сайхан"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Гоо сайхан</div>
                </div>
              </Link>

              <Link href="/?filter=Арьс арчилгаа">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/skincare.jpg"
                      alt="Арьс арчилгаа"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Арьс арчилгаа</div>
                </div>
              </Link>

              <Link href="/?filter=Үс арчилгаа">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/haircare.jpg"
                      alt="Үс арчилгаа"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Үс арчилгаа</div>
                </div>
              </Link>

              <Link href="/?filter=Эрүүл мэнд">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/health.jpg"
                      alt="Эрүүл мэнд"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Эрүүл мэнд</div>
                </div>
              </Link>

              <Link href="/?filter=Гэр ахуй">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/home.jpg"
                      alt="Гэр ахуй"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Гэр ахуй</div>
                </div>
              </Link>

              <Link href="/?filter=Гал тогоо">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/kitchen.jpg"
                      alt="Гал тогоо"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Гал тогоо</div>
                </div>
              </Link>

              <Link href="/?filter=Цахилгаан бараа">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/electronics.jpg"
                      alt="Цахилгаан бараа"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Цахилгаан бараа</div>
                </div>
              </Link>

              <Link href="/?filter=Гар утас, дагалдах хэрэгсэл">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/mobile.jpg"
                      alt="Гар утас, дагалдах хэрэгсэл"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Гар утас, дагалдах хэрэгсэл</div>
                </div>
              </Link>

              <Link href="/?filter=Авто бараа">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/cars.jpg"
                      alt="Авто бараа"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Авто бараа</div>
                </div>
              </Link>

              <Link href="/?filter=Аялал">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/travel.jpg"
                      alt="Аялал"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Аялал</div>
                </div>
              </Link>

              <Link href="/?filter=Оффис, бичиг хэрэг">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/office.jpg"
                      alt="Оффис, бичиг хэрэг"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Оффис, бичиг хэрэг</div>
                </div>
              </Link>

              <Link href="/?filter=Амьтны хэрэгсэл">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/pet.jpg"
                      alt="Амьтны хэрэгсэл"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Амьтны хэрэгсэл</div>
                </div>
              </Link>

              <Link href="/?filter=Бусад">
                <div className="min-w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition hover:shadow-md cursor-pointer">
                  <div className="relative h-32 w-full">
                    <Image
                      src="/categories/others.jpg"
                      alt="Бусад"
                      fill
                      sizes="(max-width: 768px) 40vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 text-center font-semibold">Бусад</div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}




      {!isFiltering && (
        <section className="mx-auto max-w-[1600px] px-4 pt-8 md:px-6 md:pt-10">
          <div className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-slate-200/70 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                  Шилдэг худалдагчид
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Үнэлгээ, баталгаажуулалт, багц болон бүтээгдэхүүний идэвхээр эрэмбэлэв
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

      <section className="mx-auto max-w-[1600px] px-4 py-8 md:px-6 md:py-10">
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
        <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-6">
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