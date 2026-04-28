"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useMemo } from "react";
import {
  ArrowRight,
  Leaf,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import SiteShell from "@/components/SiteShell";
import {
  getCartCount,
  useCartStore,
} from "@/components/cartStore";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Product } from "@/lib/products";
import { useProductsStore } from "@/components/productsStore";

const STANDARD_DELIVERY_FEE = 249;
const FREE_DELIVERY_THRESHOLD = 5000;

type DetailedCartItem = {
  productId: string;
  quantity: number;
  subtotal: number;
  product: Product;
};

export default function CartPageClient() {
  const { isAuthenticated, isReady: isAuthReady } = useAuth();
  const {
    items: cartItems,
    clearItems,
    isLoading,
    isReady,
    removeItem,
    updateQuantity,
  } = useCartStore();
  const {
    isLoading: isProductsLoading,
    isReady: areProductsReady,
    products,
  } = useProductsStore();

  const items = useMemo<DetailedCartItem[]>(
    () =>
      cartItems.flatMap((item) => {
        const product = products.find((entry) => entry.id === item.productId);

        if (!product) {
          return [];
        }

        return [
          {
            ...item,
            product,
            subtotal: product.price * item.quantity,
          },
        ];
      }),
    [cartItems, products],
  );

  const itemCount = getCartCount(cartItems);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee =
    !items.length || subtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : STANDARD_DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const amountUntilFreeDelivery = Math.max(
    FREE_DELIVERY_THRESHOLD - subtotal,
    0,
  );

  if (isAuthReady && !isAuthenticated) {
    return (
      <SiteShell>
        <section className="px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-3xl rounded-[2.3rem] border border-[#dbe8cd] bg-white p-8 text-center shadow-[0_22px_60px_rgba(33,79,20,0.08)] md:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#edf5e1] text-[#214f14]">
              <ShoppingCart size={30} />
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] text-[#163915]">
              Sign in to view your cart
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#5c7752]">
              Your cart now lives on your account, so the same saved items appear across devices after login.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth?next=/cart"
                className="theme-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold"
              >
                Sign in
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-[#d6e6bd] bg-white px-6 py-4 text-sm font-semibold text-[#214f14]"
              >
                Continue shopping
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
            {items.length ? (
              <button
                type="button"
                onClick={() => void clearItems()}
                className="inline-flex h-fit items-center gap-2 self-start rounded-full border border-[#d6e6bd] bg-white px-5 py-3 text-sm font-semibold text-[#214f14] transition-colors hover:bg-[#f3f8ec]"
              >
                <Trash2 size={16} />
                Clear cart
              </button>
            ) : null}
          </div>

          {!isReady || isLoading || !areProductsReady || isProductsLoading ? (
            <div className="theme-panel-strong mx-auto max-w-3xl rounded-[2.3rem] p-6 text-center shadow-[0_22px_60px_rgba(33,79,20,0.08)] md:p-10">
              <h2 className="text-3xl font-black tracking-[-0.04em] text-[#163915]">
                Loading your cart
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#5c7752]">
                Pulling your saved cart from the server.
              </p>
            </div>
          ) : !items.length ? (
            <div className="theme-panel-strong mx-auto max-w-3xl rounded-[2.3rem] p-6 text-center shadow-[0_22px_60px_rgba(33,79,20,0.08)] md:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#edf5e1] text-[#214f14]">
                <ShoppingCart size={30} />
              </div>
              <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] text-[#163915]">
                Your cart is empty
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#5c7752]">
                Add plants, lawn grass, or planters from the catalog and they
                will appear here with live quantity controls and order totals.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/"
                  className="theme-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold"
                >
                  Start shopping
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-[#d6e6bd] bg-white px-6 py-4 text-sm font-semibold text-[#214f14]"
                >
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.18fr_0.82fr]">
              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.product.id}
                    className="rounded-[2rem] border border-[#dbe8cd] bg-white/95 p-4 shadow-[0_22px_60px_rgba(33,79,20,0.08)] md:p-5"
                  >
                    <div className="flex flex-col gap-5 md:flex-row">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="relative block aspect-square w-full overflow-hidden rounded-[1.5rem] bg-[#f4f8ef] md:w-[180px]"
                      >
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 180px"
                          className="object-cover"
                        />
                      </Link>

                      <div className="flex flex-1 flex-col gap-5 md:flex-row md:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#edf5e1] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5b7751]">
                              {item.product.category}
                            </span>
                            <span className="rounded-full border border-[#d6e6bd] px-3 py-1 text-[11px] font-semibold text-[#214f14]">
                              {item.product.packLabel}
                            </span>
                          </div>

                          <Link
                            href={`/products/${item.product.id}`}
                            className="mt-3 block text-2xl font-black tracking-[-0.04em] text-[#163915] transition-colors hover:text-[#214f14]"
                          >
                            {item.product.name}
                          </Link>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#58724f] md:text-base">
                            {item.product.description}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#46603d]">
                            <span className="inline-flex items-center gap-2">
                              <Leaf size={15} />
                              Ready nursery stock
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Truck size={15} />
                              Delivery scheduled after confirmation
                            </span>
                          </div>
                        </div>

                        <div className="md:w-[240px]">
                          <div className="rounded-[1.5rem] bg-[#f6faef] p-4">
                            <div className="flex items-center justify-between text-sm text-[#58724f]">
                              <span>Unit price</span>
                              <span className="font-semibold text-[#214f14]">
                                {formatCurrency(item.product.price)}
                              </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-4">
                              <span className="text-sm text-[#58724f]">
                                Quantity
                              </span>
                              <div className="inline-flex items-center rounded-full border border-[#d6e6bd] bg-white p-1">
                                <button
                                  type="button"
                                  aria-label={`Decrease quantity for ${item.product.name}`}
                                  onClick={() => void
                                    updateQuantity(
                                      item.product.id,
                                      item.quantity - 1,
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#214f14] transition-colors hover:bg-[#edf5e1]"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="min-w-10 text-center text-sm font-bold text-[#163915]">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Increase quantity for ${item.product.name}`}
                                  onClick={() => void
                                    updateQuantity(
                                      item.product.id,
                                      item.quantity + 1,
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#214f14] transition-colors hover:bg-[#edf5e1]"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-[#dbe8cd] pt-4">
                              <div>
                                <p className="text-sm text-[#58724f]">
                                  Subtotal
                                </p>
                                <p className="text-2xl font-black tracking-[-0.04em] text-[#214f14]">
                                  {formatCurrency(item.subtotal)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => void removeItem(item.product.id)}
                                className="inline-flex items-center gap-2 rounded-full border border-[#d6e6bd] bg-white px-3 py-2 text-sm font-semibold text-[#47613e] transition-colors hover:bg-[#edf5e1]"
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
                ))}
              </div>

              <aside className="h-fit rounded-[2rem] border border-[#dbe8cd] bg-white/95 p-6 shadow-[0_22px_60px_rgba(33,79,20,0.08)] lg:sticky lg:top-24">
                <h2 className="text-3xl font-black tracking-[-0.04em] text-[#163915]">
                  Order summary
                </h2>

                <div className="mt-6 rounded-[1.6rem] bg-[#f6faef] p-5">
                  <div className="space-y-4 text-sm text-[#46603d]">
                    <div className="flex items-center justify-between">
                      <span>Items in cart</span>
                      <span className="font-semibold text-[#214f14]">
                        {itemCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Items total</span>
                      <span className="font-semibold text-[#214f14]">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2">
                        <Truck size={15} />
                        Delivery
                      </span>
                      <span className="font-semibold text-[#214f14]">
                        {deliveryFee === 0
                          ? "Free"
                          : formatCurrency(deliveryFee)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-[#dbe8cd] pt-5">
                    <div className="flex items-center justify-between text-xl font-black text-[#163915]">
                      <span>Total payable</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    <p className="mt-2 text-sm text-[#58724f]">
                      Taxes included where applicable. Final confirmation
                      happens at checkout.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4 text-sm text-[#46603d]">
                  <p className="font-semibold text-[#214f14]">
                    {deliveryFee === 0
                      ? "Free delivery unlocked for this cart."
                      : `${formatCurrency(amountUntilFreeDelivery)} away from free delivery.`}
                  </p>
                  <p className="mt-2">
                    Dispatch support, healthy plant handling, and delivery
                    coordination are included in the order workflow.
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <Link
                    href="/checkout"
                    className="theme-button flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold"
                  >
                    Proceed to checkout
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/"
                    className="flex w-full items-center justify-center rounded-full border border-[#d6e6bd] bg-white px-6 py-4 text-sm font-semibold text-[#214f14]"
                  >
                    Continue shopping
                  </Link>
                </div>

                <div className="mt-6 space-y-3 rounded-[1.5rem] bg-[#f6faef] p-4 text-sm text-[#46603d]">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={17} className="text-[#214f14]" />
                    Secure order confirmation and assisted support
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck size={17} className="text-[#214f14]" />
                    Delivery charges shown before you continue
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
