import type { Viewport } from "next";
import OrderSuccessPageClient from "@/components/orders/OrderSuccessPageClient";

export const viewport: Viewport = {
  themeColor: "#4a9e5c",
};

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return <OrderSuccessPageClient orderId={orderId} />;
}
