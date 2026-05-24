"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCartStore } from "@/components/cartStore";
import OrderSuccess from "@/components/orders/OrderSuccess";
import type { Order } from "@/components/orders/orderUtils";
import SiteShell from "@/components/SiteShell";
import type { ApiResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";

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

export default function OrderSuccessPageClient({
  orderId,
}: {
  orderId: string;
}) {
  const router = useRouter();
  const { fetchWithAuth, isAuthenticated, isReady } = useAuth();
  const { reload } = useCartStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/auth?next=/order-success/${encodeURIComponent(orderId)}`);
      return;
    }

    let isActive = true;

    void reload().catch(() => {
      // Best effort only: refresh cart after order placement.
    });

    void (async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const response = await fetchWithAuth<ApiResponse<{ orders: Order[] }>>("/orders");
          const matchedOrder =
            response.data.orders.find((entry) => entry.id === orderId) || null;

          if (matchedOrder) {
            if (isActive) {
              setOrder(matchedOrder);
              setError(null);
            }
            return;
          }

          if (attempt < 4) {
            await sleep(700);
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
          return;
        }
      }

      if (isActive) {
        setError("We couldn't find this order confirmation right now.");
      }
    })();

    return () => {
      isActive = false;
    };
  }, [fetchWithAuth, isAuthenticated, isReady, orderId, reload, router]);

  if (!isReady || (isAuthenticated && !order && !error)) {
    return (
      <SiteShell hideMobileHeader hideMobileBottomNav showFooter={false}>
        <div className="flex min-h-screen items-center justify-center bg-[#4a9e5c] px-5 py-8 text-center text-white">
          <div>
            <p className="text-3xl font-bold">Preparing your order confirmation...</p>
            <p className="mt-3 text-base text-white/80">
              We are fetching your latest order details.
            </p>
          </div>
        </div>
      </SiteShell>
    );
  }

  if (!order) {
    return (
      <SiteShell hideMobileHeader hideMobileBottomNav showFooter={false}>
        <div className="flex min-h-screen items-center justify-center bg-[#4a9e5c] px-5 py-8">
          <div className="w-full max-w-xl rounded-[18px] bg-white p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Order confirmation unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-[#5e5e5e]">
              {error || "We couldn't load this order right now."}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/order")}
                className="rounded-full bg-[#4a9e5c] px-5 py-3 text-sm font-semibold text-white"
              >
                View Orders
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-full border border-[#d6e6bd] px-5 py-3 text-sm font-semibold text-[#214f14]"
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
      primaryActionLabel="View Order"
      secondaryActionHref="/"
      secondaryActionLabel="Continue Shopping"
    />
  );
}
