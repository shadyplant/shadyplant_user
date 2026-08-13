"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  normalizeDeliveryAddress,
  isValidPhoneNumber,
  isValidPostalCode,
  type DeliveryAddress,
} from "@/lib/validation";
import {
  ArrowLeft,
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

const ADDRESS_TYPE_OPTIONS: Array<{
  value: DeliveryAddress["addressType"];
  label: string;
}> = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
];

type Position = {
  lat: number;
  lng: number;
};

type LocationPrediction = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  description: string;
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

function normalizePlacePrediction(
  prediction: google.maps.places.AutocompletePrediction,
): LocationPrediction {
  return {
    placeId: prediction.place_id,
    primaryText:
      prediction.structured_formatting?.main_text || prediction.description,
    secondaryText: prediction.structured_formatting?.secondary_text || "",
    description: prediction.description,
  };
}

function buildDeliveryAddress(
  formattedAddress: string,
  components: google.maps.GeocoderAddressComponent[] | undefined,
): DeliveryAddress {
  const sanitizedFormattedAddress =
    sanitizeFormattedDeliveryAddress(formattedAddress);
  const premise = getAddressPart(components, "premise");
  const subpremise = getAddressPart(components, "subpremise");
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
  const line1 = [subpremise, premise, streetNumber, route]
    .filter(Boolean)
    .join(" ")
    .trim();
  const fallbackLine1 =
    line1 || sublocality || locality || state || sanitizedFormattedAddress;

  return {
    formattedAddress: sanitizedFormattedAddress,
    line1: fallbackLine1.trim(),
    line2: sublocality,
    buildingName: fallbackLine1.trim(),
    locality: sublocality || locality,
    recipientName: "",
    phoneNumber: "",
    alternatePhoneNumber: "",
    addressType: "",
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

function applyProfileDefaultsToDeliveryAddress(
  deliveryAddress: Partial<DeliveryAddress>,
  profileName: string,
  profilePhone: string,
) {
  return normalizeDeliveryAddress({
    ...deliveryAddress,
    recipientName:
      String(deliveryAddress.recipientName || "").trim() || profileName,
    phoneNumber:
      String(deliveryAddress.phoneNumber || "").trim() || profilePhone,
  });
}

function getProfileDisplayName(user: ReturnType<typeof useAuth>["user"]) {
  return String(user?.fullName || user?.billingDetails?.name || "").trim();
}

function getProfileDisplayPhone(user: ReturnType<typeof useAuth>["user"]) {
  return String(
    user?.phoneNumber || user?.billingDetails?.contact || "",
  ).trim();
}

function getMapCenterPosition(map: google.maps.Map | null): Position | null {
  const center = map?.getCenter();

  if (!center) {
    return null;
  }

  return {
    lat: center.lat(),
    lng: center.lng(),
  };
}

function arePositionsEqual(a: Position | null, b: Position | null) {
  if (!a || !b) {
    return false;
  }

  return (
    Math.abs(a.lat - b.lat) < 0.000001 && Math.abs(a.lng - b.lng) < 0.000001
  );
}

function getMissingShippingReason({
  countryCode,
  stateCode,
  pin,
}: typeof EMPTY_SHIPPING_QUERY) {
  if (!countryCode) {
    return "Non-service zone: country was not found for this location.";
  }

  if (!stateCode) {
    return "Non-service zone: state was not found for this location.";
  }

  if (!pin) {
    return "Non-service zone: PIN code was not found for this location.";
  }

  return "";
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
  actionLabel?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
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
  actionLabel,
  isOpen: controlledIsOpen,
  onOpenChange,
  hideTrigger = false,
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

  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;
  const setIsOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledIsOpen === undefined) {
        setUncontrolledIsOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [controlledIsOpen, onOpenChange],
  );
  const [address, setAddress] = useState(effectiveInitialAddress);
  const [confirmedAddress, setConfirmedAddress] =
    useState(effectiveInitialAddress);
  const [markerPos, setMarkerPos] = useState<Position>(() =>
    hasInitialPosition && initialPosition ? initialPosition : DEFAULT_LOCATION,
  );
  const [confirmedMarkerPos, setConfirmedMarkerPos] = useState<Position>(() =>
    hasInitialPosition && initialPosition ? initialPosition : DEFAULT_LOCATION,
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddressDetailsOpen, setIsAddressDetailsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [locationPredictions, setLocationPredictions] = useState<
    LocationPrediction[]
  >([]);
  const [isFetchingPredictions, setIsFetchingPredictions] = useState(false);
  const [shippingServiceability, setShippingServiceability] =
    useState<ShippingServiceabilityResponse | null>(null);
  const [isCheckingShipping, setIsCheckingShipping] = useState(false);
  const [shippingQuery, setShippingQuery] = useState(EMPTY_SHIPPING_QUERY);
  const [confirmedShippingQuery, setConfirmedShippingQuery] = useState(
    EMPTY_SHIPPING_QUERY,
  );
  const [resolvedDeliveryAddress, setResolvedDeliveryAddress] =
    useState<DeliveryAddress>(() =>
      buildDeliveryAddress(effectiveInitialAddress, undefined),
    );
  const [confirmedDeliveryAddress, setConfirmedDeliveryAddress] =
    useState<DeliveryAddress>(() =>
      buildDeliveryAddress(effectiveInitialAddress, undefined),
    );
  const mapRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const placePredictionDebounceRef = useRef<number | null>(null);
  const placePredictionRequestIdRef = useRef(0);
  const lastAutoResolvedAddressRef = useRef("");
  const lastReverseGeocodedCenterRef = useRef<Position | null>(null);
  const locationRequestIdRef = useRef(0);
  const mapIdleDebounceRef = useRef<number | null>(null);
  const skipNextMapIdleRef = useRef(false);
  const wasOpenRef = useRef(false);
  const hasAddress = address.trim().length > 0;
  const hasConfirmedAddress = confirmedAddress.trim().length > 0;
  const recipientName = resolvedDeliveryAddress.recipientName.trim();
  const phoneNumber = resolvedDeliveryAddress.phoneNumber.trim();
  const locality = resolvedDeliveryAddress.locality.trim();
  const buildingName = resolvedDeliveryAddress.buildingName.trim();
  const city = resolvedDeliveryAddress.city.trim();
  const state = resolvedDeliveryAddress.state.trim();
  const postalCode = resolvedDeliveryAddress.postalCode.trim();
  const hasCompleteRequiredAddress = Boolean(
    buildingName &&
    locality &&
    city &&
    state &&
    postalCode &&
    recipientName &&
    phoneNumber &&
    isValidPhoneNumber(phoneNumber) &&
    isValidPostalCode(postalCode),
  );
  const canCommitDeliveryAddress = Boolean(
    hasAddress &&
    shippingServiceability?.serviceable &&
    !isCheckingShipping &&
    hasCompleteRequiredAddress,
  );
  const shouldPersistToProfile =
    persistToProfile ??
    (variant === "field" ||
      variant === "home-strip" ||
      variant === "header-inline");
  const profileName = getProfileDisplayName(user);
  const profilePhone = getProfileDisplayPhone(user);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) {
      return () => {
        circleRef.current?.setMap(null);
        circleRef.current = null;
      };
    }

    circleRef.current?.setMap(null);
    circleRef.current = null;

    if (shippingServiceability) {
      circleRef.current = new google.maps.Circle({
        map: mapRef.current,
        center: markerPos,
        radius: 1200,
        fillColor: shippingServiceability.serviceable
          ? DEFAULT_SERVICE_ZONE_STYLES.fillColor
          : DEFAULT_RESTRICTION_ZONE_STYLES.fillColor,
        fillOpacity: 0.16,
        strokeColor: shippingServiceability.serviceable
          ? DEFAULT_SERVICE_ZONE_STYLES.strokeColor
          : DEFAULT_RESTRICTION_ZONE_STYLES.strokeColor,
        strokeOpacity: 1,
        strokeWeight: 3,
        clickable: false,
        draggable: false,
        editable: false,
        zIndex: 1,
      });
    }

    return () => {
      circleRef.current?.setMap(null);
      circleRef.current = null;
    };
  }, [isLoaded, markerPos, shippingServiceability]);

  useEffect(() => {
    const profileName = getProfileDisplayName(user);
    const profilePhone = getProfileDisplayPhone(user);
    const savedDeliveryAddress = normalizeDeliveryAddress(
      user?.deliveryAddress,
    );
    const hasSavedDeliveryAddress =
      Object.values(savedDeliveryAddress).some(Boolean);
    const nextAddress = effectiveInitialAddress;

    queueMicrotask(() => {
      if (hasSavedDeliveryAddress) {
        const nextDeliveryAddress = applyProfileDefaultsToDeliveryAddress(
          savedDeliveryAddress,
          profileName,
          profilePhone,
        );
        const nextConfirmedAddress =
          formatDeliveryAddress(nextDeliveryAddress) ||
          sanitizeFormattedDeliveryAddress(effectiveInitialAddress);

        setAddress(nextConfirmedAddress);
        setConfirmedAddress(nextConfirmedAddress);
        setResolvedDeliveryAddress(nextDeliveryAddress);
        setConfirmedDeliveryAddress(nextDeliveryAddress);
        setMarkerPos(initialPosition || DEFAULT_LOCATION);
        setConfirmedMarkerPos(initialPosition || DEFAULT_LOCATION);
        setShippingQuery(EMPTY_SHIPPING_QUERY);
        setConfirmedShippingQuery(EMPTY_SHIPPING_QUERY);
        return;
      }

      const nextDeliveryAddress = applyProfileDefaultsToDeliveryAddress(
        buildDeliveryAddress(nextAddress, undefined),
        profileName,
        profilePhone,
      );

      setAddress(nextAddress);
      setConfirmedAddress(nextAddress);
      setResolvedDeliveryAddress(nextDeliveryAddress);
      setConfirmedDeliveryAddress(nextDeliveryAddress);
      setMarkerPos(
        hasInitialPosition && initialPosition ? initialPosition : DEFAULT_LOCATION,
      );
      setConfirmedMarkerPos(
        hasInitialPosition && initialPosition ? initialPosition : DEFAULT_LOCATION,
      );
      setShippingQuery(EMPTY_SHIPPING_QUERY);
      setConfirmedShippingQuery(EMPTY_SHIPPING_QUERY);
    });
  }, [
    effectiveInitialAddress,
    hasInitialPosition,
    initialPosition,
    user,
    user?.deliveryAddress,
    user?.fullName,
    user?.phoneNumber,
    user?.billingDetails?.name,
    user?.billingDetails?.contact,
  ]);

  function updateResolvedDeliveryAddress(nextPatch: Partial<DeliveryAddress>) {
    setResolvedDeliveryAddress((current) => {
      const nextDeliveryAddress = normalizeDeliveryAddress({
        ...current,
        ...nextPatch,
      });
      const nextAddressLabel =
        formatDeliveryAddress(nextDeliveryAddress) ||
        sanitizeFormattedDeliveryAddress(
          nextDeliveryAddress.formattedAddress,
        ) ||
        sanitizeFormattedDeliveryAddress(nextDeliveryAddress.line1);

      setAddress(nextAddressLabel);
      return nextDeliveryAddress;
    });
  }

  const syncDraftFromConfirmed = useCallback(() => {
    setAddress(confirmedAddress);
    setMarkerPos(confirmedMarkerPos);
    setResolvedDeliveryAddress(confirmedDeliveryAddress);
    setShippingQuery(confirmedShippingQuery);
    setLocationPredictions([]);
    setIsFetchingPredictions(false);
    setIsSearchFocused(false);
    clearPlacePredictionDebounce();
    setShippingServiceability(null);
    setStatusMessage("");
  }, [
    confirmedAddress,
    confirmedDeliveryAddress,
    confirmedMarkerPos,
    confirmedShippingQuery,
  ]);

  function closePicker() {
    syncDraftFromConfirmed();
    setIsAddressDetailsOpen(false);
    setIsOpen(false);
  }

  function closeAddressDetails() {
    syncDraftFromConfirmed();
    setIsAddressDetailsOpen(false);
  }

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      syncDraftFromConfirmed();
      setIsAddressDetailsOpen(false);
    }

    if (!isOpen && wasOpenRef.current) {
      syncDraftFromConfirmed();
      setIsAddressDetailsOpen(false);
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, syncDraftFromConfirmed]);

  function clearMapIdleDebounce() {
    if (typeof window === "undefined") {
      return;
    }

    if (mapIdleDebounceRef.current !== null) {
      window.clearTimeout(mapIdleDebounceRef.current);
      mapIdleDebounceRef.current = null;
    }
  }

  function focusSearchInput() {
    const input = addressInputRef.current;

    if (!input) {
      return;
    }

    input.focus({ preventScroll: true });
    input.select();
  }

  function openMapPickerAndFocusSearch() {
    setIsOpen(true);

    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      focusSearchInput();
    }, 0);
  }

  function clearPlacePredictionDebounce() {
    if (typeof window === "undefined") {
      return;
    }

    if (placePredictionDebounceRef.current !== null) {
      window.clearTimeout(placePredictionDebounceRef.current);
      placePredictionDebounceRef.current = null;
    }
  }

  useEffect(() => {
    if (!isLoaded || !isSearchFocused) {
      setLocationPredictions([]);
      setIsFetchingPredictions(false);
      clearPlacePredictionDebounce();
      return;
    }

    const query = address.trim();

    if (query.length < 2) {
      setLocationPredictions([]);
      setIsFetchingPredictions(false);
      clearPlacePredictionDebounce();
      return;
    }

    clearPlacePredictionDebounce();

    if (typeof window === "undefined") {
      return;
    }

    const requestId = ++placePredictionRequestIdRef.current;

    placePredictionDebounceRef.current = window.setTimeout(() => {
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current =
          new google.maps.places.AutocompleteService();
      }

      setIsFetchingPredictions(true);

      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "in" },
        },
        (predictions, status) => {
          if (requestId !== placePredictionRequestIdRef.current) {
            return;
          }

          setIsFetchingPredictions(false);

          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !predictions?.length
          ) {
            setLocationPredictions([]);
            return;
          }

          setLocationPredictions(
            predictions.map((prediction) =>
              normalizePlacePrediction(prediction),
            ),
          );
        },
      );
    }, 220);

    return () => clearPlacePredictionDebounce();
  }, [address, isLoaded, isSearchFocused]);

  async function selectLocationPrediction(prediction: LocationPrediction) {
    clearPlacePredictionDebounce();
    setIsSearchFocused(false);
    setLocationPredictions([]);
    setStatusMessage("Resolving selected location...");

    if (!isLoaded) {
      setAddress(prediction.description);
      return;
    }

    const requestId = ++locationRequestIdRef.current;
    const geocoder = geocoderRef.current || new google.maps.Geocoder();
    geocoderRef.current = geocoder;

    const results = await new Promise<google.maps.GeocoderResult[] | null>(
      (resolve) => {
        geocoder.geocode(
          { placeId: prediction.placeId },
          (nextResults, status) => {
            if (requestId !== locationRequestIdRef.current) {
              resolve(null);
              return;
            }

            if (status !== "OK" || !nextResults?.length) {
              resolve(null);
              return;
            }

            resolve(nextResults);
          },
        );
      },
    );

    if (!results?.[0]?.geometry?.location) {
      if (requestId === locationRequestIdRef.current) {
        setAddress(prediction.description);
        setStatusMessage("Location selected. Move the map to refine it.");
      }
      return;
    }

    if (requestId !== locationRequestIdRef.current) {
      return;
    }

    const nextPosition = {
      lat: results[0].geometry.location.lat(),
      lng: results[0].geometry.location.lng(),
    };
    const nextAddress = results[0].formatted_address || prediction.description;
    const nextDeliveryAddress = buildDeliveryAddress(
      nextAddress,
      results[0].address_components,
    );
    const nextShippingQuery = buildShippingQuery(results[0].address_components);

    applyLocation(
      nextPosition,
      nextAddress,
      nextDeliveryAddress,
      nextShippingQuery,
      {
        panToMap: true,
      },
    );
    setStatusMessage("Location selected. Confirm the map center to save.");
  }

  function handleDeliveryAddressFieldChange(
    field: keyof DeliveryAddress,
    value: string,
  ) {
    const nextValue = String(value || "");
    updateResolvedDeliveryAddress({
      [field]: nextValue,
      ...(field === "buildingName"
        ? { line1: nextValue }
        : field === "locality"
          ? { line2: nextValue }
          : {}),
    } as Partial<DeliveryAddress>);
  }

  const deliverySummaryLine =
    formatDeliveryAddress(resolvedDeliveryAddress) || address || emptyLabel;
  const deliveryNameLine =
    resolvedDeliveryAddress.recipientName.trim() ||
    resolvedDeliveryAddress.buildingName.trim() ||
    "Deliver to this location";

  function scheduleReverseGeocodeFromMapCenter() {
    clearMapIdleDebounce();

    if (typeof window === "undefined") {
      return;
    }

    const nextCenter = getMapCenterPosition(mapRef.current);

    if (!nextCenter) {
      return;
    }

    if (arePositionsEqual(nextCenter, lastReverseGeocodedCenterRef.current)) {
      return;
    }

    mapIdleDebounceRef.current = window.setTimeout(() => {
      void reverseGeocode(nextCenter, { panToMap: false });
    }, 250);
  }

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
      options?: {
        panToMap?: boolean;
      },
    ) => {
      const normalizedDeliveryAddress =
        nextDeliveryAddress || buildDeliveryAddress(nextAddress, undefined);
      const deliveryAddressWithProfileDefaults =
        applyProfileDefaultsToDeliveryAddress(
          normalizedDeliveryAddress,
          profileName,
          profilePhone,
        );
      const displayAddress =
        formatDeliveryAddress(deliveryAddressWithProfileDefaults) ||
        sanitizeFormattedDeliveryAddress(nextAddress);
      setMarkerPos(nextPosition);
      setAddress(displayAddress);
      setResolvedDeliveryAddress(deliveryAddressWithProfileDefaults);
      if (nextShippingQuery) {
        setShippingServiceability(null);
        setShippingQuery(nextShippingQuery);
      } else {
        setShippingServiceability(null);
        setShippingQuery(EMPTY_SHIPPING_QUERY);
      }
      if (options?.panToMap ?? true) {
        skipNextMapIdleRef.current = true;
        mapRef.current?.panTo(nextPosition);
      }
      setStatusMessage("Checking delivery service area...");
    },
    [profileName, profilePhone],
  );

  useEffect(() => () => clearMapIdleDebounce(), []);

  useEffect(() => {
    const normalizedInitialAddress = effectiveInitialAddress.trim();
    const requestId = ++locationRequestIdRef.current;

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
        if (requestId !== locationRequestIdRef.current) {
          return;
        }

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

  async function reverseGeocode(
    nextPosition: Position,
    options?: {
      fallbackAddress?: string;
      panToMap?: boolean;
      force?: boolean;
    },
  ) {
    const requestId = ++locationRequestIdRef.current;
    const shouldPanToMap = options?.panToMap ?? false;
    const fallbackAddress = options?.fallbackAddress || "";
    const shouldForce = options?.force ?? false;
    const lastRequestedCenter = lastReverseGeocodedCenterRef.current;

    if (!shouldForce && arePositionsEqual(nextPosition, lastRequestedCenter)) {
      return null;
    }

    lastReverseGeocodedCenterRef.current = nextPosition;

    setMarkerPos(nextPosition);
    setShippingServiceability(null);
    setStatusMessage("Checking delivery service area...");

    if (!isLoaded) {
      applyLocation(
        nextPosition,
        fallbackAddress || address,
        undefined,
        undefined,
        {
          panToMap: shouldPanToMap,
        },
      );
      return null;
    }

    const results = await new Promise<google.maps.GeocoderResult[] | null>(
      (resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: nextPosition }, (nextResults, status) => {
          if (requestId !== locationRequestIdRef.current) {
            resolve(null);
            return;
          }

          if (status !== "OK" || !nextResults?.length) {
            resolve(null);
            return;
          }

          resolve(nextResults);
        });
      },
    );

    if (!results?.[0]) {
      if (requestId === locationRequestIdRef.current) {
        setMarkerPos(nextPosition);
        if (shouldPanToMap) {
          skipNextMapIdleRef.current = true;
          mapRef.current?.panTo(nextPosition);
        }
      }

      return null;
    }

    if (requestId !== locationRequestIdRef.current) {
      return null;
    }

    const resolvedAddress =
      results[0].formatted_address || fallbackAddress || address;
    const nextDeliveryAddress = buildDeliveryAddress(
      resolvedAddress,
      results[0].address_components,
    );
    const nextShippingQuery = buildShippingQuery(results[0].address_components);

    applyLocation(
      nextPosition,
      resolvedAddress,
      nextDeliveryAddress,
      nextShippingQuery,
      {
        panToMap: shouldPanToMap,
      },
    );

    return {
      address: resolvedAddress,
      deliveryAddress: nextDeliveryAddress,
      shippingQuery: nextShippingQuery,
      position: nextPosition,
    };
  }

  function onMapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng) {
      return;
    }

    void reverseGeocode(
      {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      },
      { panToMap: true },
    );
  }

  function onMapIdle() {
    if (skipNextMapIdleRef.current) {
      skipNextMapIdleRef.current = false;
      return;
    }

    scheduleReverseGeocodeFromMapCenter();
  }

  function useCurrentLocation() {
    setIsLocating(true);
    setStatusMessage("Fetching your current location...");

    requestAppLocation(
      (location) => {
        setIsLocating(false);
        void reverseGeocode(
          {
            lat: location.latitude,
            lng: location.longitude,
          },
          { panToMap: true },
        );
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
    setMarkerPos(confirmedMarkerPos);
    setShippingServiceability(null);
    setShippingQuery(EMPTY_SHIPPING_QUERY);
    setLocationPredictions([]);
    setIsFetchingPredictions(false);
    setIsSearchFocused(false);
    if (addressInputRef.current) {
      addressInputRef.current.value = "";
    }
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

  async function commitDeliveryAddress() {
    if (!hasAddress) {
      return;
    }

    if (isCheckingShipping) {
      setStatusMessage("Please wait while we check this service area.");
      return;
    }

    if (!shippingServiceability?.serviceable) {
      setStatusMessage(
        shippingServiceability?.reason ||
          "This location is outside the delivery service area.",
      );
      return;
    }

    const centerPosition = getMapCenterPosition(mapRef.current) || markerPos;
    const confirmedLocation = await reverseGeocode(centerPosition, {
      panToMap: false,
      force: true,
    });

    if (!confirmedLocation) {
      setStatusMessage(
        "Unable to confirm the current map location. Please try again.",
      );
      return;
    }

    const confirmedAddress = confirmedLocation.address;
    const confirmedDeliveryAddress = normalizeDeliveryAddress({
      ...confirmedLocation.deliveryAddress,
      buildingName:
        resolvedDeliveryAddress.buildingName.trim() ||
        confirmedLocation.deliveryAddress.buildingName,
      line1:
        resolvedDeliveryAddress.line1.trim() ||
        confirmedLocation.deliveryAddress.line1,
      locality:
        resolvedDeliveryAddress.locality.trim() ||
        confirmedLocation.deliveryAddress.locality,
      line2:
        resolvedDeliveryAddress.line2.trim() ||
        confirmedLocation.deliveryAddress.line2,
      city:
        resolvedDeliveryAddress.city.trim() ||
        confirmedLocation.deliveryAddress.city,
      state:
        resolvedDeliveryAddress.state.trim() ||
        confirmedLocation.deliveryAddress.state,
      postalCode:
        resolvedDeliveryAddress.postalCode.trim() ||
        confirmedLocation.deliveryAddress.postalCode,
      recipientName: resolvedDeliveryAddress.recipientName.trim(),
      phoneNumber: resolvedDeliveryAddress.phoneNumber.trim(),
      alternatePhoneNumber: resolvedDeliveryAddress.alternatePhoneNumber.trim(),
      addressType: resolvedDeliveryAddress.addressType,
      landmark:
        resolvedDeliveryAddress.landmark.trim() ||
        confirmedLocation.deliveryAddress.landmark,
      notes: resolvedDeliveryAddress.notes.trim(),
    });
    const confirmedPosition = confirmedLocation.position;
    const confirmedRecipientName =
      confirmedDeliveryAddress.recipientName.trim();
    const confirmedPhoneNumber = confirmedDeliveryAddress.phoneNumber.trim();
    const confirmedBuildingName = confirmedDeliveryAddress.buildingName.trim();
    const confirmedLocality = confirmedDeliveryAddress.locality.trim();
    const confirmedCity = confirmedDeliveryAddress.city.trim();
    const confirmedState = confirmedDeliveryAddress.state.trim();
    const confirmedPostalCode = confirmedDeliveryAddress.postalCode.trim();

    if (
      !confirmedBuildingName ||
      !confirmedLocality ||
      !confirmedCity ||
      !confirmedState ||
      !confirmedPostalCode ||
      !confirmedRecipientName ||
      !confirmedPhoneNumber ||
      !isValidPhoneNumber(confirmedPhoneNumber) ||
      !isValidPostalCode(confirmedPostalCode)
    ) {
      setStatusMessage(
        "Please complete the address fields before saving. PIN code and state must come from Google when available.",
      );
      return;
    }

    setConfirmedAddress(confirmedAddress);
    setConfirmedMarkerPos(confirmedPosition);
    setConfirmedDeliveryAddress(confirmedDeliveryAddress);
    setConfirmedShippingQuery(confirmedLocation.shippingQuery);
    setAddress(confirmedAddress);
    setMarkerPos(confirmedPosition);
    setResolvedDeliveryAddress(confirmedDeliveryAddress);
    setShippingQuery(confirmedLocation.shippingQuery);
    onAddressChange?.(
      confirmedAddress,
      confirmedPosition,
      confirmedDeliveryAddress,
    );
    emitDeliveryAddressUpdate({
      address: confirmedAddress,
      position: confirmedPosition,
      deliveryAddress: confirmedDeliveryAddress,
    });
    writeCheckoutDraft({
      deliveryAddress: confirmedAddress,
      deliveryAddressDetails: confirmedDeliveryAddress,
      deliveryPosition: confirmedPosition,
    });
    onDone?.(confirmedAddress, confirmedPosition, confirmedDeliveryAddress);
    await persistSelectionToProfile(confirmedDeliveryAddress);
    setStatusMessage("Saved");
    window.setTimeout(() => {
      setIsAddressDetailsOpen(false);
      setIsOpen(false);
      setStatusMessage("");
    }, 650);
  }

  const trigger = hideTrigger ? null : variant === "cart-select" ? (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="flex h-[38px] w-full items-center gap-2 bg-white px-3 text-left text-sm text-[#111827]"
    >
      <MapPin size={16} className="shrink-0 text-[#1b3151]" />
      <span className="min-w-0 flex-1 truncate">
        {confirmedAddress || emptyLabel}
      </span>
      <ChevronDown size={16} className="shrink-0 text-[#111827]" />
    </button>
  ) : variant === "header-inline" ? (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="hidden items-center gap-2 border-b-1 border-[#cccccc] px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 cursor-pointer lg:inline-flex"
    >
      <MapPin size={16} className="shrink-0 text-[#214f14]" />
      <span className="max-w-[170px] truncate">
        {confirmedAddress || emptyLabel}
      </span>
    </button>
  ) : variant === "home-strip" ? (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="flex items-center justify-between gap-3 rounded-[0.5rem] border-[1.5px] border-gray-200 bg-white px-2 py-2 text-left shadow-[0_1px_0_rgba(0,0,0,0.02)] transition hover:border-[#cfd8c3] hover:bg-[#fbfdf8]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-100 text-[#207958]">
        <MapPin size={18} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-[#171410]">
          {hasConfirmedAddress ? "Your location" : "Set location"}
        </span>
        <span className=" block truncate text-[9px] text-gray-700">
          {confirmedAddress || emptyLabel}
        </span>
      </span>

      <ChevronRight size={16} className="shrink-0 text-[#9a9a9a]" />
    </button>
  ) : variant === "checkout-card" ? (
    <div className="flex items-center gap-3 rounded-[1rem] border border-[#e8e8e8] bg-white px-3 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf5ea] text-[#207958]">
        <MapPin size={18} />
      </div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="min-w-0 flex-1 text-left"
      >
        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          Deliver To
        </span>
        <span className="mt-1 block truncate text-sm font-semibold text-[#171410]">
          {deliveryNameLine}
        </span>
        <span className="mt-0.5 block truncate text-xs leading-5 text-gray-600">
          {deliverySummaryLine}
        </span>
      </button>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[#207958] px-4 text-sm font-semibold text-[#207958] transition hover:bg-[#f4fbf4]"
      >
        {actionLabel || (hasConfirmedAddress ? "Change" : "Add address details")}
      </button>
    </div>
  ) : hasConfirmedAddress ? (
    <section className="mt-5">
      <h2 className="text-xs font-semibold text-gray-700 md:text-sm">
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
          {confirmedAddress}
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

  const addressDetailsForm = (
    <div className="mt-4">
      <div className="flex items-start gap-3 rounded-md bg-[#faf7ef] px-4 py-3 text-xs text-[#8a6b2b]">
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#d6bc75] text-[11px] font-bold">
          i
        </span>
        <p>
          Ensure your address details are accurate for a smooth delivery
          experience.
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className="text-[12px] font-semibold text-[#9b9b9b]">
            Flat/House/building name *
          </span>
          <input
            type="text"
            value={resolvedDeliveryAddress.buildingName}
            onChange={(event) =>
              handleDeliveryAddressFieldChange(
                "buildingName",
                event.target.value,
              )
            }
            className="mt-2 h-12 w-full rounded-md border border-gray-500 px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#a8a8a8] focus:border-[#207958] focus:ring-4 focus:ring-[#e8f4df]"
            placeholder="Flat, house number, building name"
          />
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-[#9b9b9b]">
            Area / Sector / Locality *
          </span>
          <input
            type="text"
            value={resolvedDeliveryAddress.locality}
            onChange={(event) =>
              handleDeliveryAddressFieldChange("locality", event.target.value)
            }
            className="mt-2 h-12 w-full rounded-md border border-gray-500 px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#a8a8a8] focus:border-[#207958] focus:ring-4 focus:ring-[#e8f4df]"
            placeholder="Area, sector, locality"
          />
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-[#9b9b9b]">City</span>
          <input
            type="text"
            value={resolvedDeliveryAddress.city}
            onChange={(event) =>
              handleDeliveryAddressFieldChange("city", event.target.value)
            }
            className="mt-2 h-12 w-full rounded-md border border-gray-500 px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#a8a8a8] focus:border-[#207958] focus:ring-4 focus:ring-[#e8f4df]"
            placeholder="Enter city"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[12px] font-semibold text-[#9b9b9b]">
              State <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={resolvedDeliveryAddress.state}
              onChange={(event) =>
                handleDeliveryAddressFieldChange("state", event.target.value)
              }
              className="mt-2 h-12 w-full rounded-md border border-gray-500 px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#a8a8a8] focus:border-[#207958] focus:ring-4 focus:ring-[#e8f4df]"
              placeholder="State"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-semibold text-[#9b9b9b]">
              Pin code <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={resolvedDeliveryAddress.postalCode}
              onChange={(event) =>
                handleDeliveryAddressFieldChange(
                  "postalCode",
                  event.target.value,
                )
              }
              inputMode="numeric"
              className="mt-2 h-12 w-full rounded-md border border-gray-500 px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#a8a8a8] focus:border-[#207958] focus:ring-4 focus:ring-[#e8f4df]"
              placeholder="Pin code"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-[12px] font-semibold text-[#9b9b9b]">
            Enter your full name <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            value={resolvedDeliveryAddress.recipientName}
            onChange={(event) =>
              handleDeliveryAddressFieldChange(
                "recipientName",
                event.target.value,
              )
            }
            className="mt-2 h-12 w-full rounded-md border border-gray-500 px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#a8a8a8] focus:border-[#207958] focus:ring-4 focus:ring-[#e8f4df]"
            placeholder="Enter full name"
          />
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-[#9b9b9b]">
            10-digit mobile number <span className="text-red-500">*</span>
          </span>
          <input
            type="tel"
            value={resolvedDeliveryAddress.phoneNumber}
            onChange={(event) =>
              handleDeliveryAddressFieldChange(
                "phoneNumber",
                event.target.value,
              )
            }
            className="mt-2 h-12 w-full rounded-md border border-gray-500 px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#a8a8a8] focus:border-[#207958] focus:ring-4 focus:ring-[#e8f4df]"
            placeholder="10-digit mobile number"
          />
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-[#9b9b9b]">
            Alternate phone number (Optional)
          </span>
          <input
            type="tel"
            value={resolvedDeliveryAddress.alternatePhoneNumber}
            onChange={(event) =>
              handleDeliveryAddressFieldChange(
                "alternatePhoneNumber",
                event.target.value,
              )
            }
            className="mt-2 h-12 w-full rounded-md border border-gray-500 px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#a8a8a8] focus:border-[#207958] focus:ring-4 focus:ring-[#e8f4df]"
            placeholder="Alternate phone number"
          />
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-[#9b9b9b]">
            Landmark
          </span>
          <input
            type="text"
            value={resolvedDeliveryAddress.landmark}
            onChange={(event) =>
              handleDeliveryAddressFieldChange("landmark", event.target.value)
            }
            className="mt-2 h-12 w-full rounded-md border border-gray-500 px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#a8a8a8] focus:border-[#207958] focus:ring-4 focus:ring-[#e8f4df]"
            placeholder="Landmark (optional)"
          />
        </label>
      </div>

      <div className="mt-4">
        <p className="text-[12px] font-semibold text-[#9b9b9b]">
          Type of address
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ADDRESS_TYPE_OPTIONS.map((option) => {
            const active = resolvedDeliveryAddress.addressType === option.value;

            return (
              <button
                key={option.value || "unset"}
                type="button"
                onClick={() =>
                  updateResolvedDeliveryAddress({
                    addressType: option.value,
                  })
                }
                className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition ${
                  active
                    ? "border-[#207958] bg-[#eaf5ea] text-[#207958]"
                    : "border-[#d7d7d7] bg-white text-[#333333] hover:border-[#207958] hover:text-[#207958]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {trigger}

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:px-6 sm:py-6">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={closePicker}
            aria-label="Close location picker"
          />

          <section className="relative flex h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-xl">
            <div className="flex items-center gap-3 border-b border-[#ececec] px-5 py-4">
              <button
                type="button"
                onClick={closePicker}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-neutral-50"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>

              <h2 className="text-lg font-bold text-[#171410]">
                Search or pin location
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-0 py-0 sm:px-5">
              {isLoaded && !loadError ? (
                <>
                  <div className="overflow-hidden rounded-md border border-[#e8e8e8] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-5 sm:pt-5">
                        <div className="pointer-events-auto relative overflow-visible rounded-xl border border-[#ececec] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                          <div className="relative">
                            <Search
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />

                            <input
                              ref={addressInputRef}
                              type="text"
                              value={address}
                              onFocus={() => setIsSearchFocused(true)}
                              onBlur={() => {
                                window.setTimeout(() => {
                                  setIsSearchFocused(false);
                                }, 120);
                              }}
                              onChange={(event) => {
                                const nextAddress = event.target.value;
                                setAddress(nextAddress);
                                setIsSearchFocused(true);
                                setShippingServiceability(null);
                                setShippingQuery({
                                  ...EMPTY_SHIPPING_QUERY,
                                });
                                setStatusMessage("");
                              }}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" &&
                                  locationPredictions.length > 0
                                ) {
                                  event.preventDefault();
                                  void selectLocationPrediction(
                                    locationPredictions[0],
                                  );
                                }
                              }}
                              placeholder="Search by area, name, street."
                              className="h-12 w-full rounded-[1rem] border border-transparent bg-white pl-11 pr-24 text-sm text-[#111111] outline-none transition placeholder:text-[#8c8c8c] focus:border-[#d8e8d5] focus:ring-4 focus:ring-[#e8f4df]"
                            />

                            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                              {hasAddress ? (
                                <button
                                  type="button"
                                  onPointerDown={(event) => {
                                    event.preventDefault();
                                    clearAddress();
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef8f0] text-[#207958] transition hover:bg-[#dff1e4] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <LocateFixed
                                  size={16}
                                  className={isLocating ? "animate-pulse" : ""}
                                />
                              </button>
                            </div>
                          </div>

                          {isSearchFocused &&
                          (isFetchingPredictions ||
                            locationPredictions.length > 0) ? (
                            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-[1.25rem] border border-[#e5e7eb] bg-white shadow-[0_20px_42px_rgba(15,23,42,0.18)]">
                              {isFetchingPredictions ? (
                                <div className="px-4 py-4 text-sm text-gray-500">
                                  Searching locations...
                                </div>
                              ) : locationPredictions.length > 0 ? (
                                <div className="max-h-[280px] overflow-y-auto">
                                  {locationPredictions.map(
                                    (prediction, index) => (
                                      <button
                                        key={prediction.placeId}
                                        type="button"
                                        onMouseDown={(event) => {
                                          event.preventDefault();
                                          void selectLocationPrediction(
                                            prediction,
                                          );
                                        }}
                                        className={`flex w-full items-start gap-3 border-t border-[#ececec] px-4 py-3 text-left transition hover:bg-[#f5faf7] ${
                                          index === 0 ? "border-t-0" : ""
                                        }`}
                                      >
                                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d6dbe1] bg-white text-[#111111]">
                                          <MapPin size={16} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                          <span className="block truncate text-[15px] font-semibold text-[#171410]">
                                            {prediction.primaryText}
                                          </span>
                                          <span className="mt-0.5 block truncate text-sm text-[#6b7280]">
                                            {prediction.secondaryText ||
                                              prediction.description}
                                          </span>
                                        </span>
                                      </button>
                                    ),
                                  )}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <GoogleMap
                        mapContainerStyle={{
                          width: "100%",
                          height: "min(58vh, 480px)",
                          touchAction: "manipulation",
                        }}
                        center={markerPos}
                        zoom={13}
                        onClick={onMapClick}
                        onIdle={onMapIdle}
                        onLoad={(map) => {
                          mapRef.current = map;
                        }}
                        options={{
                          disableDefaultUI: true,
                          gestureHandling: "greedy",
                          draggable: true,
                          scrollwheel: true,
                          zoomControl: true,
                          streetViewControl: false,
                          fullscreenControl: false,
                        }}
                      ></GoogleMap>

                      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-[92%]">
                        <div className="flex flex-col items-center">
                          <MapPin
                            size={38}
                            className="text-[#111111] drop-shadow-lg"
                          />
                          <div className="mt-[-8px] h-4 w-4 rounded-full border-4 border-white bg-[#207958] shadow-lg" />
                        </div>
                      </div>

                      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
                        <button
                          type="button"
                          onClick={useCurrentLocation}
                          disabled={isLocating}
                          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[#d7ead8] bg-white px-4 py-3 text-sm font-semibold text-[#207958] shadow-[0_12px_24px_rgba(0,0,0,0.12)] transition hover:bg-[#f4fbf4] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <LocateFixed size={16} />
                          {isLocating
                            ? "Locating..."
                            : "Use my current location"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`mt-0 border-t px-4 py-2 text-xs font-medium ${
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
                          ? "Delivery service available"
                          : shippingServiceability.reason ||
                            "Delivery service not available"
                        : "Select a location to check serviceability."}
                  </div>
                  {shippingServiceability?.matchedRule ? (
                    <div className="border-t border-[#ececec] bg-white px-4 py-2 text-[11px] text-[#59734f]">
                      Matched rule: {shippingServiceability.matchedRule.action}{" "}
                      {shippingServiceability.matchedRule.ruleType}
                    </div>
                  ) : null}

                  <div className="mt-4 px-4">
                    <span className="text-xs font-medium text-gray-500">
                      Deliver To
                    </span>
                    <div className="mt-1 rounded-md border border-[#ececec] bg-white p-2 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="mt-1 text-base font-semibold text-[#171410]">
                            {deliveryNameLine}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-gray-600">
                            {deliverySummaryLine}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={openMapPickerAndFocusSearch}
                          className="inline-flex shrink-0 items-center justify-center rounded-md border border-[#207958] px-3 py-1.5 text-sm font-semibold text-[#207958] transition hover:bg-[#f4fbf4]"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="px-4">
                    <button
                      type="button"
                      onClick={() => setIsAddressDetailsOpen(true)}
                      className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[0.95rem] bg-[#207958] px-5 text-[15px] font-semibold text-white transition hover:bg-[#18664a]"
                    >
                      {resolvedDeliveryAddress.recipientName.trim() ||
                      resolvedDeliveryAddress.buildingName.trim()
                        ? "Add address details"
                        : "Add address Details"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-[#f0ddb0] bg-[#fffaf0] p-4 text-sm leading-6 text-[#7a5a11]">
                  Map search is not connected yet. Add a Google Maps browser key
                  to enable suggestions, map pinning, and current-location
                  selection.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
      {isAddressDetailsOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:px-6 sm:py-6">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={closePicker}
            aria-label="Close address details sheet"
          />

          <section className="relative flex h-[88dvh] w-full max-w-none flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#ececec] px-5 py-4">
              <div className="min-w-0">
                <h2 className="mt-1 text-lg font-bold text-[#171410]">
                  Deliver To
                </h2>
              </div>

              <button
                type="button"
                onClick={closePicker}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-neutral-50"
                aria-label="Close address details sheet"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 sm:px-5">
              {statusMessage ? (
                <div
                  className={`mb-3 rounded-xl px-4 py-3 text-sm font-medium ${
                    statusMessage === "Saved"
                      ? "bg-[#eaf5ea] text-[#1f6a34]"
                      : "bg-[#f8fafc] text-[#374151]"
                  }`}
                >
                  {statusMessage}
                </div>
              ) : null}

              <span className="text-xs text-gray-400">
                Area/Sector/Locality
              </span>
              <div className="rounded-md border border-[#ececec] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mt-1 text-base font-semibold text-[#171410]">
                      {deliveryNameLine}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {deliverySummaryLine}
                    </p>
                  </div>
                <button
                  type="button"
                  onClick={closeAddressDetails}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#207958] px-4 text-sm font-semibold text-[#207958] transition hover:bg-[#f4fbf4]"
                >
                  Change
                  </button>
                </div>
              </div>

              {addressDetailsForm}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[#ececec] bg-white p-4">
              <button
                type="button"
                onClick={closeAddressDetails}
                className="h-12 rounded-md border border-gray-200 text-sm font-semibold text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void commitDeliveryAddress()}
                disabled={!canCommitDeliveryAddress || isSavingProfile}
                className={`h-12 rounded-md text-sm font-semibold transition ${
                  canCommitDeliveryAddress && !isSavingProfile
                    ? "bg-[#207958] text-white hover:bg-[#1b4700]"
                    : "cursor-not-allowed bg-[#20795840] text-gray-400"
                }`}
              >
                {isSavingProfile ? "Saving..." : "Save address"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export { DELIVERY_ADDRESS_EVENT };
