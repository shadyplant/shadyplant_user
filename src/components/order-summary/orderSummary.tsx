"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCartStore } from "@/components/cartStore";
import SiteShell from "@/components/SiteShell";
import { useProductsStore } from "@/components/productsStore";
import type { ApiResponse } from "@/lib/api";
import {
  cleanupCashfreeReturnUrl,
  clearCashfreeCheckoutSession,
  getCashfreeReturnState,
  loadCashfreeSdk,
  openCashfreeCheckout,
  readCashfreeCheckoutSession,
  writeCashfreeCheckoutSession,
  type CashfreeMode,
} from "@/lib/cashfreeCheckout";
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
    deliveryCharge: number;
    total: number;
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
  suggestedDeliveryDate: string;
};

type CashfreeCheckout = {
  paymentAttemptId: string;
  paymentSessionId: string;
  orderId: string;
  cfOrderId: string;
  amount: number;
  currency: string;
  businessName: string;
  description: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  mode: CashfreeMode;
  returnUrl: string;
  shouldSimulateWebhook: boolean;
};

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
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasHandledCashfreeReturn, setHasHandledCashfreeReturn] = useState(false);
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
          `/payments/cashfree/attempts/${paymentAttemptId}`,
        );
        const paymentAttempt = response.data.paymentAttempt;

        if (paymentAttempt.status === "completed" && paymentAttempt.orderId) {
          clearCashfreeCheckoutSession();
          cleanupCashfreeReturnUrl();
          router.push("/order");
          return true;
        }

        if (paymentAttempt.status === "failed") {
          clearCashfreeCheckoutSession();
          cleanupCashfreeReturnUrl();
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
    if (!isAuthReady || !isAuthenticated || hasHandledCashfreeReturn) {
      return;
    }

    const returnState = getCashfreeReturnState();
    const persistedCheckout = readCashfreeCheckoutSession();
    const paymentAttemptId =
      returnState.paymentAttemptId || persistedCheckout?.paymentAttemptId || "";

    if (!returnState.isReturn || !paymentAttemptId) {
      return;
    }

    let isActive = true;
    setIsSubmitting(true);
    setStatusMessage("Confirming your payment securely...");

    void (async () => {
      try {
        if (
          persistedCheckout?.paymentAttemptId === paymentAttemptId &&
          persistedCheckout.shouldSimulateWebhook
        ) {
          await fetchWithAuth(`/payments/cashfree/test-webhook/${paymentAttemptId}`, {
            method: "POST",
          });
        } else {
          await fetchWithAuth<ApiResponse<{ paymentAttempt: PaymentAttemptStatus }>>(
            `/payments/cashfree/attempts/${paymentAttemptId}/verify`,
            {
              method: "POST",
            },
          );
        }

        if (!isActive) {
          return;
        }

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

        cleanupCashfreeReturnUrl();
        setIsSubmitting(false);
        setHasHandledCashfreeReturn(true);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [
    fetchWithAuth,
    hasHandledCashfreeReturn,
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

    void fetchWithAuth<ApiResponse<{ preview: CheckoutPreview }>>("/checkout/preview", {
      method: "POST",
      body: JSON.stringify({
        deliveryAddress: buildCheckoutDeliveryAddressPayload(
          deliveryAddress,
          deliveryAddressDetails,
          user?.deliveryAddress,
        ),
        deliveryLocation: deliveryPosition,
      }),
    })
      .then((response) => {
        if (isActive) {
          setPreview(response.data.preview);
        }
      })
      .catch((error) => {
        if (isActive) {
          setPreview(null);
          setPreviewError(
            error instanceof Error
              ? error.message
              : "Unable to load the latest checkout summary.",
          );
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
    user?.deliveryAddress,
  ]);

  const effectivePreview = canRequestPreview ? preview : null;

  async function handleContinue() {
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
    };

    try {
      const scriptLoaded = await loadCashfreeSdk();
      if (!scriptLoaded || !window.Cashfree) {
        throw new Error("Cashfree checkout failed to load.");
      }

      const response = await fetchWithAuth<ApiResponse<{ checkout: CashfreeCheckout }>>(
        "/checkout/online",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      const checkout = response.data.checkout;
      writeCashfreeCheckoutSession({
        paymentAttemptId: checkout.paymentAttemptId,
        shouldSimulateWebhook: checkout.shouldSimulateWebhook,
        returnPath: "/order-summary",
      });

      await openCashfreeCheckout({
        mode: checkout.mode,
        paymentSessionId: checkout.paymentSessionId,
      });

      setIsSubmitting(false);
      return;
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to continue with Cashfree checkout.",
      );
    }

    setIsSubmitting(false);
  }

  if (isAuthReady && !isAuthenticated) {
    return null;
  }

  return (
    <SiteShell hideMobileHeader hideMobileBottomNav>
      <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-[#eeeeee] bg-white px-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-7 items-center justify-center text-[#111111]"
          aria-label="Go back"
        >
          <ArrowLeft size={21} strokeWidth={1.8} />
        </button>
        <h1 className="text-[15px] font-semibold text-[#111111]">
          Order summary
        </h1>
      </div>

      <section className="min-h-screen bg-white px-4 pb-28 pt-6 sm:px-6 md:py-8">
        <div className="mx-auto w-full max-w-[520px]">
          <div className="mx-auto flex max-w-2xl items-start px-1 pb-7 pt-2 sm:px-6 md:pt-6">
            {steps.map((step, index) => {
              const active = step.id === currentStep;
              const done = step.id < currentStep;

              return (
                <div key={step.id} className="flex flex-1 items-start last:flex-none">
                  <div className="flex min-w-[54px] flex-col items-center gap-2 sm:min-w-[60px]">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${active ? "border-2 border-[#C5D6B5] bg-[#2f6427] text-white shadow-[0_0_0_2px_rgba(47,100,39,0.18)]" : done ? "bg-[#6B9E3E] text-white" : "bg-[#E8F0E0] text-[#1A1F14]"}`}>
                      {done ? <CheckCircle2 size={18} /> : step.id}
                    </div>
                    <span className={`text-center text-[10px] leading-tight md:text-xs ${active ? "font-semibold text-[#14721c]" : "font-medium text-[#1A1F14]"}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`mx-1 mt-[18px] h-0.5 flex-1 sm:mx-3 md:mx-4 ${done ? "bg-[#6B9E3E]" : "bg-[#D8DDD0]"}`} />
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
              <h2 className="mt-4 text-xl font-black text-[#163915]">
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
                <div className="bg-[#f0f0f0] px-3 py-2">
                  <h2 className="text-[18px] font-black leading-5 text-black">
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

                <div className="bg-[#f0f0f0] px-3 py-2">
                  <h2 className="text-[18px] font-black leading-5 text-black">
                    Ship to :
                  </h2>
                </div>
                <div className="min-h-[70px] px-3 py-3 text-[12px] leading-[1.25] text-black">
                  {deliveryAddress || "Delivery address not available."}
                </div>
              </section>

              <section className="mt-4 overflow-hidden rounded-b-lg border border-[#e3e3e3] bg-white">
                <div className="grid grid-cols-[minmax(0,1fr)_88px_96px] bg-[#f0f0f0] px-3 py-2 text-[14px] font-black text-black">
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

                <div className="bg-[#fafafa] px-3 pt-8">
                  <div className="flex justify-between gap-4 border-b border-[#bfbfbf] py-3 text-[14px] text-black">
                    <span className="font-black">Sub total</span>
                    <span>{formatInvoiceAmount(effectivePreview?.pricing.itemsSubtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#bfbfbf] py-3 text-[14px] text-black">
                    <span className="font-black">Tax</span>
                    <span>{formatInvoiceAmount(0)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#bfbfbf] py-3 text-[14px] text-black">
                    <span className="font-black">Delivery charge</span>
                    <span>
                      {effectivePreview
                        ? formatInvoiceAmount(effectivePreview.pricing.deliveryCharge)
                        : "Required"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between gap-4 bg-[#e8e8e8] px-3 py-4 text-[14px] font-black text-black">
                  <span>Payable amount</span>
                  <span>
                    {effectivePreview
                      ? formatInvoiceAmount(effectivePreview.pricing.total)
                      : "---"}
                  </span>
                </div>
              </section>

              {!hasPosition(deliveryPosition) ? (
                <div className="px-2 py-4 text-center">
                  <Link
                    href="/cart"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#d6e6bd] bg-white px-5 text-xs font-black text-[#214f14]"
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

              {effectivePreview ? (
                <p className="mx-auto mt-4 max-w-[360px] text-center text-[11px] leading-5 text-[#666666]">
                  Delivery distance {effectivePreview.pricing.distanceKm.toFixed(2)} km.
                  {` `}
                  Chargeable weight {effectivePreview.summary.totalWeightKg} kg.
                  {` `}
                  Server pricing is recalculated at payment time, so the frontend cannot override totals.
                </p>
              ) : null}

              {statusMessage ? (
                <p className="mx-auto mt-3 max-w-[360px] rounded-lg bg-[#f4fbf2] px-3 py-2 text-center text-xs font-semibold leading-5 text-[#214f14]">
                  {statusMessage}
                </p>
              ) : null}

              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e3e3e3] bg-white px-3 py-2 shadow-[0_-10px_28px_rgba(36,54,27,0.12)] sm:static sm:mt-5 sm:border-t-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                <div className="mx-auto grid w-full max-w-[520px] grid-cols-[minmax(0,1fr)_140px] gap-3">
                  <div className="min-w-0 py-1">
                    <span className="block text-[11px] font-normal text-[#8a8a8a]">
                      Total payable
                    </span>
                    <span className="block break-all text-[25px] font-black leading-tight text-[#263a22]">
                      {effectivePreview
                        ? formatInvoiceAmount(effectivePreview.pricing.total)
                        : "---"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleContinue()}
                    disabled={!effectivePreview || isSubmitting}
                    className="flex h-[54px] items-center justify-center rounded-lg bg-[#397519] px-3 text-[20px] font-black text-white transition hover:bg-[#2d5f12] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Processing..." : "Continue"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
