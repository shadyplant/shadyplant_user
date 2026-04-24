"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ggn-wishlist";
const WISHLIST_EVENT = "ggn-wishlist-change";
const EMPTY_SNAPSHOT = "";

export function parseWishlist(snapshot: string): string[] {
  if (!snapshot) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(snapshot);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

export function readWishlist(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseWishlist(window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT);
}

export function writeWishlist(items: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(WISHLIST_EVENT));
}

export function clearWishlist() {
  writeWishlist([]);
}

export function removeWishlistItem(productId: string) {
  writeWishlist(readWishlist().filter((item) => item !== productId));
}

export function addWishlistItem(productId: string) {
  const items = readWishlist();

  if (items.includes(productId)) {
    return;
  }

  writeWishlist([...items, productId]);
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(WISHLIST_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(WISHLIST_EVENT, handleChange);
  };
}

function getWishlistSnapshot() {
  if (typeof window === "undefined") {
    return EMPTY_SNAPSHOT;
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
}

function getServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

export function useWishlistItems() {
  const wishlistSnapshot = useSyncExternalStore(
    subscribe,
    getWishlistSnapshot,
    getServerSnapshot,
  );

  return parseWishlist(wishlistSnapshot);
}
