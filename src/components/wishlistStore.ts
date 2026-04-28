"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError, type ApiResponse } from "@/lib/api";

type WishlistStoreState = {
  items: string[];
  isLoading: boolean;
  isReady: boolean;
  userId: string | null;
  errorMessage: string | null;
};

type WishlistApiResponse = ApiResponse<{
  wishlist: {
    items?: Array<{
      productId?: string;
      id?: string;
    }>;
  };
}>;

const EMPTY_STATE: WishlistStoreState = {
  items: [],
  isLoading: false,
  isReady: false,
  userId: null,
  errorMessage: null,
};

let wishlistState: WishlistStoreState = EMPTY_STATE;
let wishlistLoadPromise: Promise<string[]> | null = null;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setWishlistState(nextState: WishlistStoreState) {
  wishlistState = nextState;
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return wishlistState;
}

function getServerSnapshot() {
  return EMPTY_STATE;
}

function sanitizeWishlistItem(item: {
  productId?: string;
  id?: string;
}) {
  return String(item.productId || item.id || "").trim();
}

function normalizeWishlistItems(response: WishlistApiResponse) {
  return Array.isArray(response.data.wishlist.items)
    ? response.data.wishlist.items.flatMap((item) => {
        const productId = sanitizeWishlistItem(item);
        return productId ? [productId] : [];
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

function resetWishlistState() {
  wishlistLoadPromise = null;
  setWishlistState({
    items: [],
    isLoading: false,
    isReady: true,
    userId: null,
    errorMessage: null,
  });
}

async function fetchWishlist(
  userId: string,
  fetchWithAuth: <T>(path: string, init?: RequestInit) => Promise<T>,
) {
  if (wishlistLoadPromise && wishlistState.userId === userId) {
    return wishlistLoadPromise;
  }

  setWishlistState({
    ...wishlistState,
    isLoading: true,
    isReady: wishlistState.isReady && wishlistState.userId === userId,
    userId,
    errorMessage: null,
  });

  wishlistLoadPromise = fetchWithAuth<WishlistApiResponse>("/wishlist")
    .then((response) => {
      const items = normalizeWishlistItems(response);
      setWishlistState({
        items,
        isLoading: false,
        isReady: true,
        userId,
        errorMessage: null,
      });
      return items;
    })
    .catch((error) => {
      setWishlistState({
        items: [],
        isLoading: false,
        isReady: true,
        userId,
        errorMessage: normalizeApiError(error, "Unable to load wishlist."),
      });
      throw error;
    })
    .finally(() => {
      wishlistLoadPromise = null;
    });

  return wishlistLoadPromise;
}

function applyWishlistResponse(userId: string, response: WishlistApiResponse) {
  const items = normalizeWishlistItems(response);

  setWishlistState({
    items,
    isLoading: false,
    isReady: true,
    userId,
    errorMessage: null,
  });

  return items;
}

export function useWishlistStore() {
  const { fetchWithAuth, isAuthenticated, isReady, user } = useAuth();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated || !user?.id) {
      resetWishlistState();
      return;
    }

    if (state.userId === user.id && state.isReady) {
      return;
    }

    void fetchWishlist(user.id, fetchWithAuth).catch((error) => {
      if (error instanceof ApiError && error.status === 401) {
        resetWishlistState();
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

  async function addItem(productId: string) {
    if (!isAuthenticated || !user?.id) {
      throw new ApiError(401, "Please sign in to use your wishlist.", null);
    }

    const response = await fetchWithAuth<WishlistApiResponse>("/wishlist/items", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });

    return applyWishlistResponse(user.id, response);
  }

  async function removeItem(productId: string) {
    if (!isAuthenticated || !user?.id) {
      throw new ApiError(401, "Please sign in to use your wishlist.", null);
    }

    const response = await fetchWithAuth<WishlistApiResponse>(
      `/wishlist/items/${productId}`,
      {
        method: "DELETE",
      },
    );

    return applyWishlistResponse(user.id, response);
  }

  async function clearItems() {
    if (!isAuthenticated || !user?.id) {
      throw new ApiError(401, "Please sign in to use your wishlist.", null);
    }

    const response = await fetchWithAuth<WishlistApiResponse>("/wishlist", {
      method: "DELETE",
    });

    return applyWishlistResponse(user.id, response);
  }

  async function reload() {
    if (!isAuthenticated || !user?.id) {
      resetWishlistState();
      return [];
    }

    return fetchWishlist(user.id, fetchWithAuth);
  }

  return {
    ...state,
    addItem,
    removeItem,
    clearItems,
    reload,
  };
}

export function useWishlistItems() {
  return useWishlistStore().items;
}
