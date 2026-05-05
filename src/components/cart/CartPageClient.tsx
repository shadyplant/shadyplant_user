"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Minus,
  Plus,
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
import type { ApiResponse } from "@/lib/api";
import {
  readCheckoutDraft,
  writeCheckoutDraft,
  type CheckoutPosition,
} from "@/lib/checkoutSession";
import { formatCurrency } from "@/lib/formatCurrency";
import type { Product } from "@/lib/products";
import { useProductsStore } from "@/components/productsStore";
import type { DeliveryAddress } from "@/lib/validation";
import { getProductHref } from "@/lib/productUrls";

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

type DetailedCartItem = {
  id: string;
  productId: string;
  variantId: string;
  variantLabel?: string;
  packLabel?: string;
  quantity: number;
  subtotal: number;
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
  isDeliveryLoading?: boolean;
};

function getOriginalPrice(price: number) {
  return price + Math.max(35, Math.round(price * 0.35));
}

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

function formatDeliveryAddress(deliveryAddress: {
  formattedAddress?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}) {
  return (
    deliveryAddress.formattedAddress ||
    [
    deliveryAddress.line1,
    deliveryAddress.line2,
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.postalCode,
  ]
    .filter(Boolean)
    .join(", ")
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
  isDeliveryLoading,
  mrpSubtotal,
  savings,
  total,
}: BillDetailsCardProps) {
  const deliveryValue = isDeliveryLoading
    ? "Calculating..."
    : deliveryFee === null
      ? "---"
      : deliveryFee
        ? formatCurrency(deliveryFee)
        : "Free";
  const totalValue = total === null ? "---" : formatCurrency(total);

  return (
    <section className="rounded-b-md pt-2">
      <h2 className="px-1 pb-3 text-[16px] font-black text-[#111111]">
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
            <span className="font-semibold">{deliveryValue}</span>
          </div>
          <div className="border-t border-dashed border-[#e5e7eb]" />
          <div className="flex items-center justify-between gap-4">
            <span>Discounts</span>
            <span className="font-semibold text-[#008a24]">
              - {formatCurrency(discount)}
            </span>
          </div>
          <div className="border-t border-[#eef0ee]" />
          <div className="flex items-center justify-between gap-4 pt-1 font-black">
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
  const [quantityEditor, setQuantityEditor] = useState<{
    itemId: string;
    productName: string;
    value: string;
    maxStock: number;
  } | null>(null);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(
    () => readCheckoutDraft()?.deliveryAddress || "",
  );
  const [selectedDeliveryPosition, setSelectedDeliveryPosition] =
    useState<CheckoutPosition | null>(
      () => readCheckoutDraft()?.deliveryPosition || null,
    );
  const [checkoutPreview, setCheckoutPreview] =
    useState<CheckoutPreview | null>(null);
  const [isDeliveryQuoteLoading, setIsDeliveryQuoteLoading] = useState(false);
  const [deliveryQuoteError, setDeliveryQuoteError] = useState<string | null>(
    null,
  );
  const [showDeliveryAddressAlert, setShowDeliveryAddressAlert] =
    useState(false);
  const {
    fetchWithAuth,
    isAuthenticated,
    isReady: isAuthReady,
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
            availableStock: resolveCartItemAvailableStock(product, item),
          },
        ];
      }),
    [cartItems, products],
  );

  const itemCount = getCartCount(cartItems);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const mrpSubtotal = items.reduce(
    (sum, item) => sum + getOriginalPrice(item.product.price) * item.quantity,
    0,
  );
  const discount = Math.max(0, mrpSubtotal - subtotal);
  const deliveryLabel = getCartDeliveryLabel();
  const savedDeliveryAddress = user?.deliveryAddress
    ? formatDeliveryAddress(user.deliveryAddress)
    : "";
  const deliveryAddressForPicker =
    selectedDeliveryAddress || savedDeliveryAddress;
  const hasCheckoutAddress = Boolean(deliveryAddressForPicker.trim());
  const hasDeliveryCoordinates = Boolean(
    selectedDeliveryPosition &&
      Number.isFinite(Number(selectedDeliveryPosition.lat)) &&
      Number.isFinite(Number(selectedDeliveryPosition.lng)),
  );
  const deliveryFee =
    hasCheckoutAddress &&
    Number.isFinite(Number(checkoutPreview?.pricing.deliveryCharge))
      ? Math.max(0, Math.round(Number(checkoutPreview?.pricing.deliveryCharge)))
      : null;
  const total =
    hasCheckoutAddress &&
    Number.isFinite(Number(checkoutPreview?.pricing.total))
      ? Math.max(0, Math.round(Number(checkoutPreview?.pricing.total)))
      : null;
  const savings = total === null ? null : Math.max(0, mrpSubtotal - total);
  const canProceedToCheckout =
    hasCheckoutAddress && deliveryFee !== null && !isDeliveryQuoteLoading;

  useEffect(() => {
    if (
      !isAuthenticated ||
      !hasCheckoutAddress ||
      !selectedDeliveryPosition ||
      !items.length
    ) {
      setCheckoutPreview(null);
      return;
    }

    const controller = new AbortController();

    async function loadDeliveryQuote() {
      setIsDeliveryQuoteLoading(true);
      setDeliveryQuoteError(null);

      try {
        const response = await fetchWithAuth<
          ApiResponse<{ preview: CheckoutPreview }>
        >("/checkout/preview", {
          method: "POST",
          body: JSON.stringify({
            deliveryAddress: {
              formattedAddress: deliveryAddressForPicker,
              ...(user?.deliveryAddress || {}),
            },
            deliveryLocation: selectedDeliveryPosition,
          }),
          signal: controller.signal,
        });

        setCheckoutPreview(response.data.preview);
        setDeliveryQuoteError(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setCheckoutPreview(null);
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
    selectedDeliveryPosition,
    user?.deliveryAddress,
  ]);

  function handleDeliveryAddressChange(
    address: string,
    position?: CheckoutPosition,
    deliveryAddress?: DeliveryAddress,
  ) {
    setSelectedDeliveryAddress(address);

    if (address.trim()) {
      setShowDeliveryAddressAlert(false);
      setDeliveryQuoteError(null);
    }

    if (position) {
      setSelectedDeliveryPosition(position);
      writeCheckoutDraft({
        deliveryAddress: address,
        deliveryPosition: position,
      });
      if (deliveryAddress) {
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
      if (!address.trim()) {
        writeCheckoutDraft({
          deliveryAddress: "",
          deliveryPosition: null,
        });
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
    if (item.quantity <= 1) {
      await removeItem(item.id);
      return;
    }

    await updateQuantity(item.id, item.quantity - 1);
  }

  function openQuantityEditor(item: DetailedCartItem) {
    setQuantityEditor({
      itemId: item.id,
      productName: item.product.name,
      value: String(item.quantity),
      maxStock: Math.max(1, item.availableStock),
    });
  }

  async function submitQuantityEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!quantityEditor) {
      return;
    }

    const numericQuantity = Number(quantityEditor.value);

    if (!Number.isFinite(numericQuantity)) {
      return;
    }

    const nextQuantity = Math.max(
      1,
      Math.min(quantityEditor.maxStock, Math.floor(numericQuantity)),
    );
    await updateQuantity(quantityEditor.itemId, nextQuantity);
    setQuantityEditor(null);
  }

  function handleCheckoutClick() {
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
      deliveryPosition: selectedDeliveryPosition,
    });

    router.push("/checkout");
  }

  if (isAuthReady && !isAuthenticated) {
    return (
      <SiteShell>
        <section className="px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-3xl rounded-[2.3rem] border border-[#dbe8cd] bg-white p-8 text-center shadow-[0_22px_60px_rgba(33,79,20,0.08)] md:p-10">
            <div className="mx-auto flex h-20 justify-center rounded-full bg-[#edf5e1] text-[#214f14]">
              <ShoppingCart size={30} />
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] text-[#163915]">
              Sign in to view your cart
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#5c7752]">
              Your cart now lives on your account, so the same saved items
              appear across devices after login.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth?next=/cart"
                className="theme-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold"
              >
                Sign in
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-[#d6e6bd] bg-white px-6 py-4 text-sm font-semibold text-[#214f14]"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell hideMobileHeader hideMobileBottomNav>
      <section className="bg-white px-4 pb-6 pt-4 md:hidden">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex h-10 items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 shrink-0 items-center justify-center text-[#111827]"
              aria-label="Go back"
            >
              <ArrowLeft size={24} strokeWidth={2.2} />
            </button>
            <h1 className="text-[16px] font-black text-[#111111]">
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
            {showDeliveryAddressAlert ? (
              <p className="mt-2 px-1 text-xs font-semibold text-[#b42318]">
                Enter your delivery address before checkout.
              </p>
            ) : null}
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
            <div className="mt-8 rounded-lg border border-[#e2e8dc] bg-[#fbfdf8] p-5 text-center">
              <ShoppingCart className="mx-auto text-[#214f14]" size={28} />
              <p className="mt-3 text-sm font-bold text-[#111111]">
                Your cart is empty
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#214f14] px-5 text-sm font-bold text-white"
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

                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_116px] items-center gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_140px] min-[390px]:gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
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

                      <div className="grid h-10 w-full shrink-0 grid-cols-3 items-center overflow-hidden rounded-[0.5rem] border-2 border-[#18a957] bg-[#f6fff8] text-[#0aa14b] min-[390px]:h-12 min-[390px]:rounded-[14px]">
                        <button
                          type="button"
                          aria-label={`Decrease quantity for ${item.product.name}`}
                          onClick={() => void decreaseQuantity(item)}
                          className="flex h-full items-center justify-center"
                        >
                          <Minus size={22} strokeWidth={2.6} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openQuantityEditor(item)}
                          className="min-w-0 text-center text-[16px] font-black leading-none transition hover:bg-[#e8f8ee] min-[390px]:text-[18px]"
                          aria-label={`Edit quantity for ${item.product.name}`}
                        >
                          {item.quantity}
                        </button>
                          <button
                            type="button"
                            aria-label={`Increase quantity for ${item.product.name}`}
                            onClick={() =>
                              item.quantity < item.availableStock
                                ? void updateQuantity(
                                    item.id,
                                    item.quantity + 1,
                                  )
                                : undefined
                            }
                            disabled={item.quantity >= item.availableStock}
                            className="flex h-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Plus size={24} strokeWidth={2.6} />
                          </button>
                      </div>
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
                  isDeliveryLoading={isDeliveryQuoteLoading}
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

      <section className="hidden px-4 py-8 md:block md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
            {items.length ? (
              <button
                type="button"
                onClick={() => void clearItems()}
                className="inline-flex h-fit items-center gap-2 self-start rounded-full border border-[#d6e6bd] bg-white px-5 py-3 text-sm font-semibold text-[#214f14] transition-colors hover:bg-[#f3f8ec]"
              >
                <Trash2 size={16} />
                Clear cart
              </button>
            ) : null}
          </div>

          <div
            ref={desktopDeliveryAddressRef}
            className={`mb-8 max-w-2xl rounded-2xl transition ${
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
            {showDeliveryAddressAlert ? (
              <p className="mt-2 px-1 text-sm font-semibold text-[#b42318]">
                Enter your delivery address before checkout.
              </p>
            ) : null}
            {!showDeliveryAddressAlert &&
            hasCheckoutAddress &&
            !hasDeliveryCoordinates ? (
              <p className="mt-2 px-1 text-sm font-semibold text-[#8a5a00]">
                Confirm this address on the map to calculate delivery charges.
              </p>
            ) : null}
          </div>

          {!isReady || isLoading || !areProductsReady || isProductsLoading ? (
            <div className="theme-panel-strong mx-auto max-w-3xl rounded-[2.3rem] p-6 text-center shadow-[0_22px_60px_rgba(33,79,20,0.08)] md:p-10">
              <h2 className="text-3xl font-black tracking-[-0.04em] text-[#163915]">
                Loading your cart
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#5c7752]">
                Pulling your saved cart from the server.
              </p>
            </div>
          ) : !items.length ? (
            <div className="theme-panel-strong mx-auto max-w-3xl rounded-[2.3rem] p-6 text-center shadow-[0_22px_60px_rgba(33,79,20,0.08)] md:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#edf5e1] text-[#214f14]">
                <ShoppingCart size={30} />
              </div>
              <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] text-[#163915]">
                Your cart is empty
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#5c7752]">
                Add plants, lawn grass, or planters from the catalog and they
                will appear here with live quantity controls and order totals.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/"
                  className="theme-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold"
                >
                  Start shopping
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-[#d6e6bd] bg-white px-6 py-4 text-sm font-semibold text-[#214f14]"
                >
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.18fr_0.82fr]">
              <div className="space-y-4">
                {items.map((item) => {
                  const productHref = getProductHref(item.product);

                  return (
                  <article
                    key={item.id}
                    className="rounded-md border border-[#d9d9d9] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
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
                          className="line-clamp-1 text-2xl font-semibold leading-8 text-[#111827]"
                        >
                          {item.product.name}
                        </Link>
                        {item.variantLabel || item.packLabel ? (
                          <p className="mt-1 text-sm font-medium text-[#58724f]">
                            {item.variantLabel || item.packLabel}
                          </p>
                        ) : null}
                        <p className="mt-1 text-3xl font-black leading-none tracking-[-0.02em] text-[#111111]">
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

                    <div className="mt-5 grid grid-cols-[minmax(0,1fr)_160px] items-center gap-4">
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

                      <div className="grid h-12 w-full shrink-0 grid-cols-3 items-center overflow-hidden rounded-[14px] border-2 border-[#18a957] bg-[#f6fff8] text-[#0aa14b] shadow-[3px_4px_0_rgba(22,57,21,0.18)]">
                        <button
                          type="button"
                          aria-label={`Decrease quantity for ${item.product.name}`}
                          onClick={() => void decreaseQuantity(item)}
                          className="flex h-full items-center justify-center"
                        >
                          <Minus size={24} strokeWidth={2.6} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openQuantityEditor(item)}
                          className="min-w-0 text-center text-[18px] font-black leading-none transition hover:bg-[#e8f8ee]"
                          aria-label={`Edit quantity for ${item.product.name}`}
                        >
                          {item.quantity}
                        </button>
                        <button
                          type="button"
                          aria-label={`Increase quantity for ${item.product.name}`}
                          onClick={() =>
                            item.quantity < item.availableStock
                              ? void updateQuantity(
                                  item.id,
                                  item.quantity + 1,
                                )
                              : undefined
                          }
                          disabled={item.quantity >= item.availableStock}
                          className="flex h-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Plus size={27} strokeWidth={2.6} />
                        </button>
                      </div>
                    </div>
                  </article>
                  );
                })}

                <div ref={desktopBillDetailsRef} className="scroll-mt-28">
                  <BillDetailsCard
                    deliveryFee={deliveryFee}
                    deliveryErrorMessage={deliveryQuoteError}
                    discount={discount}
                    isDeliveryLoading={isDeliveryQuoteLoading}
                    mrpSubtotal={mrpSubtotal}
                    savings={savings}
                    total={total}
                  />
                </div>
              </div>

              <aside className="h-fit rounded-[2rem] border border-[#dbe8cd] bg-white/95 p-6 shadow-[0_22px_60px_rgba(33,79,20,0.08)] lg:sticky lg:top-24">
                <h2 className="text-3xl font-black tracking-[-0.04em] text-[#163915]">
                  Order summary
                </h2>

                <div className="mt-6 rounded-[1.6rem] bg-[#f6faef] p-5">
                  <div className="space-y-4 text-sm text-[#46603d]">
                    <div className="flex items-center justify-between">
                      <span>Items in cart</span>
                      <span className="font-semibold text-[#214f14]">
                        {itemCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Items total</span>
                      <span className="font-semibold text-[#214f14]">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2">
                        <Truck size={15} />
                        Delivery
                      </span>
                      <span className="font-semibold text-[#214f14]">
                        {isDeliveryQuoteLoading
                          ? "Calculating..."
                          : deliveryFee === null
                            ? "---"
                            : deliveryFee === 0
                              ? "Free"
                              : formatCurrency(deliveryFee)}
                      </span>
                    </div>
                    {checkoutPreview ? (
                      <div className="flex items-center justify-between">
                        <span>Chargeable weight</span>
                        <span className="font-semibold text-[#214f14]">
                          {checkoutPreview.summary.totalWeightKg} kg
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 border-t border-[#dbe8cd] pt-5">
                    <div className="flex items-center justify-between text-xl font-black text-[#163915]">
                      <span>Total payable</span>
                      <span>
                        {total === null ? "---" : formatCurrency(total)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#58724f]">
                      Taxes included where applicable. Final confirmation
                      happens at checkout.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4 text-sm text-[#46603d]">
                  <p className="font-semibold text-[#214f14]">
                    {deliveryFee === null
                      ? "Select a delivery address to calculate transport charge."
                      : "Delivery charge is calculated from your selected location."}
                  </p>
                  <p className="mt-2">
                    {checkoutPreview
                      ? `Current estimate uses ${checkoutPreview.summary.totalWeightKg} kg total product weight over ${checkoutPreview.pricing.distanceKm.toFixed(2)} km.`
                      : "Dispatch support, healthy plant handling, and delivery coordination are included in the order workflow."}
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleCheckoutClick}
                    className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold transition ${
                      canProceedToCheckout
                        ? "theme-button"
                        : "border border-[#d6e6bd] bg-white text-[#214f14] hover:bg-[#f4fbf2]"
                    }`}
                  >
                    Proceed to checkout
                    <ArrowRight size={16} />
                  </button>
                  <Link
                    href="/"
                    className="flex w-full items-center justify-center rounded-full border border-[#d6e6bd] bg-white px-6 py-4 text-sm font-semibold text-[#214f14]"
                  >
                    Continue shopping
                  </Link>
                </div>

                <div className="mt-6 space-y-3 rounded-[1.5rem] bg-[#f6faef] p-4 text-sm text-[#46603d]">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={17} className="text-[#214f14]" />
                    Secure order confirmation and assisted support
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck size={17} className="text-[#214f14]" />
                    Delivery charges shown before you continue
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      {quantityEditor ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 px-4 pb-6 sm:items-center sm:pb-0">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close quantity editor"
            onClick={() => setQuantityEditor(null)}
          />

          <form
            onSubmit={(event) => void submitQuantityEditor(event)}
            className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
          >
            <div>
              <p className="text-sm font-bold text-[#163915]">Edit quantity</p>
              <p className="mt-1 line-clamp-1 text-xs font-medium text-[#5c7752]">
                {quantityEditor.productName}
              </p>
            </div>

            <input
              type="number"
              min={1}
              max={quantityEditor.maxStock}
              inputMode="numeric"
              value={quantityEditor.value}
              onChange={(event) =>
                setQuantityEditor((current) =>
                  current
                    ? {
                        ...current,
                        value: event.target.value,
                      }
                    : current,
                )
              }
              className="mt-4 h-12 w-full rounded-xl border border-[#174f18] px-4 text-center text-lg font-black text-[#174f18] outline-none focus:ring-4 focus:ring-[#f4fbf2]"
              autoFocus
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setQuantityEditor(null)}
                className="h-11 rounded-xl border border-[#d6e6bd] bg-white text-sm font-black text-[#174f18] transition hover:bg-[#f4fbf2]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-11 rounded-xl bg-[#174f18] text-sm font-black text-white transition hover:bg-[#103b11]"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </SiteShell>
  );
}
