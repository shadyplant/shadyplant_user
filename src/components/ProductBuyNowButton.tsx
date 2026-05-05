"use client";

import { type ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/components/cartStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { useOptionalProductOptionSelection } from "@/components/ProductOptionSelectionContext";

type ProductBuyNowButtonProps = {
  productId: string;
  availableStock?: number;
  className?: string;
  children: ReactNode;
};

export default function ProductBuyNowButton({
  productId,
  availableStock,
  className,
  children,
}: ProductBuyNowButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { items, addItem, updateQuantity } = useCartStore();
  const selectedOptionContext = useOptionalProductOptionSelection();
  const activeProductId = selectedOptionContext?.product.id || productId;
  const effectiveAvailableStock =
    selectedOptionContext?.resolved.stock ?? availableStock;
  const stockAvailable = Math.max(
    0,
    Math.floor(Number(effectiveAvailableStock ?? 0)),
  );
  const isOutOfStock =
    effectiveAvailableStock !== undefined && stockAvailable <= 0;

  async function handleClick() {
    if (isSubmitting || isOutOfStock) {
      return;
    }

    if (!isAuthenticated) {
      router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const existingItem = selectedOptionContext
        ? items.find((item) => item.id === selectedOptionContext.resolved.lineId)
        : items.find((item) => item.productId === productId && !item.variantId);

      if (!existingItem || existingItem.quantity <= 0) {
        await addItem(activeProductId, 1, selectedOptionContext
          ? {
              variantId: selectedOptionContext.resolved.variantId,
              optionSelections: selectedOptionContext.resolved.optionSelections,
            }
          : undefined);
      } else if (
        effectiveAvailableStock !== undefined &&
        existingItem.quantity > stockAvailable
      ) {
        await updateQuantity(existingItem.id, stockAvailable);
      }

      router.push("/checkout");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isSubmitting || isOutOfStock}
      className={`${className || ""} disabled:cursor-not-allowed disabled:opacity-60`.trim()}
    >
      {isOutOfStock ? "Out of stock" : isSubmitting ? "Preparing..." : children}
    </button>
  );
}
