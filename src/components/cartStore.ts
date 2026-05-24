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
      id?: string;
      productId?: string;
      variantId?: string;
      variantLabel?: string;
      packLabel?: string;
      unitPrice?: number | null;
      unitMrp?: number | null;
      optionSelections?: Array<{
        groupKey?: string;
        optionKey?: string;
        label?: string;
        groupTitle?: string;
      }>;
      quantity?: number;
    }>;
  };
}>;

const GUEST_CART_STORAGE_KEY = "ggnGuestCart";

const EMPTY_STATE: CartStoreState = {
  items: [],
  isLoading: false,
  isReady: false,
  userId: null,
  errorMessage: null,
};

let cartState: CartStoreState = EMPTY_STATE;
let cartLoadPromise: Promise<CartItem[]> | null = null;
let cartSyncPromise: Promise<CartItem[]> | null = null;

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

function buildVariantId(
  optionSelections?: CartItem["optionSelections"],
  fallbackVariantId = "",
) {
  const normalizedSelections = Array.isArray(optionSelections)
    ? optionSelections
        .map((selection) => ({
          groupKey: String(selection.groupKey || "").trim(),
          optionKey: String(selection.optionKey || "").trim(),
        }))
        .filter((selection) => selection.groupKey && selection.optionKey)
    : [];

  if (normalizedSelections.length) {
    return normalizedSelections
      .map((selection) => `${selection.groupKey}~${selection.optionKey}`)
      .join("|");
  }

  return String(fallbackVariantId || "").trim();
}

function buildCartLineId(productId: string, variantId = "") {
  return `${productId}::${variantId || "default"}`;
}

function sanitizeCartItem(item: {
  id?: string;
  productId?: string;
  variantId?: string;
  variantLabel?: string;
  packLabel?: string;
  unitPrice?: number | null;
  unitMrp?: number | null;
  optionSelections?: Array<{
    groupKey?: string;
    optionKey?: string;
    label?: string;
    groupTitle?: string;
  }>;
  quantity?: number;
}): CartItem | null {
  const productId = String(item.productId || "").trim();
  const lineId = String(item.id || "").trim();
  const quantity = Number(item.quantity);

  if (!productId || !lineId || !Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }

  return {
    id: lineId,
    productId,
    variantId: String(item.variantId || "").trim(),
    variantLabel: String(item.variantLabel || "").trim() || undefined,
    packLabel: String(item.packLabel || "").trim() || undefined,
    unitPrice:
      item.unitPrice === undefined || item.unitPrice === null
        ? null
        : Number(item.unitPrice),
    unitMrp:
      item.unitMrp === undefined || item.unitMrp === null
        ? null
        : Number(item.unitMrp),
    optionSelections: Array.isArray(item.optionSelections)
      ? item.optionSelections.flatMap((selection) => {
          const groupKey = String(selection.groupKey || "").trim();
          const optionKey = String(selection.optionKey || "").trim();

          if (!groupKey || !optionKey) {
            return [];
          }

          return [
            {
              groupKey,
              optionKey,
              label: String(selection.label || "").trim() || undefined,
              groupTitle: String(selection.groupTitle || "").trim() || undefined,
            },
          ];
        })
      : undefined,
    quantity: Math.max(1, Math.floor(quantity)),
  };
}

function readGuestCartItems() {
  if (typeof window === "undefined") {
    return [] as CartItem[];
  }

  try {
    const rawItems = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);

    if (!rawItems) {
      return [];
    }

    const parsedItems = JSON.parse(rawItems) as Array<{
      id?: string;
      productId?: string;
      variantId?: string;
      variantLabel?: string;
      packLabel?: string;
      unitPrice?: number | null;
      unitMrp?: number | null;
      optionSelections?: Array<{
        groupKey?: string;
        optionKey?: string;
        label?: string;
        groupTitle?: string;
      }>;
      quantity?: number;
    }>;

    return Array.isArray(parsedItems)
      ? parsedItems.flatMap((item) => {
          const sanitizedItem = sanitizeCartItem(item);
          return sanitizedItem ? [sanitizedItem] : [];
        })
      : [];
  } catch {
    return [];
  }
}

function writeGuestCartItems(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  if (!items.length) {
    window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
}

function normalizeCartItems(response: CartApiResponse): CartItem[] {
  return Array.isArray(response.data.cart.items)
    ? response.data.cart.items.flatMap((item) => {
        const sanitizedItem = sanitizeCartItem(item);
        return sanitizedItem ? [sanitizedItem] : [];
      })
    : [];
}

function preserveCartItemOrder(
  previousItems: CartItem[],
  nextItems: CartItem[],
) {
  if (!previousItems.length || !nextItems.length) {
    return nextItems;
  }

  const nextItemsByProductId = new Map(
    nextItems.map((item) => [item.id, item]),
  );
  const previousProductIds = new Set(
    previousItems.map((item) => item.id),
  );
  const orderedExistingItems = previousItems.flatMap((item) => {
    const nextItem = nextItemsByProductId.get(item.id);
    return nextItem ? [nextItem] : [];
  });
  const newItems = nextItems.filter(
    (item) => !previousProductIds.has(item.id),
  );

  return [...orderedExistingItems, ...newItems];
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

function applyGuestCartState(items: CartItem[]) {
  writeGuestCartItems(items);
  setCartState({
    items,
    isLoading: false,
    isReady: true,
    userId: null,
    errorMessage: null,
  });

  return items;
}

function hydrateGuestCartState() {
  cartLoadPromise = null;
  return applyGuestCartState(readGuestCartItems());
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
  const items = preserveCartItemOrder(
    cartState.items,
    normalizeCartItems(response),
  );

  setCartState({
    items,
    isLoading: false,
    isReady: true,
    userId,
    errorMessage: null,
  });

  return items;
}

async function syncGuestCartToAccount(
  userId: string,
  fetchWithAuth: <T>(path: string, init?: RequestInit) => Promise<T>,
) {
  if (cartSyncPromise && cartState.userId === userId) {
    return cartSyncPromise;
  }

  const syncPromise = (async () => {
    const serverItems =
      cartState.userId === userId && cartState.isReady
        ? cartState.items
        : await fetchCart(userId, fetchWithAuth);
    const guestItems = readGuestCartItems();

    if (!guestItems.length) {
      return serverItems;
    }

    let nextItems = serverItems;
    const serverItemsById = new Map(serverItems.map((item) => [item.id, item]));

    for (const guestItem of guestItems) {
      const matchingServerItem = serverItemsById.get(guestItem.id);

      if (!matchingServerItem) {
        const response = await fetchWithAuth<CartApiResponse>("/cart/items", {
          method: "POST",
          body: JSON.stringify({
            productId: guestItem.productId,
            variantId: guestItem.variantId || "",
            optionSelections: guestItem.optionSelections || [],
            quantity: guestItem.quantity,
          }),
        });

        nextItems = applyCartResponse(userId, response);
        nextItems.forEach((item) => {
          serverItemsById.set(item.id, item);
        });
        continue;
      }

      const mergedQuantity = Math.max(
        matchingServerItem.quantity,
        guestItem.quantity,
      );

      if (mergedQuantity !== matchingServerItem.quantity) {
        const response = await fetchWithAuth<CartApiResponse>(
          `/cart/items/${matchingServerItem.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ quantity: mergedQuantity }),
          },
        );

        nextItems = applyCartResponse(userId, response);
        nextItems.forEach((item) => {
          serverItemsById.set(item.id, item);
        });
      }
    }

    writeGuestCartItems([]);
    return nextItems;
  })().finally(() => {
    cartSyncPromise = null;
  });

  cartSyncPromise = syncPromise;
  return syncPromise;
}

export function useCartStore() {
  const { fetchWithAuth, isAuthenticated, isReady, user } = useAuth();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated || !user?.id) {
      hydrateGuestCartState();
      return;
    }

    const hasGuestItems = readGuestCartItems().length > 0;

    if (state.userId === user.id && state.isReady && !hasGuestItems) {
      return;
    }

    void syncGuestCartToAccount(user.id, fetchWithAuth).catch((error) => {
      if (error instanceof ApiError && error.status === 401) {
        hydrateGuestCartState();
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

  async function addItem(
    productId: string,
    quantity = 1,
    variant?: {
      variantId?: string;
      optionSelections?: CartItem["optionSelections"];
    },
  ) {
    if (!isAuthenticated || !user?.id) {
      const normalizedVariantId = buildVariantId(
        variant?.optionSelections,
        variant?.variantId || "",
      );
      const lineId = buildCartLineId(productId, normalizedVariantId);
      const nextQuantity = Math.max(1, Math.floor(Number(quantity || 1)));
      const existingItem = cartState.items.find((item) => item.id === lineId);

      return applyGuestCartState(
        existingItem
          ? cartState.items.map((item) =>
              item.id === lineId
                ? { ...item, quantity: item.quantity + nextQuantity }
                : item,
            )
          : [
              ...cartState.items,
              {
                id: lineId,
                productId,
                variantId: normalizedVariantId,
                variantLabel:
                  Array.isArray(variant?.optionSelections) &&
                  variant.optionSelections.length
                    ? variant.optionSelections
                        .map((selection) => selection.label || selection.optionKey)
                        .join(" / ")
                    : undefined,
                optionSelections: variant?.optionSelections || undefined,
                quantity: nextQuantity,
              },
            ],
      );
    }

    const response = await fetchWithAuth<CartApiResponse>("/cart/items", {
      method: "POST",
      body: JSON.stringify({
        productId,
        variantId: variant?.variantId || "",
        optionSelections: variant?.optionSelections || [],
        quantity,
      }),
    });

    return applyCartResponse(user.id, response);
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (!isAuthenticated || !user?.id) {
      const normalizedQuantity = Math.max(1, Math.floor(Number(quantity || 1)));
      return applyGuestCartState(
        cartState.items.map((item) =>
          item.id === itemId ? { ...item, quantity: normalizedQuantity } : item,
        ),
      );
    }

    const response = await fetchWithAuth<CartApiResponse>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });

    return applyCartResponse(user.id, response);
  }

  async function removeItem(itemId: string) {
    if (!isAuthenticated || !user?.id) {
      return applyGuestCartState(
        cartState.items.filter((item) => item.id !== itemId),
      );
    }

    const response = await fetchWithAuth<CartApiResponse>(`/cart/items/${itemId}`, {
      method: "DELETE",
    });

    return applyCartResponse(user.id, response);
  }

  async function clearItems() {
    if (!isAuthenticated || !user?.id) {
      return applyGuestCartState([]);
    }

    const response = await fetchWithAuth<CartApiResponse>("/cart", {
      method: "DELETE",
    });

    return applyCartResponse(user.id, response);
  }

  async function reload() {
    if (!isAuthenticated || !user?.id) {
      return hydrateGuestCartState();
    }

    return syncGuestCartToAccount(user.id, fetchWithAuth);
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
  return items.find((item) => item.productId === productId && !item.variantId)?.quantity ?? 0;
}

export function getCartQuantityByLineId(items: CartItem[], lineId: string) {
  return items.find((item) => item.id === lineId)?.quantity ?? 0;
}
