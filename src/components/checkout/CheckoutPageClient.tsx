"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCartStore } from "@/components/cartStore";
import { useProductsStore } from "@/components/productsStore";
import { requestJson } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { hasCompleteDeliveryAddress, isValidPostalCode } from "@/lib/validation";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

const LIBRARIES: "places"[] = ["places"];
const WAREHOUSE_LOCATION = {
  lat: 26.2457163,
  lng: 90.9172911,
};
const SAMPLE_QTY_SQFT = 100;
const GRASS_PRICE_PER_SQFT = 12;
const SUPPORT_WHATSAPP = "919876543210";

const VEHICLES = [
  { id: "small", name: "Small Pickup", rate: 15, desc: "Up to 500 sqft" },
  { id: "medium", name: "Medium Truck", rate: 25, desc: "Up to 1200 sqft" },
  { id: "heavy", name: "Heavy Loader", rate: 45, desc: "Up to 3000 sqft" },
] as const;

const ADD_ONS = [
  {
    id: "lawn_food",
    name: "Premium Lawn Food",
    description: "Supports color and early settling after installation.",
    unitLabel: "bag",
    unitPrice: 780,
  },
  {
    id: "root_booster",
    name: "Root Booster Mix",
    description: "Helps fresh lawn sections take hold more evenly.",
    unitLabel: "pack",
    unitPrice: 420,
  },
  {
    id: "installation_help",
    name: "Installation Support",
    description: "Reserve guided setup support from the nursery team.",
    unitLabel: "slot",
    unitPrice: 950,
  },
] as const;

type DeliveryQuoteResponse = {
  ok: boolean;
  zone?: string;
  distance_km?: number;
  warning?: string | null;
  message?: string;
};

type CheckoutState = {
  grass: number;
  shipping: number;
  total: number;
  dist: number;
  zone: string;
  warning: string | null;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill: {
    contact?: string;
    email?: string;
    name?: string;
  };
  theme: {
    color: string;
  };
};

type RazorpayCheckout = {
  paymentAttemptId: string;
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  businessName: string;
  description: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  shouldSimulateWebhook: boolean;
};

type AddOnQuantities = Record<(typeof ADD_ONS)[number]["id"], number>;

type BillingFormState = {
  useDeliveryAddress: boolean;
  needBusinessInvoice: boolean;
  billingName: string;
  companyName: string;
  gstNumber: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

type CheckoutLineItem = {
  key: string;
  name: string;
  subtitle: string;
  image: string | null;
  quantity: number;
  coverageSqft: number;
};

const EMPTY_ADD_ONS: AddOnQuantities = {
  lawn_food: 0,
  root_booster: 0,
  installation_help: 0,
};

const EMPTY_BILLING_FORM: BillingFormState = {
  useDeliveryAddress: true,
  needBusinessInvoice: false,
  billingName: "",
  companyName: "",
  gstNumber: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

function parseCoverageSqft(packLabel: string) {
  const match = String(packLabel || "").match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function resolveVehicle(quantitySqft: number) {
  if (quantitySqft <= 500) {
    return VEHICLES[0];
  }

  if (quantitySqft <= 1200) {
    return VEHICLES[1];
  }

  return VEHICLES[2];
}

function getDefaultDeliveryDate() {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 2);
  deliveryDate.setHours(10, 0, 0, 0);
  return deliveryDate.toISOString();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatSavedAddress(deliveryAddress: {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}) {
  return [
    deliveryAddress.line1,
    deliveryAddress.line2,
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function getStatusToneClasses(tone: "neutral" | "success" | "warning" | "error") {
  if (tone === "success") {
    return "border-[#cfe5c8] bg-[#f6fbf3] text-[#23471c]";
  }

  if (tone === "warning") {
    return "border-[#f0ddb0] bg-[#fffaf0] text-[#7a5a11]";
  }

  if (tone === "error") {
    return "border-[#f2d2d2] bg-[#fff7f7] text-[#9c3131]";
  }

  return "border-[#dbe8cd] bg-white text-[#58724f]";
}

function validateBillingForm(form: BillingFormState) {
  const errors: Record<string, string> = {};

  if (!form.needBusinessInvoice) {
    return errors;
  }

  if (!form.billingName.trim()) {
    errors.billingName = "Billing name is required for GST invoice.";
  }

  if (!form.companyName.trim()) {
    errors.companyName = "Business name is required for GST invoice.";
  }

  if (!/^[0-9A-Z]{15}$/.test(form.gstNumber.trim().toUpperCase())) {
    errors.gstNumber = "Enter a valid 15-character GSTIN.";
  }

  if (!form.useDeliveryAddress) {
    if (!form.line1.trim()) {
      errors.line1 = "Billing address line 1 is required.";
    }

    if (!form.city.trim()) {
      errors.city = "Billing city is required.";
    }

    if (!form.state.trim()) {
      errors.state = "Billing state is required.";
    }

    if (!form.postalCode.trim()) {
      errors.postalCode = "Billing postal code is required.";
    } else if (!isValidPostalCode(form.postalCode)) {
      errors.postalCode = "Enter a valid billing postal code.";
    }
  }

  return errors;
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { fetchWithAuth, isAuthenticated, isReady, user } = useAuth();
  const { items: cartItems, isReady: isCartReady } = useCartStore();
  const { products, isReady: areProductsReady } = useProductsStore();
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPos, setMarkerPos] = useState(WAREHOUSE_LOCATION);
  const [address, setAddress] = useState("");
  const [addOnQuantities, setAddOnQuantities] = useState<AddOnQuantities>(EMPTY_ADD_ONS);
  const [billingForm, setBillingForm] = useState<BillingFormState>(EMPTY_BILLING_FORM);
  const [billingErrors, setBillingErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CheckoutState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"neutral" | "success" | "warning" | "error">(
    "neutral",
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const requestedSqft = Number(searchParams?.get("sqft") || "");
  const requestedProductId = String(searchParams?.get("product") || "").trim();

  useEffect(() => {
    if (!user) {
      return;
    }

    setBillingForm((current) => ({
      ...current,
      billingName: current.billingName || user.fullName || "",
    }));

    const savedAddress = formatSavedAddress(user.deliveryAddress);
    if (savedAddress && !address) {
      setAddress(savedAddress);
    }
  }, [address, user]);

  const checkoutItems = useMemo<CheckoutLineItem[]>(() => {
    const requestedProduct = products.find((product) => product.id === requestedProductId);

    if (Number.isFinite(requestedSqft) && requestedSqft > 0) {
      return [
        {
          key: requestedProductId || "buy-now",
          name: requestedProduct?.name || "Lawn grass order",
          subtitle: requestedProduct?.packLabel || "Buy now selection",
          image: requestedProduct?.image || null,
          quantity: 1,
          coverageSqft: Math.round(requestedSqft),
        },
      ];
    }

    return cartItems.flatMap((item) => {
      const product = products.find((entry) => entry.id === item.productId);

      if (!product || product.category !== "Lawn Grass") {
        return [];
      }

      const coverageSqft = parseCoverageSqft(product.packLabel) * item.quantity;
      if (!coverageSqft) {
        return [];
      }

      return [
        {
          key: product.id,
          name: product.name,
          subtitle: product.packLabel,
          image: product.image,
          quantity: item.quantity,
          coverageSqft,
        },
      ];
    });
  }, [cartItems, products, requestedProductId, requestedSqft]);

  const hasRealOrderContext = checkoutItems.length > 0;
  const quantitySqft = useMemo(
    () =>
      hasRealOrderContext
        ? checkoutItems.reduce((sum, item) => sum + item.coverageSqft, 0)
        : SAMPLE_QTY_SQFT,
    [checkoutItems, hasRealOrderContext],
  );

  const isContextReady = useMemo(() => {
    if (Number.isFinite(requestedSqft) && requestedSqft > 0) {
      return true;
    }

    if (!isAuthenticated) {
      return true;
    }

    return isCartReady && areProductsReady;
  }, [areProductsReady, isAuthenticated, isCartReady, requestedSqft]);

  const selectedVehicle = resolveVehicle(quantitySqft);

  const profileReady = Boolean(
    user &&
      user.fullName &&
      user.phoneNumber &&
      hasCompleteDeliveryAddress(user.deliveryAddress),
  );

  const selectedAddOns = useMemo(
    () =>
      ADD_ONS.flatMap((item) => {
        const quantity = addOnQuantities[item.id];
        if (!quantity) {
          return [];
        }

        return [
          {
            ...item,
            quantity,
            subtotal: quantity * item.unitPrice,
          },
        ];
      }),
    [addOnQuantities],
  );

  const addOnSubtotal = useMemo(
    () => selectedAddOns.reduce((sum, item) => sum + item.subtotal, 0),
    [selectedAddOns],
  );

  const grandTotal = (result?.total || 0) + addOnSubtotal;
  const materialSubtotal = quantitySqft * GRASS_PRICE_PER_SQFT;

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng) {
      return;
    }

    const nextPosition = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    setMarkerPos(nextPosition);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: nextPosition }, (results) => {
      if (results && results[0]) {
        setAddress(results[0].formatted_address);
      }
    });
  }, []);

  function onPlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) {
      return;
    }

    const nextPosition = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    setMarkerPos(nextPosition);
    setAddress(place.formatted_address || "");
    map?.panTo(nextPosition);
  }

  function setAddOnQuantity(addOnId: keyof AddOnQuantities, quantity: number) {
    setAddOnQuantities((current) => ({
      ...current,
      [addOnId]: Math.max(0, Math.min(9, quantity)),
    }));
  }

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  async function calculateCheckout() {
    setStatusMessage(null);
    setStatusTone("neutral");

    if (!isContextReady) {
      return;
    }

    setIsCalculating(true);

    try {
      const deliveryQuote = await requestJson<DeliveryQuoteResponse>("/calc-delivery", {
        method: "POST",
        body: JSON.stringify({
          lat: markerPos.lat,
          lng: markerPos.lng,
        }),
      });

      if (!deliveryQuote.ok || !deliveryQuote.distance_km) {
        setResult(null);
        setStatusMessage(
          deliveryQuote.message || "This delivery location is not serviceable yet.",
        );
        setStatusTone("error");
        return;
      }

      const shippingCost = Math.round(deliveryQuote.distance_km * selectedVehicle.rate);

      setResult({
        grass: materialSubtotal,
        shipping: shippingCost,
        total: materialSubtotal + shippingCost,
        dist: Number(deliveryQuote.distance_km.toFixed(1)),
        zone: deliveryQuote.zone || "Standard",
        warning: deliveryQuote.warning || null,
      });

      if (!hasRealOrderContext) {
        setStatusMessage(
          "Delivery charge is shown on a 100 sqft sample. Use Buy now or add lawn grass to cart for the actual order total.",
        );
        setStatusTone("warning");
      } else if (deliveryQuote.warning) {
        setStatusMessage(deliveryQuote.warning);
        setStatusTone("warning");
      } else {
        setStatusMessage("Delivery charge calculated successfully.");
        setStatusTone("success");
      }
    } catch (error) {
      setResult(null);
      setStatusMessage(getErrorMessage(error, "Unable to calculate delivery charge."));
      setStatusTone("error");
    } finally {
      setIsCalculating(false);
    }
  }

  function buildOrderPayload(paymentMethod: "cash_on_delivery" | "online_payment") {
    if (!user || !hasRealOrderContext || !result) {
      throw new Error("Add a lawn grass order before continuing to payment.");
    }

    if (!profileReady) {
      throw new Error("Complete your saved delivery address and phone number before checkout.");
    }

    const nextBillingErrors = validateBillingForm(billingForm);
    setBillingErrors(nextBillingErrors);

    if (Object.keys(nextBillingErrors).length) {
      throw new Error("Complete the required billing fields for business invoice.");
    }

    return {
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      quantitySqft,
      distanceKm: result.dist,
      vehicleId: selectedVehicle.id,
      deliveryDate: getDefaultDeliveryDate(),
      paymentMethod,
      deliveryAddress: user.deliveryAddress,
      recommendedItems: selectedAddOns.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    };
  }

  async function handleCashOnDelivery() {
    if (!isAuthenticated) {
      router.push("/auth?next=/checkout");
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const response = await fetchWithAuth<{
        message: string;
        data: { order: { id: string } };
      }>("/orders", {
        method: "POST",
        body: JSON.stringify(buildOrderPayload("cash_on_delivery")),
      });

      setStatusMessage(response.message);
      setStatusTone("success");
      router.push("/order");
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Unable to place the order right now."));
      setStatusTone("error");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleOnlinePayment() {
    if (!isAuthenticated) {
      router.push("/auth?next=/checkout");
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        throw new Error("Razorpay failed to load.");
      }

      const response = await fetchWithAuth<{
        message: string;
        data: { checkout: RazorpayCheckout };
      }>("/payments/razorpay/create-order", {
        method: "POST",
        body: JSON.stringify(buildOrderPayload("online_payment")),
      });

      const checkout = response.data.checkout;

      if (!window.Razorpay) {
        throw new Error("Razorpay is unavailable right now.");
      }

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: checkout.businessName,
        description: checkout.description,
        order_id: checkout.orderId,
        prefill: {
          contact: checkout.prefill.contact,
          email: checkout.prefill.email,
          name: checkout.prefill.name,
        },
        handler: () => {
          void (async () => {
            try {
              if (checkout.shouldSimulateWebhook) {
                await fetchWithAuth(
                  `/payments/razorpay/test-webhook/${checkout.paymentAttemptId}`,
                  {
                    method: "POST",
                  },
                );
              }

              router.push("/order");
            } catch (error) {
              setStatusMessage(
                getErrorMessage(
                  error,
                  "Payment was captured, but order confirmation is still pending.",
                ),
              );
              setStatusTone("warning");
            } finally {
              setIsProcessing(false);
            }
          })();
        },
        theme: {
          color: "#214f14",
        },
      });

      razorpay.open();
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Unable to start online payment."));
      setStatusTone("error");
      setIsProcessing(false);
    }
  }

  const savedAddress = user ? formatSavedAddress(user.deliveryAddress) : "";
  const canPlaceOrder = Boolean(
    result && hasRealOrderContext && isAuthenticated && profileReady && !isProcessing,
  );

  return (
    <SiteShell>
      <section className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e6cf] bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#5b7751]">
                <ShieldCheck size={14} className="text-[#214f14]" />
                Secure checkout
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#163915] md:text-5xl">
                Checkout
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#58724f] md:text-base">
                Delivery charge is calculated from the selected location, while order quantity
                comes from your Buy now flow or lawn grass cart items.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-[#58724f] md:text-sm">
              <div className="rounded-[1.3rem] border border-[#dbe8cd] bg-white px-4 py-3">
                <p className="font-semibold text-[#163915]">1. Location</p>
                <p className="mt-1">Pin the destination</p>
              </div>
              <div className="rounded-[1.3rem] border border-[#dbe8cd] bg-white px-4 py-3">
                <p className="font-semibold text-[#163915]">2. Delivery</p>
                <p className="mt-1">See charge instantly</p>
              </div>
              <div className="rounded-[1.3rem] border border-[#dbe8cd] bg-white px-4 py-3">
                <p className="font-semibold text-[#163915]">3. Payment</p>
                <p className="mt-1">Confirm the order</p>
              </div>
            </div>
          </div>

          {statusMessage ? (
            <div
              className={`mb-6 rounded-[1.5rem] border px-5 py-4 text-sm ${getStatusToneClasses(statusTone)}`}
            >
              {statusMessage}
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_380px]">
            <div className="space-y-6">
              {!isReady ? (
                <section className="rounded-[1.8rem] border border-[#dbe8cd] bg-white p-6 text-sm text-[#58724f] shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
                  Loading your checkout...
                </section>
              ) : null}

              {!isReady || !isContextReady ? (
                <section className="rounded-[1.8rem] border border-[#dbe8cd] bg-white p-6 text-sm text-[#58724f] shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
                  Preparing your checkout items...
                </section>
              ) : null}

              <section className="rounded-[1.8rem] border border-[#dbe8cd] bg-white p-6 shadow-[0_18px_45px_rgba(33,79,20,0.06)] md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6b8b58]">
                      Delivery
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                      Delivery destination
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#58724f]">
                      Search the destination or drop the pin. Our routing algorithm will use
                      that location to calculate delivery charge.
                    </p>
                  </div>

                  {!isAuthenticated ? (
                    <Link
                      href="/auth?next=/checkout"
                      className="inline-flex items-center justify-center rounded-full border border-[#dbe8cd] bg-white px-4 py-2 text-sm font-semibold text-[#214f14]"
                    >
                      Sign in to order
                    </Link>
                  ) : !profileReady ? (
                    <Link
                      href="/profile?section=addresses"
                      className="inline-flex items-center justify-center rounded-full border border-[#e8d39d] bg-[#fffaf0] px-4 py-2 text-sm font-semibold text-[#6f5110]"
                    >
                      Complete profile address
                    </Link>
                  ) : null}
                </div>

                {isAuthenticated && profileReady ? (
                  <div className="mt-5 rounded-[1.4rem] border border-[#dbe8cd] bg-[#f8fbf3] px-4 py-3 text-sm text-[#46603d]">
                    Fulfillment address on file:{" "}
                    <span className="font-semibold text-[#163915]">
                      {savedAddress || "Address saved in profile"}
                    </span>
                  </div>
                ) : null}

                <div className="mt-6 space-y-4">
                  {isLoaded && !loadError ? (
                    <>
                      <Autocomplete
                        onLoad={(ref) => {
                          autocompleteRef.current = ref;
                        }}
                        onPlaceChanged={onPlaceChanged}
                      >
                        <div className="relative">
                          <MapPin
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b8b58]"
                            size={18}
                          />
                          <input
                            type="text"
                            placeholder="Search locality, address, or landmark"
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            className="w-full rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] py-4 pl-12 pr-4 text-sm text-[#163915] outline-none"
                          />
                        </div>
                      </Autocomplete>

                      <div className="overflow-hidden rounded-[1.6rem] border border-[#dbe8cd]">
                        <GoogleMap
                          mapContainerStyle={{ width: "100%", height: "340px" }}
                          center={markerPos}
                          zoom={11}
                          onClick={onMapClick}
                          onLoad={(nextMap) => setMap(nextMap)}
                          options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                            streetViewControl: false,
                          }}
                        >
                          <Marker position={markerPos} />
                        </GoogleMap>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-[1.4rem] border border-[#f0ddb0] bg-[#fffaf0] p-4 text-sm text-[#7a5a11]">
                      Map API is not connected, so live delivery coverage cannot be checked yet.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={calculateCheckout}
                  disabled={isCalculating || !isContextReady}
                  className="theme-button mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold"
                >
                  {isCalculating ? "Calculating delivery..." : "Calculate delivery charge"}
                  <ArrowRight size={16} />
                </button>
              </section>

              <section className="rounded-[1.8rem] border border-[#dbe8cd] bg-white p-6 shadow-[0_18px_45px_rgba(33,79,20,0.06)] md:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6b8b58]">
                  Order overview
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                  Checkout items
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#58724f]">
                  Quantity is derived from your active lawn grass order. Transport is assigned
                  automatically based on total coverage.
                </p>

                <div className="mt-6 space-y-4">
                  {hasRealOrderContext ? (
                    checkoutItems.map((item) => (
                      <article
                        key={item.key}
                        className="flex gap-4 rounded-[1.5rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.2rem] bg-white">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#5b7751]">
                              <Store size={20} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold text-[#163915]">{item.name}</p>
                          <p className="mt-1 text-sm text-[#58724f]">{item.subtitle}</p>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#46603d]">
                            <span>Qty: {item.quantity}</span>
                            <span>Coverage: {item.coverageSqft} sqft</span>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-[#dbe8cd] bg-[#f8fbf3] p-5 text-sm text-[#58724f]">
                      <p className="font-semibold text-[#163915]">Sample delivery calculation</p>
                      <p className="mt-2 leading-6">
                        No lawn grass order is attached yet, so delivery is being estimated on a
                        sample {SAMPLE_QTY_SQFT} sqft order.
                      </p>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <Link
                          href="/"
                          className="inline-flex items-center justify-center rounded-full border border-[#d6e6bd] bg-white px-5 py-3 text-sm font-semibold text-[#214f14]"
                        >
                          Browse products
                        </Link>
                        <Link
                          href="/cart"
                          className="inline-flex items-center justify-center rounded-full border border-[#d6e6bd] bg-white px-5 py-3 text-sm font-semibold text-[#214f14]"
                        >
                          Open cart
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4">
                    <p className="text-sm font-semibold text-[#214f14]">Coverage</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                      {quantitySqft} sqft
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4">
                    <p className="text-sm font-semibold text-[#214f14]">Assigned transport</p>
                    <p className="mt-2 text-xl font-black tracking-[-0.04em] text-[#163915]">
                      {selectedVehicle.name}
                    </p>
                    <p className="mt-1 text-sm text-[#58724f]">{selectedVehicle.desc}</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4">
                    <p className="text-sm font-semibold text-[#214f14]">Material subtotal</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                      {formatCurrency(materialSubtotal)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.8rem] border border-[#dbe8cd] bg-white p-6 shadow-[0_18px_45px_rgba(33,79,20,0.06)] md:p-8">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5e1] text-[#214f14]">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6b8b58]">
                      Billing
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                      Billing address
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#58724f]">
                      Personal orders can continue without invoice details. Business buyers can
                      add billing name, GSTIN, and billing address for tax invoice use.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-[1.3rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm font-semibold text-[#214f14]">
                    <input
                      type="checkbox"
                      checked={billingForm.useDeliveryAddress}
                      onChange={(event) =>
                        setBillingForm((current) => ({
                          ...current,
                          useDeliveryAddress: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-[#cfe0b5]"
                    />
                    Use delivery address for billing
                  </label>

                  <label className="flex items-center gap-3 rounded-[1.3rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm font-semibold text-[#214f14]">
                    <input
                      type="checkbox"
                      checked={billingForm.needBusinessInvoice}
                      onChange={(event) =>
                        setBillingForm((current) => ({
                          ...current,
                          needBusinessInvoice: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-[#cfe0b5]"
                    />
                    Need GST invoice
                  </label>
                </div>

                {billingForm.needBusinessInvoice ? (
                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                        Billing name
                      </span>
                      <input
                        type="text"
                        value={billingForm.billingName}
                        onChange={(event) =>
                          setBillingForm((current) => ({
                            ...current,
                            billingName: event.target.value,
                          }))
                        }
                        className="w-full rounded-[1.3rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                      {billingErrors.billingName ? (
                        <span className="mt-2 block text-xs text-[#c54b4b]">
                          {billingErrors.billingName}
                        </span>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                        Business name
                      </span>
                      <input
                        type="text"
                        value={billingForm.companyName}
                        onChange={(event) =>
                          setBillingForm((current) => ({
                            ...current,
                            companyName: event.target.value,
                          }))
                        }
                        className="w-full rounded-[1.3rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                      {billingErrors.companyName ? (
                        <span className="mt-2 block text-xs text-[#c54b4b]">
                          {billingErrors.companyName}
                        </span>
                      ) : null}
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                        GSTIN
                      </span>
                      <input
                        type="text"
                        value={billingForm.gstNumber}
                        onChange={(event) =>
                          setBillingForm((current) => ({
                            ...current,
                            gstNumber: event.target.value.toUpperCase(),
                          }))
                        }
                        className="w-full rounded-[1.3rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                      />
                      {billingErrors.gstNumber ? (
                        <span className="mt-2 block text-xs text-[#c54b4b]">
                          {billingErrors.gstNumber}
                        </span>
                      ) : null}
                    </label>

                    {billingForm.useDeliveryAddress ? (
                      <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#f8fbf3] p-4 text-sm text-[#58724f] md:col-span-2">
                        Billing invoice will use your saved delivery address.
                      </div>
                    ) : (
                      <>
                        <label className="block md:col-span-2">
                          <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                            Billing address line 1
                          </span>
                          <input
                            type="text"
                            value={billingForm.line1}
                            onChange={(event) =>
                              setBillingForm((current) => ({
                                ...current,
                                line1: event.target.value,
                              }))
                            }
                            className="w-full rounded-[1.3rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                          />
                          {billingErrors.line1 ? (
                            <span className="mt-2 block text-xs text-[#c54b4b]">
                              {billingErrors.line1}
                            </span>
                          ) : null}
                        </label>

                        <label className="block md:col-span-2">
                          <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                            Billing address line 2
                          </span>
                          <input
                            type="text"
                            value={billingForm.line2}
                            onChange={(event) =>
                              setBillingForm((current) => ({
                                ...current,
                                line2: event.target.value,
                              }))
                            }
                            className="w-full rounded-[1.3rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                            City
                          </span>
                          <input
                            type="text"
                            value={billingForm.city}
                            onChange={(event) =>
                              setBillingForm((current) => ({
                                ...current,
                                city: event.target.value,
                              }))
                            }
                            className="w-full rounded-[1.3rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                          />
                          {billingErrors.city ? (
                            <span className="mt-2 block text-xs text-[#c54b4b]">
                              {billingErrors.city}
                            </span>
                          ) : null}
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                            State
                          </span>
                          <input
                            type="text"
                            value={billingForm.state}
                            onChange={(event) =>
                              setBillingForm((current) => ({
                                ...current,
                                state: event.target.value,
                              }))
                            }
                            className="w-full rounded-[1.3rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                          />
                          {billingErrors.state ? (
                            <span className="mt-2 block text-xs text-[#c54b4b]">
                              {billingErrors.state}
                            </span>
                          ) : null}
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-[#214f14]">
                            Postal code
                          </span>
                          <input
                            type="text"
                            value={billingForm.postalCode}
                            onChange={(event) =>
                              setBillingForm((current) => ({
                                ...current,
                                postalCode: event.target.value,
                              }))
                            }
                            className="w-full rounded-[1.3rem] border border-[#dbe8cd] bg-[#fbfdf8] px-4 py-3 text-sm text-[#163915] outline-none"
                          />
                          {billingErrors.postalCode ? (
                            <span className="mt-2 block text-xs text-[#c54b4b]">
                              {billingErrors.postalCode}
                            </span>
                          ) : null}
                        </label>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[1.4rem] border border-[#dbe8cd] bg-[#f8fbf3] p-4 text-sm text-[#58724f]">
                    Personal checkout will use your account details. Add GST invoice details only
                    when needed for business billing.
                  </div>
                )}
              </section>

              <section className="rounded-[1.8rem] border border-[#dbe8cd] bg-white p-6 shadow-[0_18px_45px_rgba(33,79,20,0.06)] md:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6b8b58]">
                  Add-ons
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                  Optional extras
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#58724f]">
                  Add supporting products or service help directly to this checkout.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {ADD_ONS.map((item) => {
                    const quantity = addOnQuantities[item.id];

                    return (
                      <div
                        key={item.id}
                        className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4"
                      >
                        <p className="text-base font-bold text-[#163915]">{item.name}</p>
                        <p className="mt-2 text-sm leading-6 text-[#58724f]">{item.description}</p>
                        <p className="mt-4 text-sm font-semibold text-[#214f14]">
                          {formatCurrency(item.unitPrice)} / {item.unitLabel}
                        </p>

                        <div className="mt-4 inline-flex items-center gap-4 rounded-full border border-[#d6e6bd] bg-white px-4 py-2 text-sm font-semibold text-[#214f14]">
                          <button
                            type="button"
                            onClick={() => setAddOnQuantity(item.id, quantity - 1)}
                            className="text-lg leading-none"
                            aria-label={`Decrease ${item.name}`}
                          >
                            -
                          </button>
                          <span className="min-w-5 text-center">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setAddOnQuantity(item.id, quantity + 1)}
                            className="text-lg leading-none"
                            aria-label={`Increase ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="overflow-hidden rounded-[2rem] border border-[#1e4215] bg-[#163915] text-white shadow-[0_24px_60px_rgba(33,79,20,0.22)]">
                <div className="border-b border-white/10 px-6 py-5">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#cfe5c8]">
                    Order summary
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                    Checkout total
                  </h2>
                </div>

                <div className="space-y-6 px-6 py-6">
                  <div className="space-y-3 text-sm text-[#dce8ce]">
                    <div className="flex items-center justify-between gap-3">
                      <span>Coverage</span>
                      <span>{quantitySqft} sqft</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Transport</span>
                      <span>{selectedVehicle.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Rate</span>
                      <span>{formatCurrency(selectedVehicle.rate)} / km</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Distance</span>
                      <span>{result ? `${result.dist} km` : "--"}</span>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-white/10 pt-5 text-sm text-[#edf5e1]">
                    <div className="flex items-center justify-between gap-3">
                      <span>Material subtotal</span>
                      <span>{formatCurrency(materialSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Delivery charge</span>
                      <span>{result ? formatCurrency(result.shipping) : "--"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Add-ons</span>
                      <span>{formatCurrency(addOnSubtotal)}</span>
                    </div>
                    {selectedAddOns.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 text-xs text-[#cfe5c8]"
                      >
                        <span>
                          {item.name} x {item.quantity}
                        </span>
                        <span>{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.5rem] bg-white/8 px-5 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#cfe5c8]">
                      Total payable
                    </p>
                    <p className="mt-2 text-4xl font-black tracking-[-0.04em]">
                      {result ? formatCurrency(grandTotal) : "--"}
                    </p>
                    <p className="mt-2 text-sm text-[#dce8ce]">
                      Delivery is calculated from the location you choose above.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleOnlinePayment}
                      disabled={!canPlaceOrder}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#163915] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CreditCard size={17} />
                      {isProcessing ? "Processing..." : "Pay online"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCashOnDelivery}
                      disabled={!canPlaceOrder}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-6 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Wallet size={17} />
                      Place cash on delivery order
                    </button>
                  </div>

                  <div className="space-y-3 border-t border-white/10 pt-5 text-sm text-[#dce8ce]">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#cfe5c8]" />
                      <p>Delivery profile validation runs before order placement.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Truck size={17} className="mt-0.5 shrink-0 text-[#cfe5c8]" />
                      <p>Transport choice is assigned automatically from order coverage.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Store size={17} className="mt-0.5 shrink-0 text-[#cfe5c8]" />
                      <p>Fresh stock is reserved only for real Buy now or cart-backed orders.</p>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
                      "Hello, I need help with my lawn grass checkout.",
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-sm font-semibold text-white"
                  >
                    <MessageSquare size={17} />
                    Need help on WhatsApp
                  </a>

                  {!hasRealOrderContext ? (
                    <div className="rounded-[1.4rem] border border-[#f0ddb0] bg-[#fffaf0] px-4 py-3 text-sm text-[#7a5a11]">
                      This screen is showing a delivery sample. Add lawn grass through Buy now or
                      cart before placing the order.
                    </div>
                  ) : null}

                  {isAuthenticated && !profileReady ? (
                    <div className="rounded-[1.4rem] border border-[#f0ddb0] bg-[#fffaf0] px-4 py-3 text-sm text-[#7a5a11]">
                      Complete your saved phone number and delivery address before placing the
                      order.
                    </div>
                  ) : null}

                  {!isAuthenticated ? (
                    <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-white/5 px-4 py-3 text-sm text-[#dce8ce]">
                      You can calculate delivery now. Sign in only when you are ready to place the
                      order.
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
