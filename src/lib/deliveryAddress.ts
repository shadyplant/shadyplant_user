import {
  normalizeDeliveryAddress,
  type DeliveryAddress,
} from "@/lib/validation";

const PLUS_CODE_PREFIX_PATTERN = /^\s*[A-Z0-9]{4,}\+[A-Z0-9]{2,}\s*/i;

function cleanAddressPart(value: unknown) {
  return String(value || "")
    .replace(PLUS_CODE_PREFIX_PATTERN, "")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,+/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/^,\s*|\s*,$/g, "")
    .trim();
}

function dedupeAddressParts(parts: string[]) {
  const seen = new Set<string>();

  return parts.filter((part) => {
    const normalizedPart = part.trim().toLowerCase();

    if (!normalizedPart || seen.has(normalizedPart)) {
      return false;
    }

    seen.add(normalizedPart);
    return true;
  });
}

export function sanitizeFormattedDeliveryAddress(value: unknown) {
  return cleanAddressPart(value);
}

export function formatDeliveryAddress(
  deliveryAddress: Partial<DeliveryAddress> | null | undefined,
) {
  if (!deliveryAddress) {
    return "";
  }

  const formattedAddress = cleanAddressPart(deliveryAddress.formattedAddress);
  const line1 = cleanAddressPart(deliveryAddress.line1);
  const line2 = cleanAddressPart(deliveryAddress.line2);
  const city = cleanAddressPart(deliveryAddress.city);
  const state = cleanAddressPart(deliveryAddress.state);
  const postalCode = cleanAddressPart(deliveryAddress.postalCode);

  const compactLabel = dedupeAddressParts([
    line2,
    line1 && line1.toLowerCase() !== city.toLowerCase() ? line1 : "",
    city,
    state,
  ]).join(", ");

  if (compactLabel) {
    return compactLabel;
  }

  if (formattedAddress) {
    return formattedAddress;
  }

  return dedupeAddressParts([line1, line2, city, state, postalCode]).join(", ");
}

export function buildCheckoutDeliveryAddressPayload(
  formattedAddress: string,
  selectedDeliveryAddress?: Partial<DeliveryAddress> | null,
  savedDeliveryAddress?: Partial<DeliveryAddress> | null,
): DeliveryAddress {
  const normalizedSelectedDeliveryAddress = normalizeDeliveryAddress(
    selectedDeliveryAddress,
  );
  const normalizedSavedDeliveryAddress =
    normalizeDeliveryAddress(savedDeliveryAddress);
  const hasSelectedDeliveryAddress = Object.values(
    normalizedSelectedDeliveryAddress,
  ).some(Boolean);
  const hasSavedDeliveryAddress = Object.values(
    normalizedSavedDeliveryAddress,
  ).some(Boolean);
  const baseDeliveryAddress = hasSelectedDeliveryAddress
    ? normalizedSelectedDeliveryAddress
    : hasSavedDeliveryAddress
      ? normalizedSavedDeliveryAddress
      : normalizeDeliveryAddress(null);
  const cleanedFormattedAddress =
    cleanAddressPart(formattedAddress) ||
    cleanAddressPart(baseDeliveryAddress.formattedAddress) ||
    cleanAddressPart(baseDeliveryAddress.line1);
  const cleanedLine1 =
    cleanAddressPart(baseDeliveryAddress.line1) || cleanedFormattedAddress;

  return {
    ...baseDeliveryAddress,
    formattedAddress: cleanedFormattedAddress,
    line1: cleanedLine1,
  };
}

export function buildPersistedDeliveryAddress(
  deliveryAddress?: Partial<DeliveryAddress> | null,
): DeliveryAddress {
  const normalizedDeliveryAddress = normalizeDeliveryAddress(deliveryAddress);
  const cleanedFormattedAddress =
    cleanAddressPart(normalizedDeliveryAddress.formattedAddress) ||
    cleanAddressPart(normalizedDeliveryAddress.line1);
  const hasStructuredAddress = Boolean(
    cleanAddressPart(normalizedDeliveryAddress.line1) &&
      cleanAddressPart(normalizedDeliveryAddress.city) &&
      cleanAddressPart(normalizedDeliveryAddress.state) &&
      cleanAddressPart(normalizedDeliveryAddress.postalCode),
  );

  if (hasStructuredAddress) {
    return {
      ...normalizedDeliveryAddress,
      formattedAddress:
        cleanedFormattedAddress ||
        formatDeliveryAddress(normalizedDeliveryAddress),
    };
  }

  return {
    formattedAddress: cleanedFormattedAddress,
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    landmark: "",
    notes: "",
  };
}
