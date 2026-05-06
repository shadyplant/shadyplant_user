"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, PackageSearch } from "lucide-react";
import OrderReviewPrompt from "@/components/orders/OrderReviewPrompt";
import SiteShell from "@/components/SiteShell";
import { type ApiResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProductsStore } from "@/components/productsStore";
import {
  filterOptions,
  formatAddress,
  formatDateTime,
  formatOrderStatus,
  getCurrentTrackingStep,
  getOrderHref,
  isDelivered,
  type FilterKey,
  type Order,
} from "@/components/orders/orderUtils";
import type { Product } from "@/lib/products";

function getPreviewProduct(order: Order, products: Product[]) {
  const previewItem = order.items?.[0] || order.orderItems?.[0];

  if (!previewItem) {
    return null;
  }

  return (
    products.find(
      (product) =>
        product.id === previewItem.productId ||
        product.productId === previewItem.productId,
    ) || null
  );
}

function getReviewProduct(order: Order, previewProduct: Product | null) {
  const previewItem = order.items?.[0] || order.orderItems?.[0];
  const productId =
    previewProduct?.id ||
    previewProduct?.productId ||
    previewItem?.productId ||
    "";
  const productName =
    previewProduct?.name ||
    order.orderItems?.[0]?.name ||
    "Delivered item";

  return productId ? { productId, productName } : null;
}

function OrderPreviewCard({
  order,
  previewProduct,
}: {
  order: Order;
  previewProduct: Product | null;
}) {
  const currentStep = getCurrentTrackingStep(order);
  const orderHref = getOrderHref(order.id);
  const previewImage = previewProduct?.image || order.orderItems?.[0]?.image || null;
  const previewTitle =
    previewProduct?.name ||
    order.orderItems?.[0]?.name ||
    (order.items?.length
      ? `${order.items.length} item${order.items.length > 1 ? "s" : ""} in this order`
      : order.orderItems?.length
        ? `${order.orderItems.length} item${order.orderItems.length > 1 ? "s" : ""} in this order`
        : `Order #${order.orderNumber}`);
  const mobileMeta = [`#${order.orderNumber}`, formatOrderStatus(order.currentStatus)]
    .filter(Boolean)
    .join(" • ");
  const reviewProduct = isDelivered(order)
    ? getReviewProduct(order, previewProduct)
    : null;

  return (
    <article className="rounded-[1.6rem] bg-white p-3 shadow-[0_16px_36px_rgba(33,79,20,0.05)] transition hover:border-[#c4d9b3] hover:shadow-[0_20px_40px_rgba(33,79,20,0.08)] md:p-5">
      <Link href={orderHref} className="group block">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] bg-[#eef5e3] text-[#214f14] md:h-24 md:w-24 md:rounded-[1.4rem]">
            {previewImage ? (
              <Image
                src={previewImage}
                alt={previewProduct?.name || previewTitle}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <PackageSearch size={30} className="md:h-9 md:w-9" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 md:hidden">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-black text-[#163915]">
                  {previewTitle}
                </p>
                <p className="mt-1 line-clamp-1 text-xs font-medium text-[#6d8464]">
                  {mobileMeta}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-[#2f65d9]">
                  {formatCurrency(order.pricing.total)}
                </p>
                <div className="mt-1 flex items-center justify-end text-[#5d7b56] transition group-hover:text-[#214f14]">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>

            <div className="hidden items-start justify-between gap-3 md:flex">
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-black text-[#163915] md:text-base">
                  {previewTitle}
                </p>
                <p className="mt-1 text-xs font-medium text-[#6d8464]">
                  Order #{order.orderNumber}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-[#6b8b58]">
                  {formatOrderStatus(order.currentStatus)}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-[#2f65d9] md:text-base">
                  {formatCurrency(order.pricing.total)}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-[#5d7b56] transition group-hover:text-[#214f14]">
                  <span className="text-xs font-semibold md:text-sm">
                    View details
                  </span>
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>

            <div className="mt-3 hidden space-y-2 text-sm text-[#58724f] md:block">
              <p className="line-clamp-2">
                {formatAddress(order) || "Address unavailable"}
              </p>
              <p>
                Delivery target:{" "}
                <span className="font-semibold text-[#355f2a]">
                  {formatDateTime(order.deliveryDate)}
                </span>
              </p>
              <p>
                {order.quantitySqft} sqft • {order.vehicle.name} •{" "}
                {order.paymentStatusLabel}
              </p>
              {currentStep ? (
                <p className="text-xs text-[#708669] md:text-sm">
                  Tracking: {currentStep.title}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Link>

      {reviewProduct ? (
        <div className="mt-4">
          <OrderReviewPrompt
            productId={reviewProduct.productId}
            productName={reviewProduct.productName}
          />
        </div>
      ) : null}
    </article>
  );
}

export default function OrderTrackingPageClient() {
  const { fetchWithAuth, isAuthenticated, isReady } = useAuth();
  const { products } = useProductsStore();
  const [filter, setFilter] = useState<FilterKey>("All");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }

    let isActive = true;

    fetchWithAuth<ApiResponse<{ orders: Order[] }>>("/orders")
      .then((response) => {
        if (!isActive) {
          return;
        }

        setOrders(response.data.orders);
      })
      .catch((nextError) => {
        if (!isActive) {
          return;
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to load orders.",
        );
      });

    return () => {
      isActive = false;
    };
  }, [fetchWithAuth, isAuthenticated, isReady]);

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      if (filter === "Delivered") {
        return isDelivered(order);
      }

      if (filter === "Active") {
        return !isDelivered(order);
      }

      return true;
    });
  }, [filter, orders]);

  return (
    <SiteShell>
      <div className="min-h-screen bg-white">
        <section className="min-h-screen bg-white px-4 py-8 md:px-8 md:py-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
              <p className="mt-2 text-sm text-gray-600">
                Review every order in a compact card view and open any order for
                full tracking details.
              </p>
            </div>

            {!isReady || (isAuthenticated && orders === null && !error) ? (
              <div className="rounded-[1.6rem] border border-[#dbe8cd] bg-white p-6 text-sm text-[#58724f]">
                Loading your orders...
              </div>
            ) : !isAuthenticated ? (
              <div className="rounded-[1.6rem] border border-[#dbe8cd] bg-white p-8 text-center shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
                <PackageSearch size={28} className="mx-auto text-[#214f14]" />
                <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                  Sign in to view your orders
                </h2>
                <p className="mt-3 text-sm text-[#58724f]">
                  Your order timeline and delivery history are available after
                  login.
                </p>
                <Link
                  href="/auth?next=/order"
                  className="mt-6 inline-flex rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white"
                >
                  Continue to sign in
                </Link>
              </div>
            ) : error ? (
              <div className="rounded-[1.6rem] border border-[#f2d2d2] bg-[#fff7f7] p-6 text-sm text-[#9c3131]">
                {error}
              </div>
            ) : (
              <>
                <div className="mb-6 border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {filterOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFilter(option)}
                        className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition-colors ${
                          filter === option
                            ? "border-black text-black"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}
                      >
                        {option} Orders
                      </button>
                    ))}
                  </nav>
                </div>

                {!filteredOrders.length ? (
                  <div className="rounded-[1.6rem] border border-[#dbe8cd] bg-white p-8 text-center shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
                    <PackageSearch
                      size={28}
                      className="mx-auto text-[#214f14]"
                    />
                    <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                      No orders in this view
                    </h2>
                    <p className="mt-3 text-sm text-[#58724f]">
                      Place your first order from the delivery calculator or
                      switch filters.
                    </p>
                    <Link
                      href="/checkout"
                      className="mt-6 inline-flex rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white"
                    >
                      Start a new order
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const previewProduct = getPreviewProduct(order, products);

                      return (
                        <OrderPreviewCard
                          key={order.id}
                          order={order}
                          previewProduct={previewProduct}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
