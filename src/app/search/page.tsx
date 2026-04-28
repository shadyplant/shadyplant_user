import SearchResultsPageClient from "@/components/search/SearchResultsPageClient";
import { fetchProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const products = await fetchProducts();

  return <SearchResultsPageClient products={products} />;
}
