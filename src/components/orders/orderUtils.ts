export type TrackingStep = {
  key: string;
  title: string;
  description: string;
  state: "complete" | "current" | "upcoming";
  occurredAt?: string | null;
  entries: TrackingEntry[];
};

export type TrackingEntry = {
  id: string;
  message: string;
  timestamp: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  trackingCode: string;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
  orderItems?: Array<{
    productId: string;
    name?: string;
    image?: string;
    quantity: number;
    variantId?: string;
    variantLabel?: string;
    packLabel?: string;
    unit?: string;
    unitPrice?: number;
    subtotal?: number;
    currency?: string;
  }>;
  fullName: string;
  email: string;
  phoneNumber: string;
  deliveryAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    landmark: string;
    notes: string;
  };
  billingDetails?: {
    name?: string;
    contact?: string;
    email?: string;
    gstin?: string;
    state?: string;
    city?: string;
    address?: string;
  };
  deliveryLocation?: {
    lat?: number;
    lng?: number;
  };
  deliveryDate: string;
  quantitySqft: number;
  distanceKm: number;
  vehicle: {
    name: string;
    rate: number;
    description: string;
  };
  paymentMethod?: string;
  paymentMethodLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  paymentDetails?: Record<string, unknown>;
  currentStatus: string;
  trackingTimeline: TrackingStep[];
  pricing: {
    total: number;
    materialSubtotal?: number;
    shippingSubtotal?: number;
    recommendedSubtotal?: number;
    itemsSubtotal?: number;
    deliveryCharge?: number;
    currency?: string;
    distanceKm?: number;
    deliveryRate?: number;
    totalWeightKg?: number;
  };
  createdAt: string;
  updatedAt?: string;
};

export type FilterKey = "All" | "Active" | "Delivered";

export const filterOptions: FilterKey[] = ["All", "Active", "Delivered"];

export function isDelivered(order: Order) {
  return order.currentStatus === "delivered";
}

export function formatDateTime(value: string) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function formatAddress(order: Order) {
  return [
    order.deliveryAddress.line1,
    order.deliveryAddress.line2,
    order.deliveryAddress.city,
    order.deliveryAddress.state,
    order.deliveryAddress.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

export function formatOrderStatus(status: string) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (normalizedStatus === "confirmed") {
    return "Order confirmed";
  }

  if (normalizedStatus === "out_for_delivery") {
    return "Out for delivery";
  }

  if (normalizedStatus === "shipped") {
    return "Shipped";
  }

  if (normalizedStatus === "delivered") {
    return "Delivered";
  }

  return status.replace(/_/g, " ");
}

export function canDownloadInvoice(order: Order) {
  return String(order.paymentStatus || "").trim().toLowerCase() === "paid";
}

export function getOrderHref(orderId: string) {
  return `/order/${encodeURIComponent(orderId)}`;
}

export function getCurrentTrackingStep(order: Order) {
  return (
    order.trackingTimeline.find((step) => step.state === "current") ||
    order.trackingTimeline.find((step) => step.state === "complete") ||
    order.trackingTimeline[0] ||
    null
  );
}
