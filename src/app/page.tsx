import HomePage from "@/pages/Home/Layout";
import MaintenanceNotice from "@/components/MaintenanceNotice";
import SiteShell from "@/components/SiteShell";
import { fetchHomeCategoryItems } from "@/lib/homeCategoryItems";
import { fetchHomeSliderBanners } from "@/lib/homeSliderBanners";
import { fetchProducts } from "@/lib/products";
import { getServerSavedDeliveryAddress } from "@/lib/serverProfile";

export const dynamic = "force-dynamic";

export default async function Home() {
  let products: Awaited<ReturnType<typeof fetchProducts>> | null = null;
  let categoryItems:
    | Awaited<ReturnType<typeof fetchHomeCategoryItems>>
    | null = null;
  let homeSliderBanners:
    | Awaited<ReturnType<typeof fetchHomeSliderBanners>>
    | null = null;
  let initialDeliveryAddress = "";
  let shouldShowMaintenance = false;

  try {
    [products, categoryItems, homeSliderBanners, initialDeliveryAddress] =
      await Promise.all([
        fetchProducts(),
        fetchHomeCategoryItems().catch(() => []),
        fetchHomeSliderBanners().catch(() => []),
        getServerSavedDeliveryAddress(),
      ]);
  } catch {
    shouldShowMaintenance = true;
  }

  if (shouldShowMaintenance) {
    return <MaintenanceNotice />;
  }

  if (!products || !categoryItems || !homeSliderBanners) {
    return <MaintenanceNotice />;
  }

  return (
    <SiteShell showFooter headerInitialAddress={initialDeliveryAddress}>
      <HomePage
        categoryItems={categoryItems}
        homeSliderBanners={homeSliderBanners}
        products={products}
        initialDeliveryAddress={initialDeliveryAddress}
      />
    </SiteShell>
  );
}
