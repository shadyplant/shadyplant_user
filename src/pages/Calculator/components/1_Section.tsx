"use client";

import { useCallback, useRef, useState } from "react";
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
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
const GRASS_PRICE_PER_SQFT = 12;

const VEHICLES = [
  { id: "small", name: "Small Pickup", rate: 15, desc: "Up to 500 sqft" },
  { id: "medium", name: "Medium Truck", rate: 25, desc: "Up to 1200 sqft" },
  { id: "heavy", name: "Heavy Loader", rate: 45, desc: "Up to 3000 sqft" },
];

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
    contact: string;
  };
  theme: {
    color: string;
  };
};

export default function GrassCalculator() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPos, setMarkerPos] = useState(WAREHOUSE_LOCATION);
  const [address, setAddress] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | "">("");
  const [formData, setFormData] = useState({
    sqft: "",
    vehicleId: "small",
    date: "",
    whatsapp: "",
    state: "Assam",
  });
  const [result, setResult] = useState<{
    grass: number;
    shipping: number;
    total: number;
    dist: number;
  } | null>(null);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const getRealDistance = useCallback((dest: google.maps.LatLngLiteral) => {
    if (!window.google) return;
    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [WAREHOUSE_LOCATION],
        destinations: [dest],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === "OK" && response?.rows[0].elements[0].distance) {
          const distInKm = response.rows[0].elements[0].distance.value / 1000;
          setDistanceKm(Number(distInKm.toFixed(1)));
        }
      },
    );
  }, []);

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setMarkerPos(newPos);
        getRealDistance(newPos);

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: newPos }, (results) => {
          if (results && results[0]) setAddress(results[0].formatted_address);
        });
      }
    },
    [getRealDistance],
  );

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
      getRealDistance(newPos);
    }
  };

  const calculateFinal = () => {
    const vehicle = VEHICLES.find((v) => v.id === formData.vehicleId);
    const grassCost = Number(formData.sqft) * GRASS_PRICE_PER_SQFT;
    const currentDist = Number(distanceKm) || 0;
    const shippingCost = currentDist * (vehicle?.rate || 0);

    setResult({
      grass: grassCost,
      shipping: shippingCost,
      total: grassCost + shippingCost,
      dist: currentDist,
    });
  };

  const downloadPDF = async () => {
    if (!receiptRef.current) return;

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
  };

  // -------------------------Payment function-----------------------
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!result?.total) return;

    // Load Razorpay
    const res = await loadRazorpay();
    if (!res) {
      alert("Razorpay failed to load");
      return;
    }

    // Create order from your API
    const orderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: result.total,
      }),
    });

    const order = await orderRes.json();

    // Razorpay options
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      name: "Aelorix",
      description: "Grass Delivery Payment",
      order_id: order.id,

      handler: function (response: RazorpaySuccessResponse) {
        console.log("Payment Success:", response);
        alert("Payment Successful ✅");
      },

      prefill: {
        contact: formData.whatsapp,
      },

      theme: {
        color: "#16a34a",
      },
    };

    if (!window.Razorpay) {
      alert("Razorpay is unavailable right now");
      return;
    }

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };
  // -------------------------Payment function-----------------------

  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-sans md:p-8">
      <div className="theme-panel-strong grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[2rem] lg:grid-cols-12">
        <div className="space-y-10 p-6 md:p-12 lg:col-span-7">
          <div>
            <div className="theme-chip mb-4 inline-flex px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
              <Leaf size={14} />
              Live calculator
            </div>
            <h1 className="theme-section-title text-3xl font-semibold">
              Delivery Estimate
            </h1>
            <p className="theme-muted mt-2">
              Northeast India exclusive lawn grass delivery.
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#5a7d55]">
                1. Shipping Destination
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
                        onChange={(e) => setAddress(e.target.value)}
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
                      onLoad={(m) => setMap(m)}
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
                    <p className="font-semibold">Map API Not Connected</p>
                    <p className="mb-3 opacity-90">
                      Please enter the estimated distance manually for now to
                      test the calculator.
                    </p>
                    <div className="relative max-w-xs">
                      <input
                        type="number"
                        placeholder="Distance in KM"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Number(e.target.value))}
                        className="w-full border-b border-amber-300 bg-transparent py-2 outline-none transition-colors focus:border-amber-600"
                      />
                      <span className="absolute right-0 top-2 text-sm text-amber-600/50">
                        KM
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#5a7d55]">
                2. Select Transport
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {VEHICLES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() =>
                      setFormData({ ...formData, vehicleId: v.id })
                    }
                    className={`rounded-[1.5rem] border p-4 text-left transition-all ${
                      formData.vehicleId === v.id
                        ? "border-[#214f14] bg-[linear-gradient(135deg,#173d12_0%,#2b6b1f_100%)] text-white shadow-[0_18px_35px_rgba(33,79,20,0.25)]"
                        : "theme-panel text-zinc-700 hover:border-[#98c25a]"
                    }`}
                  >
                    <Truck
                      size={20}
                      className={
                        formData.vehicleId === v.id
                          ? "text-white"
                          : "text-zinc-400"
                      }
                    />
                    <p className="mt-3 text-sm font-semibold">{v.name}</p>
                    <div
                      className={`mt-1 flex items-center justify-between ${
                        formData.vehicleId === v.id
                          ? "text-zinc-300"
                          : "text-zinc-500"
                      }`}
                    >
                      <span className="text-[11px] font-medium tracking-wide">
                        INR {v.rate}/KM
                      </span>
                      <span className="text-[10px]">{v.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#5a7d55]">
                3. Order Details
              </label>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="relative">
                  <Ruler
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                    size={18}
                  />
                  <input
                    type="number"
                    placeholder="Quantity (Sq Ft)"
                    value={formData.sqft}
                    onChange={(e) =>
                      setFormData({ ...formData, sqft: e.target.value })
                    }
                    className="theme-input w-full rounded-2xl py-3 pl-10 pr-28"
                  />
                  <div className="absolute right-3 top-3 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700">
                    INR {GRASS_PRICE_PER_SQFT} / SQFT
                  </div>
                </div>

                <div className="relative">
                  <Calendar
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                    size={18}
                  />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="theme-input w-full rounded-2xl py-3 pl-10 pr-4 text-zinc-700"
                  />
                </div>

                <div className="relative sm:col-span-2">
                  <MessageSquare
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                    size={18}
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp Number (For Estimate)"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    className="theme-input w-full rounded-2xl py-3 pl-10 pr-4"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={calculateFinal}
              disabled={!formData.sqft || distanceKm === ""}
              className="theme-button w-full rounded-2xl py-4 font-semibold transition-all active:scale-[0.98] disabled:bg-zinc-300 disabled:shadow-none"
            >
              Calculate Final Cost
            </button>
          </div>
        </div>

        <div className="relative border-t border-[#d8ebbf] bg-[linear-gradient(180deg,rgba(233,248,208,0.88),rgba(248,252,239,0.72))] p-6 md:p-12 lg:col-span-5 lg:border-l lg:border-t-0">
          <div className="sticky top-12">
            <h2 className="mb-8 text-lg font-semibold text-zinc-900">
              Calculation Summary
            </h2>

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
                        Official Estimate
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
                      <span className="font-medium text-zinc-900">
                        {result.dist} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 text-sm">
                      <span className="text-zinc-500">Selected Vehicle</span>
                      <span className="font-medium capitalize text-zinc-900">
                        {
                          VEHICLES.find((v) => v.id === formData.vehicleId)
                            ?.name
                        }
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
                        Estimates are calculated from our Guwahati central
                        nursery. Actual rates may vary slightly due to road
                        terrain constraints.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {result && (
                      <button
                        onClick={handlePayment}
                        className="w-full rounded-2xl bg-emerald-600 py-4 font-semibold text-white"
                      >
                        Pay ₹ {result.total.toLocaleString()}
                      </button>
                    )}
                    <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 font-semibold text-white shadow-sm transition-colors hover:bg-[#20bd5a]">
                      <MessageSquare size={18} /> Send Quote to WhatsApp
                    </button>

                    <button
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
                    Enter your delivery address and quantity to generate a
                    precise estimate.
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
