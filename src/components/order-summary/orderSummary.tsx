"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCartCount, useCartStore } from "@/components/cartStore";
import SiteShell from "@/components/SiteShell";
import { useProductsStore } from "@/components/productsStore";
import type { DeliveryAddress } from "@/lib/validation";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

type Step = 1 | 2 | 3;

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayOptions = {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill: {
    contact?: string;
    email?: string;
    name?: string;
  };
  notes?: Record<string, string>;
  theme: {
    color: string;
  };
};

type CheckoutSummarySnapshot = {
  deliveryAddress?: string;
  deliveryFee?: number;
  itemsSubtotal?: number;
  itemCount?: number;
  total?: number;
  createdAt?: string;
};

type BillingDetailsSnapshot = {
  name?: string;
  contact?: string;
  gstin?: string;
  state?: string;
  city?: string;
  address?: string;
  createdAt?: string;
};

const CHECKOUT_SUMMARY_STORAGE_KEY = "ggnCheckoutSummary";
const BILLING_DETAILS_STORAGE_KEY = "ggnBillingDetails";

const steps: { id: Step; label: string }[] = [
  { id: 1, label: "Billing details" },
  { id: 2, label: "Order summary" },
  { id: 3, label: "Payment" },
];

function formatAddress(deliveryAddress?: DeliveryAddress) {
  if (!deliveryAddress) {
    return "";
  }

  return [
    deliveryAddress.line1,
    deliveryAddress.line2,
    deliveryAddress.landmark,
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatInvoiceAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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

function readCheckoutSummary() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSummary = window.sessionStorage.getItem(CHECKOUT_SUMMARY_STORAGE_KEY);
  if (!rawSummary) {
    return null;
  }

  try {
    return JSON.parse(rawSummary) as CheckoutSummarySnapshot;
  } catch {
    return null;
  }
}

function readBillingDetails() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawDetails = window.sessionStorage.getItem(BILLING_DETAILS_STORAGE_KEY);
  if (!rawDetails) {
    return null;
  }

  try {
    return JSON.parse(rawDetails) as BillingDetailsSnapshot;
  } catch {
    return null;
  }
}

export default function OrderSummaryClient() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(2);
  const [isContinuing, setIsContinuing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [checkoutSummary] =
    useState<CheckoutSummarySnapshot | null>(readCheckoutSummary);
  const [billingDetails] =
    useState<BillingDetailsSnapshot | null>(readBillingDetails);
  const { isAuthenticated, isReady: isAuthReady, user } = useAuth();
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
  const itemCount = getCartCount(cartItems);
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const storedDeliveryFee = Number(checkoutSummary?.deliveryFee);
  const hasStoredDeliveryFee =
    Number.isFinite(storedDeliveryFee) && storedDeliveryFee >= 0;
  const snapshotMatchesCart =
    checkoutSummary &&
    Math.round(Number(checkoutSummary.itemsSubtotal)) === Math.round(subtotal) &&
    Number(checkoutSummary.itemCount) === itemCount;
  const deliveryCharge =
    hasStoredDeliveryFee && snapshotMatchesCart ? Math.round(storedDeliveryFee) : null;
  const total = deliveryCharge === null ? null : subtotal + deliveryCharge;
  const profileDeliveryAddress = formatAddress(user?.deliveryAddress);
  const shippingAddress =
    checkoutSummary?.deliveryAddress?.trim() || profileDeliveryAddress;
  const billingName =
    billingDetails?.name?.trim() || user?.fullName || "Customer";
  const billingAddress = billingDetails?.address?.trim() || "";
  const billingContact =
    billingDetails?.contact?.trim() || user?.phoneNumber || "";
  const billingLocation = [billingDetails?.city, billingDetails?.state]
    .map((entry) => entry?.trim())
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.replace("/auth?next=/order-summary");
    }
  }, [isAuthReady, isAuthenticated, router]);

  async function handleContinueToPayment() {
    if (deliveryCharge === null || total === null) {
      router.push("/cart");
      return;
    }

    setCurrentStep(3);
    setIsContinuing(true);
    setStatusMessage("");

    try {
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Razorpay failed to load.");
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        throw new Error("Razorpay key is not configured.");
      }

      const razorpay = new window.Razorpay({
        key: razorpayKey,
        amount: Math.round(total * 100),
        currency: "INR",
        name: "Grass Green Nursery",
        description: `Order payment for ${itemCount} item${itemCount === 1 ? "" : "s"}`,
        prefill: {
          contact: billingContact || user?.phoneNumber,
          email: user?.email,
          name: billingName,
        },
        notes: {
          deliveryAddress: shippingAddress || "Not provided",
          billingAddress: [billingAddress, billingLocation]
            .filter(Boolean)
            .join(", "),
        },
        handler: (response) => {
          setStatusMessage(`Payment started successfully: ${response.razorpay_payment_id}`);
          router.push("/order");
        },
        theme: {
          color: "#397519",
        },
      });

      razorpay.open();
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Unable to start Razorpay payment."));
      setCurrentStep(2);
    } finally {
      setIsContinuing(false);
    }
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
          <div className="mx-auto flex max-w-[440px] items-start pb-8">
            {steps.map((step, index) => {
              const active = step.id === currentStep;
              const done = step.id < currentStep;

              return (
                <div key={step.id} className="flex flex-1 items-start last:flex-none">
                  <div className="flex min-w-[72px] flex-col items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-black transition ${
                        done
                          ? "bg-[#559a28] text-white"
                          : active
                            ? "bg-[#d7efbd] text-[#111111]"
                            : "bg-[#d7efbd] text-[#111111]"
                      }`}
                    >
                      {done ? <Check size={24} strokeWidth={3} /> : step.id}
                    </div>
                    <span className="text-center text-[10px] font-medium leading-tight text-black">
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 ? (
                    <div className="mx-1 mt-5 h-px flex-1 bg-[#9d9d9d] sm:mx-2" />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div>
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
                      {billingDetails?.gstin?.trim() ? (
                        <p>GSTIN - {billingDetails.gstin.trim()}</p>
                      ) : null}
                      {user?.email ? <p>Email - {user.email}</p> : null}
                      {!billingAddress && !billingLocation && !billingContact && !user?.email ? (
                        <p>Billing address not available.</p>
                      ) : null}
                    </div>

                    <div className="bg-[#f0f0f0] px-3 py-2">
                      <h2 className="text-[18px] font-black leading-5 text-black">
                        Ship to :
                      </h2>
                    </div>
                    <div className="min-h-[70px] px-3 py-3 text-[12px] leading-[1.25] text-black">
                      {shippingAddress || "Delivery address not available."}
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
                        <span>{formatInvoiceAmount(subtotal)}</span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-[#bfbfbf] py-3 text-[14px] text-black">
                        <span className="font-black">Tax</span>
                        <span>{formatInvoiceAmount(0)}</span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-[#bfbfbf] py-3 text-[14px] text-black">
                        <span className="font-black">Delivery charge</span>
                        <span>
                          {deliveryCharge === null
                            ? "Required"
                            : formatInvoiceAmount(deliveryCharge)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between gap-4 bg-[#e8e8e8] px-3 py-4 text-[14px] font-black text-black">
                      <span>Payable amount</span>
                      <span>{total === null ? "---" : formatInvoiceAmount(total)}</span>
                    </div>
                  </section>

                  {deliveryCharge === null ? (
                    <div className="px-2 py-4 text-center">
                      <Link
                        href="/cart"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-[#d6e6bd] bg-white px-5 text-xs font-black text-[#214f14]"
                      >
                        Calculate delivery charge
                      </Link>
                    </div>
                  ) : null}

                  <p className="mx-auto mt-4 max-w-[300px] text-center text-[9px] leading-[1.25] text-[#777777]">
                    By continuing with the order, you confirm that you are above
                    18 years of age, and you agree to the Grass Green Nursery{" "}
                    <Link href="/blogs" className="text-[#1d5eff]">
                      Terms and Policy.
                    </Link>
                  </p>

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
                          {total === null ? "---" : formatInvoiceAmount(total)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleContinueToPayment}
                        disabled={isContinuing || deliveryCharge === null}
                        className="flex h-[54px] items-center justify-center rounded-lg bg-[#397519] px-3 text-[20px] font-black text-white transition hover:bg-[#2d5f12] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {deliveryCharge === null
                          ? "Calculate first"
                          : isContinuing
                            ? "Opening..."
                            : "Checkout"}
                      </button>
                    </div>
                  </div>
                </>
              )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
