"use client";

import { Heart } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { readWishlist, useWishlistItems, writeWishlist } from "@/components/wishlistStore";

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
  const [isPopping, setIsPopping] = useState(false);
  const popTimeoutRef = useRef<number | null>(null);
  const wishlistItems = useWishlistItems();
  const isWishlisted = wishlistItems.includes(productId);

  useEffect(() => {
    return () => {
      if (popTimeoutRef.current) {
        window.clearTimeout(popTimeoutRef.current);
      }
    };
  }, []);

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const wishlistItems = readWishlist();
    const nextIsWishlisted = !wishlistItems.includes(productId);
    const nextWishlistItems = nextIsWishlisted
      ? [...wishlistItems, productId]
      : wishlistItems.filter((item) => item !== productId);

    writeWishlist(nextWishlistItems);
    if (popTimeoutRef.current) {
      window.clearTimeout(popTimeoutRef.current);
    }

    setIsPopping(true);
    popTimeoutRef.current = window.setTimeout(() => setIsPopping(false), 220);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isWishlisted}
      className={`${className} inline-flex touch-manipulation items-center justify-center rounded-full transition duration-200 ease-out ${
        isPopping ? "scale-125" : "scale-100"
      } ${isWishlisted ? "text-[#2f8f49]" : "text-[#6b8b58]"}`}
    >
      <Heart
        size={size}
        fill={isWishlisted ? "currentColor" : "none"}
        strokeWidth={2}
      />
    </button>
  );
}
