import { notFound } from "next/navigation";
import LawnGrassBulkOrderPageClient from "@/components/LawnGrassBulkOrderPageClient";
import { fetchProducts } from "@/lib/products";
import { slugifyProductName } from "@/lib/productUrls";

export default async function LawnGrassProductPage({
  params,
}: {
  params: { productName: string };
}) {
  if (slugifyProductName(params.productName) !== "lawn-grass") {
    notFound();
  }

  if (params.productName === "lawn-grass") {
    notFound();
  }

  const products = await fetchProducts({
    query: "lawn grass",
    limit: 12,
  });

  const product =
    products.find((item) => slugifyProductName(item.name) === "lawn-grass") ||
    products.find((item) => slugifyProductName(item.name).includes("lawn-grass")) ||
    null;

  if (!product) {
    notFound();
  }

  const recommendations = products
    .filter((item) => item.id !== product.id)
    .filter((item) => item.category === product.category || item.tags.includes("lawn-grass"))
    .slice(0, 4);

  return (
    <LawnGrassBulkOrderPageClient
      product={product}
      recommendations={recommendations}
    />
  );
}
