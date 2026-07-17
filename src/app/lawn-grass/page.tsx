import SiteShell from "@/components/SiteShell";
import LawnGrassBulkOrderPageClient from "@/components/LawnGrassBulkOrderPageClient";
import {
  fetchLawnGrassPageProduct,
  fetchProducts,
  type Product,
} from "@/lib/products";
import { slugifyProductName } from "@/lib/productUrls";

const fallbackProduct: Product = {
  id: "lawn-grass",
  productId: "lawn-grass",
  name: "Lawn Grass",
  category: "Lawn Grass",
  variety: "",
  containerSize: "",
  height: "",
  price: 12,
  mrp: 12,
  weight: 1,
  offer: "",
  minOrderQuantity: 1,
  stock: 999999,
  isOnTrend: false,
  isFeaturedLatest: false,
  packLabel: "Bulk order",
  unit: "units",
  badge: "",
  description: "Bulk lawn grass pricing with slab-based rates and delivery calculation.",
  image: "",
  images: [],
  usesImages: [],
  tags: ["lawn-grass"],
  videoClips: [],
  optionGroups: [],
  detailSections: [],
  quantityPricingSlabs: [
    {
      key: "1-500",
      label: "1-500 units",
      minQuantity: 1,
      maxQuantity: 500,
      pricePerUnit: 12,
      note: "",
    },
    {
      key: "501-1000",
      label: "501-1,000 units",
      minQuantity: 501,
      maxQuantity: 1000,
      pricePerUnit: 10,
      note: "",
    },
    {
      key: "1001-1500",
      label: "1,001-1,500 units",
      minQuantity: 1001,
      maxQuantity: 1500,
      pricePerUnit: 8,
      note: "",
    },
  ],
};

export default async function LawnGrassPage() {
  let products: Product[] = [];

  try {
    products = await fetchProducts({
      limit: 200,
    });
  } catch {
    products = [];
  }

  let linkedProduct: Product | null = null;

  try {
    linkedProduct = await fetchLawnGrassPageProduct();
  } catch {
    linkedProduct = null;
  }

  const product =
    linkedProduct ||
    products.find((item) => slugifyProductName(item.name) === "lawn-grass") ||
    products.find((item) => slugifyProductName(item.name).includes("lawn-grass")) ||
    products.find((item) => slugifyProductName(item.name).includes("lawn")) ||
    products.find((item) => slugifyProductName(item.name).includes("grass")) ||
    products.find((item) => item.tags.some((tag) => slugifyProductName(tag).includes("lawn-grass"))) ||
    products.find((item) => item.tags.some((tag) => slugifyProductName(tag).includes("grass"))) ||
    fallbackProduct;

  const recommendations = products
    .filter((item) => item.id !== product.id)
    .filter((item) => item.category === product.category || item.tags.includes("lawn-grass"))
    .slice(0, 4);

  const fallbackRecommendations = products
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  const displayRecommendations = recommendations.length
    ? recommendations
    : fallbackRecommendations;

  return (
    <SiteShell hideMobileBottomNav>
      <LawnGrassBulkOrderPageClient
        product={product}
        recommendations={displayRecommendations}
      />
    </SiteShell>
  );
}
