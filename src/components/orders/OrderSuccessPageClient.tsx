"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCartStore } from "@/components/cartStore";
import OrderSuccess from "@/components/orders/OrderSuccess";
import type { Order } from "@/components/orders/orderUtils";
import SiteShell from "@/components/SiteShell";
import type { ApiResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  clearPaymentGatewayCheckoutSession,
  cleanupPaymentGatewayReturnUrl,
} from "@/lib/paymentGatewayCheckout";
import CompactSpinnerLoader from "../loader/compact_spinner";

type PaymentAttemptStatus = {
  id: string;
  status: string;
  orderId: string | null;
};

function sleep(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function formatSuccessDate(value: string) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function readMobileMatch() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(max-width: 767px)").matches;
}

export default function OrderSuccessPageClient({
  orderId,
  paymentAttemptId = "",
}: {
  orderId: string;
  paymentAttemptId?: string;
}) {
  const router = useRouter();
  const { fetchWithAuth, isAuthenticated, isReady } = useAuth();
  const { reload } = useCartStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileRedirectCountdown, setMobileRedirectCountdown] = useState<
    number | null
  >(null);
  const hasAutoRedirectedRef = useRef(false);
  const normalizedPaymentAttemptId = paymentAttemptId.trim();
  const resolvedOrderId = order?.id || "";
  const isPendingOrderRoute =
    orderId === "pending" || Boolean(normalizedPaymentAttemptId);

  useEffect(() => {
    setIsMobile(readMobileMatch());

    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = () => {
      setIsMobile(mediaQuery.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const nextPath = `/order-success/${encodeURIComponent(orderId)}${
      normalizedPaymentAttemptId
        ? `?payment_attempt_id=${encodeURIComponent(normalizedPaymentAttemptId)}`
        : ""
    }`;

    // TEMPORARILY DISABLED FOR UI DESIGN

    if (!isAuthenticated) {
      router.replace(`/auth?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    let isActive = true;

    void reload().catch(() => {
      // Best effort only: refresh cart after order placement.
    });

    async function loadOrderById(targetOrderId: string) {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const response =
          await fetchWithAuth<ApiResponse<{ orders: Order[] }>>("/orders");
        const matchedOrder =
          response.data.orders.find((entry) => entry.id === targetOrderId) ||
          null;

        if (matchedOrder) {
          if (isActive) {
            setOrder(matchedOrder);
            setError(null);
          }
          return true;
        }

        if (attempt < 5) {
          await sleep(700);
        }
      }

      return false;
    }

    async function loadOrderFromPaymentAttempt(targetPaymentAttemptId: string) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const attemptResponse = await fetchWithAuth<
          ApiResponse<{ paymentAttempt: PaymentAttemptStatus }>
        >(`/payments/attempts/${encodeURIComponent(targetPaymentAttemptId)}`);

        const paymentAttempt = attemptResponse.data.paymentAttempt;

        if (paymentAttempt.status === "failed") {
          clearPaymentGatewayCheckoutSession();
          cleanupPaymentGatewayReturnUrl();

          if (isActive) {
            setError(
              "Payment failed before order confirmation. Please try again.",
            );
          }
          return false;
        }

        if (paymentAttempt.status === "completed" && paymentAttempt.orderId) {
          const loaded = await loadOrderById(paymentAttempt.orderId);

          if (loaded) {
            clearPaymentGatewayCheckoutSession();
            cleanupPaymentGatewayReturnUrl();
            router.replace(
              `/order-success/${encodeURIComponent(paymentAttempt.orderId)}${
                normalizedPaymentAttemptId
                  ? `?payment_attempt_id=${encodeURIComponent(normalizedPaymentAttemptId)}`
                  : ""
              }`,
            );
            return true;
          }
        }

        if (attempt < 11) {
          await sleep(800);
        }
      }

      if (isActive) {
        setError("We couldn't find this order confirmation right now.");
      }

      return false;
    }

    void (async () => {
      try {
        setError(null);
        setOrder(null);

        if (normalizedPaymentAttemptId) {
          await loadOrderFromPaymentAttempt(normalizedPaymentAttemptId);
          return;
        }

        const loaded = await loadOrderById(orderId);
        if (!loaded && isActive) {
          setError("We couldn't find this order confirmation right now.");
        }
      } catch (nextError) {
        if (!isActive) {
          return;
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to load your order confirmation.",
        );
      } finally {
        if (!isActive) {
          return;
        }

        cleanupPaymentGatewayReturnUrl();
      }
    })();

    return () => {
      isActive = false;
    };
  }, [
    fetchWithAuth,
    isAuthenticated,
    isReady,
    normalizedPaymentAttemptId,
    orderId,
    reload,
    router,
  ]);

  // TEMPORARILY DISABLED FOR UI DESIGN
  // Automatic mobile redirect countdown.

  useEffect(() => {
    if (!resolvedOrderId || !isMobile) {
      setMobileRedirectCountdown(null);
      hasAutoRedirectedRef.current = false;
      return;
    }

    hasAutoRedirectedRef.current = false;
    setMobileRedirectCountdown(5);

    const timer = window.setInterval(() => {
      setMobileRedirectCountdown((current) => {
        if (current === null) {
          return 5;
        }

        if (current <= 1) {
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isMobile, resolvedOrderId]);

  // TEMPORARILY DISABLED FOR UI DESIGN

  useEffect(() => {
    if (!resolvedOrderId || !isMobile || mobileRedirectCountdown !== 0) {
      return;
    }

    if (hasAutoRedirectedRef.current) {
      return;
    }

    hasAutoRedirectedRef.current = true;
    router.replace(`/order/${encodeURIComponent(resolvedOrderId)}`);
  }, [isMobile, mobileRedirectCountdown, resolvedOrderId, router]);

  const handleViewOrder = () => {
    if (!resolvedOrderId) {
      return;
    }

    router.replace(`/order/${encodeURIComponent(resolvedOrderId)}`);
  };

  if (!isReady) {
    return (
      <SiteShell
        hideMobileHeader
        hideHeader
        hideMobileBottomNav
        showFooter={false}
      >
        <div className="flex min-h-screen items-center justify-center bg-[#4a9e5c] px-5 py-8 text-center text-white">
          <CompactSpinnerLoader />
        </div>
      </SiteShell>
    );
  }

  if (isAuthenticated && !order && !error) {
    if (isPendingOrderRoute) {
      return <OrderSuccess isLoading />;
    }

    return (
      <SiteShell
        hideMobileHeader
        hideHeader
        hideMobileBottomNav
        showFooter={false}
      >
        <div className="flex min-h-screen items-center justify-center bg-[#4a9e5c] px-5 py-8 text-center text-white">
          <CompactSpinnerLoader />
        </div>
      </SiteShell>
    );
  }

  if (!order) {
    return (
      <SiteShell
        hideMobileHeader
        hideHeader
        hideMobileBottomNav
        showFooter={false}
      >
        <div className="flex min-h-screen items-center justify-center bg-[#4a9e5c] px-5 py-8">
          <div className="w-full max-w-xl rounded-[18px] bg-white p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
            <h1 className="text-2xl font-bold text-gray-800">
              We couldn’t find your order confirmation
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {
                "Your order may still be processing. Check your orders for updates."
              }
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.replace("/order")}
                className="rounded-full bg-[#207958] px-5 py-3 text-sm font-semibold text-white cursor-pointer"
              >
                View Orders
              </button>
              <button
                type="button"
                onClick={() => router.replace("/")}
                className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </SiteShell>
    );
  }

  return (
    <OrderSuccess
      orderNumber={order.orderNumber}
      orderDate={formatSuccessDate(order.createdAt)}
      deliveryDate={formatSuccessDate(order.deliveryDate)}
      total={formatCurrency(order.pricing.total)}
      primaryActionHref={`/order/${encodeURIComponent(order.id)}`}
      primaryActionOnClick={isMobile ? handleViewOrder : undefined}
      primaryActionLabel="View Order"
      secondaryActionHref="/"
      secondaryActionLabel="Continue Shopping"
      mobileRedirectCountdown={isMobile ? mobileRedirectCountdown : null}
      showRedirectBadge={isMobile && mobileRedirectCountdown !== null}
      redirectSeconds={mobileRedirectCountdown ?? 0}
    />
  );
}
