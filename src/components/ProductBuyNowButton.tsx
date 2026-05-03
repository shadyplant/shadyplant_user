"use client";

import { type ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/components/cartStore";
import { useAuth } from "@/components/auth/AuthProvider";

type ProductBuyNowButtonProps = {
  productId: string;
  className?: string;
  children: ReactNode;
};

export default function ProductBuyNowButton({
  productId,
  className,
  children,
}: ProductBuyNowButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { items, addItem } = useCartStore();

  async function handleClick() {
    if (isSubmitting) {
      return;
    }

    if (!isAuthenticated) {
      router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const existingItem = items.find((item) => item.productId === productId);

      if (!existingItem || existingItem.quantity <= 0) {
        await addItem(productId, 1);
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
      disabled={isSubmitting}
      className={className}
    >
      {isSubmitting ? "Preparing..." : children}
    </button>
  );
}
