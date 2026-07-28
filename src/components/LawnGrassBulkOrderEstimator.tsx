"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Info,
  Minus,
  PhoneCall,
  Plus,
  ShoppingCart,
} from "lucide-react";
import ProductDeliveryAddressPicker, {
  DELIVERY_ADDRESS_EVENT,
} from "@/components/ProductDeliveryAddressPicker";
import ShareButton from "@/components/ShareButton";
import WishlistButton from "@/components/WishlistButton";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCartStore } from "@/components/cartStore";
import { requestJson } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  buildCheckoutDeliveryAddressPayload,
  formatDeliveryAddress,
  sanitizeFormattedDeliveryAddress,
} from "@/lib/deliveryAddress";
import {
  readCheckoutDraft,
  type CheckoutPosition,
  writeCheckoutDraft,
} from "@/lib/checkoutSession";
import type { Product, ProductQuantityPricingSlab } from "@/lib/products";
import type { DeliveryAddress } from "@/lib/validation";

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

type LawnGrassBulkOrderEstimatorProps = {
  product: Product;
};

function resolveQuantitySlab(
  slabs: ProductQuantityPricingSlab[],
  quantity: number,
) {
  const normalizedQuantity = Math.max(1, Math.floor(Number(quantity || 1)));
  const orderedSlabs = [...slabs].sort(
    (left, right) => left.minQuantity - right.minQuantity,
  );

  return (
    orderedSlabs.find(
      (slab) =>
        normalizedQuantity >= slab.minQuantity &&
        (slab.maxQuantity === null || normalizedQuantity <= slab.maxQuantity),
    ) ||
    orderedSlabs
      .slice()
      .reverse()
      .find((slab) => normalizedQuantity >= slab.minQuantity) ||
    null
  );
}

function BlankEstimatePlaceholder() {
  return (
    <span
      aria-label="Not calculated yet"
      className="inline-flex items-center text-[1.1rem] font-medium leading-none tracking-[0.12em] text-[#8d8d8d]"
    >
      --
    </span>
  );
}

function LawnEstimateCarousel({
  images,
  productName,
  actionControls,
}: {
  images: string[];
  productName: string;
  actionControls?: ReactNode;
}) {
  const galleryImages = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const resolvedActiveIndex = Math.min(
    activeIndex,
    Math.max(galleryImages.length - 1, 0),
  );

  function goToImage(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), galleryImages.length - 1);
    setActiveIndex(nextIndex);
  }

  function goToPrevious() {
    setActiveIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1,
    );
  }

  function goToNext() {
    setActiveIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1,
    );
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 1) {
      return;
    }

    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touchStartX = touchStartXRef.current;
    const touchStartY = touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (touchStartX === null || touchStartY === null) {
      return;
    }

    const touchEnd = event.changedTouches[0];
    if (!touchEnd) {
      return;
    }

    const deltaX = touchEnd.clientX - touchStartX;
    const deltaY = touchEnd.clientY - touchStartY;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      goToNext();
    } else {
      goToPrevious();
    }
  }

  if (!galleryImages.length) {
    return (
      <div className="relative aspect-[1.55] overflow-hidden rounded-[0.5rem] md:rounded-[1.25rem] border border-[#e7e7e7] bg-[#f4f4f1] sm:aspect-[1.45] lg:aspect-[1.32]">
        <div className="flex h-full items-center justify-center text-sm font-medium text-[#7f7f7f]">
          Image preview unavailable
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[0.5rem] md:rounded-[1.25rem] border border-[#e5e5e5] bg-[#f4f4f1] shadow-[0_10px_28px_rgba(0,0,0,0.04)]">
      <div
        className="relative aspect-[1.55] overflow-hidden sm:aspect-[1.45] lg:aspect-[1.32]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={galleryImages[resolvedActiveIndex]}
          alt={`${productName} preview ${resolvedActiveIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 52vw, 760px"
          className="object-cover"
        />

        <div className="absolute left-3 top-3 rounded-xs bg-white/90 px-[4px] py-[2px] text-[8px] md:px-2 md:py-1 md:text-xs uppercase font-semibold text-[#214f14] shadow-sm backdrop-blur">
          Real Image
        </div>

        {actionControls ? (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
            {actionControls}
          </div>
        ) : null}
      </div>

      {galleryImages.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/70 px-1.5 py-1 md:px-2.5 md:py-1.5 shadow-sm backdrop-blur">
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-dot-${index}`}
              type="button"
              onClick={() => goToImage(index)}
              aria-label={`Show ${productName} image ${index + 1}`}
              aria-pressed={index === resolvedActiveIndex}
              className={`h-1 rounded-full transition-all ${
                index === resolvedActiveIndex
                  ? "w-4 bg-[#214f14]"
                  : "w-1 bg-[#214f14]/30"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function LawnGrassBulkOrderEstimator({
  product,
}: LawnGrassBulkOrderEstimatorProps) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated, user } = useAuth();
  const savedCheckoutDraft = readCheckoutDraft();

  const carouselImages = useMemo(
    () =>
      Array.from(
        new Set(
          [product.image, ...(product.images || [])]
            .map((image) => String(image || "").trim())
            .filter(Boolean),
        ),
      ).slice(0, 5),
    [product.image, product.images],
  );

  const [quantity, setQuantity] = useState(
    String(Math.max(1, Math.floor(product.minOrderQuantity || 1))),
  );
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(() =>
    sanitizeFormattedDeliveryAddress(savedCheckoutDraft?.deliveryAddress),
  );
  const [selectedDeliveryPosition, setSelectedDeliveryPosition] =
    useState<CheckoutPosition | null>(
      () => savedCheckoutDraft?.deliveryPosition || null,
    );
  const [selectedDeliveryAddressDetails, setSelectedDeliveryAddressDetails] =
    useState<DeliveryAddress | null>(
      () => savedCheckoutDraft?.deliveryAddressDetails || null,
    );
  const [deliveryCharge, setDeliveryCharge] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSavingCart, setIsSavingCart] = useState(false);
  const [hasCalculatedQuote, setHasCalculatedQuote] = useState(false);

  const quantityValue = Math.max(1, Math.floor(Number(quantity || 1)));
  const selectedSlab = resolveQuantitySlab(
    product.quantityPricingSlabs || [],
    quantityValue,
  );
  const salePricePerUnit = selectedSlab?.pricePerUnit ?? product.price;
  const itemsSubtotal = salePricePerUnit * quantityValue;
  const deliveryAddressForPicker =
    sanitizeFormattedDeliveryAddress(selectedDeliveryAddress) ||
    formatDeliveryAddress(savedCheckoutDraft?.deliveryAddressDetails || null);
  const hasLocation = Boolean(
    selectedDeliveryPosition &&
    Number.isFinite(Number(selectedDeliveryPosition.lat)) &&
    Number.isFinite(Number(selectedDeliveryPosition.lng)),
  );
  const isReadyToQuote = Boolean(
    deliveryAddressForPicker.trim() && hasLocation && phoneNumber.trim(),
  );

  const orderTotalPreview = useMemo(() => {
    if (hasCalculatedQuote && totalAmount !== null) {
      return totalAmount;
    }

    return null;
  }, [hasCalculatedQuote, totalAmount]);

  const canUseEstimateActions = orderTotalPreview !== null;

  useEffect(() => {
    if (user?.phoneNumber) {
      setPhoneNumber((current) => current.trim() || user.phoneNumber);
    }
  }, [user?.phoneNumber]);

  useEffect(() => {
    function handleDeliveryAddressUpdate(event: Event) {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const nextAddress =
        typeof event.detail?.address === "string"
          ? sanitizeFormattedDeliveryAddress(event.detail.address)
          : "";
      const nextPosition = event.detail?.position;
      const nextDeliveryAddress =
        event.detail?.deliveryAddress &&
        typeof event.detail.deliveryAddress === "object"
          ? (event.detail.deliveryAddress as DeliveryAddress)
          : null;

      setSelectedDeliveryAddress(nextAddress);
      setSelectedDeliveryPosition(
        nextPosition &&
          Number.isFinite(Number(nextPosition.lat)) &&
          Number.isFinite(Number(nextPosition.lng))
          ? {
              lat: Number(nextPosition.lat),
              lng: Number(nextPosition.lng),
            }
          : null,
      );
      setSelectedDeliveryAddressDetails(nextDeliveryAddress);
      setDeliveryCharge(null);
      setTotalAmount(null);
      setQuoteError("");
      setQuoteMessage("");
      setHasCalculatedQuote(false);
    }

    window.addEventListener(
      DELIVERY_ADDRESS_EVENT,
      handleDeliveryAddressUpdate,
    );

    return () => {
      window.removeEventListener(
        DELIVERY_ADDRESS_EVENT,
        handleDeliveryAddressUpdate,
      );
    };
  }, []);

  async function handleCalculate() {
    if (!phoneNumber.trim()) {
      setQuoteError("Enter phone number before calculating charges.");
      return;
    }

    if (!isReadyToQuote || !selectedDeliveryPosition) {
      setQuoteError(
        "Select a delivery location on the map before calculating charges.",
      );
      return;
    }

    setIsCalculating(true);
    setQuoteError("");
    setQuoteMessage("");

    try {
      const deliveryAddressPayload = buildCheckoutDeliveryAddressPayload(
        deliveryAddressForPicker,
        selectedDeliveryAddressDetails,
        null,
      );

      const response = await requestJson<DeliveryQuoteResponse>(
        "/calc-delivery",
        {
          method: "POST",
          body: JSON.stringify({
            weight: Math.max(0.01, Number(product.weight || 0) * quantityValue),
            lat: selectedDeliveryPosition.lat,
            lng: selectedDeliveryPosition.lng,
            state:
              deliveryAddressPayload.state ||
              selectedDeliveryAddressDetails?.state ||
              "",
          }),
        },
      );

      if (!response.ok || !response.success) {
        throw new Error(
          response.message || "Unable to calculate delivery charge.",
        );
      }

      const charge = Number.isFinite(Number(response.cost))
        ? Math.max(0, Math.round(Number(response.cost)))
        : 0;

      setDeliveryCharge(charge);
      setTotalAmount(itemsSubtotal + charge);
      setQuoteMessage(
        response.message || "Delivery charge calculated successfully.",
      );
      setHasCalculatedQuote(true);
    } catch (error) {
      setDeliveryCharge(null);
      setTotalAmount(null);
      setHasCalculatedQuote(false);
      setQuoteError(
        error instanceof Error
          ? error.message
          : "Unable to calculate delivery charge.",
      );
    } finally {
      setIsCalculating(false);
    }
  }

  async function handleAddToCart() {
    if (!canUseEstimateActions) {
      return;
    }

    setIsSavingCart(true);

    try {
      await addItem(product.id, quantityValue, {
        variantId: selectedSlab?.key || "",
        variantLabel: selectedSlab?.label || "Bulk order",
        packLabel: product.packLabel,
        unitPrice: salePricePerUnit,
      });
    } finally {
      setIsSavingCart(false);
    }
  }

  async function handleBuyNow() {
    if (!canUseEstimateActions) {
      return;
    }

    await handleAddToCart();

    if (!isAuthenticated) {
      router.push(`/auth?next=${encodeURIComponent("/checkout")}`);
      return;
    }

    router.push("/checkout");
  }

  function handleAddressChange(
    address: string,
    position?: CheckoutPosition,
    deliveryAddress?: DeliveryAddress,
  ) {
    const sanitizedAddress = sanitizeFormattedDeliveryAddress(address);
    setSelectedDeliveryAddress(sanitizedAddress);
    setSelectedDeliveryPosition(position || null);
    setSelectedDeliveryAddressDetails(deliveryAddress || null);
    writeCheckoutDraft({
      deliveryAddress: sanitizedAddress,
      deliveryAddressDetails: deliveryAddress || null,
      deliveryPosition: position || null,
    });
    setDeliveryCharge(null);
    setTotalAmount(null);
    setQuoteError("");
    setQuoteMessage("");
    setHasCalculatedQuote(false);
  }

  const heroTitle = `Buy ${product.name || "Lawn Grass"} with Home Delivery`;
  const heroDescription =
    "🔥 Save More & Unlock Better Prices as You Add More to Your Order, with Fair Shipping Based on Your Location";
  const ratePerSqft = salePricePerUnit;
  const savingsAmount = hasCalculatedQuote
    ? Math.max(0, Math.round((product.mrp - salePricePerUnit) * quantityValue))
    : 0;

  return (
    <section className="w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-7">
          <div className="flex flex-col-reverse gap-4 lg:flex-col lg:gap-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4 lg:gap-6">
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold leading-tight text-[#2b2b2b] md:text-[2rem]">
                  {heroTitle}
                </h1>
                <p className="mt-2 max-w-xl text-xs leading-4 md:leading-6 text-[#6a6a6a] md:text-[1.05rem]">
                  {heroDescription}
                </p>
              </div>
            </div>

            <LawnEstimateCarousel
              images={carouselImages}
              productName={product.name}
              actionControls={
                <>
                  <WishlistButton
                    productId={product.id}
                    size={18}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[0.55rem] bg-white/90 !text-[#5f5f5f] shadow-sm backdrop-blur transition hover:bg-white sm:h-10 sm:w-10"
                  />
                  <ShareButton
                    url={
                      typeof window !== "undefined"
                        ? window.location.href
                        : undefined
                    }
                    productName={product.name}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[0.55rem] bg-white/90 text-[#5f5f5f] shadow-sm backdrop-blur transition hover:bg-white sm:h-10 sm:w-10"
                  />
                </>
              }
            />
          </div>

          <div className="rounded-[1rem] p-0 md:p-5">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              <label className="block">
                <span className="text-[10px] font-medium text-gray-600 sm:text-[14px] md:text-[15px]">
                  Enter Quantity In Sqft*
                </span>
                <div className="mt-2 flex h-12 overflow-hidden rounded-[0.55rem] border border-[#e4e4e4] bg-white sm:h-14">
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity((current) =>
                        String(
                          Math.max(1, Math.floor(Number(current || 1)) - 1),
                        ),
                      );
                      setDeliveryCharge(null);
                      setTotalAmount(null);
                      setQuoteError("");
                      setQuoteMessage("");
                      setHasCalculatedQuote(false);
                    }}
                    className="inline-flex w-10 items-center justify-center bg-[#E7F9E7] text-[#0d9a55] transition hover:bg-[#24913c] sm:w-12"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} className="sm:size-[18px]" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) => {
                      setQuantity(event.target.value);
                      setDeliveryCharge(null);
                      setTotalAmount(null);
                      setQuoteError("");
                      setQuoteMessage("");
                      setHasCalculatedQuote(false);
                    }}
                    className="min-w-0 flex-1 border-x border-[#e4e4e4] text-center text-[0.95rem] font-semibold tracking-[-0.04em] text-[#111111] outline-none placeholder:text-[#a0a0a0] focus:bg-[#e4f3e2] sm:text-[1.05rem]"
                    placeholder="10,000"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity((current) =>
                        String(
                          Math.max(1, Math.floor(Number(current || 1)) + 1),
                        ),
                      );
                      setDeliveryCharge(null);
                      setTotalAmount(null);
                      setQuoteError("");
                      setQuoteMessage("");
                      setHasCalculatedQuote(false);
                    }}
                    className="inline-flex w-10 items-center justify-center bg-[#E7F9E7] text-[#0d9a55] transition hover:bg-[#24913c] sm:w-12"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} className="sm:size-[18px]" />
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-[10px] font-medium text-gray-600 sm:text-[14px] md:text-[15px]">
                  Enter Phone Number*
                </span>
                <div className="relative mt-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    className="h-12 w-full rounded-[0.55rem] border border-[#e4e4e4] bg-white px-3 pr-10 text-[0.95rem] text-[#111111] outline-none transition placeholder:text-[#a0a0a0] focus:border-[#4c8b5d] focus:ring-4 focus:ring-[#e8f4df] sm:h-14 sm:px-4 sm:pr-12 sm:text-[1rem]"
                    placeholder="+91 6002515623"
                  />
                  <PhoneCall
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8a8a] sm:right-4 sm:size-[18px]"
                  />
                </div>
              </label>
            </div>

            <div className="mt-4">
              <div className="text-[10px] font-medium text-gray-600 md:text-[15px]">
                Select Delivery Point ( Point On Map )*
              </div>
              <div className="mt-2 overflow-hidden rounded-[0.55rem] border border-[#e4e4e4] bg-white px-3 py-2.5">
                <ProductDeliveryAddressPicker
                  variant="checkout-card"
                  initialAddress={deliveryAddressForPicker}
                  initialPosition={selectedDeliveryPosition}
                  autoResolveInitialAddress
                  emptyLabel="Select Delivery Point"
                  onAddressChange={handleAddressChange}
                  onDone={handleAddressChange}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleCalculate()}
              disabled={isCalculating || !isReadyToQuote}
              className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-[0.45rem] bg-[#207958] px-6 text-[1.05rem] font-semibold text-white transition hover:bg-[#3f7b4c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCalculating ? "Calculating..." : "Estimate Cost"}
            </button>

            <p className="mt-2 flex items-start gap-2 text-[10px] md:text-[0.8rem] text-[#8d8d8d]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              This estimate will cover lawn rate and transportation charges
              together.
            </p>

            {/* {quoteError ? (
              <div className="mt-3 flex items-start gap-2 rounded-[0.75rem] border border-[#f2d3d3] bg-[#fff7f7] px-4 py-3 text-sm text-[#b42318]">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{quoteError}</p>
              </div>
            ) : null} */}

            {/* {quoteMessage ? (
              <div className="mt-3 flex items-start gap-2 rounded-[0.75rem] border border-[#d6ead8] bg-[#f5fbf5] px-4 py-3 text-sm text-[#1f6a34]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{quoteMessage}</p>
              </div>
            ) : null} */}

            <div className="mt-4 space-y-3 rounded-[1rem] bg-white p-0 md:p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between gap-4 border-b border-[#d9d9d9] pb-3">
                <span className="text-xs text-[#333333]">
                  Total Quantity
                </span>
                <span className="text-xs font-medium text-[#2f2f2f]">
                  {hasCalculatedQuote ? (
                    Number(quantityValue).toLocaleString("en-IN")
                  ) : (
                    <BlankEstimatePlaceholder />
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-[#d9d9d9] pb-3">
                <span className="text-xs text-[#333333]">
                  ₹ Rate Per Sqft
                </span>
                <span className="text-xs font-medium text-[#2f2f2f]">
                  {hasCalculatedQuote ? (
                    ratePerSqft.toFixed(2)
                  ) : (
                    <BlankEstimatePlaceholder />
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-semibold text-[#333333]">
                  Total Amount
                </span>
                <span className="text-[1.1rem] font-semibold tracking-[-0.03em] text-[#111111]">
                  {orderTotalPreview !== null ? (
                    <>
                      {formatCurrency(orderTotalPreview)}
                      <span className="ml-1">/-</span>
                    </>
                  ) : (
                    <BlankEstimatePlaceholder />
                  )}
                </span>
              </div>

              {hasCalculatedQuote && deliveryCharge !== null ? (
                <p className="text-[0.78rem] leading-5 text-[#7f7f7f]">
                  Delivery charge included: {formatCurrency(deliveryCharge)}
                </p>
              ) : null}

              <p className="flex items-start gap-2 text-[10px] md:text-[0.78rem] leading-5 text-[#7f7f7f]">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Total amount includes lawn price + transport charges.
              </p>

              {hasCalculatedQuote && savingsAmount > 0 ? (
                <div className="rounded-[0.35rem] bg-[#c8f5b930] px-3 py-2 text-center text-xs font-semibold text-[#0d6b2d]">
                  Congratulations! You&apos;re saving{" "}
                  {formatCurrency(savingsAmount)} on this order.
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => void handleAddToCart()}
                  disabled={isSavingCart || !canUseEstimateActions}
                  className="inline-flex h-12 items-center justify-center rounded-[0.45rem] bg-[#207958] px-3 text-[0.92rem] font-semibold text-white transition hover:bg-[#3f7b4c] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:px-5 sm:text-[1rem]"
                >
                  <ShoppingCart size={15} className="mr-1.5 sm:mr-2" />
                  {isSavingCart ? "Adding..." : "Add to cart"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleBuyNow()}
                  disabled={isSavingCart || !canUseEstimateActions}
                  className="inline-flex h-12 items-center justify-center rounded-[0.45rem] border border-[#d8d8d8] bg-white px-3 text-[0.92rem] font-semibold text-[#4a4a4a] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:px-5 sm:text-[1rem]"
                >
                  Buy now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
