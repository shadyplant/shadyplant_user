"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError, type ApiResponse } from "@/lib/api";
import type { CartItem } from "@/content/store";

type CartStoreState = {
  items: CartItem[];
  isLoading: boolean;
  isReady: boolean;
  userId: string | null;
  errorMessage: string | null;
};

type CartApiResponse = ApiResponse<{
  cart: {
    items?: Array<{
      productId?: string;
      id?: string;
      quantity?: number;
    }>;
  };
}>;

const EMPTY_STATE: CartStoreState = {
  items: [],
  isLoading: false,
  isReady: false,
  userId: null,
  errorMessage: null,
};

let cartState: CartStoreState = EMPTY_STATE;
let cartLoadPromise: Promise<CartItem[]> | null = null;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setCartState(nextState: CartStoreState) {
  cartState = nextState;
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return cartState;
}

function getServerSnapshot() {
  return EMPTY_STATE;
}

function sanitizeCartItem(item: {
  productId?: string;
  id?: string;
  quantity?: number;
}): CartItem | null {
  const productId = String(item.productId || item.id || "").trim();
  const quantity = Number(item.quantity);

  if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }

  return {
    productId,
    quantity: Math.max(1, Math.floor(quantity)),
  };
}

function normalizeCartItems(response: CartApiResponse): CartItem[] {
  return Array.isArray(response.data.cart.items)
    ? response.data.cart.items.flatMap((item) => {
        const sanitizedItem = sanitizeCartItem(item);
        return sanitizedItem ? [sanitizedItem] : [];
      })
    : [];
}

function normalizeApiError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function resetCartState() {
  cartLoadPromise = null;
  setCartState({
    items: [],
    isLoading: false,
    isReady: true,
    userId: null,
    errorMessage: null,
  });
}

async function fetchCart(
  userId: string,
  fetchWithAuth: <T>(path: string, init?: RequestInit) => Promise<T>,
) {
  if (cartLoadPromise && cartState.userId === userId) {
    return cartLoadPromise;
  }

  setCartState({
    ...cartState,
    isLoading: true,
    isReady: cartState.isReady && cartState.userId === userId,
    userId,
    errorMessage: null,
  });

  cartLoadPromise = fetchWithAuth<CartApiResponse>("/cart")
    .then((response) => {
      const items = normalizeCartItems(response);
      setCartState({
        items,
        isLoading: false,
        isReady: true,
        userId,
        errorMessage: null,
      });
      return items;
    })
    .catch((error) => {
      setCartState({
        items: [],
        isLoading: false,
        isReady: true,
        userId,
        errorMessage: normalizeApiError(error, "Unable to load cart."),
      });
      throw error;
    })
    .finally(() => {
      cartLoadPromise = null;
    });

  return cartLoadPromise;
}

function applyCartResponse(userId: string, response: CartApiResponse) {
  const items = normalizeCartItems(response);

  setCartState({
    items,
    isLoading: false,
    isReady: true,
    userId,
    errorMessage: null,
  });

  return items;
}

export function useCartStore() {
  const { fetchWithAuth, isAuthenticated, isReady, user } = useAuth();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated || !user?.id) {
      resetCartState();
      return;
    }

    if (state.userId === user.id && state.isReady) {
      return;
    }

    void fetchCart(user.id, fetchWithAuth).catch((error) => {
      if (error instanceof ApiError && error.status === 401) {
        resetCartState();
      }
    });
  }, [
    fetchWithAuth,
    isAuthenticated,
    isReady,
    state.isReady,
    state.userId,
    user?.id,
  ]);

  async function addItem(productId: string, quantity = 1) {
    if (!isAuthenticated || !user?.id) {
      throw new ApiError(401, "Please sign in to use your cart.", null);
    }

    const response = await fetchWithAuth<CartApiResponse>("/cart/items", {
      method: "POST",
      body: JSON.stringify({
        productId,
        quantity,
      }),
    });

    return applyCartResponse(user.id, response);
  }

  async function updateQuantity(productId: string, quantity: number) {
    if (!isAuthenticated || !user?.id) {
      throw new ApiError(401, "Please sign in to use your cart.", null);
    }

    const response = await fetchWithAuth<CartApiResponse>(`/cart/items/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });

    return applyCartResponse(user.id, response);
  }

  async function removeItem(productId: string) {
    if (!isAuthenticated || !user?.id) {
      throw new ApiError(401, "Please sign in to use your cart.", null);
    }

    const response = await fetchWithAuth<CartApiResponse>(`/cart/items/${productId}`, {
      method: "DELETE",
    });

    return applyCartResponse(user.id, response);
  }

  async function clearItems() {
    if (!isAuthenticated || !user?.id) {
      throw new ApiError(401, "Please sign in to use your cart.", null);
    }

    const response = await fetchWithAuth<CartApiResponse>("/cart", {
      method: "DELETE",
    });

    return applyCartResponse(user.id, response);
  }

  async function reload() {
    if (!isAuthenticated || !user?.id) {
      resetCartState();
      return [];
    }

    return fetchCart(user.id, fetchWithAuth);
  }

  return {
    ...state,
    addItem,
    updateQuantity,
    removeItem,
    clearItems,
    reload,
  };
}

export function useCartItems() {
  return useCartStore().items;
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartQuantity(items: CartItem[], productId: string) {
  return items.find((item) => item.productId === productId)?.quantity ?? 0;
}
