import { requestJson, type ApiResponse } from "@/lib/api";

export type DeliveryChargeProfileSnapshot = {
  code: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: {
    maxWeightKg?: number;
    states?: string[];
    [key: string]: unknown;
  };
};

export type DeliveryConfigSnapshot = {
  profiles: DeliveryChargeProfileSnapshot[];
  slabs: Record<string, unknown>;
};

export type DeliveryConfigResponse = {
  config: DeliveryConfigSnapshot;
};

function normalizeStateKey(state: string) {
  return String(state || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function resolveServerDeliveryWeightCapKg(
  config: DeliveryConfigSnapshot | null | undefined,
  state: string,
) {
  const normalizedState = normalizeStateKey(state);

  if (!config || !normalizedState) {
    return null;
  }

  const matchingProfile = config.profiles.find((profile) => {
    if (profile.isActive === false) {
      return false;
    }

    const states = profile.metadata?.states;
    if (!Array.isArray(states) || !states.length) {
      return false;
    }

    return states.some((entry) => normalizeStateKey(entry) === normalizedState);
  });

  const maxWeightKg = Number(matchingProfile?.metadata?.maxWeightKg);

  return Number.isFinite(maxWeightKg) && maxWeightKg > 0
    ? maxWeightKg
    : null;
}

export async function fetchDeliveryConfigSnapshot(signal?: AbortSignal) {
  const response = await requestJson<ApiResponse<DeliveryConfigResponse>>(
    "/delivery-config",
    {
      signal,
    },
  );

  return response.data.config;
}
