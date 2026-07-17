"use client";

import { useId, useState, type ReactNode } from "react";
import {
  getCartQuantity,
  getCartQuantityByLineId,
  useCartStore,
} from "@/components/cartStore";
import { useOptionalProductOptionSelection } from "@/components/ProductOptionSelectionContext";
import QuantityStepper from "@/components/QuantityStepper";

type AddToCartButtonProps = {
  productId: string;
  quantity?: number;
  availableStock?: number;
  minOrderQuantity?: number;
  showQuantityControls?: boolean;
  className?: string;
  compact?: boolean;
  showQuantityBadge?: boolean;
  label?: string;
  showInlineInCartLabel?: boolean;
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
  availableStock,
  minOrderQuantity = 1,
  showQuantityControls = false,
  className = "",
  compact = false,
  showQuantityBadge = true,
  label = "Add to cart",
  showInlineInCartLabel = false,
  children,
}: AddToCartButtonProps) {
  const { items: cartItems, addItem, updateQuantity, removeItem } = useCartStore();
  const selectedOptionContext = useOptionalProductOptionSelection();
  const activeProductId = selectedOptionContext?.product.id || productId;
  const activeLineId =
    selectedOptionContext?.resolved.lineId || `${productId}::default`;
  const quantityInCart = selectedOptionContext
    ? getCartQuantityByLineId(cartItems, selectedOptionContext.resolved.lineId)
    : getCartQuantity(cartItems, productId);
  const [justAdded, setJustAdded] = useState(false);
  const [draftQuantity, setDraftQuantity] = useState<string | null>(null);
  const effectiveAvailableStock =
    selectedOptionContext?.resolved.stock ?? availableStock;
  const stockAvailable = Math.max(
    0,
    Math.floor(
      Number(
        effectiveAvailableStock ?? 0,
      ),
    ),
  );
  const effectiveMinimumQuantity =
    stockAvailable > 0
      ? Math.max(1, Math.min(minOrderQuantity, stockAvailable))
      : Math.max(1, minOrderQuantity);
  const isOutOfStock =
    effectiveAvailableStock !== undefined && stockAvailable <= 0;
  const hasReachedStockLimit =
    effectiveAvailableStock !== undefined && quantityInCart >= stockAvailable;
  const displayQuantity = Math.max(effectiveMinimumQuantity, quantityInCart);
  const inputValue = draftQuantity ?? String(displayQuantity);

  function stopNestedNavigation(
    event:
      | React.MouseEvent<HTMLElement>
      | React.TouchEvent<HTMLElement>
      | React.FocusEvent<HTMLElement>,
  ) {
    event.stopPropagation();
  }

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isOutOfStock || hasReachedStockLimit) {
      return;
    }

    await addItem(
      activeProductId,
      Math.max(quantity, effectiveMinimumQuantity),
      selectedOptionContext
      ? {
          variantId: selectedOptionContext.resolved.variantId,
          optionSelections: selectedOptionContext.resolved.optionSelections,
        }
      : undefined,
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  }

  async function decreaseQuantity() {
    if (quantityInCart <= effectiveMinimumQuantity) {
      await removeItem(activeLineId);
      setDraftQuantity(null);
      return;
    }

    await updateQuantity(
      activeLineId,
      Math.max(effectiveMinimumQuantity, quantityInCart - 1),
    );
    setDraftQuantity(null);
  }

  async function increaseQuantity() {
    if (isOutOfStock || hasReachedStockLimit) {
      return;
    }

    if (quantityInCart <= 0) {
      await addItem(
        activeProductId,
        effectiveMinimumQuantity,
        selectedOptionContext
          ? {
              variantId: selectedOptionContext.resolved.variantId,
              optionSelections: selectedOptionContext.resolved.optionSelections,
            }
          : undefined,
      );
      return;
    }

    await updateQuantity(
      activeLineId,
      quantityInCart < effectiveMinimumQuantity
        ? effectiveMinimumQuantity
        : quantityInCart + 1,
    );
    setDraftQuantity(null);
  }

  async function commitQuantity(value: string) {
    const numericQuantity = Number(value);

    if (!Number.isFinite(numericQuantity)) {
      setDraftQuantity(null);
      return;
    }

    const nextQuantity = Math.max(
      effectiveMinimumQuantity,
      Math.min(
        stockAvailable || effectiveMinimumQuantity,
        Math.floor(numericQuantity),
      ),
    );

    if (quantityInCart <= 0) {
      await addItem(
        activeProductId,
        nextQuantity,
        selectedOptionContext
          ? {
              variantId: selectedOptionContext.resolved.variantId,
              optionSelections: selectedOptionContext.resolved.optionSelections,
            }
          : undefined,
      );
    } else {
      await updateQuantity(activeLineId, nextQuantity);
    }

    setDraftQuantity(null);
  }

  if (compact) {
    return (
      <button
        type="button"
        onMouseDown={stopNestedNavigation}
        onTouchStart={stopNestedNavigation}
        onClick={handleClick}
        aria-label={
          isOutOfStock
            ? "Add to cart unavailable"
            : quantityInCart
              ? `Add one more, ${quantityInCart} already in cart`
              : label
        }
        disabled={isOutOfStock || hasReachedStockLimit}
        className={`group relative isolate overflow-hidden z-30 touch-manipulation disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 -bottom-[20%] -z-10 h-10 w-10 -translate-x-1/2 translate-y-full scale-100 rounded-full bg-black transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-[60%] group-hover:scale-[8] group-focus-visible:translate-y-[60%] group-focus-visible:scale-[8]"
        />
        <div className="relative z-10 inline-flex items-center justify-center">
          {justAdded ? (
            <AddedToCartIcon className="h-6 w-6" />
          ) : (
            <AddToCartIcon className="h-6 w-6" />
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

  if (showQuantityControls && quantityInCart > 0 && !isOutOfStock) {
    return (
      <QuantityStepper
        value={inputValue}
        min={effectiveMinimumQuantity}
        max={stockAvailable || effectiveMinimumQuantity}
        ariaLabel="Cart quantity"
        decreaseAriaLabel="Decrease cart quantity"
        increaseAriaLabel="Increase cart quantity"
        className="h-12 min-w-[12.5rem] sm:min-w-[13.5rem]"
        increaseDisabled={hasReachedStockLimit}
        onMouseDown={stopNestedNavigation}
        onTouchStart={stopNestedNavigation}
        onInputFocus={(event) => {
          stopNestedNavigation(event);
          setDraftQuantity(String(displayQuantity));
        }}
        onChange={setDraftQuantity}
        onCommit={commitQuantity}
        onDecrease={decreaseQuantity}
        onIncrease={increaseQuantity}
      />
    );
  }

  return (
    <button
      type="button"
      onMouseDown={stopNestedNavigation}
      onTouchStart={stopNestedNavigation}
      onClick={handleClick}
      className={`group relative isolate overflow-hidden z-30 touch-manipulation disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      aria-label={isOutOfStock ? "Add to cart unavailable" : label}
      disabled={isOutOfStock || hasReachedStockLimit}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -bottom-[20%] -z-10 h-10 w-10 -translate-x-1/2 translate-y-full scale-100 rounded-full bg-[#07ab4e] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-[60%] group-hover:scale-[10] group-focus-visible:translate-y-[60%] group-focus-visible:scale-[8]"
      />
      <span className="relative z-10 inline-flex items-center gap-2">
        {justAdded ? (
          <AddedToCartIcon className="h-6 w-6 shrink-0" />
        ) : (
          <AddToCartIcon className="h-6 w-6 shrink-0" />
        )}
        <span>
          {justAdded
            ? "Added to cart"
            : showInlineInCartLabel && quantityInCart > 0
              ? `Added ${quantityInCart} in cart`
              : children ?? label}
        </span>
      </span>

      {quantityInCart > 0 && !showInlineInCartLabel ? (
        <span className="relative z-10 rounded-full bg-[#214f14] px-3 py-1 text-xs font-bold text-white">
          {quantityInCart} in cart
        </span>
      ) : null}
    </button>
  );
}