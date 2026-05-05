import { getApiBaseUrl } from "@/lib/api";

export type HomeCategoryItem = {
  id: string;
  organizationId?: string;
  itemKey: string;
  label: string;
  href: string;
  image: string;
  accentFrom: string;
  accentVia: string;
  accentTo: string;
  showOfferBadge: boolean;
  isActive: boolean;
  sortOrder: number;
};

type HomeCategoryItemApiResponse = {
  message: string;
  data: {
    items: HomeCategoryItem[];
  };
};

export async function fetchHomeCategoryItems() {
  const response = await fetch(`${getApiBaseUrl()}/home-categories`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch home category items.");
  }

  const payload = (await response.json()) as HomeCategoryItemApiResponse;
  return payload.data.items;
}
