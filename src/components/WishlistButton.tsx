"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWishlistStore } from "@/components/wishlistStore";

type WishlistButtonProps = {
  productId: string;
  size?: number;
  className?: string;
};

export default function WishlistButton({
  productId,
  size = 18,
  className = "",
}: WishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [isPopping, setIsPopping] = useState(false);
  const popTimeoutRef = useRef<number | null>(null);
  const { items: wishlistItems, addItem, removeItem } = useWishlistStore();
  const isWishlisted = wishlistItems.includes(productId);

  useEffect(() => {
    return () => {
      if (popTimeoutRef.current) {
        window.clearTimeout(popTimeoutRef.current);
      }
    };
  }, []);

  async function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    if (isWishlisted) {
      await removeItem(productId);
    } else {
      await addItem(productId);
    }

    if (popTimeoutRef.current) {
      window.clearTimeout(popTimeoutRef.current);
    }

    setIsPopping(true);
    popTimeoutRef.current = window.setTimeout(() => setIsPopping(false), 220);
  }

  function stopCardNavigation(
    event: MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
  }

  return (
    <button
      type="button"
      onMouseDown={stopCardNavigation}
      onTouchStart={stopCardNavigation}
      onClick={handleToggle}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isWishlisted}
      className={`z-30 inline-flex touch-manipulation items-center justify-center rounded-full transition duration-200 ease-out ${
        isPopping ? "scale-125" : "scale-100"
      } ${
        isWishlisted ? "text-[#FF3D58]" : "text-[#5f5f5f]"
      } ${className}`}
    >
      <Heart
        size={size}
        fill={isWishlisted ? "currentColor" : "none"}
        className={isWishlisted ? "text-[#FF3D58]" : "text-[#7a7a7a]"}
        strokeWidth={2}
      />
    </button>
  );
}
``