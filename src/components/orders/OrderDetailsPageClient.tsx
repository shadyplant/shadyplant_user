"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  PackageSearch,
  Truck,
} from "lucide-react";
import OrderReviewPrompt from "@/components/orders/OrderReviewPrompt";
import OrderInvoiceDownloadButton from "@/components/orders/OrderInvoiceDownloadButton";
import SiteShell from "@/components/SiteShell";
import { type ApiResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  canDownloadInvoice,
  formatAddress,
  formatDateTime,
  formatOrderStatus,
  type Order,
} from "@/components/orders/orderUtils";

function formatTrackingHeadlineDate(value?: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getReviewProduct(order: Order) {
  const previewItem = order.items?.[0] || order.orderItems?.[0];
  const productId = previewItem?.productId || "";
  const productName = order.orderItems?.[0]?.name || "Delivered item";

  return productId ? { productId, productName } : null;
}

export default function OrderDetailsPageClient({
  orderId,
}: {
  orderId: string;
}) {
  const { fetchWithAuth, isAuthenticated, isReady } = useAuth();
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
            : "Unable to load order details.",
        );
      });

    return () => {
      isActive = false;
    };
  }, [fetchWithAuth, isAuthenticated, isReady]);

  const order = useMemo(
    () => (orders || []).find((candidate) => candidate.id === orderId) || null,
    [orderId, orders],
  );

  const formattedAddress = order ? formatAddress(order) : "";
  const reviewProduct =
    order && order.currentStatus === "delivered" ? getReviewProduct(order) : null;
  const canShowInvoice = order ? canDownloadInvoice(order) : false;

  return (
    <SiteShell>
      <div className="min-h-screen bg-white">
        <section className="min-h-screen bg-white px-4 py-8 md:px-8 md:py-12">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/order"
              className="inline-flex items-center gap-2 rounded-full border border-[#dbe8cd] bg-white px-4 py-2 text-sm font-semibold text-[#214f14] transition hover:bg-[#f4fbf2]"
            >
              <ArrowLeft size={16} />
              Back to orders
            </Link>

            {!isReady || (isAuthenticated && orders === null && !error) ? (
              <div className="mt-6 rounded-[1.6rem] border border-[#dbe8cd] bg-white p-6 text-sm text-[#58724f]">
                Loading order details...
              </div>
            ) : !isAuthenticated ? (
              <div className="mt-6 rounded-[1.6rem] border border-[#dbe8cd] bg-white p-8 text-center shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
                <PackageSearch size={28} className="mx-auto text-[#214f14]" />
                <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                  Sign in to view this order
                </h2>
                <p className="mt-3 text-sm text-[#58724f]">
                  Order details and tracking history are available after login.
                </p>
                <Link
                  href={`/auth?next=/order/${encodeURIComponent(orderId)}`}
                  className="mt-6 inline-flex rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white"
                >
                  Continue to sign in
                </Link>
              </div>
            ) : error ? (
              <div className="mt-6 rounded-[1.6rem] border border-[#f2d2d2] bg-[#fff7f7] p-6 text-sm text-[#9c3131]">
                {error}
              </div>
            ) : !order ? (
              <div className="mt-6 rounded-[1.6rem] border border-[#dbe8cd] bg-white p-8 text-center shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
                <PackageSearch size={28} className="mx-auto text-[#214f14]" />
                <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                  Order not found
                </h2>
                <p className="mt-3 text-sm text-[#58724f]">
                  We could not find the requested order in your account.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <article className="overflow-hidden rounded-[1.8rem] border border-[#dbe8cd] bg-white shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
                  <div className="flex flex-col gap-4 border-b border-[#e2eadc] bg-[#f6faef] px-6 py-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b8b58]">
                        Order #{order.orderNumber}
                      </p>
                      <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                        {formatOrderStatus(order.currentStatus)}
                      </h1>
                      <p className="mt-2 text-sm text-[#58724f]">
                        Tracking code: {order.trackingCode}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b8b58]">
                        Total
                      </p>
                      <p className="mt-2 text-2xl font-black text-[#2f65d9]">
                        {formatCurrency(order.pricing.total)}
                      </p>
                      {canShowInvoice ? (
                        <OrderInvoiceDownloadButton order={order} />
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_290px]">
                    <div className="space-y-4">
                      <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4">
                        <p className="text-sm font-semibold text-[#163915]">
                          Order summary
                        </p>
                        <div className="mt-4 grid gap-3 text-sm text-[#58724f] md:grid-cols-2">
                          <p>Placed on: {formatDateTime(order.createdAt)}</p>
                          <p>
                            Delivery target: {formatDateTime(order.deliveryDate)}
                          </p>
                          <p>Quantity: {order.quantitySqft} sqft</p>
                          <p>Distance: {order.distanceKm} km</p>
                          <p>Vehicle: {order.vehicle.name}</p>
                          <p>Payment: {order.paymentStatusLabel}</p>
                          <p>Method: {order.paymentMethodLabel}</p>
                          <p>
                            Shipping:{" "}
                            {formatCurrency(order.pricing.shippingSubtotal ?? 0)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#163915]">
                          <MapPin size={16} className="text-[#214f14]" />
                          Delivery Address
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-[#58724f]">
                          {formattedAddress || "Address unavailable"}
                        </p>
                      </div>

                      <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#163915]">
                          <Truck size={16} className="text-[#214f14]" />
                          Expanded Track History
                        </h2>

                        <div className="mt-5 space-y-6">
                          {order.trackingTimeline.map((step, index) => (
                            <div
                              key={`${order.id}-${step.key}`}
                              className="relative flex gap-4"
                            >
                              {index !== order.trackingTimeline.length - 1 ? (
                                <div className="absolute bottom-[-28px] left-[11px] top-6 w-[2px] bg-[#69b657]" />
                              ) : null}

                              <div className="relative z-10 mt-0.5 shrink-0">
                                {step.state === "complete" ? (
                                  <CheckCircle2
                                    size={24}
                                    className="bg-[#fbfdf8] text-[#4ea34a]"
                                  />
                                ) : (
                                  <Clock
                                    size={24}
                                    className={
                                      step.state === "current"
                                        ? "bg-[#fbfdf8] text-[#4ea34a]"
                                        : "bg-[#fbfdf8] text-gray-300"
                                    }
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1 pb-2">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <p
                                    className={`text-[1.05rem] font-semibold ${
                                      step.state === "upcoming"
                                        ? "text-gray-500"
                                        : "text-[#1f1f1f]"
                                    }`}
                                  >
                                    {step.title}
                                  </p>
                                  <p className="text-sm font-medium text-[#777777]">
                                    {formatTrackingHeadlineDate(step.occurredAt)}
                                  </p>
                                </div>

                                {Array.isArray(step.entries) && step.entries.length ? (
                                  <div className="mt-4 space-y-4">
                                    {step.entries.map((entry) => (
                                      <div key={entry.id}>
                                        <p className="text-[15px] leading-6 text-[#232323]">
                                          {entry.message}
                                        </p>
                                        <p className="mt-0.5 text-sm text-[#8c8c8c]">
                                          {formatDateTime(entry.timestamp)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-2 text-sm text-[#8c8c8c]">
                                    {step.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {reviewProduct ? (
                        <OrderReviewPrompt
                          productId={reviewProduct.productId}
                          productName={reviewProduct.productName}
                        />
                      ) : null}
                    </div>

                    <aside className="space-y-4">
                      <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b8b58]">
                          Quick help
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#58724f]">
                          Need to place another order or review checkout
                          details? Use the quick actions below.
                        </p>
                      </div>

                      <Link
                        href="/checkout"
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <HelpCircle size={16} />
                        Start another order
                      </Link>
                    </aside>
                  </div>
                </article>
              </div>
            )}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
