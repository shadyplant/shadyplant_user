"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Trash2 } from "lucide-react";
import ProductCardCartControl from "@/components/ProductCardCartControl";
import SiteShell from "@/components/SiteShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProductsStore } from "@/components/productsStore";
import {
  useWishlistStore,
} from "@/components/wishlistStore";
import { formatCurrency } from "@/lib/formatCurrency";
import { getProductHref } from "@/lib/productUrls";

export default function WishlistPageClient() {
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

  if (isAuthReady && !isAuthenticated) {
    return (
      <SiteShell>
        <section className="px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-3xl p-8 text-center md:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center text-[#214f14]">
              <Heart size={30} />
            </div>
            <h2 className="mt-6 text-3xl text-[#163915]">
              Sign in to view your wishlist
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#5c7752]">
              Your wishlist is now stored on your account, so the same saved picks follow you across devices.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth?next=/wishlist"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#24361b_0%,#365127_100%)] px-6 py-4 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(36,54,27,0.18)] transition hover:bg-[linear-gradient(135deg,#1d2e16_0%,#2f4721_100%)]"
              >
                Sign in
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-[#d6e6bd] bg-white px-6 py-4 text-sm font-semibold text-[#214f14]"
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
    <SiteShell>
      <section className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
            {products.length ? (
              <button
                type="button"
                onClick={() => void clearItems()}
                className="inline-flex h-fit items-center gap-2 self-start rounded-[0.5rem] border border-[#d6e6bd] bg-white px-5 py-3 text-sm text-[#214f14] transition-colors hover:bg-[#f3f8ec]"
              >
                <Trash2 size={16} />
                Clear wishlist
              </button>
            ) : null}
          </div>

          {!isReady || isLoading || !areProductsReady || isProductsLoading ? (
            <div className="mx-auto max-w-3xl rounded-[2.3rem] border border-[rgba(36,54,27,0.08)] bg-[var(--surface-strong)] p-6 text-center shadow-[0_22px_60px_rgba(33,79,20,0.08)] backdrop-blur-[16px] md:p-10">
              <h2 className="text-3xl text-[#163915]">
                Loading your wishlist
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#5c7752]">
                Pulling your saved products from the server.
              </p>
            </div>
          ) : !products.length ? (
            <div className=" mx-auto max-w-3xl p-6 text-center md:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#edf5e1] text-[#4c8d5b]">
                <Heart size={30} />
              </div>
              <h2 className="mt-6 text-3xl text-gray-900">
                Your wishlist is empty
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-gray-600">
                Tap the heart on any product card to save it here for later
                review.
              </p>
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
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                {products.map((product) => {
                  const productHref = getProductHref(product);

                  return (
                  <article
                    key={product.id}
                    className="rounded-[0.5rem] bg-white p-4 md:p-5 shadow-[0_22px_60px_rgba(33,79,20,0.08)]"
                  >
                    <div className="flex flex-col gap-5 md:flex-row">
                      <Link
                        href={productHref}
                        className="relative block aspect-square w-full overflow-hidden rounded-[0.5rem] bg-[#f4f8ef] md:w-[180px]"
                      >
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 180px"
                          className="object-cover"
                        />
                      </Link>

                      <div className="flex flex-1 flex-col gap-5 md:flex-row md:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#edf5e1] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5b7751]">
                              {product.category}
                            </span>
                            <span className="rounded-full border border-[#d6e6bd] px-3 py-1 text-[11px] font-semibold text-[#214f14]">
                              {product.badge}
                            </span>
                          </div>

                          <Link
                            href={productHref}
                            className="mt-3 block text-2xltext-[#163915] transition-colors hover:text-[#214f14]"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#58724f] md:text-base">
                            {product.description}
                          </p>
                          <p className="mt-3 text-sm font-semibold text-[#5d7853]">
                            {product.packLabel}
                          </p>
                        </div>

                        <div className="md:w-[250px]">
                          <div className="rounded-[0.5rem] p-4">
                            <p className="text-sm text-[#58724f]">
                              Current price
                            </p>
                            <p className="mt-1 text-3xl text-[#214f14]">
                              {formatCurrency(product.price)}
                            </p>
                            <p className="mt-1 text-sm text-[#58724f]">
                              {product.unit}
                            </p>

                            <div className="mt-5 space-y-3">
                              <div className="[&>div]:mt-0 [&>button]:mt-0">
                                <ProductCardCartControl
                                productId={product.id}
                                  stock={product.stock}
                                  minOrderQuantity={product.minOrderQuantity}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => void removeItem(product.id)}
                                className="flex w-full items-center justify-center gap-2 rounded-[0.5rem] border border-[#d6e6bd] bg-white px-5 py-3 text-sm font-semibold text-[#214f14] transition-colors hover:bg-[#edf5e1]"
                              >
                                <Trash2 size={15} />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                  );
                })}
              </div>

              <aside className="h-fit p-6 lg:sticky lg:top-24 shadow-[0_22px_60px_rgba(33,79,20,0.08)]">
                <h2 className="text-3xl text-[#163915]">
                  Saved overview
                </h2>

                <div className="mt-6 rounded-[1.6rem] bg-[#f6faef] p-5">
                  <div className="space-y-4 text-sm text-[#46603d]">
                    <div className="flex items-center justify-between">
                      <span>Saved products</span>
                      <span className="font-semibold text-[#214f14]">
                        {products.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Highest price</span>
                      <span className="font-semibold text-[#214f14]">
                        {formatCurrency(
                          Math.max(...products.map((product) => product.price)),
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lowest price</span>
                      <span className="font-semibold text-[#214f14]">
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
                    className="bg-[#4c8b5d] text-white flex w-full items-center justify-center gap-2 rounded-[0.5rem] px-6 py-4 text-sm font-semibold transition-colors hover:bg-[#163915]"
                  >
                    Continue Shop
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/cart"
                    className="flex w-full items-center justify-center rounded-[0.5rem] border border-[#d6e6bd] bg-white px-6 py-4 text-sm font-semibold text-[#214f14]"
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
