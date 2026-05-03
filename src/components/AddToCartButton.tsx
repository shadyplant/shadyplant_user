"use client";

import { useId, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  showQuantityBadge?: boolean;
  label?: string;
  children?: ReactNode;
};

function AddToCartIcon({ className = "" }: { className?: string }) {
  const clipPathId = useId();

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M17 18.375H7.35116C7.20479 18.375 7.06306 18.3236 6.95069 18.2298C6.83831 18.1361 6.76242 18.0058 6.73623 17.8618L4.65013 6.3882C4.62394 6.24419 4.54805 6.11394 4.43568 6.02016C4.3233 5.92637 4.18158 5.875 4.03521 5.875H2.625"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.625 21.5C8.48794 21.5 9.1875 20.8004 9.1875 19.9375C9.1875 19.0746 8.48794 18.375 7.625 18.375C6.76206 18.375 6.0625 19.0746 6.0625 19.9375C6.0625 20.8004 6.76206 21.5 7.625 21.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 21.5C17.8629 21.5 18.5625 20.8004 18.5625 19.9375C18.5625 19.0746 17.8629 18.375 17 18.375C16.1371 18.375 15.4375 19.0746 15.4375 19.9375C15.4375 20.8004 16.1371 21.5 17 21.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.5249 8.99999C4.5249 8.66862 4.79353 8.39999 5.1249 8.39999H13.9999C14.3313 8.39999 14.5999 8.66862 14.5999 8.99999C14.5999 9.33136 14.3313 9.59999 13.9999 9.59999H5.1249C4.79353 9.59999 4.5249 9.33136 4.5249 8.99999ZM19.1149 11.4111C19.4402 11.4747 19.6523 11.7898 19.5888 12.115L18.9327 15.4735C18.8807 15.754 18.7323 16.0076 18.5132 16.1905C18.293 16.3743 18.0152 16.475 17.7283 16.475H6.3749C6.04353 16.475 5.7749 16.2064 5.7749 15.875C5.7749 15.5436 6.04353 15.275 6.3749 15.275H17.7283C17.7342 15.275 17.7398 15.2729 17.7443 15.2692C17.7488 15.2654 17.7518 15.2602 17.7529 15.2545L17.7543 15.2468L17.7543 15.2468L18.411 11.885C18.4746 11.5597 18.7897 11.3476 19.1149 11.4111Z"
        fill="currentColor"
      />
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M15.25 7H20.75"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 4.25V9.75"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width="8" height="8" fill="white" transform="translate(14 3)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function AddedToCartIcon({ className = "" }: { className?: string }) {
  const clipPathId = useId();

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M17 18.375H7.35116C7.20479 18.375 7.06306 18.3236 6.95069 18.2298C6.83831 18.1361 6.76242 18.0058 6.73623 17.8618L4.65013 6.3882C4.62394 6.24419 4.54805 6.11394 4.43568 6.02016C4.3233 5.92637 4.18158 5.875 4.03521 5.875H2.625"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.625 21.5C8.48794 21.5 9.1875 20.8004 9.1875 19.9375C9.1875 19.0746 8.48794 18.375 7.625 18.375C6.76206 18.375 6.0625 19.0746 6.0625 19.9375C6.0625 20.8004 6.76206 21.5 7.625 21.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 21.5C17.8629 21.5 18.5625 20.8004 18.5625 19.9375C18.5625 19.0746 17.8629 18.375 17 18.375C16.1371 18.375 15.4375 19.0746 15.4375 19.9375C15.4375 20.8004 16.1371 21.5 17 21.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.134 11.3127C19.5133 11.3868 19.7616 11.7547 19.6877 12.134L19.0315 15.4865L19.0325 15.4875C18.9769 15.7927 18.8156 16.069 18.5774 16.2678C18.3689 16.4417 18.1127 16.547 17.844 16.5705L17.7288 16.5754H6.37524C5.98864 16.5754 5.67505 16.2618 5.67505 15.8752C5.67505 15.4886 5.98864 15.175 6.37524 15.175H17.6672L18.3127 11.8664C18.3868 11.4871 18.7548 11.2389 19.134 11.3127ZM14.0002 8.29999L14.1409 8.31464C14.46 8.37976 14.7004 8.66177 14.7004 9.00018C14.7004 9.33859 14.46 9.62061 14.1409 9.68573L14.0002 9.70038H5.12524C4.73864 9.70038 4.42505 9.38678 4.42505 9.00018C4.42505 8.61358 4.73864 8.29999 5.12524 8.29999H14.0002Z"
        fill="currentColor"
      />
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M19 10.5C21.4853 10.5 23.5 8.48528 23.5 6C23.5 3.51472 21.4853 1.5 19 1.5C16.5147 1.5 14.5 3.51472 14.5 6C14.5 8.48528 16.5147 10.5 19 10.5Z"
          fill="#008042"
        />
        <path
          d="M17.125 6.375L18.25 7.5L20.875 4.875"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width="12" height="12" fill="white" transform="translate(13)" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default function AddToCartButton({
  productId,
  quantity = 1,
  className = "",
  compact = false,
  showQuantityBadge = true,
  label = "Add to cart",
  children,
}: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { items: cartItems, addItem } = useCartStore();
  const quantityInCart = getCartQuantity(cartItems, productId);
  const [justAdded, setJustAdded] = useState(false);

  function stopNestedNavigation(
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.TouchEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
  }

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
        onMouseDown={stopNestedNavigation}
        onTouchStart={stopNestedNavigation}
        onClick={handleClick}
        aria-label={quantityInCart ? `Add one more, ${quantityInCart} already in cart` : label}
        className={`z-30 touch-manipulation ${className}`.trim()}
      >
        <div className="relative inline-flex items-center justify-center">
          {justAdded ? (
            <AddedToCartIcon className="h-6 w-6 text-white" />
          ) : (
            <AddToCartIcon className="h-6 w-6 text-white" />
          )}

          {showQuantityBadge && quantityInCart > 0 ? (
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
      onMouseDown={stopNestedNavigation}
      onTouchStart={stopNestedNavigation}
      onClick={handleClick}
      className={`z-30 touch-manipulation ${className}`.trim()}
      aria-label={label}
    >
      <span className="inline-flex items-center gap-2">
        {justAdded ? (
          <AddedToCartIcon className="h-6 w-6 text-white" />
        ) : (
          <AddToCartIcon className="h-6 w-6 text-white" />
        )}
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
