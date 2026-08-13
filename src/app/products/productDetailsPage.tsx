import Link from "next/link";
import { ChevronRight, Star, Truck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import ProductDeliveryAddressPicker from "@/components/ProductDeliveryAddressPicker";
import MobileSearchHeader from "@/components/MobileSearchHeader";
import MobileProductImageCarousel from "@/components/MobileProductImageCarousel";
import ProductMobileActionBar from "@/components/ProductMobileActionBar";
import ProductReviewsPanel from "@/components/ProductReviewsPanel";
import MobileProductReviewsSummary from "@/components/MobileProductReviewsSummary";
import ProductBuyNowButton from "@/components/ProductBuyNowButton";
import ProductDetailsSections from "@/components/ProductDetailsSections";
import ProductImageGallery from "@/components/ProductImageGallery";
import {
  ProductOptionGroupsSelector,
  ProductOptionSelectionProvider,
  SelectedProductMrp,
  SelectedProductPrice,
  SelectedProductStockNotice,
} from "@/components/ProductOptionSelectionContext";
import SiteShell from "@/components/SiteShell";
import MaintenanceNotice from "@/components/MaintenanceNotice";
import WishlistButton from "@/components/WishlistButton";
import { fetchProductById, fetchProducts } from "@/lib/products";
import { fetchProductReviews } from "@/lib/productReviews";
import { getProductHref, slugifyProductName } from "@/lib/productUrls";
import SeeInActionCarousel from "@/components/carousal/SeeInActionCarousel";
import ShareButton from "@/components/ShareButton";

const PRODUCT_DELIVERY_OFFSET_DAYS = 7;

function formatExpectedDeliveryLabel() {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + PRODUCT_DELIVERY_OFFSET_DAYS);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(deliveryDate);
}

export async function renderProductDetailsPage({
  productLookupId,
  requestedProductName,
}: {
  productLookupId: string;
  requestedProductName?: string;
}) {
  let product: Awaited<ReturnType<typeof fetchProductById>> | null = null;
  let shouldShowMaintenance = false;

  try {
    product = await fetchProductById(productLookupId);
  } catch {
    shouldShowMaintenance = true;
  }

  if (shouldShowMaintenance) {
    return <MaintenanceNotice />;
  }

  if (!product) {
    notFound();
  }

  const canonicalProductName = slugifyProductName(product.name);
  const canonicalHref = getProductHref(product);

  if (requestedProductName !== canonicalProductName) {
    redirect(canonicalHref);
  }

  let relatedProducts: Awaited<ReturnType<typeof fetchProducts>> | null = null;
  let reviewData: Awaited<ReturnType<typeof fetchProductReviews>> | null = null;

  try {
    [relatedProducts, reviewData] = await Promise.all([
      fetchProducts({
        category: product.category,
        excludeId: product.id,
        limit: 3,
      }),
      fetchProductReviews(product.id),
    ]);
  } catch {
    shouldShowMaintenance = true;
  }

  if (shouldShowMaintenance) {
    return <MaintenanceNotice />;
  }
  if (!reviewData || !relatedProducts) {
    return <MaintenanceNotice />;
  }
  const productOptionGroups = product.optionGroups;
  const hasRatings = reviewData.summary.totalRatings > 0;
  const expectedDeliveryLabel = formatExpectedDeliveryLabel();
  const productHighlights = [
    product.variety,
    product.containerSize,
    product.height,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const productMetaLine = productHighlights.join(" | ");

  return (
    <SiteShell hideMobileHeader hideMobileBottomNav showFooter>
      <div className="bg-white">
        <MobileSearchHeader />
        <section className="bg-white pb-24 md:hidden">
          <ProductOptionSelectionProvider
            product={product}
            optionGroups={productOptionGroups}
          >
            <div className="min-h-screen w-full">
              <MobileProductImageCarousel
                images={product.images}
                productId={product.id}
                productName={product.name}
                rating={
                  hasRatings
                    ? reviewData.summary.averageRating.toFixed(1)
                    : undefined
                }
                totalRatings={
                  hasRatings ? reviewData.summary.totalRatings : undefined
                }
              />

              <div className="mx-auto w-full max-w-2xl px-4 pb-8 pt-3 sm:px-4">
                <section>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-lg md:text-[24px] font-medium text-[#3a3a3a]">
                        {product.name}
                      </h1>
                      {productMetaLine ? (
                        <p className="mt-1 line-clamp-1 text-gray-600 text-sm">
                          {productMetaLine}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs leading-normal text-gray-400">
                    {product.description}
                  </p>

                  <div className="mt-6 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-lg font-semibold leading-none text-[#07ab4e]">
                      <SelectedProductPrice />
                    </span>
                    <SelectedProductMrp className="text-[14px] font-medium text-[#9d9d9d] line-through" />
                    <span className="text-sm text-gray-400]">
                      {product.unit}
                    </span>
                  </div>
                  <SelectedProductStockNotice className="mt-2 block text-[12px] font-black uppercase tracking-[0.14em] text-[#b23b2b]" />

                  <p className="mt-2 text-xs font-normal text-gray-700">
                    <span>
                      <Truck
                        size={16}
                        className="inline-block mr-1.5 text-gray-500"
                      />
                    </span>
                    <span> Expected delivery by {expectedDeliveryLabel}</span>
                  </p>
                </section>

                <ProductDeliveryAddressPicker />

                <ProductOptionGroupsSelector variant="mobile" />
                <div className="mt-5">
                  <ProductDetailsSections product={product} />
                </div>

                <MobileProductReviewsSummary
                  productId={product.id}
                  reviewData={reviewData}
                  productName={product.name}
                />

                <SeeInActionCarousel
                  key={`${product.id}-mobile-real-view`}
                  images={product.usesImages}
                  productName={product.name}
                />

                {relatedProducts.length ? (
                  <section className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-[16px] font-semibold text-[#171410]">
                        Related Products
                      </h2>
                      <Link href="/search" className=" text-sm text-[#55ad35]">
                        View All
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {relatedProducts.map((relatedProduct) => (
                        <ProductCard
                          key={relatedProduct.id}
                          product={relatedProduct}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
            <ProductMobileActionBar
              productId={product.id}
              stock={product.stock}
              minOrderQuantity={product.minOrderQuantity}
              maxPurchaseQuantity={product.maxPurchaseQuantity}
            />
          </ProductOptionSelectionProvider>
        </section>

        <section className="hidden bg-white px-4 py-8 md:block md:px-6 md:py-4">
          <ProductOptionSelectionProvider
            product={product}
            optionGroups={productOptionGroups}
          >
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500 md:text-sm">
                <Link href="/" className="hover:text-[#214f14]">
                  Home
                </Link>
                <span>
                  <ChevronRight size={14} />
                </span>
                <Link href="/" className="hover:text-">
                  products
                </Link>
                <span>
                  <ChevronRight size={14} />
                </span>
                <span className="text-gray-500">{product.name}</span>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                <div className="lg:sticky lg:top-0 lg:self-start">
                  <ProductImageGallery
                    images={product.images}
                    productName={product.name}
                    overlayContent={
                      <>
                        <WishlistButton
                          productId={product.id}
                          size={25}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/92 text-[#5f5f5f] shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm transition hover:bg-white"
                        />

                        <ShareButton
                          url={
                            typeof window !== "undefined"
                              ? window.location.href
                              : undefined
                          }
                          productName={product.name}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/92 text-[#5f5f5f] shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm transition hover:bg-white"
                        />
                      </>
                    }
                  />
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl p-2 md:p-0">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <h1 className="max-w-2xl text-xl md:text-2xl font-bold leading-tight text-[#3a3a3a]">
                          {product.name}
                        </h1>
                        {productMetaLine ? (
                          <p className="w-full max-w-2xl text-gray-600 text-base">
                            {productMetaLine}
                          </p>
                        ) : null}
                      </div>

                      {hasRatings && (
                        <div className="inline-flex items-center gap-2 text-[15px] font-medium text-[#6f6f6f]">
                          <Star
                            size={14}
                            className="text-[#f1bf4a]"
                            fill="currentColor"
                          />
                          <span>
                            {reviewData.summary.averageRating.toFixed(1)} |{" "}
                            {reviewData.summary.totalRatings} ratings
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="mt-3 max-w-2xl text-sm leading-normal text-gray-400">
                      {product.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p className="text-2xl font-medium leading-none text-[#07ab4e]">
                        <SelectedProductPrice />
                      </p>
                      <SelectedProductMrp className="text-[18px] font-medium text-[#9d9d9d] line-through" />
                      <span className="text-sm text-gray-400">
                        {product.unit}
                      </span>
                    </div>
                    <SelectedProductStockNotice className="mt-2 block text-[12px] font-black uppercase tracking-[0.14em] text-[#b23b2b]" />

                    <p className="mt-5 text-sm font-normal text-gray-700">
                      <span>
                        <Truck
                          size={16}
                          className="inline-block mr-1.5 text-gray-500"
                        />
                      </span>
                      <span> Expected delivery by {expectedDeliveryLabel}</span>
                    </p>

                    <ProductDeliveryAddressPicker />

                    <div className="mt-5">
                      <ProductOptionGroupsSelector variant="desktop" />
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:mt-8">
                      <AddToCartButton
                        productId={product.id}
                        availableStock={product.stock}
                        minOrderQuantity={product.minOrderQuantity}
                        maxPurchaseQuantity={product.maxPurchaseQuantity}
                        showQuantityControls
                        className="flex h-12 w-full items-center justify-center rounded-[0.5rem] bg-[#207958] px-4 text-sm font-semibold text-white shadow-none transition hover:bg-[#18664a]"
                      />
                      <ProductBuyNowButton
                        productId={product.id}
                        availableStock={product.stock}
                        minOrderQuantity={product.minOrderQuantity}
                        maxPurchaseQuantity={product.maxPurchaseQuantity}
                        className="rounded-[0.5rem] border border-[#b5b5b5] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#2f2f2f] md:px-5 md:py-3"
                      >
                        Buy Now
                      </ProductBuyNowButton>
                    </div>
                  </div>

                  <div className="mt-2">
                    <ProductDetailsSections product={product} />
                  </div>

                  <ProductReviewsPanel
                    productId={product.id}
                    productName={product.name}
                    reviewData={reviewData}
                  />
                </div>
              </div>

              <SeeInActionCarousel
                key={`${product.id}-desktop-real-view`}
                images={product.usesImages}
                productName={product.name}
              />

              {relatedProducts.length ? (
                <div className="mt-2 rounded-2xl p-0 md:mt-2 md:p-8">
                  <div className="mb-5 md:mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b8b58] md:text-xs">
                      More to explore
                    </p>
                    <h2 className="mt-1.5 text-xl font-bold text-[#163915] md:mt-2 md:text-2xl md:tracking-tight">
                      Similar picks you may like
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
                    {relatedProducts.map((relatedProduct) => (
                      <ProductCard
                        key={relatedProduct.id}
                        product={relatedProduct}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </ProductOptionSelectionProvider>
        </section>
      </div>
    </SiteShell>
  );
}
