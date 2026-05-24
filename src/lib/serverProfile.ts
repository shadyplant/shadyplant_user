import "server-only";

import { cookies } from "next/headers";
import { formatDeliveryAddress } from "@/lib/deliveryAddress";
import { getApiBaseUrl, type ApiResponse } from "@/lib/api";
import { normalizeDeliveryAddress, type DeliveryAddress } from "@/lib/validation";

type RefreshPayload = {
  user?: {
    deliveryAddress?: Partial<DeliveryAddress> | null;
  } | null;
};

export async function getServerSavedDeliveryAddress() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) {
    return "";
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/session-user`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      return "";
    }

    const payload = (await response.json()) as ApiResponse<RefreshPayload>;
    return formatDeliveryAddress(
      normalizeDeliveryAddress(payload?.data?.user?.deliveryAddress),
    );
  } catch {
    return "";
  }
}
