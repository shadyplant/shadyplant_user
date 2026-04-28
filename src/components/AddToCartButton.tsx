"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Plus, ShoppingCart } from "lucide-react";
import {
  getCartQuantity,
  useCartStore,
} from "@/components/cartStore";
import { useAuth } from "@/components/auth/AuthProvider";

type AddToCartButtonProps = {
  productId: string;
  quantity?: number;
  className?: string;
  compact?: boolean;
  label?: string;
  children?: ReactNode;
};

export default function AddToCartButton({
  productId,
  quantity = 1,
  className = "",
  compact = false,
  label = "Add to cart",
  children,
}: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { items: cartItems, addItem } = useCartStore();
  const quantityInCart = getCartQuantity(cartItems, productId);
  const [justAdded, setJustAdded] = useState(false);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    await addItem(productId, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={quantityInCart ? `Add one more, ${quantityInCart} already in cart` : label}
        className={`touch-manipulation ${className}`.trim()}
      >
        <div className="relative inline-flex items-center justify-center">
          {justAdded ? (
            <Check size={18} className="text-white" />
          ) : (
            <>
              <ShoppingCart className="h-5 w-5 text-current" />
              <div className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 text-[#214f14] shadow-sm">
                <Plus className="h-3.5 w-3.5" />
              </div>
            </>
          )}

          {quantityInCart > 0 ? (
            <span className="absolute -bottom-2 -right-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#214f14] px-1 text-[10px] font-bold text-white">
              {quantityInCart}
            </span>
          ) : null}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`touch-manipulation ${className}`.trim()}
      aria-label={label}
    >
      <span className="inline-flex items-center gap-2">
        {justAdded ? <Check size={18} /> : <ShoppingCart size={18} />}
        <span>{justAdded ? "Added to cart" : children ?? label}</span>
      </span>

      {quantityInCart > 0 ? (
        <span className="rounded-full bg-[#214f14] px-3 py-1 text-xs font-bold text-white">
          {quantityInCart} in cart
        </span>
      ) : null}
    </button>
  );
}
