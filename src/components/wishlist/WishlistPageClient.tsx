"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ProductCardCartControl from "@/components/ProductCardCartControl";
import SiteShell from "@/components/SiteShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProductsStore } from "@/components/productsStore";
import { useWishlistStore } from "@/components/wishlistStore";
import { formatCurrency } from "@/lib/formatCurrency";
import { getProductHref } from "@/lib/productUrls";
import SpinnerLoader from "../loader/spinner";

function formatWishlistHighlights(product: {
  variety?: string | null;
  containerSize?: string | null;
  height?: string | null;
}) {
  return [product.variety, product.containerSize, product.height]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function getWishlistDeliveryLabel() {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(deliveryDate);
}

export default function WishlistPageClient() {
  const router = useRouter();
  const { isAuthenticated, isReady: isAuthReady } = useAuth();
  const {
    items: wishlistItems,
    clearItems,
    isLoading,
    isReady,
    removeItem,
  } = useWishlistStore();
  const {
    isLoading: isProductsLoading,
    isReady: areProductsReady,
    products: allProducts,
  } = useProductsStore();
  const products = wishlistItems.flatMap((productId) => {
    const product = allProducts.find((entry) => entry.id === productId);
    return product ? [product] : [];
  });
  const deliveryLabel = getWishlistDeliveryLabel();

  if (isAuthReady && !isAuthenticated) {
    return (
      <SiteShell hideMobileHeader>
        <section className="px-4 py-8 md:px-6 md:py-12 min-h-screen flex items-center">
          <div className="mx-auto max-w-3xl p-8 text-center md:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-700  ">
              <Trash2 size={28} />
            </div>
            <h2 className="mt-6 text-2xl md:text-3xl text-gray-800">
              Sign in to view your wishlist
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth?next=/wishlist"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#207958] px-6 py-4 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(36,54,27,0.18)] transition hover:bg-[linear-gradient(135deg,#1d2e16_0%,#2f4721_100%)]"
              >
                Sign in
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-4 text-sm font-semibold text-gray-6      00"
              >
                Browse products
              </Link>
            </div>
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell hideMobileHeader>
      <section className="px-2 py-0 md:px-6 md:py-2 min-h-screen flex items-center">
        <div className="mx-auto w-full md:max-w-7xl min-h-screen flex flex-col">
          <div className="hidden items-center justify-between md:flex md:px-0 md:py-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {products.length > 0 ? (
              <button
                type="button"
                onClick={() => void clearItems()}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 size={16} />
                Clear wishlist
              </button>
            ) : null}
          </div>

          {/* Top bar mobile */}
          <div className="flex md:hidden border-b border-[#e2e8dc] h-15 items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 shrink-0 items-center justify-center text-[#111827]"
              aria-label="Go back"
            >
              <ArrowLeft size={24} strokeWidth={2.2} />
            </button>
            <h1 className="text-lg text-[#111111]">My Wishlist</h1>
          </div>
          {/* Top bar mobile */}

          {!isReady || isLoading || !areProductsReady || isProductsLoading ? (
            <SpinnerLoader offset={124} />
          ) : !products.length ? (
            <div className=" mx-auto max-w-3xl p-6 text-center md:p-10 min-h-[calc(100vh-180px)] flex flex-col items-center justify-center ">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                  <Heart size={28} />
                </div>
                <h2 className="mt-6 text-2xl text-gray-900">
                  Your wishlist is empty
                </h2>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/"
                    className="bg-[#207958] inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold text-white"
                  >
                    Explore products
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/cart"
                    className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:ml-3"
                  >
                    View cart
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] pt-2 md:pt-2">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {products.map((product) => {
                  const productHref = getProductHref(product);
                  const productHighlights = formatWishlistHighlights(product);

                  return (
                    <article
                      key={product.id}
                      className="group isolate overflow-hidden rounded-[0.5rem] bg-[#ffffff] p-1 transition-all duration-300 hover:border-[#b8cdb0] hover:shadow-[0_14px_34px_rgba(23,20,16,0.08)] sm:p-3"
                    >
                      <div className="relative">
                        <Link
                          href={productHref}
                          className="group/image relative block aspect-[0.9] overflow-hidden rounded-[0.5rem] bg-stone-50"
                        >
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition duration-500 group-hover/image:scale-105"
                          />
                          <span className="pointer-events-none absolute left-2 top-2 bg-white/92 px-[0.3rem] py-[0.1rem] text-[10px] font-semibold rounded-[0.25rem] text-[#214f14] opacity-0 backdrop-blur transition-opacity duration-200 group-hover/image:opacity-100 group-focus-within/image:opacity-100 group-active/image:opacity-100">
                            Original
                          </span>
                          <div className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-md bg-white/70 px-1 py-0.5 text-[#111111] shadow-[0_6px_18px_rgba(0,0,0,0.12)] backdrop-blur-md md:bottom-2 md:left-2 md:gap-1.5 md:rounded-lg md:px-2 md:py-1">
                            <Star
                              size={10}
                              fill="currentColor"
                              className="h-2.5 w-2.5 text-[#ffba08] md:h-4 md:w-4"
                            />
                            <span className="text-[0.6rem] md:text-[0.75rem]">
                              4.{(product.price % 10) + 1}
                            </span>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => void removeItem(product.id)}
                          aria-label={`Remove ${product.name} from wishlist`}
                          className="absolute right-2 top-2 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-[#5f5f5f] shadow-[0_6px_18px_rgba(0,0,0,0.12)] backdrop-blur transition-colors hover:bg-white/90"
                        >
                          <Trash2 size={18} strokeWidth={2} />
                        </button>
                      </div>

                      <div className="relative z-10 pt-3">
                        <Link href={productHref} className="block min-w-0">
                          <h3 className="mt-1 min-h-[2.2rem] text-sm font-bold tracking-normal text-[#050505] line-clamp-2 sm:min-h-0 sm:line-clamp-none sm:text-lg">
                            {product.name}
                          </h3>

                          {productHighlights.length ? (
                            <p className="mt-0 line-clamp-1 pr-2 text-[12px] leading-4 text-[#7a7a7a] sm:text-xs">
                              {productHighlights.join(" | ")}
                            </p>
                          ) : null}
                        </Link>

                        <div className="mt-2 md:mt-4 sm:mt-5">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-base font-medium text-[#07ab4e] sm:text-2xl">
                              {formatCurrency(product.price)}
                            </span>
                            <div className="flex gap-1">
                              {product.mrp > product.price ? (
                                <span className="text-[14px] font-semidbold text-[#9b9b9b] line-through sm:text-base">
                                  {formatCurrency(product.mrp)}
                                </span>
                              ) : null}

                              {product.packLabel ? (
                                <span className="mt-1 text-[11px] font-medium text-[#9b9b9b] sm:text-xs">
                                  {product.packLabel}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <p className="mt-0 text-[12px] text-[#707070] sm:text-xs">
                            Min. Qty - {product.minOrderQuantity} Pcs.
                          </p>
                          <p className="mt-1 text-[12px] font-medium text-[#202020]">
                            Delivery by {deliveryLabel}
                          </p>
                          <ProductCardCartControl
                            productId={product.id}
                            stock={product.stock}
                            minOrderQuantity={product.minOrderQuantity}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="h-fit hidden md:flex md:flex-col px-0 py-6 md:px-6 md:py-0 lg:sticky lg:top-24">
                <h2 className="text-2xl text-[#163915]">Saved overview</h2>

                <div className="mt-6 rounded-[0.5rem] p-5">
                  <div className="space-y-4 text-sm text-[#4b5563]">
                    <div className="flex items-center justify-between">
                      <span>Saved products</span>
                      <span className="font-semibold text-[#111827]">
                        {products.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Highest price</span>
                      <span className="font-semibold text-[#111827]">
                        {formatCurrency(
                          Math.max(...products.map((product) => product.price)),
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lowest price</span>
                      <span className="font-semibold text-[#111827]">
                        {formatCurrency(
                          Math.min(...products.map((product) => product.price)),
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <Link
                    href="/"
                    className="flex w-full items-center justify-center gap-2 rounded-[0.5rem] bg-[#207958] px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#374151]"
                  >
                    Continue Shop
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/cart"
                    className="flex w-full items-center justify-center rounded-[0.5rem] border border-[#d1d5db] bg-white px-6 py-4 text-sm font-semibold text-[#4b5563]"
                  >
                    Open cart
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
