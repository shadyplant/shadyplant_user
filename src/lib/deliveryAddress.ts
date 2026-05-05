import type { DeliveryAddress } from "@/lib/validation";

export function formatDeliveryAddress(
  deliveryAddress: Partial<DeliveryAddress> | null | undefined,
) {
  if (!deliveryAddress) {
    return "";
  }

  return (
    deliveryAddress.formattedAddress ||
    [
      deliveryAddress.line1,
      deliveryAddress.line2,
      deliveryAddress.city,
      deliveryAddress.state,
      deliveryAddress.postalCode,
    ]
      .filter(Boolean)
      .join(", ")
  );
}
