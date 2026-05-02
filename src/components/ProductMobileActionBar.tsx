"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getCartQuantity, useCartStore } from "@/components/cartStore";
import { useAuth } from "@/components/auth/AuthProvider";

type ProductMobileActionBarProps = {
  productId: string;
  checkoutHref: string;
};

export default function ProductMobileActionBar({
  productId,
  checkoutHref,
}: ProductMobileActionBarProps) {
  const [isQuantityPopupOpen, setIsQuantityPopupOpen] = useState(false);
  const [quantityInput, setQuantityInput] = useState("1");
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  const quantity = getCartQuantity(items, productId);
  const displayQuantity = Math.max(1, quantity);

  function redirectToAuth() {
    router.push(`/auth?next=${encodeURIComponent(pathname || "/")}`);
  }

  function openQuantityPopup() {
    setQuantityInput(String(displayQuantity));
    setIsQuantityPopupOpen(true);
  }

  async function handleDecrease() {
    if (!isAuthenticated) {
      redirectToAuth();
      return;
    }

    if (quantity <= 0) {
      return;
    }

    if (quantity === 1) {
      await removeItem(productId);
      return;
    }

    await updateQuantity(productId, quantity - 1);
  }

  async function handleIncrease() {
    if (!isAuthenticated) {
      redirectToAuth();
      return;
    }

    if (quantity <= 0) {
      await addItem(productId, 1);
      return;
    }

    await updateQuantity(productId, quantity + 1);
  }

  async function handleQuantitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      redirectToAuth();
      return;
    }

    const numericQuantity = Number(quantityInput);

    if (!Number.isFinite(numericQuantity)) {
      return;
    }

    const nextQuantity = Math.max(1, Math.min(99, Math.floor(numericQuantity)));

    if (quantity <= 0) {
      await addItem(productId, nextQuantity);
    } else {
      await updateQuantity(productId, nextQuantity);
    }

    setIsQuantityPopupOpen(false);
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e5e5e5] bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,0.98fr)_minmax(0,1fr)] gap-3">
          {quantity <= 0 ? (
            <button
              type="button"
              onClick={() => void handleIncrease()}
              className="flex h-12 items-center justify-center rounded-xl border border-[#55ad35] bg-white px-3 text-sm font-black text-[#2f8f20] transition hover:bg-[#f5fbf1]"
            >
              Add to Cart
            </button>
          ) : (
            <div className="grid h-12 grid-cols-3 overflow-hidden rounded-xl border border-[#55ad35] bg-white text-[#2f8f20]">
              <button
                type="button"
                onClick={() => void handleDecrease()}
                className="flex items-center justify-center transition hover:bg-[#f4fbf2]"
                aria-label="Decrease cart quantity"
              >
                <Minus size={18} strokeWidth={2.4} />
              </button>

              <button
                type="button"
                onClick={openQuantityPopup}
                className="flex min-w-0 items-center justify-center border-x border-[#d8ead3] text-base font-black leading-none transition hover:bg-[#f4fbf2]"
                aria-label="Edit cart quantity"
              >
                {displayQuantity}
              </button>

              <button
                type="button"
                onClick={() => void handleIncrease()}
                className="flex items-center justify-center transition hover:bg-[#f4fbf2]"
                aria-label="Increase cart quantity"
              >
                <Plus size={19} strokeWidth={2.4} />
              </button>
            </div>
          )}

          <Link
            href={checkoutHref}
            className="flex h-12 items-center justify-center rounded-xl bg-[#55ad35] px-4 text-sm font-black text-white transition hover:bg-[#469829]"
          >
            Buy Now
          </Link>
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
              <label htmlFor="mobile-product-quantity" className="text-sm font-bold text-[#163915]">
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
              min={1}
              max={99}
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
