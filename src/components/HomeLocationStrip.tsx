"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import ProductDeliveryAddressPicker from "@/components/ProductDeliveryAddressPicker";
import { formatDeliveryAddress } from "@/lib/deliveryAddress";

export default function HomeLocationStrip({
  initialAddress = "",
}: {
  initialAddress?: string;
}) {
  const { user } = useAuth();
  const savedAddress = formatDeliveryAddress(user?.deliveryAddress) || initialAddress;

  return (
    <ProductDeliveryAddressPicker
      variant="home-strip"
      initialAddress={savedAddress}
      emptyLabel="Enter your location"
    />
  );
}
