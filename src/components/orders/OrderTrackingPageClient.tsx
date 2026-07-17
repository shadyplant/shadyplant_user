"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Clock3,
  Download,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import OrderInvoiceDownloadButton from "@/components/orders/OrderInvoiceDownloadButton";
import OrderReviewPrompt from "@/components/orders/OrderReviewPrompt";
import SiteShell from "@/components/SiteShell";
import { type ApiResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { useAuth } from "@/components/auth/AuthProvider";
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
import { useProductsStore } from "@/components/productsStore";
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

function formatOrderDateOnly(value: string) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB");
}

function buildOrderThumbnailPreview(order: Order, previewImage: string | null) {
  const orderImages = (order.orderItems || [])
    .map((item) => item.image || "")
    .filter(Boolean);
  const previewImages = [previewImage || "", ...orderImages]
    .filter(Boolean)
    .filter((image, index, list) => list.indexOf(image) === index)
    .slice(0, 3);

  return {
    itemCount: Math.max(
      order.orderItems?.length || 0,
      order.items?.length || 0,
      previewImages.length ? 1 : 0,
    ),
    previewImages,
  };
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
  const thumbnailPreview = buildOrderThumbnailPreview(order, previewImage);
  const reviewProduct = isDelivered(order)
    ? getReviewProduct(order, previewProduct)
    : null;
  const currentStatus = String(order.currentStatus || "").trim().toLowerCase();
  const isRefunded = String(order.currentStatus || "").trim().toLowerCase() === "refunded";
  const canShowInvoice =
    !isRefunded &&
    String(order.paymentStatus || "").trim().toLowerCase() === "paid";
  const isCancelled = currentStatus === "cancelled";
  const isPaidOrder =
    String(order.paymentStatus || "").trim().toLowerCase() === "paid";
  const showRefundAction = isCancelled && isPaidOrder;
  const refundActionLabel =
    order.refundRequestStatus === "refunded"
      ? "Refunded"
      : order.refundRequestStatus === "submitted"
        ? "Refund Pending"
        : order.refundRequestStatus === "resubmit_required"
          ? "Get Refund"
          : "Get Refund";

  return (
    <article className="rounded-[0.8rem] bg-white p-2 shadow-[0_16px_36px_rgba(33,79,20,0.05)] md:p-4">
      <div className="rounded-[1rem] px-2 py-2 md:px-4 md:py-4">
        <Link
          href={orderHref}
          className="flex w-full items-center gap-2 px-0 py-2 md:hidden"
        >
          <div className="relative h-[84px] w-[84px] shrink-0">
            {thumbnailPreview.itemCount > 1 ? (
              <>
                <div className="absolute left-1 top-2 h-[62px] w-[62px] rotate-[-8deg] overflow-hidden rounded-[0.45rem] bg-[#c8c8c8] shadow-sm">
                  {thumbnailPreview.previewImages[1] ? (
                    <Image
                      src={thumbnailPreview.previewImages[1]}
                      alt="Order item preview"
                      fill
                      sizes="62px"
                      className="object-cover opacity-70"
                    />
                  ) : null}
                </div>
                <div className="absolute left-4 top-0 h-[62px] w-[62px] rotate-[4deg] overflow-hidden rounded-[0.45rem] bg-[#d8d8d8] shadow-sm">
                  {thumbnailPreview.previewImages[2] ? (
                    <Image
                      src={thumbnailPreview.previewImages[2]}
                      alt="Order item preview"
                      fill
                      sizes="62px"
                      className="object-cover opacity-75"
                    />
                  ) : null}
                </div>
                <div className="absolute left-0 top-6 flex h-[62px] w-[62px] rotate-[6deg] flex-col items-center justify-center overflow-hidden rounded-[0.45rem] bg-[#6c6c6c] text-center text-white shadow-[0_8px_18px_rgba(0,0,0,0.15)]">
                  {thumbnailPreview.previewImages[0] ? (
                    <Image
                      src={thumbnailPreview.previewImages[0]}
                      alt={order.orderItems?.[0]?.name || "Order item"}
                      fill
                      sizes="62px"
                      className="object-cover opacity-25"
                    />
                  ) : null}
                  <div className="relative z-10 px-1.5">
                    <p className="text-[0.8rem] font-bold leading-none">
                      {thumbnailPreview.itemCount} Items
                    </p>
                    <p className="mt-1 text-[0.6rem] leading-none text-white/85">
                      {formatOrderStatus(order.currentStatus)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden bg-white text-[#c6c6c6]">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt={
                      previewProduct?.name ||
                      order.orderItems?.[0]?.name ||
                      order.orderNumber
                    }
                    fill
                    sizes="76px"
                    className="object-cover"
                  />
                ) : (
                  <PackageSearch size={28} />
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.82rem] leading-5 font-medium text-[#8d8d8d]">
              <span className="text-[#beb8b8]">Order ID</span>{" "}
              {order.orderNumber}
            </p>

            <p className="mt-1 truncate text-[0.82rem] leading-5 font-medium text-[#8d8d8d]">
              <span className="text-[#beb8b8]">Order Status</span>{" "}
              {currentStep?.title || formatOrderStatus(order.currentStatus)}
            </p>

            <p className="mt-2 truncate text-[0.82rem] leading-5 font-medium text-[#8d8d8d]">
              {formatCurrency(order.pricing.total)}
            </p>
          </div>

          <span className="shrink-0 text-[#cfcaca]">
            <ChevronRight size={28} strokeWidth={1.8} />
          </span>
        </Link>

        <div className="hidden gap-5 md:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
          <div className="flex min-w-0 items-start gap-4 md:gap-5">
            <div className="relative h-[98px] w-[98px] shrink-0 md:h-[116px] md:w-[116px]">
              {thumbnailPreview.itemCount > 1 ? (
                <>
                  <div className="absolute left-1 top-2 h-[74px] w-[74px] rotate-[-8deg] overflow-hidden rounded-[0.45rem] bg-[#c8c8c8] shadow-sm md:h-[82px] md:w-[82px]">
                    {thumbnailPreview.previewImages[1] ? (
                      <Image
                        src={thumbnailPreview.previewImages[1]}
                        alt="Order item preview"
                        fill
                        sizes="82px"
                        className="object-cover opacity-70"
                      />
                    ) : null}
                  </div>
                  <div className="absolute left-5 top-0 h-[74px] w-[74px] rotate-[4deg] overflow-hidden rounded-[0.45rem] bg-[#d8d8d8] shadow-sm md:h-[82px] md:w-[82px]">
                    {thumbnailPreview.previewImages[2] ? (
                      <Image
                        src={thumbnailPreview.previewImages[2]}
                        alt="Order item preview"
                        fill
                        sizes="82px"
                        className="object-cover opacity-75"
                      />
                    ) : null}
                  </div>
                  <div className="absolute left-0 top-9 flex h-[74px] w-[74px] rotate-[6deg] flex-col items-center justify-center overflow-hidden rounded-[0.45rem] bg-[#6c6c6c] text-center text-white shadow-[0_8px_18px_rgba(0,0,0,0.15)] md:h-[82px] md:w-[82px]">
                    {thumbnailPreview.previewImages[0] ? (
                      <Image
                        src={thumbnailPreview.previewImages[0]}
                        alt={order.orderItems?.[0]?.name || "Order item"}
                        fill
                        sizes="82px"
                        className="object-cover opacity-25"
                      />
                    ) : null}
                    <div className="relative z-10 px-2">
                      <p className="text-[0.95rem] font-bold leading-none">
                        {thumbnailPreview.itemCount} Items
                      </p>
                      <p className="mt-1 text-[0.68rem] leading-none text-white/85">
                        {formatOrderStatus(order.currentStatus)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[0.8rem] bg-[#eef5e3] text-[#214f14] shadow-sm md:h-[96px] md:w-[96px]">
                  {previewImage ? (
                    <Image
                      src={previewImage}
                      alt={
                        previewProduct?.name ||
                        order.orderItems?.[0]?.name ||
                        order.orderNumber
                      }
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <PackageSearch size={28} className="md:h-8 md:w-8" />
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <Link href={orderHref} className="block">
                <p className="text-[0.98rem] font-bold text-[#353535] md:text-[1.05rem]">
                  Order ID : {order.orderNumber}
                </p>
              </Link>
              <div className="mt-2.5 space-y-1 text-[0.9rem] leading-6 text-[#4a4a4a] md:text-[0.96rem]">
                <p>
                  Order Status : {currentStep?.title || formatOrderStatus(order.currentStatus)}
                </p>
                <p>Order Date &amp; Time : {formatDateTime(order.createdAt)}</p>
                <p>
                  {order.currentStatus === "delivered"
                    ? `Delivered By : ${formatOrderDateOnly(order.deliveryDate)}`
                    : `Expected Delivery Date : ${formatOrderDateOnly(order.deliveryDate)}`}
                </p>
                <p className="line-clamp-1">
                  Delivery Address : {formatAddress(order) || "Address unavailable"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:min-w-[340px] lg:justify-between">
            <Link href={orderHref} className="text-left lg:text-right lg:self-end">
              <p className="text-[1rem] font-bold text-gray-700 md:text-[1.1rem]">
                {formatCurrency(order.pricing.total)}
              </p>
              <p className="mt-1 text-[0.82rem] text-gray-500 md:text-[0.88rem]">View details</p>
            </Link>

            <div className="flex flex-nowrap items-center gap-3 lg:justify-end">
              {!isCancelled ? (
                <Link
                  href={orderHref}
                  className="inline-flex min-w-[160px] items-center justify-center gap-2 whitespace-nowrap rounded-[0.55rem] border border-gray-300 bg-white px-4 py-2.5 text-[0.9rem] font-semibold text-gray-700 transition hover:bg-[#f8f8f8] md:text-[0.95rem]"
                >
                  <Truck size={18} />
                  Track Order
                </Link>
              ) : null}

              {showRefundAction ? (
                <Link
                  href={orderHref}
                  className={`inline-flex min-w-[190px] items-center justify-center gap-2 whitespace-nowrap rounded-[0.55rem] border px-4 py-2.5 text-[0.9rem] font-semibold transition md:text-[0.95rem] ${
                    order.refundRequestStatus === "refunded"
                      ? "border-[#d9e3c8] bg-[#f6fbf1] text-[#355f2a]"
                      : "border-[#d9e3c8] bg-white text-[#355f2a] hover:bg-[#f8f8f8]"
                  }`}
                >
                  {order.refundRequestStatus === "submitted" ? (
                    <Clock3 size={18} className="h-[18px] w-[18px] shrink-0" />
                  ) : (
                    <Wallet size={18} className="h-[18px] w-[18px] shrink-0" />
                  )}
                  {refundActionLabel}
                </Link>
              ) : canShowInvoice ? (
                <OrderInvoiceDownloadButton
                  order={order}
                  className="border border-gray-300 px-4 py-2.5 text-[0.98rem] text-gray-700 hover:bg-[#f8f8f8] md:text-[1.02rem]"
                />
              ) : !isRefunded && !isCancelled ? (
                <span className="inline-flex items-center gap-2 rounded-[0.55rem] border border-gray-300 bg-white px-4 py-2.5 text-[0.98rem] font-semibold text-gray-700 md:text-[1.02rem]">
                  <Download size={18} />
                  Download Invoice
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

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
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false);
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
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (orders || []).filter((order) => {
      if (filter === "Delivered") {
        if (!isDelivered(order)) {
          return false;
        }
      } else if (filter === "Active") {
        if (isDelivered(order)) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchHaystack = [
        order.orderNumber,
        order.id,
        formatOrderStatus(order.currentStatus),
        getCurrentTrackingStep(order)?.title || "",
        ...(order.orderItems || []).map((item) => item.name || ""),
        formatCurrency(order.pricing.total),
        String(order.pricing.total),
      ]
        .join(" ")
        .toLowerCase();

      return searchHaystack.includes(normalizedSearch);
    });
  }, [filter, orders, searchTerm]);

  useEffect(() => {
    if (!isMobileFilterOpen) {
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileFilterOpen]);

  useEffect(() => {
    if (!isDesktopFilterOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        target.closest("[data-orders-desktop-filter]")
      ) {
        return;
      }

      setIsDesktopFilterOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isDesktopFilterOpen]);

  return (
    <SiteShell hideMobileHeader>
      <div className="min-h-screen bg-white">
        <section className="min-h-screen bg-white px-4 py-4 md:px-8 md:py-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6">
              <h2 className="text-[1.2rem] text-gray-900 md:text-3xl">Your Orders</h2>
              <div className="mt-4 flex items-center gap-2">
                <label className="flex flex-1 items-center gap-2 rounded-[0.7rem] border border-[#dedede] bg-white px-3 py-2.5">
                  <Search size={16} className="shrink-0 text-[#8f8f8f]" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search order ID, status, product, amount"
                    className="w-full bg-transparent text-sm text-[#4a4a4a] outline-none placeholder:text-[#9f9f9f]"
                    aria-label="Search orders"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-[0.7rem] border border-[#dedede] bg-white text-[#6f6f6f] md:hidden"
                  aria-label="Filter orders by status"
                >
                  <SlidersHorizontal size={18} />
                </button>

                <div
                  className="relative hidden md:block"
                  data-orders-desktop-filter
                >
                  <button
                    type="button"
                    onClick={() =>
                      setIsDesktopFilterOpen((current) => !current)
                    }
                    className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-[0.7rem] border border-[#dedede] bg-white text-[#6f6f6f]"
                    aria-label="Filter orders by status"
                    aria-expanded={isDesktopFilterOpen}
                  >
                    <SlidersHorizontal size={18} />
                  </button>

                  {isDesktopFilterOpen ? (
                    <div className="absolute right-0 top-full z-20 mt-2 min-w-[210px] overflow-hidden rounded-[0.9rem] border border-[#e7e7e7] bg-white shadow-[0_16px_34px_rgba(0,0,0,0.08)]">
                      <div className="p-2">
                        {filterOptions.map((option) => {
                          const isActive = filter === option;

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setFilter(option);
                                setIsDesktopFilterOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-[0.75rem] px-3 py-2.5 text-left text-sm transition ${
                                isActive
                                  ? "bg-[#edf5e8] font-semibold text-[#214f14]"
                                  : "text-[#5f5f5f] hover:bg-[#f7f7f7]"
                              }`}
                            >
                              <span>{option} Orders</span>
                              {isActive ? (
                                <span className="text-xs font-medium">
                                  Selected
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
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
                  <nav className="-mb-px flex gap-5 overflow-x-auto whitespace-nowrap md:space-x-8 md:gap-0">
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
                  <div className="rounded-[1.6rem] p-8 text-center">
                    <PackageSearch
                      size={28}
                      className="mx-auto text-gray-400"
                    />
                    <h2 className="mt-4 text-2xl text-gray-500">
                      No orders found
                    </h2>
                    <Link
                      href="/"
                      className="mt-6 inline-flex rounded-full bg-[#207958] px-6 py-3 text-sm font-semibold text-white"
                    >
                      Shop Now
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

      {isMobileFilterOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-black/40 md:hidden">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close order filters"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          <div className="relative w-full rounded-t-[1.6rem] bg-white px-4 pb-6 pt-3 shadow-[0_-18px_50px_rgba(0,0,0,0.18)]">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-[#d8d8d8]" />
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-[#1f1f1f]">
                  Filter Orders
                </p>
                <p className="text-sm text-[#8b8b8b]">Choose order status</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e2e2] text-[#7b7b7b]"
                aria-label="Close order filters"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {filterOptions.map((option) => {
                const isActive = filter === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setFilter(option);
                      setIsMobileFilterOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-[0.9rem] px-4 py-3 text-left text-sm font-medium transition ${
                      isActive
                        ? "bg-[#edf5e8] text-[#214f14]"
                        : "bg-white text-[#5f5f5f] border border-[#ececec]"
                    }`}
                  >
                    <span>{option} Orders</span>
                    {isActive ? (
                      <span className="text-xs font-semibold">Selected</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </SiteShell>
  );
}
