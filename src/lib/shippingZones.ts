import { requestJson } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";

export type ShippingZoneType = "service" | "restriction";

export type ShippingZonePoint = {
  lat: number;
  lng: number;
};

export type ShippingZone = {
  id: string;
  name: string;
  zoneType: ShippingZoneType;
  description: string;
  notes: string;
  isActive: boolean;
  fillColor: string;
  strokeColor: string;
  opacity: number;
  polygon: ShippingZonePoint[];
  pointCount: number;
  vertices: ShippingZonePoint[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type ShippingZoneListResponse = {
  zones: ShippingZone[];
};

export async function listShippingZones() {
  const response = await requestJson<ApiResponse<ShippingZoneListResponse>>(
    "/shipping-zones",
  );

  return response.data.zones;
}
