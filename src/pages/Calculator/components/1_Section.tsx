"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Ruler,
  MessageSquare,
  MapPin,
  Calendar,
  AlertCircle,
  Download,
  Leaf,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  hasCompleteDeliveryAddress,
  validateCheckoutForm,
} from "@/lib/validation";

const LIBRARIES: "places"[] = ["places"];
const WAREHOUSE_LOCATION = {
  lat: 26.2457163,
  lng: 90.9172911,
};
const GRASS_PRICE_PER_SQFT = 12;

const VEHICLES = [
  { id: "small", name: "Small Pickup", rate: 15, desc: "Up to 500 sqft" },
  { id: "medium", name: "Medium Truck", rate: 25, desc: "Up to 1200 sqft" },
  { id: "heavy", name: "Heavy Loader", rate: 45, desc: "Up to 3000 sqft" },
] as const;

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

function getVehicle(vehicleId: string) {
  return VEHICLES.find((vehicle) => vehicle.id === vehicleId) || VEHICLES[0];
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function GrassCalculator() {
  const router = useRouter();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { fetchWithAuth, isAuthenticated, user } = useAuth();
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPos, setMarkerPos] = useState(WAREHOUSE_LOCATION);
  const [address, setAddress] = useState("");
  const [formData, setFormData] = useState({
    sqft: "",
    vehicleId: "small",
    date: "",
    whatsapp: user?.phoneNumber || "",
  });
  const [result, setResult] = useState<CheckoutState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.phoneNumber) {
      setFormData((current) =>
        current.whatsapp
          ? current
          : {
              ...current,
              whatsapp: user.phoneNumber,
            },
      );
    }
  }, [user?.phoneNumber]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPos(newPos);

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: newPos }, (results) => {
        if (results && results[0]) {
          setAddress(results[0].formatted_address);
        }
      });
    }
  }, []);

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const newPos = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setMarkerPos(newPos);
      setAddress(place.formatted_address || "");
      map?.panTo(newPos);
    }
  };

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

  async function calculateFinal() {
    setStatusMessage(null);
    const validation = validateCheckoutForm({
      sqft: formData.sqft,
      deliveryDate: formData.date,
      whatsapp: formData.whatsapp,
    });
    setErrors(validation.errors);

    if (!validation.data) {
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
        return;
      }

      const vehicle = getVehicle(formData.vehicleId);
      const grassCost = validation.data.quantitySqft * GRASS_PRICE_PER_SQFT;
      const shippingCost = Math.round(deliveryQuote.distance_km * vehicle.rate);

      setResult({
        grass: grassCost,
        shipping: shippingCost,
        total: grassCost + shippingCost,
        dist: Number(deliveryQuote.distance_km.toFixed(1)),
        zone: deliveryQuote.zone || "Standard",
        warning: deliveryQuote.warning || null,
      });

      if (deliveryQuote.warning) {
        setStatusMessage(deliveryQuote.warning);
      }
    } catch (error) {
      setResult(null);
      setStatusMessage(getErrorMessage(error, "Unable to calculate the delivery estimate."));
    } finally {
      setIsCalculating(false);
    }
  }

  function buildOrderPayload(paymentMethod: "cash_on_delivery" | "online_payment") {
    const validation = validateCheckoutForm({
      sqft: formData.sqft,
      deliveryDate: formData.date,
      whatsapp: formData.whatsapp,
    });

    if (!validation.data || !user || !result) {
      throw new Error("Complete the estimate before continuing.");
    }

    if (!hasCompleteDeliveryAddress(user.deliveryAddress)) {
      throw new Error("Complete your delivery address in profile before checkout.");
    }

    return {
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || validation.data.whatsapp,
      quantitySqft: validation.data.quantitySqft,
      distanceKm: result.dist,
      vehicleId: formData.vehicleId,
      deliveryDate: validation.data.deliveryDate,
      paymentMethod,
      deliveryAddress: user.deliveryAddress,
      recommendedItems: [],
    };
  }

  async function downloadPDF() {
    if (!receiptRef.current) {
      return;
    }

    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Lawn_Grass_Estimate_${new Date().getTime()}.pdf`);
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
      router.push("/order");
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Unable to place the COD order."));
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
                  "Payment was captured, but order finalization is still pending.",
                ),
              );
            } finally {
              setIsProcessing(false);
            }
          })();
        },
        theme: {
          color: "#16a34a",
        },
      });

      razorpay.open();
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Unable to start online payment."));
      setIsProcessing(false);
    }
  }

  const profileReady = Boolean(
    user &&
      user.fullName &&
      (user.phoneNumber || formData.whatsapp) &&
      hasCompleteDeliveryAddress(user.deliveryAddress),
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-sans md:p-8">
      <div className="theme-panel-strong grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[2rem] lg:grid-cols-12">
        <div className="space-y-10 p-6 md:p-12 lg:col-span-7">
          <div>
            <div className="theme-chip mb-4 inline-flex px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
              <Leaf size={14} />
              Assisted checkout
            </div>
            <h1 className="theme-section-title text-3xl font-semibold">
              Lawn Grass Checkout
            </h1>
            <p className="theme-muted mt-2">
              Confirm delivery, pricing, and payment in one guided checkout flow for lawn grass orders.
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="rounded-[1.5rem] border border-[#dbe8cd] bg-[#f8fbf3] p-5 text-sm text-[#58724f]">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#214f14]" />
                <div>
                  <p className="font-semibold text-[#163915]">
                    Sign in before placing an order
                  </p>
                  <p className="mt-2">
                    Review pricing here first, then continue with secure order placement using
                    your authenticated delivery profile.
                  </p>
                  <Link
                    href="/auth?next=/checkout"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#214f14] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Sign in to continue
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          ) : !profileReady ? (
            <div className="rounded-[1.5rem] border border-[#f4dfae] bg-[#fffaf0] p-5 text-sm text-[#7a5a11]">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#5f4307]">
                    Complete your delivery profile before checkout
                  </p>
                  <p className="mt-2">
                    Add a phone number and full delivery address in your profile so the backend
                    can create orders correctly.
                  </p>
                  <Link
                    href="/profile?section=addresses"
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e9cd8d] bg-white px-4 py-2 text-sm font-semibold text-[#5f4307]"
                  >
                    Update profile
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          ) : user ? (
            <div className="rounded-[1.5rem] border border-[#dbe8cd] bg-[#f8fbf3] p-5 text-sm text-[#58724f]">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#214f14]" />
                <div>
                  <p className="font-semibold text-[#163915]">Checkout profile ready</p>
                  <p className="mt-2">
                    Orders will use {user.fullName}, {user.phoneNumber || formData.whatsapp},
                    and your saved address in profile.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#5a7d55]">
                1. Delivery Destination
              </label>

              {isLoaded && !loadError ? (
                <div className="space-y-4">
                  <Autocomplete
                    onLoad={(ref) => (autocompleteRef.current = ref)}
                    onPlaceChanged={onPlaceChanged}
                  >
                    <div className="relative">
                      <MapPin
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                        size={20}
                      />
                      <input
                        type="text"
                        placeholder="Search area or pin on map..."
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        className="theme-input w-full rounded-2xl py-3 pl-12 pr-4 text-lg"
                      />
                    </div>
                  </Autocomplete>

                  <div className="theme-panel h-56 w-full overflow-hidden rounded-[1.5rem] p-2">
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "100%" }}
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
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-amber-800">
                  <AlertCircle size={20} className="mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold">Map API not connected</p>
                    <p className="opacity-90">
                      Delivery serviceability and live checkout require the map location picker.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#5a7d55]">
                2. Select Transport
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {VEHICLES.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({ ...current, vehicleId: vehicle.id }))
                    }
                    className={`rounded-[1.5rem] border p-4 text-left transition-all ${
                      formData.vehicleId === vehicle.id
                        ? "border-[#214f14] bg-[linear-gradient(135deg,#173d12_0%,#2b6b1f_100%)] text-white shadow-[0_18px_35px_rgba(33,79,20,0.25)]"
                        : "theme-panel text-zinc-700 hover:border-[#98c25a]"
                    }`}
                  >
                    <Truck
                      size={20}
                      className={
                        formData.vehicleId === vehicle.id ? "text-white" : "text-zinc-400"
                      }
                    />
                    <p className="mt-3 text-sm font-semibold">{vehicle.name}</p>
                    <div
                      className={`mt-1 flex items-center justify-between ${
                        formData.vehicleId === vehicle.id
                          ? "text-zinc-300"
                          : "text-zinc-500"
                      }`}
                    >
                      <span className="text-[11px] font-medium tracking-wide">
                        INR {vehicle.rate}/KM
                      </span>
                      <span className="text-[10px]">{vehicle.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#5a7d55]">
                3. Checkout Details
              </label>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <div className="relative">
                    <Ruler
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                      size={18}
                    />
                    <input
                      type="number"
                      placeholder="Quantity (Sq Ft)"
                      value={formData.sqft}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          sqft: event.target.value,
                        }))
                      }
                      className="theme-input w-full rounded-2xl py-3 pl-10 pr-28"
                    />
                    <div className="absolute right-3 top-3 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700">
                      INR {GRASS_PRICE_PER_SQFT} / SQFT
                    </div>
                  </div>
                  {errors.sqft ? (
                    <p className="mt-2 text-xs text-[#c54b4b]">{errors.sqft}</p>
                  ) : null}
                </div>

                <div>
                  <div className="relative">
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                      size={18}
                    />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          date: event.target.value,
                        }))
                      }
                      className="theme-input w-full rounded-2xl py-3 pl-10 pr-4 text-zinc-700"
                    />
                  </div>
                  {errors.deliveryDate ? (
                    <p className="mt-2 text-xs text-[#c54b4b]">{errors.deliveryDate}</p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <div className="relative">
                    <MessageSquare
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                      size={18}
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp Number"
                      value={formData.whatsapp}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          whatsapp: event.target.value,
                        }))
                      }
                      className="theme-input w-full rounded-2xl py-3 pl-10 pr-4"
                    />
                  </div>
                  {errors.whatsapp ? (
                    <p className="mt-2 text-xs text-[#c54b4b]">{errors.whatsapp}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={calculateFinal}
              disabled={isCalculating}
              className="theme-button w-full rounded-2xl py-4 font-semibold transition-all active:scale-[0.98] disabled:bg-zinc-300 disabled:shadow-none"
            >
              {isCalculating ? "Calculating..." : "Review Checkout Total"}
            </button>
          </div>
        </div>

        <div className="relative border-t border-[#d8ebbf] bg-[linear-gradient(180deg,rgba(233,248,208,0.88),rgba(248,252,239,0.72))] p-6 md:p-12 lg:col-span-5 lg:border-l lg:border-t-0">
          <div className="sticky top-12">
            <h2 className="mb-8 text-lg font-semibold text-zinc-900">
              Checkout Summary
            </h2>

            {statusMessage ? (
              <div className="mb-4 rounded-[1.4rem] border border-[#dbe8cd] bg-white p-4 text-sm text-[#58724f]">
                {statusMessage}
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div
                    ref={receiptRef}
                    className="theme-panel-strong space-y-4 rounded-[1.75rem] p-6"
                  >
                    <div className="mb-2 border-b border-zinc-100 pb-4 text-center">
                      <h3 className="text-lg font-bold text-zinc-900">
                        Order Estimate
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Date: {formData.date || "To be confirmed"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">
                        Premium Lawn Grass{" "}
                        <span className="ml-1 rounded bg-zinc-100 px-1 text-[10px] text-zinc-500">
                          (INR {GRASS_PRICE_PER_SQFT}/sqft)
                        </span>
                      </span>
                      <span className="font-medium text-zinc-900">
                        {formData.sqft} sqft
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Delivery Distance</span>
                      <span className="font-medium text-zinc-900">{result.dist} km</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Service zone</span>
                      <span className="font-medium text-zinc-900">{result.zone}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 text-sm">
                      <span className="text-zinc-500">Selected Vehicle</span>
                      <span className="font-medium capitalize text-zinc-900">
                        {getVehicle(formData.vehicleId).name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-zinc-600">Material Cost</span>
                      <span className="font-semibold text-zinc-900">
                        INR {result.grass.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Transport Cost</span>
                      <span className="font-semibold text-zinc-900">
                        INR {result.shipping.toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-4 border-t border-zinc-200 pt-4">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                        Total Estimated Amount
                      </p>
                      <p className="text-4xl font-bold tracking-tight text-emerald-600">
                        INR {result.total.toLocaleString()}
                      </p>
                    </div>

                    <div className="pt-6">
                      <p className="text-center text-[10px] leading-relaxed text-zinc-400">
                        Pricing uses the live delivery API and your selected transport rate before
                        final order confirmation.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={handleOnlinePayment}
                      disabled={isProcessing || !profileReady}
                      className="w-full rounded-2xl bg-emerald-600 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      {isProcessing ? "Processing..." : `Pay INR ${result.total.toLocaleString()}`}
                    </button>

                    <button
                      type="button"
                      onClick={handleCashOnDelivery}
                      disabled={isProcessing || !profileReady}
                      className="w-full rounded-2xl border border-[#214f14] bg-white py-4 font-semibold text-[#214f14] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Place Cash on Delivery Order
                    </button>

                    {formData.whatsapp ? (
                      <a
                        href={`https://wa.me/${formData.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `I need help with my lawn grass checkout for ${formData.sqft || "0"} sqft at ${address || "the selected location"}.`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 font-semibold text-white shadow-sm transition-colors hover:bg-[#20bd5a]"
                      >
                        <MessageSquare size={18} /> Share checkout details on WhatsApp
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={downloadPDF}
                      className="theme-panel flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-zinc-700 transition-colors"
                    >
                      <Download size={18} /> Download PDF Receipt
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="theme-panel flex h-64 flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center text-zinc-400"
                >
                  <MapPin size={32} className="mb-3 text-zinc-300" />
                  <p className="font-medium text-zinc-500">Awaiting Details</p>
                  <p className="mt-1 text-sm">
                    Enter your delivery location and quantity to prepare your checkout total.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
