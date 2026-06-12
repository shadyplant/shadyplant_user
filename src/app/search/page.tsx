import SearchResultsPageClient from "@/components/search/SearchResultsPageClient";
import MaintenanceNotice from "@/components/MaintenanceNotice";
import { fetchProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  let products: Awaited<ReturnType<typeof fetchProducts>> | null = null;
  let shouldShowMaintenance = false;

  try {
    products = await fetchProducts();
  } catch {
    shouldShowMaintenance = true;
  }

  if (shouldShowMaintenance) {
    return <MaintenanceNotice />;
  }

  if (!products) {
    return <MaintenanceNotice />;
  }

  return <SearchResultsPageClient products={products} />;
}
