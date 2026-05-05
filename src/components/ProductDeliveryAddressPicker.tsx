"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Autocomplete,
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
import { formatDeliveryAddress } from "@/lib/deliveryAddress";

const LIBRARIES: "places"[] = ["places"];
const DEFAULT_LOCATION = {
  lat: 25.5138,
  lng: 90.2142,
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

function buildDeliveryAddress(
  formattedAddress: string,
  components: google.maps.GeocoderAddressComponent[] | undefined,
): DeliveryAddress {
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

  return {
    formattedAddress: formattedAddress.trim(),
    line1: line1 || formattedAddress.trim(),
    line2: sublocality,
    city: locality,
    state,
    postalCode,
    landmark: "",
    notes: "",
  };
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
  onAddressChange,
  onDone,
}: ProductDeliveryAddressPickerProps) {
  const { user } = useAuth();
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

  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState(effectiveInitialAddress);
  const [markerPos, setMarkerPos] = useState<Position>(() =>
    hasInitialPosition && initialPosition ? initialPosition : DEFAULT_LOCATION,
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [resolvedDeliveryAddress, setResolvedDeliveryAddress] =
    useState<DeliveryAddress>(() =>
      buildDeliveryAddress(effectiveInitialAddress, undefined),
    );
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const lastAutoResolvedAddressRef = useRef("");
  const hasAddress = address.trim().length > 0;

  useEffect(() => {
    const nextAddress = effectiveInitialAddress;
    queueMicrotask(() => {
      setAddress(nextAddress);
      setResolvedDeliveryAddress(buildDeliveryAddress(nextAddress, undefined));
    });
  }, [effectiveInitialAddress]);

  const applyLocation = useCallback((
    nextPosition: Position,
    nextAddress: string,
    nextDeliveryAddress?: DeliveryAddress,
  ) => {
    const normalizedDeliveryAddress =
      nextDeliveryAddress || buildDeliveryAddress(nextAddress, undefined);
    setMarkerPos(nextPosition);
    setAddress(nextAddress);
    setResolvedDeliveryAddress(normalizedDeliveryAddress);
    onAddressChange?.(nextAddress, nextPosition, normalizedDeliveryAddress);
    mapRef.current?.panTo(nextPosition);
    setStatusMessage("Delivery point selected.");
  }, [onAddressChange]);

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
    geocoder.geocode({ address: normalizedInitialAddress }, (results, status) => {
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
      const nextAddress = results[0].formatted_address || normalizedInitialAddress;
      const nextDeliveryAddress = buildDeliveryAddress(
        nextAddress,
        results[0].address_components,
      );

      applyLocation(nextPosition, nextAddress, nextDeliveryAddress);
      setStatusMessage("Saved delivery location confirmed.");
    });
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

      applyLocation(nextPosition, resolvedAddress, nextDeliveryAddress);
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
    );
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatusMessage("Location access is not available on this browser.");
      return;
    }

    setIsLocating(true);
    setStatusMessage("Fetching your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        reverseGeocode({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setIsLocating(false);
        setStatusMessage("Allow location permission or search manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function clearAddress() {
    setAddress("");
    const clearedDeliveryAddress = buildDeliveryAddress("", undefined);
    setResolvedDeliveryAddress(clearedDeliveryAddress);
    onAddressChange?.("", undefined, clearedDeliveryAddress);
    setStatusMessage("");
    addressInputRef.current?.focus();
  }

  const trigger =
    variant === "cart-select" ? (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-[38px] w-full items-center gap-2 rounded-md border border-[#d9dde4] bg-white px-3 text-left text-sm text-[#111827]"
      >
        <MapPin size={16} className="shrink-0 text-[#1b3151]" />
        <span className="min-w-0 flex-1 truncate">{address || emptyLabel}</span>
        <ChevronDown size={16} className="shrink-0 text-[#111827]" />
      </button>
    ) : variant === "header-inline" ? (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#233d1d] transition border border-[#d6d6d6] hover:bg-[#edf5e1] lg:inline-flex"
      >
        <MapPin size={16} className="shrink-0 text-[#214f14]" />
        <span className="max-w-[170px] truncate">{address || emptyLabel}</span>
      </button>
    ) : variant === "home-strip" ? (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mx-2.5 flex min-h-8 w-[calc(100%-1.25rem)] items-center gap-1.5 rounded-xl bg-transparent px-2.5 py-1 text-left text-xs text-black md:mx-6 md:w-[calc(100%-3rem)]"
      >
        <HomeLocationIcon />
        {address ? (
          <>
            <span className="shrink-0 font-bold uppercase">Home</span>
            <span className="min-w-0 flex-1 truncate">{address}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate font-semibold">
            {emptyLabel}
          </span>
        )}
        <ChevronRight size={16} className="shrink-0" />
      </button>
    ) : variant === "checkout-card" ? (
      <div className="flex items-start gap-3 rounded-[18px] border border-[#C5D6B5] bg-[#E8F0E0] p-4">
        <MapPin size={20} className="mt-1 shrink-0 text-[#173d12]" />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-extrabold text-black">Delivery To:</p>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="block w-full text-left text-sm leading-relaxed text-[#111111]"
          >
            {address || emptyLabel}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="shrink-0 rounded-lg bg-white px-4 py-2 text-xs font-bold text-[#3B5E2B] shadow-sm transition hover:bg-[#F7F8F4]"
        >
          Change
        </button>
      </div>
    ) : (
      <section className="mt-5">
        <h2 className="text-[14px] font-black text-[#111111]">
          Delivery Address
        </h2>
        <div className="mt-2 flex h-12 items-center gap-2 rounded-md border border-[#8a8a8a] bg-white px-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="min-w-0 flex-1 truncate text-left text-[12px] font-medium text-[#171410]"
          >
            {address || emptyLabel}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#171410]"
            aria-label="Choose delivery location"
          >
            <LocateFixed size={20} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-1 block w-full pr-2 text-right text-xs font-medium text-[#135dff]"
        >
          Change Address
        </button>
      </section>
    );

  return (
    <>
      {trigger}

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 px-3 pb-3 pt-8 backdrop-blur-sm sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close location picker"
          />

          <section className="relative flex max-h-[92vh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#ececec] px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b8b58]">
                  Delivery point
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#171410]">
                  Search or pin location
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-[#171410]"
                aria-label="Close location picker"
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b8b58]"
                        size={17}
                      />
                      <input
                        ref={addressInputRef}
                        type="text"
                        value={address}
                        onChange={(event) => {
                          const nextAddress = event.target.value;
                          setAddress(nextAddress);
                          const nextDeliveryAddress = buildDeliveryAddress(
                            nextAddress,
                            undefined,
                          );
                          setResolvedDeliveryAddress(nextDeliveryAddress);
                          onAddressChange?.(
                            nextAddress,
                            undefined,
                            nextDeliveryAddress,
                          );
                          setStatusMessage("");
                        }}
                        placeholder="Type address, locality, or landmark"
                        className="h-12 w-full rounded-2xl border border-[#dce8ce] bg-[#fbfdf8] pl-11 pr-12 text-sm text-[#171410] outline-none focus:border-[#aac58d] focus:ring-2 focus:ring-[#dce8ce]"
                      />
                      {hasAddress ? (
                        <button
                          type="button"
                          onClick={clearAddress}
                          className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#6b8b58] transition hover:bg-[#edf5e1] hover:text-[#214f14]"
                          aria-label="Clear address"
                        >
                          <X size={16} />
                        </button>
                      ) : null}
                    </div>
                  </Autocomplete>

                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#edf5e1] text-sm font-semibold text-[#214f14]"
                  >
                    <LocateFixed size={17} />
                    {isLocating
                      ? "Fetching location..."
                      : "Use current location"}
                  </button>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-[#dce8ce]">
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
                      <Marker position={markerPos} />
                    </GoogleMap>
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
                className="h-12 rounded-2xl border border-[#dce8ce] text-sm font-semibold text-[#214f14]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!hasAddress) {
                    return;
                  }

                  onAddressChange?.(
                    address,
                    markerPos,
                    resolvedDeliveryAddress,
                  );
                  onDone?.(address, markerPos, resolvedDeliveryAddress);
                  setIsOpen(false);
                }}
                disabled={!hasAddress}
                className={`h-12 rounded-2xl text-sm font-semibold transition ${
                  hasAddress
                    ? "bg-[#245d00] text-white hover:bg-[#1b4700]"
                    : "cursor-not-allowed bg-[#dce8ce] text-[#8aa27a]"
                }`}
              >
                Done
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
