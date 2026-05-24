"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgePercent, Check, Loader2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCartStore } from "@/components/cartStore";
import CheckoutPageFooter from "@/components/checkout/CheckoutPageFooter";
import SiteShell from "@/components/SiteShell";
import { useProductsStore } from "@/components/productsStore";
import type { ApiResponse } from "@/lib/api";
import {
  cleanupPaymentGatewayReturnUrl,
  clearPaymentGatewayCheckoutSession,
  getPaymentGatewayReturnState,
  openPaymentGatewayCheckout,
  readPaymentGatewayCheckoutSession,
  writePaymentGatewayCheckoutSession,
  type PaymentGatewayMode,
} from "@/lib/paymentGatewayCheckout";
import {
  buildCheckoutDeliveryAddressPayload,
  formatDeliveryAddress,
} from "@/lib/deliveryAddress";
import {
  normalizeBillingDetailsDraft,
  readBillingDetailsDraft,
  readCheckoutDraft,
  type CheckoutPosition,
} from "@/lib/checkoutSession";

type Step = 1 | 2 | 3;

type CheckoutPreview = {
  pricing: {
    itemsSubtotal: number;
    itemsSubtotalAfterCoupon?: number;
    deliveryCharge: number;
    totalBeforeCoupon?: number;
    total: number;
    couponCode?: string;
    couponType?: string;
    couponDiscountValue?: number;
    couponAdjustAmount?: number;
    couponDiscountPercent?: number;
    currency: string;
    distanceKm: number;
    deliveryRate: number;
    totalWeightKg: number;
  };
  summary: {
    itemCount: number;
    totalQuantity: number;
    totalWeightKg: number;
    itemsSubtotal: number;
    currency: string;
  };
  deliveryChargeDetails: {
    message: string;
    rate: number;
    units: number | null;
  };
  appliedCoupon?: {
    id: string;
    code: string;
    type: "adjust" | "discount";
    adjustAmount: number;
    discountPercent: number;
    discountValue: number;
  } | null;
  suggestedDeliveryDate: string;
};

type PaymentGatewayCheckout = {
  paymentAttemptId: string;
  provider: string;
  merchantOrderId: string;
  gatewayOrderId: string;
  redirectUrl: string;
  paymentSessionId?: string;
  amount: number;
  currency: string;
  businessName: string;
  description: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  mode: PaymentGatewayMode;
  returnUrl: string;
};

type CheckoutPaymentMethod = "cash_on_delivery" | "online_payment" | "emi";

type PaymentAttemptStatus = {
  id: string;
  status: string;
  statusLabel: string;
  orderId: string | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
};

const steps: { id: Step; label: string }[] = [
  { id: 1, label: "Billing Details" },
  { id: 2, label: "Order Summary" },
  { id: 3, label: "Payment" },
];

function formatInvoiceAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function hasPosition(position: CheckoutPosition | null | undefined): position is CheckoutPosition {
  return Boolean(
    position &&
      Number.isFinite(Number(position.lat)) &&
      Number.isFinite(Number(position.lng)),
  );
}

function sleep(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

export default function OrderSummaryClient() {
  const router = useRouter();
  const [currentStep] = useState<Step>(2);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [couponDraft, setCouponDraft] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState("");
  const [couponError, setCouponError] = useState("");
  const [persistCouponError, setPersistCouponError] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasHandledGatewayReturn, setHasHandledGatewayReturn] = useState(false);
  const [checkoutDraft] = useState(() => readCheckoutDraft());
  const [billingDetailsDraft] = useState(() => readBillingDetailsDraft());
  const { fetchWithAuth, isAuthenticated, isReady: isAuthReady, user } = useAuth();
  const {
    items: cartItems,
    isLoading: isCartLoading,
    isReady: isCartReady,
  } = useCartStore();
  const {
    isLoading: isProductsLoading,
    isReady: areProductsReady,
    products,
  } = useProductsStore();

  const deliveryAddress =
    checkoutDraft?.deliveryAddress?.trim() ||
    formatDeliveryAddress(checkoutDraft?.deliveryAddressDetails) ||
    "";
  const deliveryPosition = checkoutDraft?.deliveryPosition || null;
  const deliveryAddressDetails = checkoutDraft?.deliveryAddressDetails || null;

  const items = useMemo(
    () =>
      cartItems.flatMap((item) => {
        const product = products.find((entry) => entry.id === item.productId);

        if (!product) {
          return [];
        }

        return [
          {
            ...item,
            amount: product.price * item.quantity,
            product,
          },
        ];
      }),
    [cartItems, products],
  );

  const isLoading =
    !isAuthReady ||
    !isCartReady ||
    isCartLoading ||
    !areProductsReady ||
    isProductsLoading;
  const billingDetails = normalizeBillingDetailsDraft(
    Object.values(billingDetailsDraft).some(Boolean)
      ? billingDetailsDraft
      : user?.billingDetails,
  );
  const billingName = billingDetails.name.trim() || user?.fullName || "Customer";
  const billingAddress = billingDetails.address.trim();
  const billingContact = billingDetails.contact.trim() || user?.phoneNumber || "";
  const billingLocation = [billingDetails.city, billingDetails.state]
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.replace("/auth?next=/order-summary");
    }
  }, [isAuthReady, isAuthenticated, router]);

  const pollPaymentAttempt = useCallback(
    async (paymentAttemptId: string) => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await fetchWithAuth<ApiResponse<{ paymentAttempt: PaymentAttemptStatus }>>(
          `/payments/attempts/${paymentAttemptId}`,
        );
        const paymentAttempt = response.data.paymentAttempt;

        if (paymentAttempt.status === "completed" && paymentAttempt.orderId) {
          clearPaymentGatewayCheckoutSession();
          cleanupPaymentGatewayReturnUrl();
          router.replace(`/order-success/${encodeURIComponent(paymentAttempt.orderId)}`);
          return true;
        }

        if (paymentAttempt.status === "failed") {
          clearPaymentGatewayCheckoutSession();
          cleanupPaymentGatewayReturnUrl();
          setStatusMessage("Payment failed before order confirmation. Please try again.");
          return false;
        }

        await sleep(1200);
      }

      setStatusMessage(
        "Payment was submitted. We are waiting for secure verification from the server webhook.",
      );
      return false;
    },
    [fetchWithAuth, router],
  );

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated || hasHandledGatewayReturn) {
      return;
    }

    const returnState = getPaymentGatewayReturnState();
    const persistedCheckout = readPaymentGatewayCheckoutSession();
    const paymentAttemptId =
      returnState.paymentAttemptId || persistedCheckout?.paymentAttemptId || "";

    if (!returnState.isReturn || !paymentAttemptId) {
      return;
    }

    let isActive = true;
    setIsSubmitting(true);
    setStatusMessage("Waiting for secure payment verification from the server...");

    void (async () => {
      try {
        await pollPaymentAttempt(paymentAttemptId);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Payment was submitted, but confirmation is still pending.",
        );
      } finally {
        if (!isActive) {
          return;
        }

        cleanupPaymentGatewayReturnUrl();
        setIsSubmitting(false);
        setHasHandledGatewayReturn(true);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [
    fetchWithAuth,
    hasHandledGatewayReturn,
    isAuthReady,
    isAuthenticated,
    pollPaymentAttempt,
  ]);

  const canRequestPreview =
    isAuthenticated && hasPosition(deliveryPosition) && Boolean(deliveryAddress) && items.length > 0;

  useEffect(() => {
    if (!canRequestPreview) {
      return;
    }

    let isActive = true;
    setStatusMessage("");
    setPreviewError("");

    void fetchWithAuth<ApiResponse<{ preview: CheckoutPreview }>>("/checkout/preview", {
      method: "POST",
      body: JSON.stringify({
        deliveryAddress: buildCheckoutDeliveryAddressPayload(
          deliveryAddress,
          deliveryAddressDetails,
          user?.deliveryAddress,
        ),
        deliveryLocation: deliveryPosition,
        couponCode: appliedCouponCode || undefined,
      }),
    })
      .then((response) => {
        if (isActive) {
          setPreview(response.data.preview);
          const appliedCouponCodeFromResponse =
            response.data.preview.appliedCoupon?.code || "";
          const hasAppliedCouponInResponse = Boolean(appliedCouponCodeFromResponse);
          if (hasAppliedCouponInResponse || !persistCouponError) {
            setCouponError("");
          }
          if (hasAppliedCouponInResponse) {
            setPersistCouponError(false);
          }
          setCouponFeedback(
            hasAppliedCouponInResponse
              ? `Coupon ${appliedCouponCodeFromResponse} applied successfully.`
              : appliedCouponCode
                ? "Coupon removed."
                : "",
          );
        }
      })
      .catch((error) => {
        if (isActive) {
          setCouponFeedback("");
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load the latest checkout summary.";

          if (appliedCouponCode) {
            setCouponError(message);
            setPersistCouponError(true);
            setAppliedCouponCode("");
            return;
          }

          setPreview(null);
          setPreviewError(message);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    canRequestPreview,
    deliveryAddress,
    deliveryAddressDetails,
    deliveryPosition,
    fetchWithAuth,
    isAuthenticated,
    items.length,
    appliedCouponCode,
    persistCouponError,
    user?.deliveryAddress,
  ]);

  const effectivePreview = canRequestPreview ? preview : null;

  async function handleContinue(paymentMethod: CheckoutPaymentMethod) {
    if (!effectivePreview || !hasPosition(deliveryPosition) || !deliveryAddress) {
      router.push("/cart");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    const payload = {
      deliveryAddress: buildCheckoutDeliveryAddressPayload(
        deliveryAddress,
        deliveryAddressDetails,
        user?.deliveryAddress,
      ),
      deliveryLocation: deliveryPosition,
      billingDetails,
      deliveryDate: effectivePreview.suggestedDeliveryDate,
      returnPath: "/order-summary",
      couponCode: appliedCouponCode || undefined,
      paymentMethod,
    };

    try {
      if (paymentMethod === "cash_on_delivery") {
        const response = await fetchWithAuth<ApiResponse<{ order: { id: string } }>>("/checkout/cod", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        router.replace(`/order-success/${encodeURIComponent(response.data.order.id)}`);
        setIsSubmitting(false);
        return;
      }

      const response =
        await fetchWithAuth<ApiResponse<{ checkout: PaymentGatewayCheckout }>>(
          "/checkout/online",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );

      const checkout = response.data.checkout;
      writePaymentGatewayCheckoutSession({
        paymentAttemptId: checkout.paymentAttemptId,
        returnPath: "/order-summary",
      });

      await openPaymentGatewayCheckout({
        provider: checkout.provider,
        redirectUrl: checkout.redirectUrl,
        paymentSessionId: checkout.paymentSessionId,
        mode: checkout.mode,
        returnUrl: checkout.returnUrl,
      });

      setIsSubmitting(false);
      return;
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to continue with online payment.",
      );
    }

    setIsSubmitting(false);
  }

  if (isAuthReady && !isAuthenticated) {
    return null;
  }

  const couponDiscountValue = Math.max(
    0,
    Number(effectivePreview?.pricing.couponDiscountValue || 0),
  );
  const hasAppliedCoupon = Boolean(effectivePreview?.appliedCoupon?.code);
  const itemsSubtotal = Number(effectivePreview?.pricing.itemsSubtotal || 0);
  const itemsSubtotalAfterCoupon = Number(
    effectivePreview?.pricing.itemsSubtotalAfterCoupon ?? itemsSubtotal,
  );
  const totalBeforeCoupon = Number(
    effectivePreview?.pricing.totalBeforeCoupon ?? effectivePreview?.pricing.total ?? 0,
  );
  const totalAfterCoupon = Number(effectivePreview?.pricing.total || 0);
  const savingsAmount = Math.max(
    couponDiscountValue,
    totalBeforeCoupon > 0 ? totalBeforeCoupon - totalAfterCoupon : 0,
  );
  const hasProductSubtotalDiscount = itemsSubtotalAfterCoupon < itemsSubtotal;
  const paymentAccess = user?.paymentAccess || {
    cashOnDelivery: true,
    onlinePayment: true,
    emi: false,
  };
  const preferredPaymentMethod: CheckoutPaymentMethod | null =
    paymentAccess.onlinePayment
      ? "online_payment"
      : paymentAccess.emi
        ? "emi"
        : null;

  return (
    <SiteShell hideHeader hideMobileBottomNav>
      <section className="min-h-screen bg-white px-4 pb-28 pt-[5.5rem] sm:px-6 sm:pt-24 md:px-6 md:pb-10 md:pt-28">
        <div className="fixed inset-x-0 top-0 z-40 border-b border-[#e8ece3] bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 md:px-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0E0] text-[#173d12] transition hover:bg-[#dcead2]"
              aria-label="Go back"
            >
              <ArrowLeft size={21} />
            </button>
            <h1 className="text-lg font-semibold text-[#173d12] sm:text-xl">
              Order Summary
            </h1>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[660px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:px-6">
          <div className="mx-auto flex max-w-2xl items-start px-4 pb-7 pt-2 sm:px-6 md:px-8 md:pt-6">
            {steps.map((step, index) => {
              const active = step.id === currentStep;
              const done = step.id < currentStep;

              return (
                <div key={step.id} className="flex flex-1 items-start last:flex-none">
                  <div className="flex min-w-[54px] flex-col items-center gap-2 sm:min-w-[60px]">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${active ? "border-2 border-[#C5D6B5] bg-[#4c8b5d] text-white shadow-[0_0_0_2px_rgba(76,139,93,0.18)]" : done ? "bg-[#4c8b5d] text-white" : "bg-[#E8F0E0] text-[#1A1F14]"}`}>
                      {done ? <Check size={18} strokeWidth={3} /> : step.id}
                    </div>
                    <span className={`text-center text-[10px] leading-tight md:text-xs ${active ? "font-semibold text-[#4c8b5d]" : done ? "font-medium text-[#4c8b5d]" : "font-medium text-[#1A1F14]"}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`mx-1 mt-[18px] h-0.5 flex-1 sm:mx-3 md:mx-4 ${done ? "bg-[#4c8b5d]" : "bg-[#D8DDD0]"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {isLoading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center border border-[#dddddd] bg-white text-center">
              <Loader2 className="animate-spin text-[#214f14]" size={30} />
              <p className="mt-4 text-sm font-bold text-[#163915]">
                Preparing your order summary
              </p>
            </div>
          ) : !items.length ? (
            <div className="border border-[#dddddd] bg-white p-8 text-center">
              <ShoppingCart className="mx-auto text-[#214f14]" size={32} />
              <h2 className="mt-4 text-xl font-semibold text-[#163915]">
                Your cart is empty
              </h2>
              <Link
                href="/cart"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#214f14] px-6 text-sm font-bold text-white"
              >
                Return to cart
              </Link>
            </div>
          ) : (
            <>
              <section className="overflow-hidden rounded-t-lg border border-[#e3e3e3] bg-white">
                <div className="bg-[#f0f0f080] px-3 py-2">
                  <h2 className="text-[18px] font-semibold leading-5 text-black">
                    Bill to :
                  </h2>
                </div>
                <div className="px-3 py-3 text-[12px] leading-[1.25] text-black">
                  <p>{billingName}</p>
                  {billingAddress ? <p>{billingAddress}</p> : null}
                  {billingLocation ? <p>{billingLocation}</p> : null}
                  {billingContact ? <p>contact - {billingContact}</p> : null}
                  {billingDetails.gstin.trim() ? (
                    <p>GSTIN - {billingDetails.gstin.trim()}</p>
                  ) : null}
                  {user?.email ? <p>Email - {user.email}</p> : null}
                </div>

                <div className="bg-[#f0f0f080] px-3 py-2">
                  <h2 className="text-[18px] font-semibold leading-5 text-black">
                    Ship to :
                  </h2>
                </div>
                <div className="min-h-[70px] px-3 py-3 text-[12px] leading-[1.25] text-black">
                  {deliveryAddress || "Delivery address not available."}
                </div>
              </section>

              <section className="mt-4 overflow-hidden rounded-b-lg border border-[#e3e3e3] bg-white">
                <div className="grid grid-cols-[minmax(0,1fr)_88px_96px] bg-[#f0f0f080] px-3 py-2 text-[14px] font-semibold text-black">
                  <span>Items</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-right">Amount</span>
                </div>

                <div className="px-3">
                  {items.map((item) => (
                    <article
                      key={item.product.id}
                      className="grid min-h-[62px] grid-cols-[minmax(0,1fr)_88px_96px] items-center border-b border-[#bfbfbf] py-3 text-[12px] last:border-b-0"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="line-clamp-2 font-medium leading-tight text-black">
                          {item.product.name}
                        </p>
                        <p className="mt-1 text-[11px] leading-tight text-black">
                          Rs. {formatInvoiceAmount(item.product.price)}
                        </p>
                      </div>
                      <div className="text-center text-[16px] font-normal text-black">
                        {item.quantity} {item.product.unit || "pcs."}
                      </div>
                      <div className="text-right text-[16px] font-normal text-black">
                        {formatInvoiceAmount(item.amount)}
                      </div>
                    </article>
                  ))}
                </div>

                <div className=" px-3 pt-8">
                  <div className="border-b border-[#bfbfbf] pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm md:text-sm font-semibold leading-5 text-[#3c63b5]">
                        Have a coupon?
                      </p>
                      {hasAppliedCoupon ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCouponCode("");
                            setCouponDraft("");
                            setCouponFeedback("Coupon removed.");
                          }}
                          className="text-[12px] font-bold text-[#214f14]"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={couponDraft}
                        onChange={(event) => {
                          setCouponDraft(event.target.value.toUpperCase());
                          setCouponError("");
                          setPersistCouponError(false);
                        }}
                        placeholder="Enter coupon code"
                        className="h-11 flex-1 rounded-md border border-[#d7d7d7] px-3 text-[13px] font-medium text-black outline-none focus:border-[#214f14]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCouponCode(couponDraft.trim().toUpperCase());
                          setCouponFeedback("");
                          setCouponError("");
                          setPersistCouponError(false);
                          setPreviewError("");
                        }}
                        disabled={!couponDraft.trim()}
                        className="h-11 rounded-md bg-[#4c8b5d] px-4 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Apply
                      </button>
                    </div>
                    {couponFeedback ? (
                      <p className="mt-2 text-[11px] font-semibold text-[#214f14]">
                        {couponFeedback}
                      </p>
                    ) : null}
                    {couponError ? (
                      <p className="mt-2 text-[11px] font-semibold text-[#b42318]">
                        {couponError}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex justify-between gap-4 border-b border-[#bfbfbf] py-3 text-[14px] text-black">
                    <span className="font-semibold">Sub total</span>
                    <span>{formatInvoiceAmount(itemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#bfbfbf] py-3 text-[14px] text-black">
                    <span className="font-semibold">Tax</span>
                    <span>{formatInvoiceAmount(0)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#bfbfbf] py-3 text-[14px] text-black">
                    <span className="font-semibold">Delivery charge</span>
                    <span>
                      {effectivePreview
                        ? formatInvoiceAmount(effectivePreview.pricing.deliveryCharge)
                        : "Required"}
                    </span>
                  </div>
                  {hasAppliedCoupon ? (
                    <>
                      <div className="flex justify-between gap-4 border-b border-[#bfbfbf] py-3 text-[14px] text-black">
                        <span className="font-semibold">Total amount</span>
                        <span>{formatInvoiceAmount(totalBeforeCoupon)}</span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-[#bfbfbf] py-3 text-[14px] text-[#214f14]">
                        <span className="font-semibold">Coupon Discount</span>
                        <span>-{formatInvoiceAmount(couponDiscountValue)}</span>
                      </div>
                      {hasProductSubtotalDiscount ? (
                        <div className="flex justify-between gap-4 border-b border-[#bfbfbf] py-3 text-[14px] text-black">
                          <span className="font-semibold">Sub total after coupon</span>
                          <span>{formatInvoiceAmount(itemsSubtotalAfterCoupon)}</span>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>

                <div className="flex justify-between gap-4 bg-[#e8e8e870] px-3 py-4 text-[14px] font-semibold text-black">
                  <span>Payable amount</span>
                  <span>
                    {effectivePreview ? formatInvoiceAmount(totalAfterCoupon) : "---"}
                  </span>
                </div>
              </section>

              {hasAppliedCoupon && savingsAmount > 0 ? (
                <div className="mt-3 text-center text-[#1f8a3b]">
                  <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
                    <BadgePercent size={14} strokeWidth={2.2} />
                    <span>You saved {formatInvoiceAmount(savingsAmount)}</span>
                  </p>
                </div>
              ) : null}

              {!hasPosition(deliveryPosition) ? (
                <div className="px-2 py-4 text-center">
                  <Link
                    href="/cart"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#d6e6bd] bg-white px-5 text-xs font-semibold text-[#214f14]"
                  >
                    Select delivery location in cart
                  </Link>
                </div>
              ) : null}

              {previewError ? (
                <p className="mx-auto mt-3 max-w-[360px] rounded-lg bg-[#fff6f5] px-3 py-2 text-center text-xs font-semibold leading-5 text-[#b42318]">
                  {previewError}
                </p>
              ) : null}

              {statusMessage ? (
                <p className="mx-auto mt-3 max-w-[360px] rounded-lg bg-[#f4fbf2] px-3 py-2 text-center text-xs font-semibold leading-5 text-[#214f14]">
                  {statusMessage}
                </p>
              ) : null}

              {!preferredPaymentMethod ? (
                <p className="mx-auto mt-3 max-w-[360px] rounded-lg bg-[#fff6f5] px-3 py-2 text-center text-xs font-semibold leading-5 text-[#b42318]">
                  Online checkout is not enabled for this account right now. Please contact support.
                </p>
              ) : null}

              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e3e3e3] bg-white px-3 py-3 md:px-0 shadow-[0_-10px_28px_rgba(36,54,27,0.12)] sm:static sm:mt-5 sm:border-t-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                <div className="mx-auto grid w-full max-w-full grid-cols-[minmax(0,1fr)] gap-4 md:pb-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
                  <div className="min-w-0 py-1">
                    <span className="block text-sm font-medium text-[#4c8b5d]">
                      Total payable
                    </span>
                    <span className="block break-all text-[2.2rem] font-medium leading-none text-[#4c8b5d] sm:text-2xl">
                      {effectivePreview ? formatInvoiceAmount(totalAfterCoupon) : "---"}
                    </span>
                  </div>
                  {preferredPaymentMethod ? (
                    <button
                      type="button"
                      onClick={() => void handleContinue(preferredPaymentMethod)}
                      disabled={!effectivePreview || isSubmitting}
                      className="inline-flex h-[52px] items-center justify-center rounded-[0.85rem] bg-[#4c8b5d] px-6 text-[1.2rem] font-medium text-white transition hover:bg-[#427a50] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:h-[60px] sm:text-[1.35rem]"
                    >
                      {isSubmitting ? "Processing..." : "Continue"}
                    </button>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
        <footer className="hidden">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#1f2a18]">
            We Accept
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {["Visa", "Mastercard", "Amex", "Discover", "PayPal"].map(
              (paymentMethod) => (
                <span
                  key={paymentMethod}
                  className="inline-flex min-w-[88px] items-center justify-center rounded-lg border border-[#d7dccf] bg-white px-4 py-2 text-sm font-semibold text-[#304624] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                >
                  {paymentMethod}
                </span>
              ),
            )}
          </div>
          <p className="mt-4 pb-6 text-xs font-medium tracking-[0.08em] text-[#5a6550]">
            Copyright © ShadyPlant. All rights reserved.
          </p>
        </footer>
        <footer className="hidden">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#1f2a18]">
            We Accept
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {["Visa", "Mastercard", "Amex", "Discover", "PayPal"].map(
              (paymentMethod) => (
                <span
                  key={paymentMethod}
                  className="inline-flex min-w-[88px] items-center justify-center rounded-lg border border-[#d7dccf] bg-white px-4 py-2 text-sm font-semibold text-[#304624] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                >
                  {paymentMethod}
                </span>
              ),
            )}
          </div>
          <p className="mt-4 pb-6 text-xs font-medium tracking-[0.08em] text-[#5a6550]">
            Copyright {"\u00A9"} ShadyPlant. All rights reserved.
          </p>
        </footer>
        <CheckoutPageFooter />
      </section>
    </SiteShell>
  );
}
