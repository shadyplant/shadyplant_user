import { getApiBaseUrl } from "@/lib/api";

export type HomeSliderBanner = {
  id: string;
  organizationId?: string;
  itemKey: string;
  title: string;
  href: string;
  desktopImage: string;
  mobileImage: string;
  isActive: boolean;
  sortOrder: number;
  actionType?: "link" | "popup";
  popupKey?: string;
};

type HomeSliderBannerApiResponse = {
  message: string;
  data: {
    items: HomeSliderBanner[];
  };
};

export async function fetchHomeSliderBanners() {
  const response = await fetch(`${getApiBaseUrl()}/home-slider-banners`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch home slider banners.");
  }

  const payload = (await response.json()) as HomeSliderBannerApiResponse;
  return payload.data.items;
}
