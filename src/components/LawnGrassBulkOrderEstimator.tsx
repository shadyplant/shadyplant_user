"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Info, ShoppingCart } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductDeliveryAddressPicker, {
  DELIVERY_ADDRESS_EVENT,
} from "@/components/ProductDeliveryAddressPicker";
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
      className="inline-flex h-8 w-16 items-center text-[1.35rem] font-medium leading-none tracking-[0.12em] text-[#8d8d8d]"
    >
      _ _ _
    </span>
  );
}

export default function LawnGrassBulkOrderEstimator({
  product,
}: LawnGrassBulkOrderEstimatorProps) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuth();
  const savedCheckoutDraft = readCheckoutDraft();

  const [quantity, setQuantity] = useState(
    String(Math.max(1, Math.floor(product.minOrderQuantity || 1))),
  );
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
  const isReadyToQuote = Boolean(deliveryAddressForPicker.trim() && hasLocation);

  const orderTotalPreview = useMemo(() => {
    if (hasCalculatedQuote && totalAmount !== null) {
      return totalAmount;
    }

    return null;
  }, [hasCalculatedQuote, totalAmount]);
  const canUseEstimateActions = orderTotalPreview !== null;

  const locationSummary = useMemo(() => {
    if (hasCalculatedQuote && selectedDeliveryAddress) {
      return selectedDeliveryAddress;
    }

    return "";
  }, [hasCalculatedQuote, selectedDeliveryAddress]);

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
        event.detail?.deliveryAddress && typeof event.detail.deliveryAddress === "object"
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

    window.addEventListener(DELIVERY_ADDRESS_EVENT, handleDeliveryAddressUpdate);

    return () => {
      window.removeEventListener(
        DELIVERY_ADDRESS_EVENT,
        handleDeliveryAddressUpdate,
      );
    };
  }, []);

  async function handleCalculate() {
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

      const response = await requestJson<DeliveryQuoteResponse>("/calc-delivery", {
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
      });

      if (!response.ok || !response.success) {
        throw new Error(response.message || "Unable to calculate delivery charge.");
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
        error instanceof Error ? error.message : "Unable to calculate delivery charge.",
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

  return (
    <div className="w-full flex items-center justify-center">
      <div className="grid w-full gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-8">
          <div className="max-w-xl">
            <h1 className="text-[1.4rem] font-medium text-[#111111] md:text-[1.7rem]">
              Get Fresh Mexican Lawn Delivered at Doorstep
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[#6b6b6b] md:text-[15px]">
              Save more and unlock better prices as you add more to your order,
              with fair shipping based on your location.
            </p>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-[15px] font-medium text-[#141414]">
                Enter Quantity
              </span>
              <div className="relative mt-2">
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
                  className="h-14 w-full rounded-[0.45rem] text-center border border-[#ececec] bg-white px-5 pr-14 text-[1.35rem] font-semibold tracking-[-0.04em] text-[#111111] outline-none transition placeholder:text-[#a0a0a0] focus:border-[#4c8b5d] focus:ring-4 focus:ring-[#e8f4df]"
                  placeholder="10,000"
                />
                <button
                  type="button"
                  onClick={() => {
                    setQuantity(String(Math.max(1, Math.floor(product.minOrderQuantity || 1))));
                    setDeliveryCharge(null);
                    setTotalAmount(null);
                    setQuoteError("");
                    setQuoteMessage("");
                    setHasCalculatedQuote(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl leading-none text-[#8f8f8f] transition hover:text-[#4a4a4a]"
                  aria-label="Reset quantity"
                >
                  ×
                </button>
              </div>
            </label>

            <div>
              <div className="text-[15px] font-medium text-[#141414]">
                Select Delivery Location
              </div>
              <div className="mt-2 rounded-[0.45rem] border border-[#ececec] bg-white px-4 py-3">
                <ProductDeliveryAddressPicker
                  variant="checkout-card"
                  initialAddress={deliveryAddressForPicker}
                  initialPosition={selectedDeliveryPosition}
                  autoResolveInitialAddress
                  emptyLabel="Set Delivery Location"
                  onAddressChange={handleAddressChange}
                  onDone={handleAddressChange}
                />
              </div>
              {/* <p className="mt-2 pr-1 text-right text-sm text-[#8d8d8d]">
                Change Delivery location.
              </p> */}
            </div>


            <button
              type="button"
              onClick={() => void handleCalculate()}
              disabled={isCalculating || !isReadyToQuote}
              className="mt-[1rem] inline-flex h-14 w-full items-center justify-center rounded-[0.4rem] bg-[#207958] px-6 text-[1.05rem] font-medium text-white transition hover:bg-[#3f7b4c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCalculating ? "Calculating..." : "Estimate Cost"}
            </button>

            {/* {quoteError ? (
              <div className="flex items-start gap-2 rounded-xl border border-[#f2d3d3] bg-[#fff7f7] px-4 py-3 text-sm text-[#b42318]">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{quoteError}</p>
              </div>
            ) : null}
            {quoteMessage ? (
              <div className="flex items-start gap-2 rounded-xl border border-[#d6ead8] bg-[#f5fbf5] px-4 py-3 text-sm text-[#1f6a34]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{quoteMessage}</p>
              </div>
            ) : null} */}
          </div>
        </div>

        <div className="rounded-[0.56rem] p-6 bg-gray-100">
          <h2 className="text-[1.4rem] font-medium text-[#111111] text-center md:text-[1.7rem]">
            Order Estimate
          </h2>

              <div className="mt-7 space-y-7">
              <div className="flex items-end justify-between gap-4 border-b border-[#d7d7d7] pb-4">
                <div>
                  <p className="text-[1rem] text-[#111111]">Total Quantity :</p>
                  <p className="mt-1 text-[2rem] font-medium tracking-[-0.04em] text-[#8d8d8d]">
                  {hasCalculatedQuote ? Number(quantityValue).toLocaleString("en-IN") : <BlankEstimatePlaceholder />}
                  </p>
                </div>
              <p className="pb-2 text-lg text-[#6f6f6f]">
                {hasCalculatedQuote ? "sqft." : ""}
              </p>
              </div>

              <div>
                <p className="text-[1rem] text-[#111111]">Deliver to :</p>
                <p className="mt-2 border-b border-[#d7d7d7] pb-3 text-[1rem] text-[#8d8d8d]">
                  {locationSummary || <BlankEstimatePlaceholder />}
                </p>
                <p className="mt-2 flex items-center gap-2 text-[0.8rem] text-[#8d8d8d]">
                  <Info className="h-3.5 w-3.5" />
                  Changing delivery address may revise total cost!
                </p>
              </div>

            <div className="flex flex-col gap-1">
                <div className="rounded-[0.5rem] border border-[#7d7d7d] bg-white px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[1.1rem] font-medium text-[#111111]">
                    Total Amount :
                  </p>
                  <p className="text-[1.35rem] font-medium tracking-[-0.04em] text-[#4a4a4a]">
                  {orderTotalPreview !== null ? (
                    <>
                      {formatCurrency(orderTotalPreview)}
                      <span className="ml-1">/-</span>
                    </>
                  ) : (
                    <BlankEstimatePlaceholder />
                  )}
                  </p>
                </div>
              {/* {deliveryCharge !== null ? (
                <p className="mt-2 text-right text-xs text-[#7d7d7d]">
                  Delivery charge included: {formatCurrency(deliveryCharge)}
                </p>
              ) : null} */}

   
              </div>

                     <p className="flex items-center gap-2 text-[0.8rem] text-[#8d8d8d]">
              <Info className="h-3.5 w-3.5" />
              Including delivery charges.
            </p>
          
            </div>

      

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleAddToCart()}
                disabled={isSavingCart || !canUseEstimateActions}
                className="inline-flex h-14 items-center justify-center rounded-[0.45rem] bg-[#207958] px-5 text-[1rem] font-medium text-white transition hover:bg-[#3f7b4c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShoppingCart size={16} className="mr-2" />
                {isSavingCart ? "Adding..." : "Add to cart"}
              </button>
              <button
                type="button"
                onClick={() => void handleBuyNow()}
                disabled={isSavingCart || !canUseEstimateActions}
                className="inline-flex h-14 items-center justify-center rounded-[0.45rem] border border-[#efefef] bg-white px-5 text-[1rem] font-medium text-[#4a4a4a] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Buy now
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
