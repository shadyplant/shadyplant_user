import { renderProductDetailsPage } from "@/app/products/productDetailsPage";

export const dynamic = "force-dynamic";

export default async function ProductDetailsCanonicalPage({
  params,
}: {
  params: Promise<{ productName: string; productId: string }>;
}) {
  const { productName, productId } = await params;

  return renderProductDetailsPage({
    productLookupId: productId,
    requestedProductName: productName,
  });
}
