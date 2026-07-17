"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Star,
  Trash2,
  Truck,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import ProductDeliveryAddressPicker, {
  DELIVERY_ADDRESS_EVENT,
} from "@/components/ProductDeliveryAddressPicker";
import { getCartCount, useCartStore } from "@/components/cartStore";
import { requestJson, type ApiResponse } from "@/lib/api";
import {
  readCheckoutDraft,
  writeCheckoutDraft,
  type CheckoutPosition,
} from "@/lib/checkoutSession";
import {
  buildCheckoutDeliveryAddressPayload,
  formatDeliveryAddress,
  sanitizeFormattedDeliveryAddress,
} from "@/lib/deliveryAddress";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Product } from "@/lib/products";
import { useProductsStore } from "@/components/productsStore";
import {
  normalizeDeliveryAddress,
  type DeliveryAddress,
} from "@/lib/validation";
import { getProductHref } from "@/lib/productUrls";
import QuantityStepper from "@/components/QuantityStepper";

const CART_DELIVERY_OFFSET_DAYS = 5;

type CheckoutPreview = {
  deliveryAddress: {
    formattedAddress?: string;
    line1?: string;
  };
  deliveryLocation: CheckoutPosition;
  summary: {
    itemCount: number;
    totalQuantity: number;
    totalWeightKg: number;
    itemsSubtotal: number;
    currency: string;
  };
  pricing: {
    itemsSubtotal: number;
    deliveryCharge: number;
    total: number;
    currency: string;
    distanceKm: number;
    deliveryRate: number;
    totalWeightKg: number;
  };
  deliveryChargeDetails: {
    message: string;
    rate: number;
    units: number | null;
  };
  suggestedDeliveryDate: string;
};

type DeliveryQuoteResponse = {
  ok: boolean;
  success: boolean;
  cost?: number;
  rate?: number;
  message?: string;
  units?: number | null;
  distance_km?: number;
  state?: string;
};

type DetailedCartItem = {
  id: string;
  productId: string;
  variantId: string;
  variantLabel?: string;
  packLabel?: string;
  quantity: number;
  subtotal: number;
  unitMrp: number;
  availableStock: number;
  product: Product;
};

type BillDetailsCardProps = {
  deliveryFee: number | null;
  discount: number;
  mrpSubtotal: number;
  savings: number | null;
  total: number | null;
  deliveryErrorMessage?: string | null;
};

function resolveCartItemAvailableStock(
  product: Product,
  item: {
    optionSelections?: Array<{
      groupKey: string;
      optionKey: string;
    }>;
  },
) {
  const matchingOption = [...(item.optionSelections || [])]
    .reverse()
    .map((selection) =>
      product.optionGroups
        .find((group) => group.key === selection.groupKey)
        ?.options.find((option) => option.key === selection.optionKey),
    )
    .find((option) => option && option.stock !== null);

  return Math.max(
    0,
    Math.floor(Number(matchingOption?.stock ?? product.stock ?? 0)),
  );
}

function getCartDeliveryLabel() {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + CART_DELIVERY_OFFSET_DAYS);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(deliveryDate);
}

function BillDetailsCard({
  deliveryFee,
  deliveryErrorMessage,
  discount,
  mrpSubtotal,
  savings,
  total,
}: BillDetailsCardProps) {
  const totalValue = total === null ? "---" : formatCurrency(total);

  return (
    <section className="rounded-b-md pt-2">
      <h2 className="px-1 pb-3 text-[16px] text-[#111111]">
        Bill details
      </h2>
      <div className="rounded-xl bg-white p-4 border border-[#d9d9d9] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="space-y-3 text-[13px] text-[#111111]">
          <div className="flex items-center justify-between gap-4">
            <span className="border-b border-dotted border-[#111111] leading-4">
              MRP
            </span>
            <span className="font-semibold">{formatCurrency(mrpSubtotal)}</span>
          </div>
          <div className="border-t border-dashed border-[#e5e7eb]" />
          <div className="flex items-center justify-between gap-4">
            <span>Delivery Charge</span>
            <span className="inline-flex min-w-[5.75rem] justify-end font-semibold tabular-nums">
              {deliveryFee === null ? (
                "---"
              ) : deliveryFee ? (
                formatCurrency(deliveryFee)
              ) : (
                "Free"
              )}
            </span>
          </div>
          <div className="border-t border-dashed border-[#e5e7eb]" />
          <div className="flex items-center justify-between gap-4">
            <span>Discounts</span>
            <span className="font-semibold text-[#008a24]">
              - {formatCurrency(discount)}
            </span>
          </div>
          <div className="border-t border-[#eef0ee]" />
          <div className="flex items-center justify-between gap-4 pt-1 font-semibold text-[#111111]">
            <span>Total Amount</span>
            <span>{totalValue}</span>
          </div>
        </div>

        {deliveryErrorMessage ? (
          <p className="mt-4 rounded-md bg-[#fff6f5] px-3 py-2 text-center text-[12px] font-semibold text-[#b42318]">
            {deliveryErrorMessage}
          </p>
        ) : null}

        {savings !== null && savings > 0 ? (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-md bg-[#dff8e7] px-3 py-2 text-[13px] font-semibold text-[#00751f]">
            <BadgePercent
              size={15}
              fill="currentColor"
              className="text-[#008a24]"
            />
            <span>
              You&apos;ll save {formatCurrency(savings)} on this order!
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function CartPageClient() {
  const router = useRouter();
  const mobileDeliveryAddressRef = useRef<HTMLDivElement | null>(null);
  const desktopDeliveryAddressRef = useRef<HTMLDivElement | null>(null);
  const mobileBillDetailsRef = useRef<HTMLDivElement | null>(null);
  const desktopBillDetailsRef = useRef<HTMLDivElement | null>(null);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>(
    {},
  );
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(() =>
    sanitizeFormattedDeliveryAddress(readCheckoutDraft()?.deliveryAddress),
  );
  const [selectedDeliveryPosition, setSelectedDeliveryPosition] =
    useState<CheckoutPosition | null>(
      () => readCheckoutDraft()?.deliveryPosition || null,
    );
  const [selectedDeliveryAddressDetails, setSelectedDeliveryAddressDetails] =
    useState<DeliveryAddress | null>(
      () => readCheckoutDraft()?.deliveryAddressDetails || null,
    );
  const [checkoutPreview, setCheckoutPreview] =
    useState<CheckoutPreview | null>(null);
  const [guestDeliveryCharge, setGuestDeliveryCharge] = useState<number | null>(null);
  const [isDeliveryQuoteLoading, setIsDeliveryQuoteLoading] = useState(false);
  const [deliveryQuoteError, setDeliveryQuoteError] = useState<string | null>(
    null,
  );
  const [showDeliveryAddressAlert, setShowDeliveryAddressAlert] =
    useState(false);
  const lastAutoResolvedDeliveryAddressRef = useRef("");
  const {
    fetchWithAuth,
    isAuthenticated,
    updateProfile,
    user,
  } = useAuth();
  const {
    items: cartItems,
    clearItems,
    isLoading,
    isReady,
    removeItem,
    updateQuantity,
  } = useCartStore();
  const {
    isLoading: isProductsLoading,
    isReady: areProductsReady,
    products,
  } = useProductsStore();

  useEffect(() => {
    if (!showDeliveryAddressAlert) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowDeliveryAddressAlert(false);
    }, 3600);

    return () => window.clearTimeout(timeoutId);
  }, [showDeliveryAddressAlert]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const savedCheckoutDraft = readCheckoutDraft();
    if (savedCheckoutDraft?.deliveryAddress?.trim()) {
      return;
    }

    const savedDeliveryAddress = normalizeDeliveryAddress(user.deliveryAddress);
    if (!Object.values(savedDeliveryAddress).some(Boolean)) {
      return;
    }

    const nextFormattedAddress = formatDeliveryAddress(savedDeliveryAddress);
    setSelectedDeliveryAddress(sanitizeFormattedDeliveryAddress(nextFormattedAddress));
    setSelectedDeliveryAddressDetails(savedDeliveryAddress);
    writeCheckoutDraft({
      deliveryAddress: nextFormattedAddress,
      deliveryAddressDetails: savedDeliveryAddress,
      deliveryPosition: readCheckoutDraft()?.deliveryPosition || null,
    });
  }, [user]);

  useEffect(() => {
    function handleDeliveryAddressUpdate(event: Event) {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const nextAddress =
        typeof event.detail?.address === "string"
          ? event.detail.address
          : "";
      const nextPosition =
        event.detail?.position &&
        Number.isFinite(Number(event.detail.position.lat)) &&
        Number.isFinite(Number(event.detail.position.lng))
          ? {
              lat: Number(event.detail.position.lat),
              lng: Number(event.detail.position.lng),
            }
          : null;
      const nextDeliveryAddress =
        event.detail?.deliveryAddress &&
        typeof event.detail.deliveryAddress === "object"
          ? normalizeDeliveryAddress(event.detail.deliveryAddress)
          : null;

      setSelectedDeliveryAddress(sanitizeFormattedDeliveryAddress(nextAddress));
      setSelectedDeliveryPosition(nextPosition);
      setSelectedDeliveryAddressDetails(nextDeliveryAddress);
      writeCheckoutDraft({
        deliveryAddress: nextAddress,
        deliveryAddressDetails: nextDeliveryAddress,
        deliveryPosition: nextPosition,
      });
    }

    window.addEventListener(DELIVERY_ADDRESS_EVENT, handleDeliveryAddressUpdate);

    return () => {
      window.removeEventListener(
        DELIVERY_ADDRESS_EVENT,
        handleDeliveryAddressUpdate,
      );
    };
  }, []);

  const items = useMemo<DetailedCartItem[]>(
    () =>
      cartItems.flatMap((item) => {
        const product = products.find((entry) => entry.id === item.productId);

        if (!product) {
          return [];
        }

        return [
          {
            ...item,
            product,
            subtotal: Number(item.unitPrice ?? product.price) * item.quantity,
            unitMrp: Math.max(
              Number(item.unitMrp ?? product.mrp ?? product.price),
              Number(item.unitPrice ?? product.price),
            ),
            availableStock: resolveCartItemAvailableStock(product, item),
          },
        ];
      }),
    [cartItems, products],
  );

  const itemCount = getCartCount(cartItems);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalWeightKg = items.reduce(
    (sum, item) => sum + Number(item.product.weight || 0) * item.quantity,
    0,
  );
  const mrpSubtotal = items.reduce(
    (sum, item) => sum + item.unitMrp * item.quantity,
    0,
  );
  const discount = Math.max(0, mrpSubtotal - subtotal);
  const deliveryLabel = getCartDeliveryLabel();
  const savedDeliveryAddress = user?.deliveryAddress
    ? formatDeliveryAddress(user.deliveryAddress)
    : "";
  const deliveryAddressForPicker =
    sanitizeFormattedDeliveryAddress(selectedDeliveryAddress) ||
    sanitizeFormattedDeliveryAddress(savedDeliveryAddress);
  const hasCheckoutAddress = Boolean(deliveryAddressForPicker.trim());
  const hasDeliveryCoordinates = Boolean(
    selectedDeliveryPosition &&
    Number.isFinite(Number(selectedDeliveryPosition.lat)) &&
    Number.isFinite(Number(selectedDeliveryPosition.lng)),
  );
  const effectiveDeliveryCharge = isAuthenticated
    ? checkoutPreview?.pricing.deliveryCharge
    : guestDeliveryCharge;
  const deliveryFee =
    hasCheckoutAddress &&
    effectiveDeliveryCharge !== null &&
    effectiveDeliveryCharge !== undefined &&
    Number.isFinite(Number(effectiveDeliveryCharge))
      ? Math.max(0, Math.round(Number(effectiveDeliveryCharge)))
      : null;
  const effectiveTotal = isAuthenticated
    ? checkoutPreview?.pricing.total
    : guestDeliveryCharge === null
      ? null
      : subtotal + guestDeliveryCharge;
  const total =
    hasCheckoutAddress &&
    effectiveTotal !== null &&
    effectiveTotal !== undefined &&
    Number.isFinite(Number(effectiveTotal))
      ? Math.max(0, Math.round(Number(effectiveTotal)))
      : null;
  const savings = total === null ? null : Math.max(0, mrpSubtotal - total);
  const canProceedToCheckout =
    hasCheckoutAddress && deliveryFee !== null && !isDeliveryQuoteLoading;

  useEffect(() => {
    if (
      !hasCheckoutAddress ||
      selectedDeliveryPosition ||
      !deliveryAddressForPicker.trim()
    ) {
      return;
    }

    const normalizedAddress = deliveryAddressForPicker.trim();
    if (lastAutoResolvedDeliveryAddressRef.current === normalizedAddress) {
      return;
    }

    const mapsWindow = window as Window & {
      google?: {
        maps?: {
          Geocoder?: new () => {
            geocode: (
              request: { address: string },
              callback: (
                results: Array<{
                  formatted_address?: string;
                  address_components?: unknown;
                  geometry?: {
                    location?: {
                      lat: () => number;
                      lng: () => number;
                    };
                  };
                }> | undefined,
                status: string,
              ) => void,
            ) => void;
          };
        };
      };
    };
    const Geocoder = mapsWindow.google?.maps?.Geocoder;

    if (!Geocoder) {
      return;
    }

    lastAutoResolvedDeliveryAddressRef.current = normalizedAddress;

    const geocoder = new Geocoder();
    geocoder.geocode({ address: normalizedAddress }, (results, status) => {
      const firstResult = Array.isArray(results) ? results[0] : undefined;
      const location = firstResult?.geometry?.location;

      if (status !== "OK" || !location) {
        lastAutoResolvedDeliveryAddressRef.current = "";
        return;
      }

      const nextPosition = {
        lat: location.lat(),
        lng: location.lng(),
      };

      setSelectedDeliveryPosition(nextPosition);
      writeCheckoutDraft({
        deliveryAddress: normalizedAddress,
        deliveryAddressDetails:
          selectedDeliveryAddressDetails || readCheckoutDraft()?.deliveryAddressDetails || null,
        deliveryPosition: nextPosition,
      });
    });
  }, [
    deliveryAddressForPicker,
    hasCheckoutAddress,
    selectedDeliveryPosition,
    selectedDeliveryAddressDetails,
  ]);

  useEffect(() => {
    const deliveryPosition = selectedDeliveryPosition;

    if (!hasCheckoutAddress || !deliveryPosition || !items.length) {
      if (!isAuthenticated) {
        setGuestDeliveryCharge(null);
      }
      setCheckoutPreview(null);
      return;
    }
    const resolvedDeliveryPosition = deliveryPosition;

    const controller = new AbortController();

    async function loadDeliveryQuote() {
      setIsDeliveryQuoteLoading(true);
      setDeliveryQuoteError(null);

      try {
        if (isAuthenticated) {
          const deliveryAddressPayload = buildCheckoutDeliveryAddressPayload(
            deliveryAddressForPicker,
            selectedDeliveryAddressDetails,
            user?.deliveryAddress,
          );

          const response = await fetchWithAuth<
            ApiResponse<{ preview: CheckoutPreview }>
          >("/checkout/preview", {
            method: "POST",
            body: JSON.stringify({
              deliveryAddress: deliveryAddressPayload,
              deliveryLocation: resolvedDeliveryPosition,
              state: deliveryAddressPayload.state,
            }),
            signal: controller.signal,
          });

          setCheckoutPreview(response.data.preview);
          setGuestDeliveryCharge(null);
        } else {
          const response = await requestJson<DeliveryQuoteResponse>("/calc-delivery", {
            method: "POST",
            body: JSON.stringify({
              weight: totalWeightKg,
              lat: resolvedDeliveryPosition.lat,
              lng: resolvedDeliveryPosition.lng,
              state: selectedDeliveryAddressDetails?.state || "",
            }),
            signal: controller.signal,
          });

          if (!response.ok || !response.success) {
            throw new Error(response.message || "Unable to calculate delivery charge.");
          }

          setGuestDeliveryCharge(
            Number.isFinite(Number(response.cost))
              ? Math.max(0, Math.round(Number(response.cost)))
              : null,
          );
          setCheckoutPreview(null);
        }
        setDeliveryQuoteError(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setCheckoutPreview(null);
        setGuestDeliveryCharge(null);
        setDeliveryQuoteError(
          error instanceof Error
            ? error.message
            : "Unable to calculate delivery charge.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsDeliveryQuoteLoading(false);
        }
      }
    }

    void loadDeliveryQuote();

    return () => {
      controller.abort();
    };
  }, [
    deliveryAddressForPicker,
    fetchWithAuth,
    hasCheckoutAddress,
    isAuthenticated,
    items.length,
    cartItems,
    selectedDeliveryAddressDetails,
    selectedDeliveryPosition,
    user?.deliveryAddress,
    totalWeightKg,
  ]);

  function handleDeliveryAddressChange(
    address: string,
    position?: CheckoutPosition,
    deliveryAddress?: DeliveryAddress,
  ) {
    const cleanedAddress = sanitizeFormattedDeliveryAddress(address);
    const nextDeliveryAddress = deliveryAddress
      ? normalizeDeliveryAddress(deliveryAddress)
      : selectedDeliveryAddressDetails;
    setSelectedDeliveryAddress(cleanedAddress);
    setSelectedDeliveryAddressDetails(nextDeliveryAddress || null);

    if (cleanedAddress.trim()) {
      setShowDeliveryAddressAlert(false);
      setDeliveryQuoteError(null);
    }

    if (position) {
      setSelectedDeliveryPosition(position);
      writeCheckoutDraft({
        deliveryAddress: cleanedAddress,
        deliveryAddressDetails: nextDeliveryAddress || null,
        deliveryPosition: position,
      });
      if (deliveryAddress && user) {
        void updateProfile({
          fullName: user?.fullName || "",
          phoneNumber: user?.phoneNumber || "",
          deliveryAddress,
          billingDetails: user?.billingDetails,
        }).catch(() => undefined);
      }
    } else {
      setSelectedDeliveryPosition(null);
      setCheckoutPreview(null);
      setDeliveryQuoteError(null);
      writeCheckoutDraft({
        deliveryAddress: cleanedAddress,
        deliveryAddressDetails: nextDeliveryAddress || null,
        deliveryPosition: null,
      });
      if (!cleanedAddress.trim()) {
        setSelectedDeliveryAddressDetails(null);
      }
    }
  }

  function handleDeliveryAddressDone(
    address: string,
    position: CheckoutPosition,
    deliveryAddress: DeliveryAddress,
  ) {
    handleDeliveryAddressChange(address, position, deliveryAddress);
    scrollToBillDetails();
  }

  function scrollToBillDetails() {
    const targetRef =
      typeof window !== "undefined" && window.innerWidth >= 768
        ? desktopBillDetailsRef
        : mobileBillDetailsRef;

    window.setTimeout(() => {
      targetRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  }

  async function decreaseQuantity(item: DetailedCartItem) {
    const minQuantity = Math.max(
      1,
      Math.min(item.product.minOrderQuantity, Math.max(1, item.availableStock)),
    );

    if (item.quantity <= minQuantity) {
      return;
    }

    await updateQuantity(item.id, Math.max(minQuantity, item.quantity - 1));
    setQuantityDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[item.id];
      return nextDrafts;
    });
  }

  async function increaseQuantity(item: DetailedCartItem) {
    if (item.quantity >= item.availableStock) {
      return;
    }

    await updateQuantity(item.id, item.quantity + 1);
    setQuantityDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[item.id];
      return nextDrafts;
    });
  }

  function getItemMinimumQuantity(item: DetailedCartItem) {
    const minQuantity = Math.max(
      1,
      Math.min(item.product.minOrderQuantity, Math.max(1, item.availableStock)),
    );

    return minQuantity;
  }

  function getDraftQuantity(item: DetailedCartItem) {
    return quantityDrafts[item.id] ?? String(item.quantity);
  }

  function updateDraftQuantity(itemId: string, value: string) {
    setQuantityDrafts((current) => ({
      ...current,
      [itemId]: value,
    }));
  }

  async function commitQuantity(item: DetailedCartItem, value: string) {
    const numericQuantity = Number(value);

    if (!Number.isFinite(numericQuantity)) {
      setQuantityDrafts((current) => {
        const nextDrafts = { ...current };
        delete nextDrafts[item.id];
        return nextDrafts;
      });
      return;
    }

    const nextQuantity = Math.max(
      getItemMinimumQuantity(item),
      Math.min(Math.max(1, item.availableStock), Math.floor(numericQuantity)),
    );

    await updateQuantity(item.id, nextQuantity);
    setQuantityDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[item.id];
      return nextDrafts;
    });
  }

  function handleCheckoutClick() {
    if (!isAuthenticated) {
      router.push("/auth?next=/checkout");
      return;
    }

    if (!hasCheckoutAddress) {
      setShowDeliveryAddressAlert(true);

      const targetRef =
        typeof window !== "undefined" && window.innerWidth >= 768
          ? desktopDeliveryAddressRef
          : mobileDeliveryAddressRef;

      window.setTimeout(() => {
        targetRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 0);

      return;
    }

    if (isDeliveryQuoteLoading) {
      setDeliveryQuoteError(
        "Please wait while we calculate the delivery charge.",
      );
      return;
    }

    if (!hasDeliveryCoordinates) {
      setDeliveryQuoteError(
        "Confirm your delivery location on the map to calculate delivery charge.",
      );

      const targetRef =
        typeof window !== "undefined" && window.innerWidth >= 768
          ? desktopDeliveryAddressRef
          : mobileDeliveryAddressRef;

      window.setTimeout(() => {
        targetRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 0);

      return;
    }

    if (deliveryFee === null || total === null) {
      setDeliveryQuoteError(
        "Calculate delivery charge before checkout. Select your delivery location from cart.",
      );

      const targetRef =
        typeof window !== "undefined" && window.innerWidth >= 768
          ? desktopDeliveryAddressRef
          : mobileDeliveryAddressRef;

      window.setTimeout(() => {
        targetRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 0);

      return;
    }

    writeCheckoutDraft({
      deliveryAddress: deliveryAddressForPicker,
      deliveryAddressDetails:
        selectedDeliveryAddressDetails ||
        normalizeDeliveryAddress(user?.deliveryAddress),
      deliveryPosition: selectedDeliveryPosition,
    });

    router.push("/checkout");
  }

  return (
    <SiteShell hideMobileHeader hideMobileBottomNav>
      <section className="bg-white px-4 pb-6 md:hidden ">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex border-b border-[#e2e8dc] h-15 items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 shrink-0 items-center justify-center text-[#111827]"
              aria-label="Go back"
            >
              <ArrowLeft size={24} strokeWidth={2.2} />
            </button>
            <h1 className="text-lg text-[#111111]">
              Shopping Cart
            </h1>
          </div>

          <div
            ref={mobileDeliveryAddressRef}
            className={`mt-3 rounded-xl transition ${
              showDeliveryAddressAlert
                ? "border border-[#d93025] bg-[#fff6f5] p-2"
                : "border border-transparent"
            }`}
          >
            <ProductDeliveryAddressPicker
              variant="cart-select"
              initialAddress={deliveryAddressForPicker}
              initialPosition={selectedDeliveryPosition}
              autoResolveInitialAddress
              emptyLabel="Select location"
              onAddressChange={handleDeliveryAddressChange}
              onDone={handleDeliveryAddressDone}
            />
            {!showDeliveryAddressAlert &&
            hasCheckoutAddress &&
            !hasDeliveryCoordinates ? (
              <p className="mt-2 px-1 text-xs font-semibold text-[#8a5a00]">
                Confirm this address on the map to calculate delivery charges.
              </p>
            ) : null}
          </div>

          {!isReady || isLoading || !areProductsReady || isProductsLoading ? (
            <div className="mt-8 rounded-lg border border-[#e2e8dc] bg-[#fbfdf8] p-5 text-center">
              <p className="text-sm font-bold text-[#111111]">
                Loading your cart
              </p>
              <p className="mt-1 text-xs text-[#5c7752]">
                Pulling your saved items.
              </p>
            </div>
          ) : !items.length ? (
            <div className="mt-30 p-5 text-center">
                <p className="mt-3 text-sm text-[#909090]">
                Your cart is empty
              </p>
              <ShoppingCart className="mx-auto my-4 text-[#909090]" size={28} />
                        <Link
                href="/"
                className=" inline-flex h-12 items-center justify-center rounded-full bg-[#4c8d5b] px-5 text-sm font-bold text-white"
              >
                Start shopping 
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-8 border-t border-[#eeeeee] pt-5">
                <h2 className="text-[14px] font-black text-[#111111]">
                  Items ({itemCount})
                </h2>
              </div>

              <div className="mt-4 space-y-5">
                {items.map((item) => {
                  const productHref = getProductHref(item.product);

                  return (
                    <article
                      key={item.id}
                      className="rounded-md border border-[#d9d9d9] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    >
                      <div className="grid grid-cols-[84px_minmax(0,1fr)_auto] gap-3 min-[390px]:grid-cols-[96px_minmax(0,1fr)_auto] sm:grid-cols-[108px_minmax(0,1fr)_auto] sm:gap-4">
                        <Link
                          href={productHref}
                          className="relative h-[84px] w-[84px] overflow-hidden rounded-md bg-[#f4f8ef] min-[390px]:h-24 min-[390px]:w-24 sm:h-[108px] sm:w-[108px]"
                        >
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="(max-width: 389px) 84px, (max-width: 639px) 96px, 108px"
                            className="object-cover"
                          />
                        </Link>

                        <div className="min-w-0">
                          <Link
                            href={productHref}
                            className="line-clamp-1 text-[19px] font-semibold leading-6 text-[#111827] min-[390px]:text-[22px] min-[390px]:leading-7 sm:text-[24px]"
                          >
                            {item.product.name}
                          </Link>
                          {item.variantLabel || item.packLabel ? (
                            <p className="mt-1 text-[11px] font-medium text-[#58724f] min-[390px]:text-[12px]">
                              {item.variantLabel || item.packLabel}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[21px] font-black leading-none tracking-[-0.02em] text-[#111111] min-[390px]:text-[24px]">
                            {formatCurrency(item.subtotal)}
                          </p>
                          <p className="mt-2 text-[12px] font-medium text-[#202020]">
                            Delivery by {deliveryLabel}
                          </p>
                        </div>

                        <div className="pt-1 text-[#008000]">
                          <span className="inline-flex items-center gap-1 align-middle">
                            <Star
                              size={13}
                              fill="currentColor"
                              strokeWidth={0}
                              className="block shrink-0"
                            />
                            <span className="flex h-[13px] items-center text-[12px] font-medium leading-none">
                              4.{(item.product.price % 10) + 1}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_12rem] items-center gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_13.5rem] min-[390px]:gap-3 sm:grid-cols-[minmax(0,1fr)_20rem] lg:grid-cols-[minmax(0,1fr)_22.5rem] xl:grid-cols-[minmax(0,1fr)_25rem]">
                        <div className="flex min-w-0 items-center gap-3 text-[12px] font-semibold text-[#30343b] min-[390px]:gap-5 min-[390px]:text-[14px] sm:gap-7">
                          <button
                            type="button"
                            onClick={() => void removeItem(item.id)}
                            className="inline-flex h-8 min-w-0 items-center gap-1.5 whitespace-nowrap min-[390px]:gap-2"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={handleCheckoutClick}
                            className="inline-flex h-8 min-w-0 items-center gap-1.5 whitespace-nowrap min-[390px]:gap-2"
                          >
                            <Zap size={14} strokeWidth={1.9} />
                            Buy this now
                          </button>
                        </div>
                        <QuantityStepper
                          value={getDraftQuantity(item)}
                          min={getItemMinimumQuantity(item)}
                          max={Math.max(1, item.availableStock)}
                          ariaLabel={`Edit quantity for ${item.product.name}`}
                          decreaseAriaLabel={`Decrease quantity for ${item.product.name}`}
                          increaseAriaLabel={`Increase quantity for ${item.product.name}`}
                          decreaseDisabled={
                            item.quantity <= getItemMinimumQuantity(item)
                          }
                          increaseDisabled={item.quantity >= item.availableStock}
                          onInputFocus={() =>
                            updateDraftQuantity(item.id, String(item.quantity))
                          }
                          onChange={(value) => updateDraftQuantity(item.id, value)}
                          onCommit={(value) => commitQuantity(item, value)}
                          onDecrease={() => decreaseQuantity(item)}
                          onIncrease={() => increaseQuantity(item)}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>

              <div ref={mobileBillDetailsRef} className="mt-5 scroll-mt-24">
                <BillDetailsCard
                  deliveryFee={deliveryFee}
                  deliveryErrorMessage={deliveryQuoteError}
                  discount={discount}
                  mrpSubtotal={mrpSubtotal}
                  savings={savings}
                  total={total}
                />
              </div>

              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e7eb] bg-white px-4 py-3">
                <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-[#5c7752]">Total payable</p>
                    <p className="text-lg font-black text-[#111111]">
                      {total === null ? "---" : formatCurrency(total)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckoutClick}
                    className={`flex h-11 min-w-[150px] items-center justify-center rounded-md px-5 text-sm font-black transition ${
                      canProceedToCheckout
                        ? "bg-[#214f14] text-white hover:bg-[#163915]"
                        : "border border-[#d6e6bd] bg-white text-[#214f14] hover:bg-[#f4fbf2]"
                    }`}
                  >
                    Place order
                  </button>
                </div>
              </div>
              <div className="h-20" />
            </>
          )}
        </div>
      </section>

      <section className="hidden px-4 py-8 md:block md:px-6 md:py-0">
        <div className="mx-auto max-w-7xl">
         <div className="flex items-center justify-between md:px-6 md:py-2">
  {/* Back Button */}
  <button
    type="button"
    onClick={() => router.back()}
    className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 cursor-pointer"
  >
    <ArrowLeft size={16} />
    Back
  </button>

  {/* Clear Cart */}
  {items.length > 0 && (
    <button
      type="button"
      onClick={() => void clearItems()}
      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
    >
      <Trash2 size={16} />
      Clear Cart
    </button>
  )}
</div>

          <div
            ref={desktopDeliveryAddressRef}
            className={`mb-8 hidden max-w-2xl rounded-2xl transition ${
              showDeliveryAddressAlert
                ? "border border-[#d93025] bg-[#fff6f5] p-3"
                : "border border-transparent"
            }`}
          >
            <ProductDeliveryAddressPicker
              variant="cart-select"
              initialAddress={deliveryAddressForPicker}
              initialPosition={selectedDeliveryPosition}
              autoResolveInitialAddress
              emptyLabel="Select delivery address"
              onAddressChange={handleDeliveryAddressChange}
              onDone={handleDeliveryAddressDone}
            />
            {!showDeliveryAddressAlert &&
            hasCheckoutAddress &&
            !hasDeliveryCoordinates ? (
              <p className="mt-2 px-1 text-sm font-semibold text-[#8a5a00]">
                Confirm this address on the map to calculate delivery charges.
              </p>
            ) : null}
          </div>

          {!isReady || isLoading || !areProductsReady || isProductsLoading ? (
            <div className="mx-auto max-w-3xl rounded-[2.3rem] border border-[rgba(36,54,27,0.08)] bg-[var(--surface-strong)] p-6 text-center shadow-[0_22px_60px_rgba(33,79,20,0.08)] backdrop-blur-[16px] md:p-10">
              <h2 className="text-3xl  text-[#163915]">
                Loading your cart
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#5c7752]">
                Pulling your saved cart from the server.
              </p>
            </div>
          ) : !items.length ? (
            <div className="mx-auto max-w-3xl rounded-[0.5rem] bg-[var(--surface-strong)] p-6 text-center backdrop-blur-[16px] md:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#edf5e1] text-[#4c8d5b]">
                <ShoppingCart size={30} />
              </div>
              <h2 className="mt-6 text-3xl  text-gray-900">
                Your cart is empty
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-gray-600">
                Add plants, lawn grass, or planters from the catalog and they
                will appear here with live quantity controls and order totals.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:ml-3"
                >
                  Back to home
                </Link>

                   <Link
                  href="/"
                  className="bg-[#207958] inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold text-white"
                >
                  Start shopping
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.18fr_0.82fr] p-6">
              <div className="space-y-4">
                {items.map((item) => {
                  const productHref = getProductHref(item.product);

                  return (
                    <article
                      key={item.id}
                      className="rounded-md bg-[#ffffff] p-4"
                    >
                      <div className="grid grid-cols-[140px_minmax(0,1fr)_auto] gap-4">
                        <Link
                          href={productHref}
                          className="relative h-[140px] w-[140px] overflow-hidden rounded-md bg-[#f4f8ef]"
                        >
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="140px"
                            className="object-cover"
                          />
                        </Link>

                        <div className="min-w-0">
                          <Link
                            href={productHref}
                            className="line-clamp-1 text-xl leading-8 text-[#111827]"
                          >
                            {item.product.name}
                          </Link>
                          {item.variantLabel || item.packLabel ? (
                            <p className="mt-1 text-sm font-medium text-[#58724f]">
                              {item.variantLabel || item.packLabel}
                            </p>
                          ) : null}
                          <p className="mt-1 text-2xl font-semibold leading-none text-[#111111]">
                            {formatCurrency(item.subtotal)}
                          </p>
                          <p className="mt-3 text-sm font-medium text-[#202020]">
                            Delivery by {deliveryLabel}
                          </p>
                        </div>

                        <div className="pt-1 text-[#008000]">
                          <span className="inline-flex items-center gap-1 align-middle">
                            <Star
                              size={14}
                              fill="currentColor"
                              strokeWidth={0}
                              className="block shrink-0"
                            />
                            <span className="flex h-[14px] items-center text-sm font-medium leading-none">
                              4.{(item.product.price % 10) + 1}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_14rem] items-center gap-4 xl:grid-cols-[minmax(0,1fr)_16rem]">
                        <div className="flex min-w-0 items-center gap-7 text-sm font-semibold text-[#30343b]">
                          <button
                            type="button"
                            onClick={() => void removeItem(item.id)}
                            className="inline-flex h-8 items-center gap-2 whitespace-nowrap"
                          >
                            <Trash2 size={15} strokeWidth={2} />
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={handleCheckoutClick}
                            className="inline-flex h-8 items-center gap-2 whitespace-nowrap"
                          >
                            <Zap size={15} strokeWidth={1.9} />
                            Buy this now
                          </button>
                        </div>

                        <QuantityStepper
                          value={getDraftQuantity(item)}
                          min={getItemMinimumQuantity(item)}
                          max={Math.max(1, item.availableStock)}
                          ariaLabel={`Edit quantity for ${item.product.name}`}
                          decreaseAriaLabel={`Decrease quantity for ${item.product.name}`}
                          increaseAriaLabel={`Increase quantity for ${item.product.name}`}
                          decreaseDisabled={
                            item.quantity <= getItemMinimumQuantity(item)
                          }
                          increaseDisabled={item.quantity >= item.availableStock}
                          onInputFocus={() =>
                            updateDraftQuantity(item.id, String(item.quantity))
                          }
                          onChange={(value) => updateDraftQuantity(item.id, value)}
                          onCommit={(value) => commitQuantity(item, value)}
                          onDecrease={() => decreaseQuantity(item)}
                          onIncrease={() => increaseQuantity(item)}
                        />
                      </div>
                    </article>
                  );
                })}

                <div ref={desktopBillDetailsRef} className="scroll-mt-28">
                  <BillDetailsCard
                    deliveryFee={deliveryFee}
                    deliveryErrorMessage={deliveryQuoteError}
                    discount={discount}
                    mrpSubtotal={mrpSubtotal}
                    savings={savings}
                    total={total}
                  />
                </div>
              </div>

              <aside className="h-fit rounded-[0.5rem] bg-white/95 p-6 lg:sticky lg:top-24">
                <h2 className="text-2xl text-gray-900 px-5 md:px-5">
                  Order summary
                </h2>

                <div className="mt-6 p-5">
                  <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Items in cart</span>
                      <span className="font-semibold text-gray-800">
                        {itemCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Items total</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2">
                        <Truck size={15} />
                        Delivery
                      </span>
                      <span className="inline-flex min-w-[5.75rem] justify-end font-semibold tabular-nums text-gray-800">
                        {deliveryFee === null ? (
                          "---"
                        ) : deliveryFee === 0 ? (
                          "Free"
                        ) : (
                          formatCurrency(deliveryFee)
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-gray-300 pt-5">
                    <div className="flex items-center justify-between text-xl font-semibold text-gray-900">
                      <span>Total payable</span>
                      <span className="inline-flex min-w-[7rem] justify-end tabular-nums">
                        {total === null ? "---" : formatCurrency(total)}
                      </span>
                    </div>
                 
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleCheckoutClick}
                    className={`flex w-full items-center justify-center gap-2 rounded-[0.5rem] px-6 py-4 text-sm font-semibold transition ${
                      canProceedToCheckout
                        ? "bg-[#207958] text-white hover:bg-[#46a780] cursor-pointer"
                        : "bg-[#207958] text-white hover:bg-gray-50 cursor-not-allowed opacity-70"
                    }`}
                  >
                    Order Now
                    <ArrowRight size={16} />
                  </button>
                  <Link
                    href="/"
                    className="flex w-full items-center justify-center rounded-[0.5rem] border border-gray-300 bg-white px-6 py-4 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Explore more products
                  </Link>
                </div>

                
              </aside>
            </div>
          )}
        </div>
      </section>

      <div
        className={`pointer-events-none fixed left-4 right-4 top-20 z-[90] transition-all duration-300 sm:left-auto sm:w-[360px] ${
          showDeliveryAddressAlert
            ? "translate-x-0 opacity-100"
            : "translate-x-[120%] opacity-0"
        }`}
        aria-live="polite"
      >
        <div className="ml-auto flex items-start gap-3 rounded-2xl border border-[#f3b3ad] bg-white px-4 py-3 shadow-[0_22px_60px_rgba(0,0,0,0.16)]">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1ef] text-[#d93025]">
            <MapPin size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#7a271a]">
              Set delivery location
            </p>
            <p className="mt-1 text-sm leading-5 text-[#9a3412]">
              Select your location from the cart before placing the order.
            </p>
          </div>
        </div>
      </div>

    </SiteShell>
  );
}
