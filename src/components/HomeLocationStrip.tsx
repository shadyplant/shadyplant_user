"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import ProductDeliveryAddressPicker from "@/components/ProductDeliveryAddressPicker";

function formatDeliveryAddress(deliveryAddress: {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}) {
  return [
    deliveryAddress.line1,
    deliveryAddress.line2,
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function HomeLocationStrip() {
  const { user } = useAuth();
  const savedAddress = user ? formatDeliveryAddress(user.deliveryAddress) : "";

  return (
    <ProductDeliveryAddressPicker
      variant="home-strip"
      initialAddress={savedAddress}
      emptyLabel="Enter your location"
    />
  );
}
