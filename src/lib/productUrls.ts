import type { Product } from "@/lib/products";

export function slugifyProductName(productName: string) {
  return String(productName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildProductHref(input: {
  name: string;
  productId: string;
}) {
  return `/products/${slugifyProductName(input.name)}/${encodeURIComponent(
    String(input.productId || "").trim(),
  )}`;
}

export function getProductHref(product: Pick<Product, "name" | "productId">) {
  return buildProductHref(product);
}
