"use client";

import { useState } from "react";
import {
  getCartQuantity,
  getCartQuantityByLineId,
  useCartStore,
} from "@/components/cartStore";
import ProductBuyNowButton from "@/components/ProductBuyNowButton";
import { useOptionalProductOptionSelection } from "@/components/ProductOptionSelectionContext";
import QuantityStepper from "@/components/QuantityStepper";
import {
  clampProductQuantity,
  resolveProductQuantityBounds,
} from "@/lib/products";

type ProductMobileActionBarProps = {
  productId: string;
  stock: number;
  minOrderQuantity: number;
  maxPurchaseQuantity?: number | null;
};

export default function ProductMobileActionBar({
  productId,
  stock,
  minOrderQuantity,
  maxPurchaseQuantity,
}: ProductMobileActionBarProps) {
  const [draftQuantity, setDraftQuantity] = useState<string | null>(null);
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  const selectedOptionContext = useOptionalProductOptionSelection();
  const activeProductId = selectedOptionContext?.product.id || productId;
  const quantity = selectedOptionContext
    ? getCartQuantityByLineId(items, selectedOptionContext.resolved.lineId)
    : getCartQuantity(items, productId);
  const availableStock = Math.max(
    0,
    Math.floor(
      Number((selectedOptionContext?.resolved.stock ?? stock) || 0),
    ),
  );
  const quantityBounds = resolveProductQuantityBounds(
    { minOrderQuantity, maxPurchaseQuantity: maxPurchaseQuantity ?? null },
    availableStock,
  );
  const effectiveMinimumQuantity = quantityBounds.minimumQuantity;
  const effectiveMaximumQuantity = quantityBounds.maximumQuantity;
  const displayQuantity = clampProductQuantity(
    quantity || effectiveMinimumQuantity,
    quantityBounds,
  );
  const inputValue = draftQuantity ?? String(displayQuantity);
  const activeLineId = selectedOptionContext?.resolved.lineId || `${productId}::default`;

  async function handleDecrease() {
    if (quantity <= effectiveMinimumQuantity) {
      await removeItem(activeLineId);
      setDraftQuantity(null);
      return;
    }

    await updateQuantity(
      activeLineId,
      Math.max(effectiveMinimumQuantity, quantity - 1),
    );
    setDraftQuantity(null);
  }

  async function handleIncrease() {
    if (
      availableStock <= 0 ||
      (effectiveMaximumQuantity !== null && quantity >= effectiveMaximumQuantity)
    ) {
      return;
    }

    if (quantity <= 0) {
      await addItem(activeProductId, effectiveMinimumQuantity, selectedOptionContext
        ? {
            variantId: selectedOptionContext.resolved.variantId,
            optionSelections: selectedOptionContext.resolved.optionSelections,
          }
        : undefined);
      return;
    }

    await updateQuantity(
      activeLineId,
      quantity < effectiveMinimumQuantity
        ? effectiveMinimumQuantity
        : quantity + 1,
    );
    setDraftQuantity(null);
  }

  async function commitQuantity(value: string) {
    const numericQuantity = Number(value);

    if (!Number.isFinite(numericQuantity)) {
      setDraftQuantity(null);
      return;
    }

    const nextQuantity = clampProductQuantity(Math.floor(numericQuantity), quantityBounds);

    if (quantity <= 0) {
      await addItem(activeProductId, nextQuantity, selectedOptionContext
        ? {
            variantId: selectedOptionContext.resolved.variantId,
            optionSelections: selectedOptionContext.resolved.optionSelections,
          }
        : undefined);
    } else {
      await updateQuantity(activeLineId, nextQuantity);
    }

    setDraftQuantity(null);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e5e5e5] bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,0.98fr)_minmax(0,1fr)] gap-3">
        {availableStock <= 0 ? (
          <div className="flex h-12 items-center justify-center rounded-md border border-[#e6c7c2] bg-[#fff6f5] px-3 text-sm font-black text-[#b23b2b]">
            Out of stock
          </div>
        ) : quantity <= 0 ? (
          <button
            type="button"
            onClick={() => void handleIncrease()}
            className="flex h-12 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 transition hover:bg-[#f5fbf1]"
          >
            Add to Cart
          </button>
        ) : (
          <QuantityStepper
            value={inputValue}
            min={effectiveMinimumQuantity}
            max={effectiveMaximumQuantity ?? Math.max(1, availableStock)}
            ariaLabel="Cart quantity"
            decreaseAriaLabel="Decrease cart quantity"
            increaseAriaLabel="Increase cart quantity"
            className="h-12"
            increaseDisabled={
              effectiveMaximumQuantity !== null &&
              quantity >= effectiveMaximumQuantity
            }
            onInputFocus={() => setDraftQuantity(String(displayQuantity))}
            onChange={setDraftQuantity}
            onCommit={commitQuantity}
            onDecrease={handleDecrease}
            onIncrease={handleIncrease}
          />
        )}

        <ProductBuyNowButton
          productId={activeProductId}
          availableStock={availableStock}
          minOrderQuantity={minOrderQuantity}
          maxPurchaseQuantity={maxPurchaseQuantity}
          className="flex h-12 items-center justify-center rounded-md bg-[#207958] px-4 text-sm text-white transition hover:bg-[#3f764c]"
        >
          Buy Now
        </ProductBuyNowButton>
      </div>
    </div>
  );
}
