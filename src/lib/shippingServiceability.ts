import { requestJson } from "@/lib/api";

export type ShippingServiceabilityResponse = {
  serviceable: boolean;
  reason: string | null;
  matchedRule: {
    action: "ALLOW" | "BLOCK";
    ruleType: "PIN" | "PIN_RANGE" | "CITY" | "DISTRICT" | "POLYGON" | "LATLNG";
    pin?: string;
    startPin?: string;
    endPin?: string;
    reason?: string;
  } | null;
};

export async function checkShippingServiceability(params: {
  countryCode: string;
  stateCode: string;
  pin: string;
}) {
  const query = new URLSearchParams({
    country: params.countryCode,
    state: params.stateCode,
    pin: params.pin,
  });

  return requestJson<ShippingServiceabilityResponse>(
    `/shipping/check?${query.toString()}`,
  );
}
