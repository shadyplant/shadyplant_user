import type { Viewport } from "next";
import OrderTrackingPageClient from "@/components/orders/OrderTrackingPageClient";

export const viewport: Viewport = {
  themeColor: "#f8fbf6",
};

export default function OrderPage() {
  return <OrderTrackingPageClient />;
}
