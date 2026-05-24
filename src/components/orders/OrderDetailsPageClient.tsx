"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Circle,
  PackageSearch,
  XCircle,
} from "lucide-react";
import OrderReviewPrompt from "@/components/orders/OrderReviewPrompt";
import OrderInvoiceDownloadButton from "@/components/orders/OrderInvoiceDownloadButton";
import SiteShell from "@/components/SiteShell";
import { type ApiResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  canDownloadInvoice,
  formatDateTime,
  formatOrderStatus,
  type Order,
} from "@/components/orders/orderUtils";

function formatOrderDateOnly(value?: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB");
}

function resolveOrderLineItems(order: Order) {
  if (Array.isArray(order.orderItems) && order.orderItems.length > 0) {
    return order.orderItems.map((item, index) => {
      const quantity = Math.max(1, Math.floor(Number(item.quantity || 0)));
      const unitPrice = Number(item.unitPrice || 0);
      const subtotal =
        Number(item.subtotal || 0) > 0
          ? Number(item.subtotal || 0)
          : unitPrice * quantity;
      const meta = [item.variantLabel, item.packLabel, item.unit]
        .filter(Boolean)
        .join(" - ");

      return {
        key: item.variantId || item.productId || `order-line-${index + 1}`,
        name: String(item.name || "Product").trim(),
        image: item.image || "",
        meta,
        unitPrice,
        quantity,
        subtotal,
      };
    });
  }

  const quantity = Math.max(1, Math.floor(Number(order.quantitySqft || 0)));
  const subtotal = Number(
    order.pricing.itemsSubtotal ?? order.pricing.materialSubtotal ?? 0,
  );
  const unitPrice = quantity > 0 ? subtotal / quantity : 0;

  return [
    {
      key: order.id,
      name: "Premium grass order",
      image: "",
      meta: `${quantity} sqft`,
      unitPrice,
      quantity,
      subtotal,
    },
  ];
}

function getReviewProduct(order: Order) {
  const previewItem = order.items?.[0] || order.orderItems?.[0];
  const productId = previewItem?.productId || "";
  const productName = order.orderItems?.[0]?.name || "Delivered item";

  return productId ? { productId, productName } : null;
}

type StorefrontTrackingStep = {
  key: string;
  title: string;
  message: string;
  timestamp: string | null;
  state: "complete" | "current" | "upcoming";
  tone?: "default" | "error";
  secondaryMessage?: string;
  secondaryTimestamp?: string | null;
  actionLabel?: string;
  actionType?: "open_refund_form" | "view_refund_details";
};

type RefundFormState = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
};

function formatTrackingDetailDate(value?: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `Date : ${date.toLocaleDateString("en-GB")}, Time : ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatLongDeliveryDate(value?: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function resolveTrackingTimestamp(order: Order, key: string) {
  const group = order.trackingTimeline.find((step) => step.key === key);
  return group?.entries?.[group.entries.length - 1]?.timestamp || group?.occurredAt || null;
}

function buildStorefrontTrackingSteps(order: Order): StorefrontTrackingStep[] {
  const currentStatus = String(order.currentStatus || "").trim().toLowerCase();
  const basePlacedTimestamp =
    resolveTrackingTimestamp(order, "placed") ||
    resolveTrackingTimestamp(order, "confirmed") ||
    order.createdAt;
  const cancelledTimestamp =
    resolveTrackingTimestamp(order, "cancelled") || order.cancelledAt || order.updatedAt || null;
  const refundStatus = order.refundRequestStatus || null;
  const refundSubmittedAt = order.refundSubmittedAt || order.updatedAt || null;
  const refundResubmitRequestedAt =
    order.refundResubmitRequestedAt || order.updatedAt || null;

  if (currentStatus === "cancelled") {
    const refundStep = (() => {
      if (refundStatus === "resubmit_required") {
        return {
          key: "refund_resubmit",
          title: "Refund Failed",
          message:
            order.refundRequestNote?.trim() ||
            "Your provided account details in invalid. Please provide valid details.",
          timestamp: refundResubmitRequestedAt,
          state: "current",
          tone: "error",
          actionLabel: "Resubmit",
          actionType: "open_refund_form",
        } satisfies StorefrontTrackingStep;
      }

      if (refundStatus === "submitted") {
        return {
          key: "refund_submitted",
          title: "Get Refund",
          message: "Your account details is submitted successfully.",
          timestamp: refundSubmittedAt,
          secondaryMessage: "Shadyplant will verify and refund back.",
          secondaryTimestamp: refundSubmittedAt,
          state: "current",
          actionLabel: "Account Details",
          actionType: "view_refund_details",
        } satisfies StorefrontTrackingStep;
      }

      return {
        key: "refund_pending",
        title: "Get Refund",
        message: "Please provide your account details for refund.",
        timestamp: null,
        state: "current",
        actionLabel: "Account Details",
        actionType: "open_refund_form",
      } satisfies StorefrontTrackingStep;
    })();

    return [
      {
        key: "placed",
        title: "Order Placed",
        message: "Your order has been confirmed.",
        timestamp: basePlacedTimestamp,
        state: "complete",
      },
      {
        key: "cancelled",
        title: "Cancelled",
        message: "Your order has been cancelled.",
        timestamp: cancelledTimestamp,
        state: "complete",
        tone: "error",
      },
      refundStep,
    ];
  }

  if (currentStatus === "refunded") {
    return [
      {
        key: "placed",
        title: "Order Placed",
        message: "Your order has been confirmed.",
        timestamp: basePlacedTimestamp,
        state: "complete",
      },
      {
        key: "cancelled",
        title: "Cancelled",
        message: "Your order has been cancelled.",
        timestamp: cancelledTimestamp,
        state: "complete",
        tone: "error",
      },
      {
        key: "refunded",
        title: "Refunded",
        message:
          "Your paid amount has been refunded back to the provided account details.",
        timestamp:
          resolveTrackingTimestamp(order, "refunded") ||
          order.refundedAt ||
          order.updatedAt ||
          null,
        state: "current",
        actionLabel: "Refund Details",
        actionType: "view_refund_details",
      },
    ];
  }

  const steps = [
    {
      key: "placed",
      title: "Order Placed",
      message: "Your order has been confirmed.",
      timestamp: basePlacedTimestamp,
    },
    {
      key: "shipped",
      title: "Order Shipped",
      message: "Your order is dispatched from Grass Green Nursery warehouse.",
      timestamp: resolveTrackingTimestamp(order, "shipped"),
    },
    {
      key: "out_for_delivery",
      title: "Out For Delivery",
      message: "Your order is about to reach your destination.",
      timestamp: resolveTrackingTimestamp(order, "out_for_delivery"),
    },
    {
      key: "delivered",
      title: currentStatus === "delivered" ? "Delivered" : "Expected Delivery By",
      message:
        currentStatus === "delivered"
          ? "Your order has been delivered successfully."
          : `Your order will be delivered by ${formatLongDeliveryDate(order.deliveryDate)}`,
      timestamp:
        currentStatus === "delivered"
          ? resolveTrackingTimestamp(order, "delivered") || order.deliveryDate
          : order.deliveryDate,
    },
  ];

  const statusIndex = (() => {
    if (currentStatus === "delivered") {
      return 3;
    }
    if (currentStatus === "out_for_delivery") {
      return 2;
    }
    if (currentStatus === "shipped") {
      return 1;
    }
    return 0;
  })();

  return steps.map((step, index) => ({
    ...step,
    state:
      index < statusIndex
        ? "complete"
        : index === statusIndex
          ? "current"
          : "upcoming",
  }));
}

export default function OrderDetailsPageClient({
  orderId,
}: {
  orderId: string;
}) {
  const { fetchWithAuth, isAuthenticated, isReady } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefundFormOpen, setIsRefundFormOpen] = useState(false);
  const [isRefundDetailsOpen, setIsRefundDetailsOpen] = useState(false);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundForm, setRefundForm] = useState<RefundFormState>({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
  });

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

  useEffect(() => {
    if (!order?.refundAccountDetails) {
      return;
    }

    setRefundForm({
      accountHolderName: order.refundAccountDetails.accountHolderName || "",
      bankName: order.refundAccountDetails.bankName || "",
      accountNumber: order.refundAccountDetails.accountNumber || "",
      confirmAccountNumber: order.refundAccountDetails.accountNumber || "",
      ifscCode: order.refundAccountDetails.ifscCode || "",
    });
  }, [order?.refundAccountDetails]);

  useEffect(() => {
    if (!isRefundFormOpen && !isRefundDetailsOpen) {
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isRefundDetailsOpen, isRefundFormOpen]);

  const reviewProduct =
    order && order.currentStatus === "delivered" ? getReviewProduct(order) : null;
  const canShowInvoice = order ? canDownloadInvoice(order) : false;
  const orderLineItems = order ? resolveOrderLineItems(order) : [];
  const refundAccountDetails = order?.refundAccountDetails || null;

  async function handleRefundAccountSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!order || refundSubmitting) {
      return;
    }

    if (
      refundForm.accountNumber.trim() !== refundForm.confirmAccountNumber.trim()
    ) {
      setRefundError("Confirm account number must match the account number.");
      return;
    }

    setRefundSubmitting(true);
    setRefundError(null);

    try {
      const response = await fetchWithAuth<ApiResponse<{ order: Order }>>(
        `/orders/${encodeURIComponent(order.id)}/refund-account`,
        {
          method: "PATCH",
          body: JSON.stringify({
            accountHolderName: refundForm.accountHolderName.trim(),
            bankName: refundForm.bankName.trim(),
            accountNumber: refundForm.accountNumber.trim(),
            ifscCode: refundForm.ifscCode.trim().toUpperCase(),
          }),
        },
      );

      setOrders((currentOrders) =>
        (currentOrders || []).map((candidate) =>
          candidate.id === order.id ? response.data.order : candidate,
        ),
      );
      setIsRefundFormOpen(false);
      setIsRefundDetailsOpen(true);
    } catch (nextError) {
      setRefundError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to submit refund account details right now.",
      );
    } finally {
      setRefundSubmitting(false);
    }
  }

  return (
    <SiteShell hideMobileHeader>
      <>
      <div className="min-h-screen bg-white">
        <section className="min-h-screen bg-white px-4 py-4 md:px-8 md:py-12">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/order"
              className="inline-flex items-center gap-2 rounded-[0.5rem] border border-[#dbe8cd] bg-white px-3 py-2 text-xs font-semibold text-[#214f14] transition hover:bg-[#f4fbf2] md:px-4 md:text-sm"
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
              <div className="mt-4 space-y-4 md:mt-6 md:space-y-6">
                <article className="overflow-hidden rounded-[1.2rem] bg-white shadow-[0_18px_45px_rgba(33,79,20,0.06)] md:rounded-[1.8rem]">
                  <div className="flex flex-col gap-3 border-b border-[#e2eadc] px-4 py-4 md:flex-row md:items-start md:justify-between md:px-6 md:py-5">
                    <div>
                      
                      <h1 className="mt-1 text-[1.25rem] font-semibold text-[#163915] md:mt-2 md:text-2xl">
                        Order Details
                      </h1>
                     
                    </div>

                    <div className="text-left md:text-right">
                      
                      {canShowInvoice ? (
                        <OrderInvoiceDownloadButton order={order} />
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-4 p-4 md:space-y-6 md:p-6">
                    <div className="p-0 md:p-4">
                        <div className="flex flex-col gap-3 border-b border-[#e6ede1] pb-4 md:flex-row md:items-start md:justify-between md:gap-4">
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[0.8rem] bg-[#eef5e3] text-[#214f14] md:h-20 md:w-20 md:rounded-[1rem]">
                              {orderLineItems[0]?.image ? (
                                <Image
                                  src={orderLineItems[0].image}
                                  alt={orderLineItems[0].name}
                                  fill
                                  sizes="(max-width: 768px) 64px, 80px"
                                  className="object-cover"
                                />
                              ) : (
                                <PackageSearch size={24} className="md:h-7 md:w-7" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-[0.95rem] font-semibold text-[#2a2a2a] md:text-xl">
                                Order ID : {order.orderNumber || order.id}
                              </p>
                              <div className="mt-2 space-y-1 text-[12px] text-[#4f4f4f] md:mt-3 md:space-y-1.5 md:text-sm">
                                <p>Order Status : {formatOrderStatus(order.currentStatus)}</p>
                                <p>Order Date &amp; Time : {formatDateTime(order.createdAt)}</p>
                                <p>Expected Delivery Date : {formatOrderDateOnly(order.deliveryDate)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="text-left md:text-right">
                            <p className="text-[1.1rem] font-semibold text-[#232323] md:text-2xl">
                              {formatCurrency(order.pricing.total)}
                            </p>
                            <p className="mt-2 text-xs text-[#aaaaaa] md:mt-8 md:text-sm">View details</p>
                          </div>
                        </div>

                        <div className="pt-3 md:pt-4">
                          {orderLineItems.map((item, index) => (
                            <div
                              key={item.key}
                              className="grid grid-cols-[24px_56px_minmax(0,1fr)] gap-3 border-b border-[#ececec] py-3 md:grid-cols-[44px_72px_minmax(0,1fr)_120px_140px] md:gap-4 md:py-4"
                            >
                              <div className="pt-1 text-sm font-medium text-[#4f4f4f] md:self-center md:pt-0 md:text-2xl">
                                {String(index + 1).padStart(2, "0")}.
                              </div>

                              <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-sm bg-[#5a5a5a] text-white md:h-[72px] md:w-[72px]">
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    sizes="(max-width: 768px) 56px, 72px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <PackageSearch size={18} className="md:h-[22px] md:w-[22px]" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="line-clamp-2 text-[0.95rem] font-medium leading-5 text-[#4a4a4a] md:line-clamp-1 md:text-[1.05rem]">
                                  {item.name}
                                </p>
                                <p className="mt-1 text-[11px] text-[#a0a0a0] md:text-sm">
                                  {item.meta || "Catalog order item"}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.85rem] font-medium text-[#4a4a4a] md:mt-2 md:block md:text-[1.05rem]">
                                  {formatCurrency(item.unitPrice)}
                                  <span className="md:hidden">{item.quantity} Pcs.</span>
                                  <span className="md:hidden">{formatCurrency(item.subtotal)}</span>
                                </div>
                              </div>

                              <div className="hidden text-[1.05rem] font-medium text-[#4a4a4a] md:self-center md:block">
                                {item.quantity} Pcs.
                              </div>

                              <div className="hidden text-[1.05rem] font-medium text-[#4a4a4a] md:self-center md:text-right">
                                {formatCurrency(item.subtotal)}
                              </div>
                            </div>
                          ))}

                          <div className="flex items-center justify-end gap-5 pt-4 text-right md:gap-8 md:pt-5">
                            <span className="text-[0.95rem] font-medium text-[#2f2f2f] md:text-[1.1rem]">
                              Grand Total
                            </span>
                            <span className="text-[0.95rem] font-medium text-[#2f2f2f] md:text-[1.1rem]">
                              {formatCurrency(order.pricing.total)}
                            </span>
                          </div>
                        </div>
                    </div>

                    <div className="p-0 md:p-4">
                      <h2 className="text-[1rem] font-medium text-[#353535] md:text-[1.1rem]">
                        Order Updates
                      </h2>
                      <div className="mt-4 border-t border-[#e7e7e7]" />

                      <div className="mt-6 space-y-0 md:mt-8">
                        {buildStorefrontTrackingSteps(order).map((step, index, steps) => {
                          const nextStep = steps[index + 1];
                          const nextStepReached =
                            nextStep?.state === "complete" || nextStep?.state === "current";
                          const isErrorStep = step.tone === "error";
                          const showCompletedTick =
                            !isErrorStep &&
                            (step.state === "complete" || step.key === "refunded");

                          return (
                            <div
                              key={`${order.id}-${step.key}`}
                              className="relative flex gap-4 pb-7 last:pb-0 md:gap-7 md:pb-10"
                            >
                              {index !== steps.length - 1 ? (
                                <div
                                  className={`absolute left-[10px] top-[22px] bottom-0 w-px md:left-[12px] md:top-[26px] ${
                                    nextStepReached
                                      ? "bg-[#8bc53f]"
                                      : "bg-[repeating-linear-gradient(to_bottom,#bdbdbd_0,#bdbdbd_3px,transparent_3px,transparent_6px)]"
                                  }`}
                                />
                              ) : null}

                              <div className="relative z-10 shrink-0">
                                {isErrorStep ? (
                                  <XCircle
                                    size={22}
                                    className="rounded-full text-[#c83b3b]"
                                  />
                                ) : showCompletedTick ? (
                                  <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#8bc53f] text-white">
                                    <Check size={14} strokeWidth={3} />
                                  </span>
                                ) : (
                                  <Circle
                                    size={22}
                                    className="rounded-full text-[#8bc53f]"
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1 pt-0.5">
                                <p className="text-[0.95rem] font-semibold text-[#353535] md:text-[1.15rem]">
                                  {step.title}
                                </p>
                                <p className="mt-3 text-[0.92rem] leading-6 text-[#4b4b4b] md:mt-7 md:text-[1.05rem]">
                                  {step.message}
                                </p>
                                {step.timestamp ? (
                                  <p className="mt-1 text-[11px] text-[#9a9a9a] md:text-sm">
                                    {formatTrackingDetailDate(step.timestamp)}
                                  </p>
                                ) : null}
                                {step.secondaryMessage ? (
                                  <p className="mt-3 text-[0.92rem] leading-6 text-[#4b4b4b] md:mt-4 md:text-[1.05rem]">
                                    {step.secondaryMessage}
                                  </p>
                                ) : null}
                                {step.secondaryTimestamp ? (
                                  <p className="mt-1 text-[11px] text-[#9a9a9a] md:text-sm">
                                    {formatTrackingDetailDate(step.secondaryTimestamp)}
                                  </p>
                                ) : null}
                                {step.actionLabel ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (step.actionType === "open_refund_form") {
                                        setRefundError(null);
                                        setIsRefundFormOpen(true);
                                        return;
                                      }

                                      setIsRefundDetailsOpen(true);
                                    }}
                                    className="mt-3 inline-flex rounded-[0.45rem] bg-[#4f8f5f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#447c52] md:mt-4 md:px-4 md:text-sm"
                                  >
                                    {step.actionLabel}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {reviewProduct ? (
                      <div className="p-0 md:p-4">
                        <OrderReviewPrompt
                          productId={reviewProduct.productId}
                          productName={reviewProduct.productName}
                        />
                      </div>
                    ) : null}
                </div>
                </article>
              </div>
            )}
          </div>
        </section>
      </div>
      {isRefundFormOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Close refund account form"
            className="absolute inset-0"
            onClick={() => setIsRefundFormOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-[1.6rem] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-3xl font-medium text-[#2f2f2f]">
                  Account Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRefundFormOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dce8ce] text-[#46653f]"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-4 border-t border-[#dddddd]" />

            <form className="mt-6 space-y-5" onSubmit={handleRefundAccountSubmit}>
              <label className="block">
                <span className="text-sm text-[#6f6f6f]">Name as on Account</span>
                <input
                  value={refundForm.accountHolderName}
                  onChange={(event) =>
                    setRefundForm((current) => ({
                      ...current,
                      accountHolderName: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-none border border-[#d7d7d7] px-4 py-3 text-base text-[#2f2f2f] outline-none focus:border-[#93cf9e]"
                />
              </label>

              <label className="block">
                <span className="text-sm text-[#6f6f6f]">Bank Name</span>
                <input
                  value={refundForm.bankName}
                  onChange={(event) =>
                    setRefundForm((current) => ({
                      ...current,
                      bankName: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-none border border-[#d7d7d7] px-4 py-3 text-base text-[#2f2f2f] outline-none focus:border-[#93cf9e]"
                />
              </label>

              <label className="block">
                <span className="text-sm text-[#6f6f6f]">Account Number</span>
                <input
                  value={refundForm.accountNumber}
                  onChange={(event) =>
                    setRefundForm((current) => ({
                      ...current,
                      accountNumber: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-none border border-[#d7d7d7] px-4 py-3 text-base text-[#2f2f2f] outline-none focus:border-[#93cf9e]"
                />
              </label>

              <label className="block">
                <span className="text-sm text-[#6f6f6f]">Confirm Account Number</span>
                <input
                  value={refundForm.confirmAccountNumber}
                  onChange={(event) =>
                    setRefundForm((current) => ({
                      ...current,
                      confirmAccountNumber: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-none border border-[#d7d7d7] px-4 py-3 text-base text-[#2f2f2f] outline-none focus:border-[#93cf9e]"
                />
              </label>

              <label className="block">
                <span className="text-sm text-[#6f6f6f]">IFSC Code</span>
                <input
                  value={refundForm.ifscCode}
                  onChange={(event) =>
                    setRefundForm((current) => ({
                      ...current,
                      ifscCode: event.target.value.toUpperCase(),
                    }))
                  }
                  className="mt-2 w-full rounded-none border border-[#d7d7d7] px-4 py-3 text-base uppercase text-[#2f2f2f] outline-none focus:border-[#93cf9e]"
                />
              </label>

              {refundError ? (
                <p className="text-sm font-medium text-[#b43f2a]">{refundError}</p>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={refundSubmitting}
                  className="inline-flex min-w-[160px] items-center justify-center bg-[#8ed59d] px-6 py-3 text-xl font-medium text-[#163915] transition hover:bg-[#7ecc90] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {refundSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isRefundDetailsOpen && refundAccountDetails ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Close refund account details"
            className="absolute inset-0"
            onClick={() => setIsRefundDetailsOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl rounded-[1.6rem] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-3xl font-medium text-[#2f2f2f]">
                  Account Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRefundDetailsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dce8ce] text-[#46653f]"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-4 border-t border-[#dddddd]" />

            <div className="mt-6 space-y-4 text-[#2f2f2f]">
              <div>
                <p className="text-sm text-[#6f6f6f]">Name as on Account</p>
                <p className="mt-2 text-lg">{refundAccountDetails.accountHolderName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-[#6f6f6f]">Bank Name</p>
                <p className="mt-2 text-lg">{refundAccountDetails.bankName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-[#6f6f6f]">Account Number</p>
                <p className="mt-2 text-lg">{refundAccountDetails.accountNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-[#6f6f6f]">IFSC Code</p>
                <p className="mt-2 text-lg uppercase">{refundAccountDetails.ifscCode || "-"}</p>
              </div>
              {order?.refundRequestNote ? (
                <div>
                  <p className="text-sm text-[#6f6f6f]">Admin Note</p>
                  <p className="mt-2 text-base">{order.refundRequestNote}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      </>
    </SiteShell>
  );
}
