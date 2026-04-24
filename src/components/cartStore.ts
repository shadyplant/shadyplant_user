"use client";

import { useSyncExternalStore } from "react";
import type { CartItem } from "@/content/store";

const STORAGE_KEY = "ggn-cart";
const CART_EVENT = "ggn-cart-change";
const EMPTY_SNAPSHOT = "[]";

function sanitizeCartItem(item: unknown): CartItem | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const candidate = item as Partial<CartItem>;
  const quantity = Number(candidate.quantity);

  if (
    typeof candidate.productId !== "string" ||
    !candidate.productId ||
    !Number.isFinite(quantity)
  ) {
    return null;
  }

  return {
    productId: candidate.productId,
    quantity: Math.max(1, Math.floor(quantity)),
  };
}

export function parseCart(snapshot: string): CartItem[] {
  if (!snapshot) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(snapshot);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.flatMap((item) => {
      const sanitizedItem = sanitizeCartItem(item);
      return sanitizedItem ? [sanitizedItem] : [];
    });
  } catch {
    return [];
  }
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseCart(window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT);
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  const sanitizedItems = items.flatMap((item) => {
    const sanitizedItem = sanitizeCartItem(item);
    return sanitizedItem ? [sanitizedItem] : [];
  });

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedItems));
  window.dispatchEvent(new Event(CART_EVENT));
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(CART_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(CART_EVENT, handleChange);
  };
}

function getCartSnapshot() {
  if (typeof window === "undefined") {
    return EMPTY_SNAPSHOT;
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
}

function getServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

export function useCartItems() {
  const cartSnapshot = useSyncExternalStore(
    subscribe,
    getCartSnapshot,
    getServerSnapshot,
  );

  return parseCart(cartSnapshot);
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartQuantity(items: CartItem[], productId: string) {
  return items.find((item) => item.productId === productId)?.quantity ?? 0;
}

export function addCartItem(productId: string, quantity = 1) {
  const normalizedQuantity = Math.max(1, Math.floor(quantity));
  const currentItems = readCart();
  const existingItem = currentItems.find((item) => item.productId === productId);

  if (existingItem) {
    writeCart(
      currentItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + normalizedQuantity }
          : item,
      ),
    );
    return;
  }

  writeCart([...currentItems, { productId, quantity: normalizedQuantity }]);
}

export function updateCartQuantity(productId: string, quantity: number) {
  const normalizedQuantity = Math.max(0, Math.floor(quantity));
  const currentItems = readCart();

  if (normalizedQuantity === 0) {
    writeCart(currentItems.filter((item) => item.productId !== productId));
    return;
  }

  writeCart(
    currentItems.map((item) =>
      item.productId === productId ? { ...item, quantity: normalizedQuantity } : item,
    ),
  );
}

export function removeCartItem(productId: string) {
  writeCart(readCart().filter((item) => item.productId !== productId));
}

export function clearCart() {
  writeCart([]);
}
