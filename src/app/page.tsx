import HomePage from "@/pages/Home/Layout";
import SiteShell from "@/components/SiteShell";
import { fetchHomeCategoryItems } from "@/lib/homeCategoryItems";
import { fetchProducts } from "@/lib/products";
import { getServerSavedDeliveryAddress } from "@/lib/serverProfile";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, categoryItems, initialDeliveryAddress] = await Promise.all([
    fetchProducts(),
    fetchHomeCategoryItems().catch(() => []),
    getServerSavedDeliveryAddress(),
  ]);

  return (
    <SiteShell showFooter headerInitialAddress={initialDeliveryAddress}>
      <HomePage
        categoryItems={categoryItems}
        products={products}
        initialDeliveryAddress={initialDeliveryAddress}
      />
    </SiteShell>
  );
}
