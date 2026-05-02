import HomePage from "@/pages/Home/Layout";
import SiteShell from "@/components/SiteShell";
import { fetchProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await fetchProducts();

  return (
    <SiteShell showFooter>
      <HomePage products={products} />
    </SiteShell>
  );
}
