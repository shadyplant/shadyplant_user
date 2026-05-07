"use client";

import { KeyboardEvent, useState } from "react";
import { BellRing, Minus, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getCartQuantity, useCartStore } from "@/components/cartStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProductStockAlertStore } from "@/components/productStockAlertStore";

type ProductCardCartControlProps = {
  productId: string;
  stock: number;
  minOrderQuantity: number;
};

function AddCartIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
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
      <g clipPath="url(#product-card-cart-plus)">
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
        <clipPath id="product-card-cart-plus">
          <rect width="8" height="8" fill="white" transform="translate(14 3)" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default function ProductCardCartControl({
  productId,
  stock,
  minOrderQuantity,
}: ProductCardCartControlProps) {
  const [draftQuantity, setDraftQuantity] = useState<string | null>(null);
  const [isSubmittingNotify, setIsSubmittingNotify] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { items, addItem, updateQuantity } = useCartStore();
  const { items: requestedAlertItems, requestAlert } =
    useProductStockAlertStore();
  const hasRequestedNotify = requestedAlertItems.includes(productId);
  const quantity = getCartQuantity(items, productId);
  const defaultLineId = `${productId}::default`;
  const availableStock = Math.max(0, Math.floor(Number(stock || 0)));
  const effectiveMinimumQuantity =
    availableStock > 0
      ? Math.max(1, Math.min(minOrderQuantity, availableStock))
      : Math.max(1, minOrderQuantity);
  const displayQuantity = Math.max(effectiveMinimumQuantity, quantity);
  const inputValue = draftQuantity ?? String(displayQuantity);

  function swallowCardNavigation(
    event:
      | React.MouseEvent<HTMLElement>
      | React.TouchEvent<HTMLElement>
      | React.FocusEvent<HTMLElement>,
  ) {
    event.stopPropagation();
  }

  function redirectToAuth() {
    router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
  }

  async function requestProductNotify() {
    if (!isAuthenticated) {
      redirectToAuth();
      return;
    }

    if (hasRequestedNotify || isSubmittingNotify) {
      return;
    }

    setIsSubmittingNotify(true);

    try {
      await requestAlert(productId);
    } finally {
      setIsSubmittingNotify(false);
    }
  }

  async function addFirstItem() {
    if (availableStock <= 0) {
      return;
    }

    if (!isAuthenticated) {
      redirectToAuth();
      return;
    }

    await addItem(productId, effectiveMinimumQuantity);
  }

  async function decreaseQuantity() {
    if (!isAuthenticated) {
      redirectToAuth();
      return;
    }

    if (quantity <= 0) {
      return;
    }

    if (quantity <= effectiveMinimumQuantity) {
      setDraftQuantity(null);
      return;
    }

    await updateQuantity(
      defaultLineId,
      Math.max(effectiveMinimumQuantity, quantity - 1),
    );
    setDraftQuantity(null);
  }

  async function increaseQuantity() {
    if (availableStock <= 0 || quantity >= availableStock) {
      return;
    }

    if (!isAuthenticated) {
      redirectToAuth();
      return;
    }

    await updateQuantity(
      defaultLineId,
      quantity < effectiveMinimumQuantity
        ? effectiveMinimumQuantity
        : quantity + 1,
    );
    setDraftQuantity(null);
  }

  async function commitQuantity(value: string) {
    if (!isAuthenticated) {
      redirectToAuth();
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      setDraftQuantity(null);
      return;
    }

    const nextQuantity = Math.max(
      effectiveMinimumQuantity,
      Math.min(availableStock || effectiveMinimumQuantity, Math.floor(numericValue)),
    );

    if (quantity <= 0) {
      await addItem(productId, nextQuantity);
    } else {
      await updateQuantity(defaultLineId, nextQuantity);
    }

    setDraftQuantity(null);
  }

  function handleQuantityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  }

  if (availableStock <= 0) {
    return (
      <button
        type="button"
        onMouseDown={swallowCardNavigation}
        onTouchStart={swallowCardNavigation}
        onClick={() => void requestProductNotify()}
        disabled={hasRequestedNotify || isSubmittingNotify}
        aria-label={
          hasRequestedNotify
            ? "Stock notification already requested"
            : "Get stock notification"
        }
        className="relative z-30 mt-4 flex h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-[0.5rem] border border-[#55ad35] bg-transparent px-3 text-base font-bold tracking-normal text-[#2f6d1d] transition hover:bg-[#f4fbf1] disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:text-lg"
      >
        <span>
          {hasRequestedNotify
            ? "Requested"
            : isSubmittingNotify
              ? "Processing..."
              : "Get Notify"}
        </span>
        <BellRing size={18} strokeWidth={2.2} />
      </button>
    );
  }

  if (quantity <= 0) {
    return (
      <button
        type="button"
        onMouseDown={swallowCardNavigation}
        onTouchStart={swallowCardNavigation}
        onClick={() => void addFirstItem()}
        className="relative z-30 mt-4 flex h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-[0.5rem] bg-[#55ad35] px-3 text-base font-bold tracking-normal text-white transition hover:bg-[#469829] sm:h-12 sm:text-lg"
      >
        <span>Add to cart</span>
        <AddCartIcon />
      </button>
    );
  }

  return (
    <div className="relative z-30 mt-4 grid h-11 w-full grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] overflow-hidden rounded-[0.5rem] bg-[#55ad35] text-white transition sm:h-12 sm:grid-cols-[3rem_minmax(0,1fr)_3rem]">
      <button
        type="button"
        onMouseDown={swallowCardNavigation}
        onTouchStart={swallowCardNavigation}
        onClick={() => void decreaseQuantity()}
        disabled={quantity <= effectiveMinimumQuantity}
        className="touch-manipulation flex items-center justify-center transition hover:bg-[#469829] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Decrease cart quantity"
      >
        <Minus size={19} strokeWidth={2.7} />
      </button>

      <input
        type="number"
        min={effectiveMinimumQuantity}
        max={availableStock}
        inputMode="numeric"
        value={inputValue}
        onMouseDown={swallowCardNavigation}
        onTouchStart={swallowCardNavigation}
        onFocus={(event) => {
          swallowCardNavigation(event);
          setDraftQuantity(String(displayQuantity));
        }}
        onChange={(event) => setDraftQuantity(event.target.value)}
        onBlur={(event) => void commitQuantity(event.target.value)}
        onKeyDown={handleQuantityKeyDown}
        className="min-w-0 border-x border-white/30 bg-transparent text-center text-lg font-black text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Cart quantity"
      />

      <button
        type="button"
        onMouseDown={swallowCardNavigation}
        onTouchStart={swallowCardNavigation}
        onClick={() => void increaseQuantity()}
        disabled={quantity >= availableStock}
        className="touch-manipulation flex items-center justify-center transition hover:bg-[#469829] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Increase cart quantity"
      >
        <Plus size={21} strokeWidth={2.7} />
      </button>
    </div>
  );
}
