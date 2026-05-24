"use client";

import { FormEvent, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import {
  getCartQuantity,
  getCartQuantityByLineId,
  useCartStore,
} from "@/components/cartStore";
import ProductBuyNowButton from "@/components/ProductBuyNowButton";
import { useOptionalProductOptionSelection } from "@/components/ProductOptionSelectionContext";

type ProductMobileActionBarProps = {
  productId: string;
  stock: number;
  minOrderQuantity: number;
};

export default function ProductMobileActionBar({
  productId,
  stock,
  minOrderQuantity,
}: ProductMobileActionBarProps) {
  const [isQuantityPopupOpen, setIsQuantityPopupOpen] = useState(false);
  const [quantityInput, setQuantityInput] = useState("1");
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
  const effectiveMinimumQuantity =
    availableStock > 0
      ? Math.max(1, Math.min(minOrderQuantity, availableStock))
      : Math.max(1, minOrderQuantity);
  const displayQuantity = Math.max(effectiveMinimumQuantity, quantity);
  const activeLineId = selectedOptionContext?.resolved.lineId || `${productId}::default`;

  function openQuantityPopup() {
    setQuantityInput(String(displayQuantity));
    setIsQuantityPopupOpen(true);
  }

  async function handleDecrease() {
    if (quantity <= effectiveMinimumQuantity) {
      await removeItem(activeLineId);
      return;
    }

    await updateQuantity(
      activeLineId,
      Math.max(effectiveMinimumQuantity, quantity - 1),
    );
  }

  async function handleIncrease() {
    if (availableStock <= 0 || quantity >= availableStock) {
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
  }

  async function handleQuantitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericQuantity = Number(quantityInput);

    if (!Number.isFinite(numericQuantity)) {
      return;
    }

    const nextQuantity = Math.max(
      effectiveMinimumQuantity,
      Math.min(
        availableStock || effectiveMinimumQuantity,
        Math.floor(numericQuantity),
      ),
    );

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

    setIsQuantityPopupOpen(false);
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e5e5e5] bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,0.98fr)_minmax(0,1fr)] gap-3">
          {availableStock <= 0 ? (
            <div className="flex h-12 items-center justify-center rounded-xl border border-[#e6c7c2] bg-[#fff6f5] px-3 text-sm font-black text-[#b23b2b]">
              Out of stock
            </div>
          ) : quantity <= 0 ? (
            <button
              type="button"
              onClick={() => void handleIncrease()}
              className="flex h-12 items-center justify-center rounded-xl border border-[#55ad35] bg-white px-3 text-sm font-black text-[#2f8f20] transition hover:bg-[#f5fbf1]"
            >
              Add to Cart
            </button>
          ) : (
            <div className="grid h-12 grid-cols-3 overflow-hidden rounded-[0.5rem] border border-[#4c8d5b] bg-white text-[#0d9a55]">
              <button
                type="button"
                onClick={() => void handleDecrease()}
                className="flex items-center justify-center bg-[#e7f9e7] transition hover:bg-[#d7f1d7]"
                aria-label="Decrease cart quantity"
              >
                <Minus size={18} strokeWidth={2.4} />
              </button>

              <button
                type="button"
                onClick={openQuantityPopup}
                className="flex min-w-0 items-center justify-center border-x border-[#d9eddc] bg-white text-base font-black leading-none text-[#0d9a55] transition hover:bg-[#f9fff9]"
                aria-label="Edit cart quantity"
              >
                {displayQuantity}
              </button>

              <button
                type="button"
                onClick={() => void handleIncrease()}
                disabled={quantity >= availableStock}
                className="flex items-center justify-center bg-[#e7f9e7] transition hover:bg-[#d7f1d7] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Increase cart quantity"
              >
                <Plus size={19} strokeWidth={2.4} />
              </button>
            </div>
          )}

          <ProductBuyNowButton
            productId={activeProductId}
            availableStock={availableStock}
            className="flex h-12 items-center justify-center rounded-[0.5rem] bg-[#4c8d5b] px-4 text-sm font-black text-white transition hover:bg-[#3f764c]"
          >
            Buy Now
          </ProductBuyNowButton>
        </div>
      </div>

      {isQuantityPopupOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 px-4 pb-20 backdrop-blur-[2px] md:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close quantity editor"
            onClick={() => setIsQuantityPopupOpen(false)}
          />

          <form
            onSubmit={(event) => void handleQuantitySubmit(event)}
            className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="mobile-product-quantity"
                className="text-sm font-bold text-[#163915]"
              >
                Enter quantity
              </label>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f8ea] text-[#214f14]"
                aria-label="Close quantity editor"
                onClick={() => setIsQuantityPopupOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <input
              id="mobile-product-quantity"
              type="number"
              min={effectiveMinimumQuantity}
              max={availableStock}
              inputMode="numeric"
              value={quantityInput}
              onChange={(event) => setQuantityInput(event.target.value)}
              className="mt-4 h-12 w-full rounded-xl border border-[#174f18] px-4 text-center text-lg font-black text-[#174f18] outline-none focus:border-[#174f18] focus:ring-4 focus:ring-[#f4fbf2]"
              autoFocus
            />

            <button
              type="submit"
              className="mt-4 h-11 w-full rounded-xl bg-[#174f18] text-sm font-black text-white transition hover:bg-[#103b11]"
            >
              Update quantity
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
