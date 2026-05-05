import type { Viewport } from "next";
import OrderDetailsPageClient from "@/components/orders/OrderDetailsPageClient";

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return <OrderDetailsPageClient orderId={orderId} />;
}
