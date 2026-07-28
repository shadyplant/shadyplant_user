"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  Circle,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useAuth } from "@/components/auth/AuthProvider";
import type { DeliveryAddress } from "@/lib/validation";
import {
  ChevronDown,
  ChevronRight,
  LocateFixed,
  MapPin,
  Search,
  X,
} from "lucide-react";
import {
  buildPersistedDeliveryAddress,
  formatDeliveryAddress,
  sanitizeFormattedDeliveryAddress,
} from "@/lib/deliveryAddress";
import { writeCheckoutDraft } from "@/lib/checkoutSession";
import { requestAppLocation } from "@/lib/nativeShare";
import {
  checkShippingServiceability,
  type ShippingServiceabilityResponse,
} from "@/lib/shippingServiceability";

const DELIVERY_ADDRESS_EVENT = "delivery-address-updated";

const LIBRARIES: "places"[] = ["places"];
const DEFAULT_LOCATION = {
  lat: Number(process.env.NEXT_PUBLIC_DELIVERY_ORIGIN_LAT || 25.5138),
  lng: Number(process.env.NEXT_PUBLIC_DELIVERY_ORIGIN_LNG || 90.2142),
};

const DEFAULT_SERVICE_ZONE_STYLES = {
  fillColor: "#16a34a",
  strokeColor: "#166534",
};

const DEFAULT_RESTRICTION_ZONE_STYLES = {
  fillColor: "#dc2626",
  strokeColor: "#991b1b",
};

const EMPTY_SHIPPING_QUERY = {
  countryCode: "",
  stateCode: "",
  pin: "",
};

type Position = {
  lat: number;
  lng: number;
};

function getAddressPart(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string,
) {
  return (
    components?.find((component) => component.types.includes(type))
      ?.long_name || ""
  );
}

function getAddressComponent(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string,
) {
  return (
    components?.find((component) => component.types.includes(type)) || null
  );
}

function buildDeliveryAddress(
  formattedAddress: string,
  components: google.maps.GeocoderAddressComponent[] | undefined,
): DeliveryAddress {
  const sanitizedFormattedAddress =
    sanitizeFormattedDeliveryAddress(formattedAddress);
  const streetNumber = getAddressPart(components, "street_number");
  const route = getAddressPart(components, "route");
  const locality =
    getAddressPart(components, "locality") ||
    getAddressPart(components, "postal_town") ||
    getAddressPart(components, "administrative_area_level_2");
  const postalCode = getAddressPart(components, "postal_code");
  const state = getAddressPart(components, "administrative_area_level_1");
  const sublocality =
    getAddressPart(components, "sublocality_level_1") ||
    getAddressPart(components, "sublocality") ||
    getAddressPart(components, "neighborhood");
  const line1 = [streetNumber, route].filter(Boolean).join(" ").trim();
  const fallbackLine1 =
    line1 || sublocality || locality || state || sanitizedFormattedAddress;

  return {
    formattedAddress: sanitizedFormattedAddress,
    line1: fallbackLine1.trim(),
    line2: sublocality,
    city: locality,
    state,
    postalCode,
    landmark: "",
    notes: "",
  };
}

function buildShippingQuery(
  components: google.maps.GeocoderAddressComponent[] | undefined,
) {
  const country = getAddressComponent(components, "country");
  const state =
    getAddressComponent(components, "administrative_area_level_1") ||
    getAddressComponent(components, "administrative_area_level_2");
  const pin = getAddressPart(components, "postal_code");

  return {
    countryCode: String(country?.short_name || "")
      .trim()
      .toUpperCase(),
    stateCode: String(state?.short_name || state?.long_name || "")
      .trim()
      .toUpperCase(),
    pin: String(pin || "").trim(),
  };
}

function getMissingShippingReason({
  countryCode,
  stateCode,
}: typeof EMPTY_SHIPPING_QUERY) {
  if (!countryCode) {
    return "Non-service zone: country was not found for this location.";
  }

  if (!stateCode) {
    return "Non-service zone: state was not found for this location.";
  }

  return "";
}

function HomeLocationIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.2848 18.9935C12.1567 19.0875 12.0373 19.1728 11.9282 19.2493C11.8118 19.1721 11.6827 19.0833 11.5427 18.9832C10.8826 18.5109 10.0265 17.8176 9.18338 16.9529C7.45402 15.1792 6 12.9151 6 10.5C6 7.18629 8.68629 4.5 12 4.5C15.3137 4.5 18 7.18629 18 10.5C18 12.8892 16.4819 15.1468 14.6893 16.9393C13.8196 17.8091 12.9444 18.5099 12.2848 18.9935ZM19.5 10.5C19.5 16.5 12 21 12 21C11.625 21 4.5 16.5 4.5 10.5C4.5 6.35786 7.85786 3 12 3C16.1421 3 19.5 6.35786 19.5 10.5ZM13.5 10.5C13.5 11.3284 12.8284 12 12 12C11.1716 12 10.5 11.3284 10.5 10.5C10.5 9.67157 11.1716 9 12 9C12.8284 9 13.5 9.67157 13.5 10.5ZM15 10.5C15 12.1569 13.6569 13.5 12 13.5C10.3431 13.5 9 12.1569 9 10.5C9 8.84315 10.3431 7.5 12 7.5C13.6569 7.5 15 8.84315 15 10.5Z"
        fill="#080341"
      />
    </svg>
  );
}

function emitDeliveryAddressUpdate(payload: {
  address: string;
  position?: Position | null;
  deliveryAddress?: DeliveryAddress | null;
}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(DELIVERY_ADDRESS_EVENT, {
      detail: {
        address: payload.address,
        position: payload.position || null,
        deliveryAddress: payload.deliveryAddress || null,
      },
    }),
  );
}

type ProductDeliveryAddressPickerProps = {
  variant?:
    | "field"
    | "home-strip"
    | "cart-select"
    | "checkout-card"
    | "header-inline";
  initialAddress?: string;
  initialPosition?: Position | null;
  autoResolveInitialAddress?: boolean;
  emptyLabel?: string;
  persistToProfile?: boolean;
  onAddressChange?: (
    address: string,
    position?: Position,
    deliveryAddress?: DeliveryAddress,
  ) => void;
  onDone?: (
    address: string,
    position: Position,
    deliveryAddress: DeliveryAddress,
  ) => void;
};

export default function ProductDeliveryAddressPicker({
  variant = "field",
  initialAddress,
  initialPosition = null,
  autoResolveInitialAddress = false,
  emptyLabel = "Enter your location",
  persistToProfile,
  onAddressChange,
  onDone,
}: ProductDeliveryAddressPickerProps) {
  const { updateProfile, user } = useAuth();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });
  const effectiveInitialAddress =
    initialAddress !== undefined
      ? initialAddress
      : formatDeliveryAddress(user?.deliveryAddress);
  const hasInitialPosition =
    Number.isFinite(Number(initialPosition?.lat)) &&
    Number.isFinite(Number(initialPosition?.lng));
  // Is input field on focus state
  const [isAddressFocused, setIsAddressFocused] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState(effectiveInitialAddress);
  const [markerPos, setMarkerPos] = useState<Position>(() =>
    hasInitialPosition && initialPosition ? initialPosition : DEFAULT_LOCATION,
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [shippingServiceability, setShippingServiceability] =
    useState<ShippingServiceabilityResponse | null>(null);
  const [isCheckingShipping, setIsCheckingShipping] = useState(false);
  const [shippingQuery, setShippingQuery] = useState(EMPTY_SHIPPING_QUERY);
  const [showServiceOverlay, setShowServiceOverlay] = useState(true);
  const [showRestrictionOverlay, setShowRestrictionOverlay] = useState(true);
  const [resolvedDeliveryAddress, setResolvedDeliveryAddress] =
    useState<DeliveryAddress>(() =>
      buildDeliveryAddress(effectiveInitialAddress, undefined),
    );
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const lastAutoResolvedAddressRef = useRef("");
  const hasAddress = address.trim().length > 0;
  const canCommitDeliveryAddress = Boolean(
    hasAddress && shippingServiceability?.serviceable && !isCheckingShipping,
  );
  const shouldShowServiceOverlay = Boolean(
    shippingServiceability?.serviceable && showServiceOverlay,
  );
  const shouldShowRestrictionOverlay = Boolean(
    shippingServiceability &&
    !shippingServiceability.serviceable &&
    showRestrictionOverlay,
  );
  const shouldPersistToProfile =
    persistToProfile ??
    (variant === "field" ||
      variant === "home-strip" ||
      variant === "header-inline");

  useEffect(() => {
    const nextAddress = effectiveInitialAddress;
    queueMicrotask(() => {
      setAddress(nextAddress);
      setResolvedDeliveryAddress(buildDeliveryAddress(nextAddress, undefined));
    });
  }, [effectiveInitialAddress]);

  useEffect(() => {
    const hasAnyShippingInput = Boolean(
      shippingQuery.countryCode || shippingQuery.stateCode || shippingQuery.pin,
    );
    const missingReason = getMissingShippingReason(shippingQuery);

    if (missingReason) {
      setIsCheckingShipping(false);
      setShippingServiceability(
        hasAnyShippingInput
          ? {
              serviceable: false,
              reason: missingReason,
              matchedRule: null,
            }
          : null,
      );
      return;
    }

    let cancelled = false;

    async function loadShippingServiceability() {
      setIsCheckingShipping(true);

      try {
        const response = await checkShippingServiceability(shippingQuery);
        if (!cancelled) {
          setShippingServiceability(response);
        }
      } catch {
        if (!cancelled) {
          setShippingServiceability({
            serviceable: false,
            reason: "Unable to verify serviceability for this location.",
            matchedRule: null,
          });
        }
      } finally {
        if (!cancelled) {
          setIsCheckingShipping(false);
        }
      }
    }

    void loadShippingServiceability();

    return () => {
      cancelled = true;
    };
  }, [shippingQuery]);

  const applyLocation = useCallback(
    (
      nextPosition: Position,
      nextAddress: string,
      nextDeliveryAddress?: DeliveryAddress,
      nextShippingQuery?: {
        countryCode: string;
        stateCode: string;
        pin: string;
      },
    ) => {
      const normalizedDeliveryAddress =
        nextDeliveryAddress || buildDeliveryAddress(nextAddress, undefined);
      const displayAddress =
        formatDeliveryAddress(normalizedDeliveryAddress) ||
        sanitizeFormattedDeliveryAddress(nextAddress);
      setMarkerPos(nextPosition);
      setAddress(displayAddress);
      setResolvedDeliveryAddress(normalizedDeliveryAddress);
      if (nextShippingQuery) {
        setShippingServiceability(null);
        setShippingQuery(nextShippingQuery);
      } else {
        setShippingServiceability(null);
        setShippingQuery(EMPTY_SHIPPING_QUERY);
      }
      mapRef.current?.panTo(nextPosition);
      setStatusMessage("Checking delivery service area...");
    },
    [],
  );

  useEffect(() => {
    const normalizedInitialAddress = effectiveInitialAddress.trim();

    if (
      !autoResolveInitialAddress ||
      !isLoaded ||
      !normalizedInitialAddress ||
      hasInitialPosition ||
      lastAutoResolvedAddressRef.current === normalizedInitialAddress
    ) {
      return;
    }

    lastAutoResolvedAddressRef.current = normalizedInitialAddress;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: normalizedInitialAddress },
      (results, status) => {
        if (status !== "OK" || !results?.[0]?.geometry?.location) {
          setStatusMessage(
            "Confirm this address on the map to calculate delivery charges.",
          );
          return;
        }

        const nextPosition = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        const nextAddress =
          results[0].formatted_address || normalizedInitialAddress;
        const nextDeliveryAddress = buildDeliveryAddress(
          nextAddress,
          results[0].address_components,
        );
        const nextShippingQuery = buildShippingQuery(
          results[0].address_components,
        );

        applyLocation(
          nextPosition,
          nextAddress,
          nextDeliveryAddress,
          nextShippingQuery,
        );
        setStatusMessage("Delivery location found. Checking service area...");
      },
    );
  }, [
    applyLocation,
    autoResolveInitialAddress,
    effectiveInitialAddress,
    hasInitialPosition,
    isLoaded,
  ]);

  function reverseGeocode(nextPosition: Position, fallbackAddress = "") {
    if (!isLoaded) {
      applyLocation(nextPosition, fallbackAddress || address);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: nextPosition }, (results, status) => {
      const resolvedAddress =
        status === "OK" && results?.[0]?.formatted_address
          ? results[0].formatted_address
          : fallbackAddress || address;
      const nextDeliveryAddress = buildDeliveryAddress(
        resolvedAddress,
        results?.[0]?.address_components,
      );
      const nextShippingQuery = buildShippingQuery(
        results?.[0]?.address_components,
      );

      applyLocation(
        nextPosition,
        resolvedAddress,
        nextDeliveryAddress,
        nextShippingQuery,
      );
    });
  }

  function onMapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng) {
      return;
    }

    reverseGeocode({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
  }

  function onPlaceChanged() {
    const place = autocompleteRef.current?.getPlace();

    if (!place?.geometry?.location) {
      return;
    }

    applyLocation(
      {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      },
      place.formatted_address || place.name || address,
      buildDeliveryAddress(
        place.formatted_address || place.name || address,
        place.address_components,
      ),
      buildShippingQuery(place.address_components),
    );
  }

  function useCurrentLocation() {
    setIsLocating(true);
    setStatusMessage("Fetching your current location...");

    requestAppLocation(
      (location) => {
        setIsLocating(false);
        reverseGeocode({
          lat: location.latitude,
          lng: location.longitude,
        });
      },
      (error) => {
        setIsLocating(false);
        setStatusMessage(
          error === "native_bridge_unavailable"
            ? "Location access is not available on this browser."
            : "Allow location permission or search manually.",
        );
      },
    );
  }

  function clearAddress() {
    setAddress("");
    const clearedDeliveryAddress = buildDeliveryAddress("", undefined);
    setResolvedDeliveryAddress(clearedDeliveryAddress);
    setShippingServiceability(null);
    setShippingQuery(EMPTY_SHIPPING_QUERY);
    onAddressChange?.("", undefined, clearedDeliveryAddress);
    emitDeliveryAddressUpdate({
      address: "",
      position: null,
      deliveryAddress: clearedDeliveryAddress,
    });
    writeCheckoutDraft({
      deliveryAddress: "",
      deliveryAddressDetails: null,
      deliveryPosition: null,
    });
    setStatusMessage("");
    addressInputRef.current?.focus();
  }

  async function persistSelectionToProfile(
    nextDeliveryAddress: DeliveryAddress,
  ) {
    if (!shouldPersistToProfile || !user) {
      return;
    }

    setIsSavingProfile(true);
    setStatusMessage("Saving delivery address...");

    try {
      await updateProfile({
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        deliveryAddress: buildPersistedDeliveryAddress(nextDeliveryAddress),
      });
      setStatusMessage("Delivery address saved to your profile.");
    } catch {
      setStatusMessage("Selected location was not saved to your profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  const trigger =
    variant === "cart-select" ? (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-[38px] w-full items-center gap-2 bg-white px-3 text-left text-sm text-[#111827]"
      >
        <MapPin size={16} className="shrink-0 text-[#1b3151]" />
        <span className="min-w-0 flex-1 truncate">{address || emptyLabel}</span>
        <ChevronDown size={16} className="shrink-0 text-[#111827]" />
      </button>
    ) : variant === "header-inline" ? (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden items-center gap-2 border-b-1 border-[#cccccc] px-3 py-2 text-sm text-[#233d1d] transition hover:bg-gray-100 lg:inline-flex"
      >
        <MapPin size={16} className="shrink-0 text-[#214f14]" />
        <span className="max-w-[170px] truncate">{address || emptyLabel}</span>
      </button>
    ) : variant === "home-strip" ? (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between gap-3 rounded-[0.5rem] border border-[#e4eadb] bg-white px-2 py-1 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)] transition hover:border-[#cfd8c3] hover:bg-[#fbfdf8]"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          <HomeLocationIcon />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold leading-5 text-[#171410]">
            {address ? "Your location" : "Set location"}
          </span>
          <span className="mt-0.5 block truncate text-[10px] leading-4 text-[#7a7a7a]">
            {address || emptyLabel}
          </span>
        </span>

        <ChevronRight size={16} className="shrink-0 text-[#9a9a9a]" />
      </button>
    ) : variant === "checkout-card" ? (
      <div className="flex items-center gap-3 rounded-[0.5rem] p-0">
        <div className="min-w-0 flex-1">
          {/* <p className="mb-1 text-sm font-semibold ">Delivery To:</p> */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="block w-full truncate text-left text-xs leading-tight text-[#111111]"
          >
            {address || emptyLabel}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#3B5E2B] transition hover:bg-[#F7F8F4]"
        >
          <LocateFixed size={18} />
        </button>
      </div>
    ) : hasAddress ? (
      <section className="mt-5">
        <h2 className="text-sm font-semibold text-gray-700 md:text-sm">
          Delivery Details
        </h2>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-2 flex min-h-[50px] w-full items-center gap-3 rounded-[10px] border border-[#d5d5d5] bg-white px-3.5 py-3 text-left"
          aria-label="Change delivery location"
        >
          <MapPin size={18} className="shrink-0 text-[#5a5a5a]" />
          <span className="min-w-0 truncate text-[12px] font-medium text-[#303030] md:text-[13px]">
            {address}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-1.5 block w-full pr-1 text-right text-[11px] font-medium text-[#207958] md:text-xs"
        >
          Change your location.
        </button>
      </section>
    ) : (
      <section className="mt-5">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex min-h-[48px] flex-1 items-center gap-3 rounded-[8px] border border-[#d9d9d9] bg-white px-3.5 text-left"
            aria-label="Choose delivery location"
          >
            <MapPin size={18} className="shrink-0 text-[#6f6f6f]" />
            <span className="min-w-0 truncate text-[12px] font-medium text-[#9a9a9a] md:text-[13px]">
              Pin your location..
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-12 min-w-[100px] items-center justify-center rounded-[6px] bg-[#207958] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#18664a]"
          >
            Check
          </button>
        </div>
        <p className="mt-2 max-w-[290px] text-[11px] leading-4 text-[#5e5e5e] md:text-xs">
          Drop your location pin for faster, more accurate quick delivery.
        </p>
      </section>
    );

  return (
    <>
      {trigger}

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:px-6 sm:py-6">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close location picker"
          />

          <section className="relative flex h-[100dvh] w-full max-w-none flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#ececec] px-5 py-4">
              <div>
                <h2 className="mt-1 text-lg font-bold text-[#171410]">
                  Search or pin location
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-10 cursor-pointer flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-neutral-50"
                aria-label="Close sign in prompt"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {isLoaded && !loadError ? (
                <>
                  <Autocomplete
                    onLoad={(ref) => {
                      autocompleteRef.current = ref;
                    }}
                    onPlaceChanged={onPlaceChanged}
                  >
                    <div className="relative">
                      <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={17}
                      />

                      <input
                        ref={addressInputRef}
                        type="text"
                        value={address}
                        onFocus={() => setIsAddressFocused(true)}
                        onBlur={() => setIsAddressFocused(false)}
                        onChange={(event) => {
                          const nextAddress = event.target.value;
                          setAddress(nextAddress);
                          const nextDeliveryAddress = buildDeliveryAddress(
                            nextAddress,
                            undefined,
                          );
                          setResolvedDeliveryAddress(nextDeliveryAddress);
                          setShippingServiceability(null);
                          setShippingQuery({
                            ...EMPTY_SHIPPING_QUERY,
                          });
                          setStatusMessage("");
                        }}
                        placeholder="Type address, locality, or landmark"
                        className="h-12 w-full rounded-xl border border-gray-300 pl-11 pr-24 text-sm text-gray-500 outline-none transition focus:border-gray-500"
                      />

                      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
                        {hasAddress && isAddressFocused ? (
                          <button
                            type="button"
                            onClick={clearAddress}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
                            aria-label="Clear address"
                          >
                            <X size={16} />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={useCurrentLocation}
                          disabled={isLocating}
                          aria-label="Use current location"
                          title={
                            isLocating
                              ? "Fetching current location..."
                              : "Use current location"
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[#214f14] transition hover:bg-gray-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <LocateFixed
                            size={16}
                            className={isLocating ? "animate-pulse" : ""}
                          />
                        </button>
                      </div>
                    </div>
                  </Autocomplete>

                  <div className="mt-4 overflow-hidden rounded-xl md:rounded-2xl border border-[#dce8ce]">
                    <div className="flex items-center justify-between gap-3 border-b border-[#e7efde] px-4 py-2 text-[11px] font-medium text-gray-700">
                      <span>Serviceability on map</span>
                      <div className="flex items-center gap-2 normal-case tracking-normal">
                        <button
                          type="button"
                          onClick={() =>
                            setShowServiceOverlay((value) => !value)
                          }
                          aria-pressed={showServiceOverlay}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition ${
                            showServiceOverlay
                              ? "bg-[#e8f4e6] text-[#1f6a34] ring-1 ring-[#8fd19e]"
                              : "bg-white text-[#7ca287] ring-1 ring-[#dce8ce]"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-[#1f6a34]" />
                          Service
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setShowRestrictionOverlay((value) => !value)
                          }
                          aria-pressed={showRestrictionOverlay}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition ${
                            showRestrictionOverlay
                              ? "bg-[#fdecec] text-[#b42318] ring-1 ring-[#f2a7a7]"
                              : "bg-white text-[#b98b8b] ring-1 ring-[#efd6d6]"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-[#b42318]" />
                          Non-service
                        </button>
                      </div>
                    </div>
                    <GoogleMap
                      mapContainerStyle={{
                        width: "100%",
                        height: "min(52vh, 420px)",
                      }}
                      center={markerPos}
                      zoom={13}
                      onClick={onMapClick}
                      onLoad={(map) => {
                        mapRef.current = map;
                      }}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        streetViewControl: false,
                        fullscreenControl: false,
                      }}
                    >
                      {shouldShowServiceOverlay ? (
                        <Circle
                          center={markerPos}
                          radius={1200}
                          options={{
                            fillColor: DEFAULT_SERVICE_ZONE_STYLES.fillColor,
                            fillOpacity: 0.16,
                            strokeColor:
                              DEFAULT_SERVICE_ZONE_STYLES.strokeColor,
                            strokeOpacity: 1,
                            strokeWeight: 3,
                            clickable: false,
                            draggable: false,
                            editable: false,
                            zIndex: 1,
                          }}
                        />
                      ) : null}
                      {shouldShowRestrictionOverlay ? (
                        <Circle
                          center={markerPos}
                          radius={1200}
                          options={{
                            fillColor:
                              DEFAULT_RESTRICTION_ZONE_STYLES.fillColor,
                            fillOpacity: 0.16,
                            strokeColor:
                              DEFAULT_RESTRICTION_ZONE_STYLES.strokeColor,
                            strokeOpacity: 1,
                            strokeWeight: 3,
                            clickable: false,
                            draggable: false,
                            editable: false,
                            zIndex: 2,
                          }}
                        />
                      ) : null}
                      <Marker position={markerPos} />
                    </GoogleMap>
                    <div
                      className={`border-t px-4 py-2 text-xs font-medium ${
                        shippingServiceability
                          ? shippingServiceability.serviceable
                            ? "border-[#dce8ce] bg-[#eff8ea] text-[#1f6a34]"
                            : "border-[#f0d1d1] bg-[#fff1f1] text-[#b42318]"
                          : "border-[#e7efde] bg-white text-gray-600"
                      }`}
                    >
                      {isCheckingShipping
                        ? "Checking serviceability..."
                        : shippingServiceability
                          ? shippingServiceability.serviceable
                            ? "Service zone: this location is covered."
                            : shippingServiceability.reason ||
                              "Non-service zone: this location is not covered."
                          : "Select a location to check serviceability."}
                    </div>
                    {shippingServiceability?.matchedRule ? (
                      <div className="border-t border-[#ececec] bg-white px-4 py-2 text-[11px] text-[#59734f]">
                        Matched rule:{" "}
                        {shippingServiceability.matchedRule.action}{" "}
                        {shippingServiceability.matchedRule.ruleType}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-[#f0ddb0] bg-[#fffaf0] p-4 text-sm leading-6 text-[#7a5a11]">
                  Map search is not connected yet. Add a Google Maps browser key
                  to enable suggestions, map pinning, and current-location
                  selection.
                </div>
              )}

              {statusMessage ? (
                <p className="mt-3 rounded-2xl bg-[#f6f8f3] px-4 py-3 text-xs font-medium text-[#52724f]">
                  {statusMessage}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[#ececec] bg-white p-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-12 rounded-sm border border-gray-200 text-sm font-semibold text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!hasAddress) {
                    return;
                  }

                  if (isCheckingShipping) {
                    setStatusMessage(
                      "Please wait while we check this service area.",
                    );
                    return;
                  }

                  if (!shippingServiceability?.serviceable) {
                    setStatusMessage(
                      shippingServiceability?.reason ||
                        "This location is outside the delivery service area.",
                    );
                    return;
                  }

                  onAddressChange?.(
                    address,
                    markerPos,
                    resolvedDeliveryAddress,
                  );
                  emitDeliveryAddressUpdate({
                    address,
                    position: markerPos,
                    deliveryAddress: resolvedDeliveryAddress,
                  });
                  writeCheckoutDraft({
                    deliveryAddress: address,
                    deliveryAddressDetails: resolvedDeliveryAddress,
                    deliveryPosition: markerPos,
                  });
                  onDone?.(address, markerPos, resolvedDeliveryAddress);
                  void persistSelectionToProfile(resolvedDeliveryAddress);
                  setIsOpen(false);
                }}
                disabled={!canCommitDeliveryAddress || isSavingProfile}
                className={`h-12 rounded-sm text-sm font-semibold transition ${
                  canCommitDeliveryAddress && !isSavingProfile
                    ? "bg-[#207958] text-white hover:bg-[#1b4700]"
                    : "cursor-not-allowed bg-[#20795840] text-gray-400"
                }`}
              >
                {isSavingProfile ? "Saving..." : "Done"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export { DELIVERY_ADDRESS_EVENT };
