"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  ChevronDown,
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
import ProductDeliveryAddressPicker from "@/components/ProductDeliveryAddressPicker";
import { getCartCount, useCartStore } from "@/components/cartStore";
import { requestJson, type ApiResponse } from "@/lib/api";
import {
  fetchDeliveryConfigSnapshot,
  resolveServerDeliveryWeightCapKg,
  type DeliveryConfigSnapshot,
} from "@/lib/deliveryConfig";
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
import {
  clampProductQuantity,
  resolveProductQuantityBounds,
  type Product,
  type ProductQuantityBounds,
} from "@/lib/products";
import { useProductsStore } from "@/components/productsStore";
import {
  normalizeDeliveryAddress,
  type DeliveryAddress,
} from "@/lib/validation";
import { getProductHref } from "@/lib/productUrls";
import QuantityStepper from "@/components/QuantityStepper";
import { span } from "framer-motion/client";
import SpinnerLoader from "../loader/spinner";
import CompactSpinnerLoader from "../loader/compact_spinner";

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
  quantityBounds: ProductQuantityBounds;
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
      <h2 className="px-1 pb-3 text-[16px] text-[#111111]">Bill details</h2>
      <div className="rounded-xl bg-white p-4 border border-[#d9d9d9] shadow-[0_30px_90px_rgba(0,0,0,0.07)]">
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
              {deliveryFee === null
                ? "---"
                : deliveryFee
                  ? formatCurrency(deliveryFee)
                  : "Free"}
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
  const [isMobileDeliveryPickerOpen, setIsMobileDeliveryPickerOpen] =
    useState(false);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>(
    {},
  );
  const [quantityAlerts, setQuantityAlerts] = useState<Record<string, string>>(
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
  const [guestDeliveryCharge, setGuestDeliveryCharge] = useState<number | null>(
    null,
  );
  const [deliveryConfig, setDeliveryConfig] =
    useState<DeliveryConfigSnapshot | null>(null);
  const [isDeliveryQuoteLoading, setIsDeliveryQuoteLoading] = useState(false);
  const [deliveryQuoteError, setDeliveryQuoteError] = useState<string | null>(
    null,
  );
  const [showDeliveryAddressAlert, setShowDeliveryAddressAlert] =
    useState(false);
  const lastAutoResolvedDeliveryAddressRef = useRef("");
  const deliveryQuoteDebounceRef = useRef<number | null>(null);
  const quantityAlertTimersRef = useRef<Record<string, number>>({});
  const { fetchWithAuth, isAuthenticated, updateProfile, user } = useAuth();
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
    return () => {
      Object.values(quantityAlertTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      quantityAlertTimersRef.current = {};
    };
  }, []);

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
    setSelectedDeliveryAddress(
      sanitizeFormattedDeliveryAddress(nextFormattedAddress),
    );
    setSelectedDeliveryAddressDetails(savedDeliveryAddress);
    writeCheckoutDraft({
      deliveryAddress: nextFormattedAddress,
      deliveryAddressDetails: savedDeliveryAddress,
      deliveryPosition: readCheckoutDraft()?.deliveryPosition || null,
    });
  }, [user]);

  useEffect(() => {
    let isActive = true;

    void fetchDeliveryConfigSnapshot()
      .then((config) => {
        if (isActive) {
          setDeliveryConfig(config);
        }
      })
      .catch(() => {
        if (isActive) {
          setDeliveryConfig(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const baseItems = useMemo<DetailedCartItem[]>(
    () =>
      cartItems.flatMap((item) => {
        const product = products.find((entry) => entry.id === item.productId);

        if (!product) {
          return [];
        }

        return [
          {
            ...item,
            quantityBounds: resolveProductQuantityBounds(
              product,
              resolveCartItemAvailableStock(product, item),
            ),
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

  const selectedDeliveryState = (
    selectedDeliveryAddressDetails?.state ||
    normalizeDeliveryAddress(user?.deliveryAddress).state ||
    ""
  ).trim();
  const serverWeightCapKg = resolveServerDeliveryWeightCapKg(
    deliveryConfig,
    selectedDeliveryState,
  );
  const totalWeightKg = baseItems.reduce(
    (sum, item) => sum + Number(item.product.weight || 0) * item.quantity,
    0,
  );

  const items = useMemo<DetailedCartItem[]>(
    () =>
      baseItems.map((item) => {
        const itemWeightKg = Number(item.product.weight || 0);
        const weightWithoutCurrentItem =
          totalWeightKg - itemWeightKg * item.quantity;
        const remainingWeightCapacity =
          serverWeightCapKg === null
            ? null
            : serverWeightCapKg - weightWithoutCurrentItem;
        const serverMaximumQuantity =
          remainingWeightCapacity !== null && itemWeightKg > 0
            ? Math.max(0, Math.floor(remainingWeightCapacity / itemWeightKg))
            : null;

        return {
          ...item,
          quantityBounds: resolveProductQuantityBounds(
            item.product,
            item.availableStock,
            {
              serverMaximumQuantity,
            },
          ),
        };
      }),
    [baseItems, serverWeightCapKg, totalWeightKg],
  );

  useEffect(() => {
    items.forEach((item) => {
      if (
        item.quantityBounds.maximumQuantity !== null &&
        item.quantity > item.quantityBounds.maximumQuantity
      ) {
        void updateQuantity(item.id, item.quantityBounds.maximumQuantity);
      }
    });
  }, [items, updateQuantity]);

  const itemCount = getCartCount(cartItems);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
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
  const isServerWeightCapExceeded =
    serverWeightCapKg !== null && totalWeightKg > serverWeightCapKg;
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
    hasCheckoutAddress &&
    deliveryFee !== null &&
    !isDeliveryQuoteLoading &&
    !isServerWeightCapExceeded;

  function triggerQuantityVibration() {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
      return;
    }

    navigator.vibrate?.([80, 35, 80]);
  }

  function showQuantityAlert(itemId: string, message: string) {
    setQuantityAlerts((current) => ({
      ...current,
      [itemId]: message,
    }));
    triggerQuantityVibration();

    const existingTimer = quantityAlertTimersRef.current[itemId];
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    quantityAlertTimersRef.current[itemId] = window.setTimeout(() => {
      setQuantityAlerts((current) => {
        const nextAlerts = { ...current };
        delete nextAlerts[itemId];
        return nextAlerts;
      });
      delete quantityAlertTimersRef.current[itemId];
    }, 2600);
  }

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
                results:
                  | Array<{
                      formatted_address?: string;
                      address_components?: unknown;
                      geometry?: {
                        location?: {
                          lat: () => number;
                          lng: () => number;
                        };
                      };
                    }>
                  | undefined,
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
          selectedDeliveryAddressDetails ||
          readCheckoutDraft()?.deliveryAddressDetails ||
          null,
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
      if (deliveryQuoteDebounceRef.current !== null) {
        window.clearTimeout(deliveryQuoteDebounceRef.current);
        deliveryQuoteDebounceRef.current = null;
      }

      if (!isAuthenticated) {
        setGuestDeliveryCharge(null);
      }
      setCheckoutPreview(null);
      return;
    }

    if (isServerWeightCapExceeded) {
      const capLabel =
        serverWeightCapKg !== null
          ? serverWeightCapKg.toLocaleString("en-IN")
          : "";
      setCheckoutPreview(null);
      setGuestDeliveryCharge(null);
      setDeliveryQuoteError(
        capLabel
          ? `Order weight exceeds the server limit of ${capLabel} kg for this delivery zone.`
          : "Order weight exceeds the server delivery limit for this zone.",
      );
      setIsDeliveryQuoteLoading(false);
      return;
    }
    const resolvedDeliveryPosition = deliveryPosition;

    if (deliveryQuoteDebounceRef.current !== null) {
      window.clearTimeout(deliveryQuoteDebounceRef.current);
    }

    const controller = new AbortController();

    deliveryQuoteDebounceRef.current = window.setTimeout(() => {
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
            const response = await requestJson<DeliveryQuoteResponse>(
              "/calc-delivery",
              {
                method: "POST",
                body: JSON.stringify({
                  weight: totalWeightKg,
                  lat: resolvedDeliveryPosition.lat,
                  lng: resolvedDeliveryPosition.lng,
                  state: selectedDeliveryAddressDetails?.state || "",
                }),
                signal: controller.signal,
              },
            );

            if (!response.ok || !response.success) {
              throw new Error(
                response.message || "Unable to calculate delivery charge.",
              );
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
    }, 350);

    return () => {
      controller.abort();

      if (deliveryQuoteDebounceRef.current !== null) {
        window.clearTimeout(deliveryQuoteDebounceRef.current);
        deliveryQuoteDebounceRef.current = null;
      }
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
    isServerWeightCapExceeded,
    serverWeightCapKg,
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
    const minQuantity = item.quantityBounds.minimumQuantity;

    if (item.quantity <= minQuantity) {
      showQuantityAlert(
        item.id,
        `Required Min Qty ${minQuantity.toLocaleString("en-IN")}`,
      );
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
    if (
      item.quantityBounds.maximumQuantity !== null &&
      item.quantity >= item.quantityBounds.maximumQuantity
    ) {
      showQuantityAlert(
        item.id,
        `Required Max Qty ${item.quantityBounds.maximumQuantity.toLocaleString(
          "en-IN",
        )}`,
      );
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
    return item.quantityBounds.minimumQuantity;
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

    const normalizedQuantity = Math.floor(numericQuantity);
    const nextQuantity = clampProductQuantity(
      normalizedQuantity,
      item.quantityBounds,
    );

    if (normalizedQuantity < item.quantityBounds.minimumQuantity) {
      showQuantityAlert(
        item.id,
        `Required Min Qty ${item.quantityBounds.minimumQuantity.toLocaleString(
          "en-IN",
        )}`,
      );
    } else if (
      item.quantityBounds.maximumQuantity !== null &&
      normalizedQuantity > item.quantityBounds.maximumQuantity
    ) {
      showQuantityAlert(
        item.id,
        `Required Max Qty ${item.quantityBounds.maximumQuantity.toLocaleString(
          "en-IN",
        )}`,
      );
    }

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

    if (isServerWeightCapExceeded) {
      setDeliveryQuoteError(
        serverWeightCapKg !== null
          ? `Order weight exceeds the server limit of ${serverWeightCapKg.toLocaleString(
              "en-IN",
            )} kg for this delivery zone.`
          : "Order weight exceeds the server delivery limit for this zone.",
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
            <h1 className="text-lg text-[#111111]">Shopping Cart</h1>
          </div>

          <div
            ref={mobileDeliveryAddressRef}
            className={` rounded-xl transition ${
              showDeliveryAddressAlert
                ? "border border-[#d93025] bg-[#fff6f5] p-0 md:p-2"
                : "border border-transparent"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsMobileDeliveryPickerOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-[#ececec] bg-white px-4 py-3 text-left transition hover:border-[#d7ead8] hover:bg-[#fbfdf8]"
            >
              <MapPin size={18} className="shrink-0 text-[#1b3151]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[#111111]">
                  {deliveryAddressForPicker || "Select location"}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {hasCheckoutAddress
                    ? "Tap to change saved address"
                    : "Tap to add delivery address"}
                </span>
              </span>
              <span className="shrink-0 text-[#111827]">
                <ChevronDown size={18} />
              </span>
            </button>
            <ProductDeliveryAddressPicker
              variant="cart-select"
              initialAddress={deliveryAddressForPicker}
              initialPosition={selectedDeliveryPosition}
              autoResolveInitialAddress
              emptyLabel="Select location"
              hideTrigger
              isOpen={isMobileDeliveryPickerOpen}
              onOpenChange={setIsMobileDeliveryPickerOpen}
              onDone={handleDeliveryAddressDone}
            />
            {!hasCheckoutAddress && (
              <div className="w-full">
                <style>{`
    @keyframes shimmerSweep {
      0% { transform: translateX(-150%) rotate(12deg); }
      100% { transform: translateX(400%) rotate(12deg); }
    }
  `}</style>

                <span className="relative inline-block overflow-hidden rounded-xs bg-[#ff0f0f10] px-3 py-1 text-xs font-medium text-[#ff0f0f]">
                  <span className="relative z-10">
                    Please pin your delivery location
                  </span>

                  <span
                    className="absolute top-0 left-0 z-20 h-full w-16 bg-gradient-to-r from-transparent via-white/90 to-transparent blur-[1px]"
                    style={{
                      animation: "shimmerSweep 1.6s ease-in-out infinite",
                    }}
                    aria-hidden="true"
                  />
                </span>
              </div>
            )}
            {!showDeliveryAddressAlert &&
            hasCheckoutAddress &&
            !hasDeliveryCoordinates ? (
              <p className="mt-2 px-1 text-xs font-semibold text-[#8a5a00]">
                Confirm this address on the map to calculate delivery charges.
              </p>
            ) : null}
          </div>

          {!isReady || isLoading || !areProductsReady || isProductsLoading ? (
            <SpinnerLoader offset={130} />
          ) : !items.length ? (
            <div className="mx-auto max-w-3xl rounded-[0.5rem] bg-[var(--surface-strong)] p-6 text-center backdrop-blur-[16px] md:p-10">
              <div className="mx-auto flex h-auto w-auto items-center justify-center text-[#4c8d5b]">
                <img
                  src="/empty_cart_illustration.svg"
                  alt=""
                  className="h-40 w-auto p-2"
                />
              </div>
              <h2 className="mt-6 text-xl text-gray-800">Your cart is empty</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-400">
                Looks like you haven&apos;t added any plants yet. Let&apos;s
                change that and bring some green home!
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#207958] py-3 pl-6 pr-14 text-sm font-semibold text-white shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[#1b6b4e] hover:shadow-[0_12px_30px_rgba(32,121,88,0.35)] active:translate-y-0 active:scale-[0.98]"
                >
                  <span className="pointer-events-none absolute inset-0">
                    <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[420%]" />
                  </span>

                  <span className="relative z-10 text-center">
                    Start shopping
                  </span>

                  <div className="absolute right-1 top-1/2 z-10 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-white/20 p-3 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/30 group-hover:shadow-[0_0_16px_rgba(255,255,255,0.25)]">
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* <div className="mt-0 border-t border-[#eeeeee] pt-2">
                <h2 className="text-[14px] text-[#111111]">
                  Items ({itemCount})
                </h2>
              </div> */}

              <div className="mt-4 space-y-5">
                {items.map((item) => {
                  const productHref = getProductHref(item.product);
                  const productHighlights = [
                    item.product.variety,
                    item.product.containerSize,
                    item.product.height,
                  ]
                    .map((value) => String(value || "").trim())
                    .filter(Boolean);

                  return (
                    <article
                      key={item.id}
                      className="rounded-lg border border-[#d9d9d9] bg-white p-3 shadow-[0_30px_90px_rgba(0,0,0,0.03)]"
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
                            className="line-clamp-1 text-sm text-gray-800 md:text-base"
                          >
                            {item.product.name}
                          </Link>
                          {productHighlights.length ? (
                            <p className="mt-1 line-clamp-1 text-[12px] leading-4 text-[#7a7a7a] min-[390px]:text-[13px]">
                              {productHighlights.join(" | ")}
                            </p>
                          ) : null}
                          {item.variantLabel || item.packLabel ? (
                            <p className="mt-1 text-[11px] font-medium text-gray-700 min-[390px]:text-[12px]">
                              {/* {item.variantLabel || item.packLabel} */}
                            </p>
                          ) : null}
                          <p className="mt-1 text-lg font-semibold leading-none tracking-[-0.02em] text-gray-700 min-[390px]:text-[24px]">
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

                      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_7.25rem] items-center gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_8rem] min-[390px]:gap-2 min-[390px]:items-center sm:grid-cols-[minmax(0,1fr)_20rem] lg:grid-cols-[minmax(0,1fr)_22.5rem] xl:grid-cols-[minmax(0,1fr)_25rem]">
                        <div className="flex min-w-0 items-center gap-3 text-[10px] font-semibold text-[#30343b] min-[390px]:gap-2 min-[390px]:text-[11px] sm:gap-7 sm:text-sm">
                          <button
                            type="button"
                            onClick={() => void removeItem(item.id)}
                            className="inline-flex h-8 min-w-0 items-center gap-1.5 whitespace-nowrap min-[390px]:gap-2"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                            Remove
                          </button>
                        </div>
                        <QuantityStepper
                          value={getDraftQuantity(item)}
                          min={getItemMinimumQuantity(item)}
                          max={
                            item.quantityBounds.maximumQuantity ??
                            Math.max(1, item.availableStock)
                          }
                          ariaLabel={`Edit quantity for ${item.product.name}`}
                          decreaseAriaLabel={`Decrease quantity for ${item.product.name}`}
                          increaseAriaLabel={`Increase quantity for ${item.product.name}`}
                          decreaseDisabled={
                            item.quantity <= getItemMinimumQuantity(item)
                          }
                          increaseDisabled={
                            item.quantityBounds.maximumQuantity !== null &&
                            item.quantity >= item.quantityBounds.maximumQuantity
                          }
                          iconSize={11}
                          iconStrokeWidth={2.1}
                          compact
                          onInputFocus={() =>
                            updateDraftQuantity(item.id, String(item.quantity))
                          }
                          onChange={(value) =>
                            updateDraftQuantity(item.id, value)
                          }
                          onCommit={(value) => commitQuantity(item, value)}
                          onDecrease={() => decreaseQuantity(item)}
                          onIncrease={() => increaseQuantity(item)}
                        />
                        {quantityAlerts[item.id] ? (
                          <div className="pointer-events-none mt-2 flex justify-center">
                            <div className="qty-alert-blink rounded-md border border-[#f4c4c4] bg-[#fff5f5] px-3 py-1.5 text-[11px] font-semibold text-[#b42318] shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
                              {quantityAlerts[item.id]}
                            </div>
                          </div>
                        ) : null}
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

              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e7eb] bg-white px-4 py-3 shadow-[0_-10px_28px_rgba(36,54,27,0.12)]">
                <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-500">Total payable</p>
                    <p className="text-2xl font-medium text-gray-800 text-[#111111]">
                      {total === null ? "---" : formatCurrency(total)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckoutClick}
                    className={`flex h-11 min-w-[150px] font-medium items-center justify-center rounded-md px-5 text-base sm:text-[1.35rem] transition ${
                      canProceedToCheckout
                        ? "bg-[#207958] text-white hover:bg-[#163915]"
                        : "border border-gray-200 bg-white text-gray-300 hover:bg-[#f4fbf2]"
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
              className="inline-flex items-center rounded-md gap-2 bg-white px-5 py-3 md:px-4 md:py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {/* Clear Cart */}
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => void clearItems()}
                className="inline-flex items-center gap-2 rounded-full border border-transparent rounded-md hover:border-red-100 bg-white px-5 py-3 md:px-4 md:py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
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
            <div className="mx-auto max-w-3xl p-6 text-center md:p-10">
              <SpinnerLoader offset={400} />
            </div>
          ) : !items.length ? (
            <div className="mx-auto max-w-3xl rounded-[0.5rem] bg-[var(--surface-strong)] p-6 text-center backdrop-blur-[16px] md:p-10">
              <div className="mx-auto flex h-auto w-auto items-center justify-center text-[#4c8d5b]">
                <img
                  src="/empty_cart_illustration.svg"
                  alt=""
                  className="h-60 w-auto p-2"
                />
              </div>
              <h2 className="mt-6 text-2xl text-gray-800">
                Your cart is empty
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-gray-400">
                Looks like you haven&apos;t added any plants yet. Let&apos;s
                change that and bring some green home!
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/"
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#207958] px-1 py-1 text-sm font-semibold text-white shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[#1b6b4e] hover:shadow-[0_12px_30px_rgba(32,121,88,0.35)] active:translate-y-0 active:scale-[0.98]"
                >
                  {/* Shine */}
                  <span className="pointer-events-none absolute inset-0">
                    <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[420%]" />
                  </span>

                  {/* Text */}
                  <span className="relative z-10 pl-4 pr-2 transition-all duration-300">
                    Start shopping
                  </span>

                  {/* Arrow */}
                  <div className="relative z-10 inline-flex items-center justify-center rounded-full bg-white/20 p-3 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/30 group-hover:shadow-[0_0_16px_rgba(255,255,255,0.25)]">
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.18fr_0.82fr] p-6">
              <div className="space-y-4">
                {items.map((item) => {
                  const productHref = getProductHref(item.product);
                  const productHighlights = [
                    item.product.variety,
                    item.product.containerSize,
                    item.product.height,
                  ]
                    .map((value) => String(value || "").trim())
                    .filter(Boolean);

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
                          {productHighlights.length ? (
                            <p className="mt-1 line-clamp-1 text-sm leading-5 text-[#7a7a7a]">
                              {productHighlights.join(" | ")}
                            </p>
                          ) : null}
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
                          max={
                            item.quantityBounds.maximumQuantity ??
                            Math.max(1, item.availableStock)
                          }
                          ariaLabel={`Edit quantity for ${item.product.name}`}
                          decreaseAriaLabel={`Decrease quantity for ${item.product.name}`}
                          increaseAriaLabel={`Increase quantity for ${item.product.name}`}
                          decreaseDisabled={
                            item.quantity <= getItemMinimumQuantity(item)
                          }
                          increaseDisabled={
                            item.quantityBounds.maximumQuantity !== null &&
                            item.quantity >= item.quantityBounds.maximumQuantity
                          }
                          onInputFocus={() =>
                            updateDraftQuantity(item.id, String(item.quantity))
                          }
                          onChange={(value) =>
                            updateDraftQuantity(item.id, value)
                          }
                          onCommit={(value) => commitQuantity(item, value)}
                          onDecrease={() => decreaseQuantity(item)}
                          onIncrease={() => increaseQuantity(item)}
                        />
                        {quantityAlerts[item.id] ? (
                          <div className="pointer-events-none mt-2 flex justify-center xl:justify-start">
                            <div className="qty-alert-blink rounded-md border border-[#f4c4c4] bg-[#fff5f5] px-3 py-1.5 text-[11px] font-semibold text-[#b42318] shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
                              {quantityAlerts[item.id]}
                            </div>
                          </div>
                        ) : null}
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
                        {deliveryFee === null
                          ? "---"
                          : deliveryFee === 0
                            ? "Free"
                            : formatCurrency(deliveryFee)}
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
