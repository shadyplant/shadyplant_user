"use client";

import { useEffect, useSyncExternalStore } from "react";
import { fetchProducts, type Product } from "@/lib/products";

type ProductsStoreState = {
  products: Product[];
  isLoading: boolean;
  isReady: boolean;
  errorMessage: string | null;
};

const EMPTY_STATE: ProductsStoreState = {
  products: [],
  isLoading: false,
  isReady: false,
  errorMessage: null,
};

let productsState: ProductsStoreState = EMPTY_STATE;
let loadPromise: Promise<Product[]> | null = null;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setProductsState(nextState: ProductsStoreState) {
  productsState = nextState;
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return productsState;
}

function getServerSnapshot() {
  return EMPTY_STATE;
}

async function loadProducts() {
  if (loadPromise) {
    return loadPromise;
  }

  setProductsState({
    ...productsState,
    isLoading: true,
    errorMessage: null,
  });

  loadPromise = fetchProducts()
    .then((products) => {
      setProductsState({
        products,
        isLoading: false,
        isReady: true,
        errorMessage: null,
      });
      return products;
    })
    .catch((error) => {
      setProductsState({
        products: [],
        isLoading: false,
        isReady: true,
        errorMessage:
          error instanceof Error ? error.message : "Unable to load products.",
      });
      throw error;
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
}

export function useProductsStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (state.isReady || state.isLoading) {
      return;
    }

    void loadProducts().catch(() => undefined);
  }, [state.isLoading, state.isReady]);

  return {
    ...state,
    reload: loadProducts,
  };
}

export function useProducts() {
  return useProductsStore().products;
}
