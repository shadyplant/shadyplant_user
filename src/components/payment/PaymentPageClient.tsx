"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCartCount, useCartStore } from "@/components/cartStore";
import SiteShell from "@/components/SiteShell";
import { useProductsStore } from "@/components/productsStore";
import type { ApiResponse } from "@/lib/api";
import {
  normalizeBillingDetailsDraft,
  readBillingDetailsDraft,
  readCheckoutDraft,
  type CheckoutPosition,
} from "@/lib/checkoutSession";
import { formatCurrency } from "@/lib/formatCurrency";

type Step = 1 | 2 | 3;
type PaymentMethod = "online" | "cod";

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

type RazorpayCheckout = {
  paymentAttemptId: string;
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  businessName: string;
  description: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
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

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPageClient() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const deliveryAddress = checkoutDraft?.deliveryAddress?.trim() || "";
  const deliveryPosition = checkoutDraft?.deliveryPosition || null;
  const billingDetails = normalizeBillingDetailsDraft(
    Object.values(billingDetailsDraft).some(Boolean)
      ? billingDetailsDraft
      : user?.billingDetails,
  );

  const items = useMemo(
    () =>
      cartItems.flatMap((item) => {
        const product = products.find((entry) => entry.id === item.productId);

        if (!product) {
          return [];
        }

        return [{ ...item, amount: product.price * item.quantity, product }];
      }),
    [cartItems, products],
  );

  const isLoading =
    !isAuthReady ||
    !isCartReady ||
    isCartLoading ||
    !areProductsReady ||
    isProductsLoading;
  const itemCount = getCartCount(cartItems);

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.replace("/auth?next=/payment");
    }
  }, [isAuthReady, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !hasPosition(deliveryPosition) || !deliveryAddress || !items.length) {
      setPreview(null);
      return;
    }

    let isActive = true;
    setStatusMessage("");

    void fetchWithAuth<ApiResponse<{ preview: CheckoutPreview }>>("/checkout/preview", {
      method: "POST",
      body: JSON.stringify({
        deliveryAddress: {
          formattedAddress: deliveryAddress,
          ...(user?.deliveryAddress || {}),
        },
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
          setStatusMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the latest payable summary.",
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    deliveryAddress,
    deliveryPosition,
    fetchWithAuth,
    isAuthenticated,
    items.length,
    user?.deliveryAddress,
  ]);

  async function pollPaymentAttempt(paymentAttemptId: string) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetchWithAuth<ApiResponse<{ paymentAttempt: PaymentAttemptStatus }>>(
        `/payments/razorpay/attempts/${paymentAttemptId}`,
      );
      const paymentAttempt = response.data.paymentAttempt;

      if (paymentAttempt.status === "completed" && paymentAttempt.orderId) {
        router.push("/order");
        return true;
      }

      if (paymentAttempt.status === "failed") {
        setStatusMessage("Payment failed before order confirmation. Please try again.");
        return false;
      }

      await sleep(1200);
    }

    setStatusMessage(
      "Payment was submitted. We are waiting for secure verification from the server webhook.",
    );
    return false;
  }

  async function handlePaymentAction() {
    if (!preview || !hasPosition(deliveryPosition) || !deliveryAddress) {
      router.push("/cart");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    const payload = {
      deliveryAddress: {
        formattedAddress: deliveryAddress,
        ...(user?.deliveryAddress || {}),
      },
      deliveryLocation: deliveryPosition,
      billingDetails,
      deliveryDate: preview.suggestedDeliveryDate,
    };

    try {
      if (paymentMethod === "cod") {
        await fetchWithAuth("/checkout/cod", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        router.push("/order");
        return;
      }

      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Razorpay failed to load.");
      }

      const response = await fetchWithAuth<ApiResponse<{ checkout: RazorpayCheckout }>>(
        "/checkout/online",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      const checkout = response.data.checkout;

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: checkout.businessName,
        description: checkout.description,
        order_id: checkout.orderId,
        prefill: {
          contact: checkout.prefill.contact,
          email: checkout.prefill.email,
          name: checkout.prefill.name,
        },
        handler: () => {
          void (async () => {
            try {
              if (checkout.shouldSimulateWebhook) {
                await fetchWithAuth(
                  `/payments/razorpay/test-webhook/${checkout.paymentAttemptId}`,
                  {
                    method: "POST",
                  },
                );
              }

              await pollPaymentAttempt(checkout.paymentAttemptId);
            } catch (error) {
              setStatusMessage(
                error instanceof Error
                  ? error.message
                  : "Payment was captured, but order confirmation is still pending.",
              );
            } finally {
              setIsSubmitting(false);
            }
          })();
        },
        theme: {
          color: "#214f14",
        },
      });

      razorpay.open();
      setIsSubmitting(false);
      return;
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to continue with checkout.",
      );
    }

    setIsSubmitting(false);
  }

  if (isAuthReady && !isAuthenticated) {
    return null;
  }

  return (
    <SiteShell hideMobileBottomNav>
      <section className="min-h-screen bg-[#F7F8F4] px-3 py-6 md:px-6 md:py-12">
        <div className="mx-auto w-full max-w-5xl">
          <div className="overflow-hidden rounded-[22px] border border-[#D8DDD0] bg-white shadow-[0_18px_50px_rgba(36,54,27,0.12)] md:rounded-[24px]">
            <div className="flex min-h-[72px] items-center justify-between border-b border-[#D8DDD0] px-4 md:px-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0E0] text-[#3B5E2B] transition hover:bg-[#dcead2]"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-center text-base font-extrabold text-[#163915] md:text-lg">
                Payment
              </h1>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0E0] text-[#3B5E2B]">
                <ShieldCheck size={19} />
              </span>
            </div>

            <div className="mx-auto flex max-w-2xl items-start px-4 py-7 md:px-6 md:py-8">
              {steps.map((step, index) => {
                const done = step.id < 3;
                const active = step.id === 3;

                return (
                  <div key={step.id} className="flex flex-1 items-start last:flex-none">
                    <div className="flex min-w-[62px] flex-col items-center gap-2">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                          active
                            ? "border-2 border-[#C5D6B5] bg-[#2f6427] text-white shadow-[0_0_0_2px_rgba(47,100,39,0.18)]"
                            : done
                              ? "bg-[#6B9E3E] text-white"
                              : "bg-[#E8F0E0] text-[#1A1F14]"
                        }`}
                      >
                        {done ? <CheckCircle2 size={18} /> : step.id}
                      </div>
                      <span
                        className={`text-center text-[10px] font-medium leading-tight md:text-xs ${
                          active ? "text-[#14721c]" : "text-[#1A1F14]"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 ? (
                      <div
                        className={`mx-2 mt-[18px] h-0.5 flex-1 md:mx-4 ${
                          step.id < 3 ? "bg-[#6B9E3E]" : "bg-[#D8DDD0]"
                        }`}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="grid gap-6 px-4 pb-7 md:grid-cols-[minmax(0,1fr)_360px] md:px-6 md:pb-8">
              {isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#D8DDD0] bg-[#fbfdf8] md:col-span-2">
                  <Loader2 className="animate-spin text-[#214f14]" size={30} />
                </div>
              ) : !items.length ? (
                <div className="rounded-2xl border border-[#D8DDD0] bg-[#fbfdf8] p-8 text-center md:col-span-2">
                  <h2 className="text-xl font-black text-[#163915]">No items to pay for</h2>
                  <Link
                    href="/cart"
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#214f14] px-6 text-sm font-bold text-white"
                  >
                    Return to cart
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("online")}
                      className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${
                        paymentMethod === "online"
                          ? "border-[#214f14] bg-[#f4fbf2] shadow-[0_10px_28px_rgba(33,79,20,0.10)]"
                          : "border-[#D8DDD0] bg-white hover:bg-[#fbfdf8]"
                      }`}
                    >
                      <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F0E0] text-[#214f14]">
                        <CreditCard size={20} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-black text-[#163915]">
                          Pay online
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-[#5c7752]">
                          Server-generated Razorpay order, verified through backend webhook before order finalization.
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${
                        paymentMethod === "cod"
                          ? "border-[#214f14] bg-[#f4fbf2] shadow-[0_10px_28px_rgba(33,79,20,0.10)]"
                          : "border-[#D8DDD0] bg-white hover:bg-[#fbfdf8]"
                      }`}
                    >
                      <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F0E0] text-[#214f14]">
                        <WalletCards size={20} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-black text-[#163915]">
                          Cash on delivery
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-[#5c7752]">
                          The backend creates the order directly using current cart items and server-calculated delivery.
                        </span>
                      </span>
                    </button>

                    <div className="rounded-2xl border border-[#D8DDD0] bg-[#fbfdf8] p-4 text-sm text-[#46603d]">
                      <div className="flex items-center gap-3 font-bold text-[#214f14]">
                        <Truck size={17} />
                        Delivery support included
                      </div>
                      <p className="mt-2 leading-6">
                        {preview
                          ? `Distance ${preview.pricing.distanceKm.toFixed(2)} km and chargeable weight ${preview.summary.totalWeightKg} kg are recalculated on the server at checkout time.`
                          : "Distance, item pricing, and order totals are recalculated on the server at checkout time."}
                      </p>
                    </div>
                  </div>

                  <aside className="h-fit rounded-2xl border border-[#D8DDD0] bg-white p-5">
                    <h2 className="text-lg font-black text-[#163915]">
                      Payable summary
                    </h2>
                    <div className="mt-4 max-h-[260px] space-y-3 overflow-auto pr-1">
                      {items.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F7F8F4]">
                            {item.product.image ? (
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-bold text-[#163915]">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-[#5c7752]">
                              Qty {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-black text-[#163915]">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 space-y-3 border-t border-[#D8DDD0] pt-4">
                      <div className="flex justify-between text-sm font-bold">
                        <span>Items ({itemCount})</span>
                        <span>
                          {preview ? formatCurrency(preview.pricing.itemsSubtotal) : "---"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Delivery Charge</span>
                        <span>
                          {preview ? formatCurrency(preview.pricing.deliveryCharge) : "Required"}
                        </span>
                      </div>
                      {preview ? (
                        <div className="flex justify-between text-sm font-bold">
                          <span>Chargeable Weight</span>
                          <span>{preview.summary.totalWeightKg} kg</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between text-base font-black text-[#163915]">
                        <span>Total</span>
                        <span>{preview ? formatCurrency(preview.pricing.total) : "---"}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handlePaymentAction()}
                      disabled={!preview || !hasPosition(deliveryPosition) || isSubmitting}
                      className="theme-button mt-5 flex h-12 w-full items-center justify-center rounded-full text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      {!preview
                        ? "Load preview first"
                        : isSubmitting
                          ? "Processing..."
                          : paymentMethod === "online"
                            ? "Pay now"
                            : "Confirm COD"}
                    </button>
                    {statusMessage ? (
                      <p className="mt-3 rounded-xl bg-[#f4fbf2] px-3 py-2 text-center text-xs font-semibold leading-5 text-[#214f14]">
                        {statusMessage}
                      </p>
                    ) : null}
                  </aside>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
