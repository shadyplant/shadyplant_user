import {
  normalizeDeliveryAddress,
  type DeliveryAddress,
} from "@/lib/validation";

export type CheckoutPosition = {
  lat: number;
  lng: number;
};

export type BillingDetailsDraft = {
  name: string;
  contact: string;
  gstin: string;
  state: string;
  city: string;
  address: string;
};

export type CheckoutDraft = {
  deliveryAddress?: string;
  deliveryAddressDetails?: DeliveryAddress | null;
  deliveryPosition?: CheckoutPosition | null;
  createdAt?: string;
};

export const CHECKOUT_DRAFT_STORAGE_KEY = "ggnCheckoutDraft";
export const BILLING_DETAILS_STORAGE_KEY = "ggnBillingDetails";

export const EMPTY_BILLING_DETAILS: BillingDetailsDraft = {
  name: "",
  contact: "",
  gstin: "",
  state: "",
  city: "",
  address: "",
};

export function normalizeBillingDetailsDraft(
  details: Partial<BillingDetailsDraft> | null | undefined,
): BillingDetailsDraft {
  return {
    name: String(details?.name || "").trim(),
    contact: String(details?.contact || "").trim(),
    gstin: String(details?.gstin || "").trim(),
    state: String(details?.state || "").trim(),
    city: String(details?.city || "").trim(),
    address: String(details?.address || "").trim(),
  };
}

export function readCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawDraft = window.sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY);
  if (!rawDraft) {
    return null;
  }

  try {
    const draft = JSON.parse(rawDraft) as CheckoutDraft;
    const lat = Number(draft.deliveryPosition?.lat);
    const lng = Number(draft.deliveryPosition?.lng);

    return {
      deliveryAddress: String(draft.deliveryAddress || "").trim(),
      deliveryAddressDetails: Object.values(
        normalizeDeliveryAddress(draft.deliveryAddressDetails),
      ).some(Boolean)
        ? normalizeDeliveryAddress(draft.deliveryAddressDetails)
        : null,
      deliveryPosition:
        Number.isFinite(lat) && Number.isFinite(lng)
          ? { lat, lng }
          : null,
      createdAt: String(draft.createdAt || ""),
    };
  } catch {
    return null;
  }
}

export function writeCheckoutDraft(draft: CheckoutDraft) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedDeliveryAddress = normalizeDeliveryAddress(
    draft.deliveryAddressDetails,
  );
  const hasDeliveryAddressDetails = Object.values(
    normalizedDeliveryAddress,
  ).some(Boolean);

  window.sessionStorage.setItem(
    CHECKOUT_DRAFT_STORAGE_KEY,
    JSON.stringify({
      deliveryAddress: String(draft.deliveryAddress || "").trim(),
      deliveryAddressDetails: hasDeliveryAddressDetails
        ? normalizedDeliveryAddress
        : null,
      deliveryPosition:
        draft.deliveryPosition &&
        Number.isFinite(Number(draft.deliveryPosition.lat)) &&
        Number.isFinite(Number(draft.deliveryPosition.lng))
          ? {
              lat: Number(draft.deliveryPosition.lat),
              lng: Number(draft.deliveryPosition.lng),
            }
          : null,
      createdAt: draft.createdAt || new Date().toISOString(),
    }),
  );
}

export function readBillingDetailsDraft(): BillingDetailsDraft {
  if (typeof window === "undefined") {
    return EMPTY_BILLING_DETAILS;
  }

  const rawDetails = window.sessionStorage.getItem(BILLING_DETAILS_STORAGE_KEY);
  if (!rawDetails) {
    return EMPTY_BILLING_DETAILS;
  }

  try {
    const details = JSON.parse(rawDetails) as Partial<BillingDetailsDraft>;
    return normalizeBillingDetailsDraft(details);
  } catch {
    return EMPTY_BILLING_DETAILS;
  }
}

export function writeBillingDetailsDraft(details: BillingDetailsDraft) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    BILLING_DETAILS_STORAGE_KEY,
    JSON.stringify({
      ...details,
      createdAt: new Date().toISOString(),
    }),
  );
}
