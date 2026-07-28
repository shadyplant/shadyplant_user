import type { Viewport } from "next";
import OrderSuccessPageClient from "@/components/orders/OrderSuccessPageClient";

export const viewport: Viewport = {
  themeColor: "#4a9e5c",
};

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orderId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const paymentAttemptId = Array.isArray(resolvedSearchParams.payment_attempt_id)
    ? resolvedSearchParams.payment_attempt_id[0] || ""
    : String(resolvedSearchParams.payment_attempt_id || "").trim();

  return <OrderSuccessPageClient orderId={orderId} paymentAttemptId={paymentAttemptId} />;
}
