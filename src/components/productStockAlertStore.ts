"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError, type ApiResponse } from "@/lib/api";

type ProductStockAlertStoreState = {
  items: string[];
  isLoading: boolean;
  isReady: boolean;
  userId: string | null;
  errorMessage: string | null;
};

type ProductStockAlertsApiResponse = ApiResponse<{
  productIds?: string[];
  alerts?: Array<{
    productId?: string;
  }>;
}>;

type ProductStockAlertMutationApiResponse = ApiResponse<{
  alert?: {
    productId?: string;
  };
}>;

const EMPTY_STATE: ProductStockAlertStoreState = {
  items: [],
  isLoading: false,
  isReady: false,
  userId: null,
  errorMessage: null,
};

let productStockAlertState: ProductStockAlertStoreState = EMPTY_STATE;
let productStockAlertLoadPromise: Promise<string[]> | null = null;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setProductStockAlertState(nextState: ProductStockAlertStoreState) {
  productStockAlertState = nextState;
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return productStockAlertState;
}

function getServerSnapshot() {
  return EMPTY_STATE;
}

function normalizeProductId(value: unknown) {
  return String(value || "").trim();
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

function normalizeProductStockAlertItems(
  response: ProductStockAlertsApiResponse,
) {
  if (Array.isArray(response.data.productIds)) {
    return [...new Set(
      response.data.productIds
        .map(normalizeProductId)
        .filter(Boolean),
    )];
  }

  return Array.isArray(response.data.alerts)
    ? [...new Set(
        response.data.alerts
          .map((alert) => normalizeProductId(alert.productId))
          .filter(Boolean),
      )]
    : [];
}

function resetProductStockAlertState() {
  productStockAlertLoadPromise = null;
  setProductStockAlertState({
    items: [],
    isLoading: false,
    isReady: true,
    userId: null,
    errorMessage: null,
  });
}

async function fetchProductStockAlerts(
  userId: string,
  fetchWithAuth: <T>(path: string, init?: RequestInit) => Promise<T>,
) {
  if (
    productStockAlertLoadPromise &&
    productStockAlertState.userId === userId
  ) {
    return productStockAlertLoadPromise;
  }

  setProductStockAlertState({
    ...productStockAlertState,
    isLoading: true,
    isReady:
      productStockAlertState.isReady &&
      productStockAlertState.userId === userId,
    userId,
    errorMessage: null,
  });

  productStockAlertLoadPromise = fetchWithAuth<ProductStockAlertsApiResponse>(
    "/products/stock-alerts/me",
  )
    .then((response) => {
      const items = normalizeProductStockAlertItems(response);
      setProductStockAlertState({
        items,
        isLoading: false,
        isReady: true,
        userId,
        errorMessage: null,
      });
      return items;
    })
    .catch((error) => {
      setProductStockAlertState({
        items: [],
        isLoading: false,
        isReady: true,
        userId,
        errorMessage: normalizeApiError(
          error,
          "Unable to load stock alerts.",
        ),
      });
      throw error;
    })
    .finally(() => {
      productStockAlertLoadPromise = null;
    });

  return productStockAlertLoadPromise;
}

function applyProductStockAlertItems(userId: string, items: string[]) {
  setProductStockAlertState({
    items: [...new Set(items.map(normalizeProductId).filter(Boolean))],
    isLoading: false,
    isReady: true,
    userId,
    errorMessage: null,
  });
}

export function useProductStockAlertStore() {
  const { fetchWithAuth, isAuthenticated, isReady, user } = useAuth();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated || !user?.id) {
      resetProductStockAlertState();
      return;
    }

    if (state.userId === user.id && state.isReady) {
      return;
    }

    void fetchProductStockAlerts(user.id, fetchWithAuth).catch((error) => {
      if (error instanceof ApiError && error.status === 401) {
        resetProductStockAlertState();
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

  async function requestAlert(productId: string) {
    if (!isAuthenticated || !user?.id) {
      throw new ApiError(
        401,
        "Please sign in to get stock notifications.",
        null,
      );
    }

    const normalizedProductId = normalizeProductId(productId);
    const response = await fetchWithAuth<ProductStockAlertMutationApiResponse>(
      `/products/${encodeURIComponent(normalizedProductId)}/stock-alerts`,
      {
        method: "POST",
      },
    );
    const nextProductId = normalizeProductId(response.data.alert?.productId);

    applyProductStockAlertItems(user.id, [
      ...state.items,
      nextProductId || normalizedProductId,
    ]);

    return nextProductId || normalizedProductId;
  }

  async function reload() {
    if (!isAuthenticated || !user?.id) {
      resetProductStockAlertState();
      return [];
    }

    return fetchProductStockAlerts(user.id, fetchWithAuth);
  }

  return {
    ...state,
    requestAlert,
    reload,
  };
}

export function useHasRequestedProductStockAlert(productId: string) {
  const { items } = useProductStockAlertStore();
  const normalizedProductId = normalizeProductId(productId);
  return items.includes(normalizedProductId);
}
