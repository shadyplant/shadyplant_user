import Link from "next/link";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
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
import { getProductExperience } from "@/components/ProductDetailsSections";
import ProductImageGallery from "@/components/ProductImageGallery";
import {
  ProductOptionGroupsSelector,
  ProductOptionSelectionProvider,
  SelectedProductMrp,
  SelectedProductPrice,
  SelectedProductStockNotice,
} from "@/components/ProductOptionSelectionContext";
import SiteShell from "@/components/SiteShell";
import WishlistButton from "@/components/WishlistButton";
import {
  fetchProductById,
  fetchProducts,
} from "@/lib/products";
import { fetchProductReviews } from "@/lib/productReviews";
import { getProductHref, slugifyProductName } from "@/lib/productUrls";
import SeeInActionCarousel from "@/components/carousal/SeeInActionCarousel";

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
  const product = await fetchProductById(productLookupId);

  if (!product) {
    notFound();
  }

  const canonicalProductName = slugifyProductName(product.name);
  const canonicalHref = getProductHref(product);

  if (requestedProductName !== canonicalProductName) {
    redirect(canonicalHref);
  }

  const [relatedProducts, reviewData] = await Promise.all([
    fetchProducts({
      category: product.category,
      excludeId: product.id,
      limit: 3,
    }),
    fetchProductReviews(product.id),
  ]);
  const productExperience = getProductExperience(product);
  const productOptionGroups = product.optionGroups;
  const hasRatings = reviewData.summary.totalRatings > 0;
  const detailSections = productExperience.accordions;
  const expectedDeliveryLabel = formatExpectedDeliveryLabel();

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
                productName={product.name}
                rating={
                  hasRatings
                    ? reviewData.summary.averageRating.toFixed(1)
                    : "New"
                }
              />

              <div className="mx-auto w-full max-w-2xl px-4 pb-8 pt-3 sm:px-4">
                <section>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-[24px] font-medium leading-7 text-[#3a3a3a]">
                        {product.name}
                      </h1>
                    </div>
                    <p className="shrink-0 pt-1 text-[15px] font-medium text-[#6f6f6f]">
                      {hasRatings
                        ? `${reviewData.summary.averageRating.toFixed(1)} | ${reviewData.summary.totalRatings} ratings`
                        : "New | 0 ratings"}
                    </p>
                  </div>

                  <p className="mt-2 text-[15px] font-normal leading-6 text-[#6f6f6f]">
                    {product.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-lg font-semibold leading-none text-[#111111]">
                      <SelectedProductPrice />
                    </span>
                    <span className="text-[14px] font-medium text-[#6f6f6f]">
                      {product.unit}
                    </span>
                    <SelectedProductMrp className="text-[14px] font-medium text-[#9d9d9d] line-through" />
                  </div>
                  <SelectedProductStockNotice className="mt-2 block text-[12px] font-black uppercase tracking-[0.14em] text-[#b23b2b]" />

                  <p className="mt-5 text-[14px] font-normal text-[#4e4e4e]">
                    Expected delivery by {expectedDeliveryLabel}
                  </p>
                </section>

                <ProductDeliveryAddressPicker />

                <ProductOptionGroupsSelector variant="mobile" />

                <section className="mt-5 border-y border-[#dddddd] bg-white">
                {detailSections.map((item) => (
                  <details
                    key={item.title}
                    className="group border-b border-[#dddddd] py-2.5 last:border-b-0"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <span>
                        <span className="block text-[15px] font-semibold leading-5 text-[#111111]">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-4 text-[#4f4f4f] group-open:hidden">
                          {item.description.split(/\r?\n/)[0]}
                        </span>
                      </span>
                      <ChevronDown
                        size={18}
                        className="shrink-0 text-[#6d6d6d] transition group-open:rotate-180"
                      />
                    </summary>
                    <div className="space-y-2 pb-1 pt-3 text-[13px] leading-6 text-[#4f4f4f]">
                      {item.description
                        .split(/\r?\n/)
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => (
                        <p key={line}>{line}</p>
                        ))}
                    </div>
                  </details>
                ))}
                </section>

                <MobileProductReviewsSummary
                  productId={product.id}
                  reviewData={reviewData}
                  productName={product.name}
                />

                <SeeInActionCarousel
                  key={`${product.id}-mobile-real-view`}
                  clips={product.videoClips}
                  productName={product.name}
                />

                {relatedProducts.length ? (
                  <section className="mt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[16px] font-semibold text-[#171410]">
                      Related Products
                    </h2>
                    <Link
                      href="/search"
                      className=" text-sm text-[#55ad35]"
                    >
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
            />
          </ProductOptionSelectionProvider>
        </section>

        <section className="hidden bg-white px-4 py-8 md:block md:px-6 md:py-12">
          <ProductOptionSelectionProvider
            product={product}
            optionGroups={productOptionGroups}
          >
            <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5b7751] md:text-sm">
              <Link href="/" className="hover:text-[#214f14]">
                Home
              </Link>
              <span>
                <ChevronRight size={14} />
              </span>
              <Link href="/" className="hover:text-[#214f14]">
                products
              </Link>
              <span>
                <ChevronRight size={14} />
              </span>
              <span className="text-[#214f14]">{product.name}</span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <ProductImageGallery
                  images={product.images}
                  productName={product.name}
                  overlayContent={
                    <WishlistButton
                      productId={product.id}
                      size={24}
                      className="h-11 w-11 rounded-full bg-white/92 shadow-md backdrop-blur text-[#159100]"
                    />
                  }
                />
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl p-2 md:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <h1 className="max-w-2xl text-[32px] font-medium leading-tight text-[#3a3a3a]">
                      {product.name}
                    </h1>

                    <div className="inline-flex items-center gap-2 text-[15px] font-medium text-[#6f6f6f]">
                      <Star
                        size={14}
                        className="text-[#f1bf4a]"
                        fill="currentColor"
                      />
                      <span>
                        {hasRatings
                          ? `${reviewData.summary.averageRating.toFixed(1)} | ${reviewData.summary.totalRatings} ratings`
                          : "New | 0 ratings"}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 max-w-2xl text-base leading-7 text-[#6f6f6f]">
                    {product.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-[42px] font-medium leading-none text-[#2f2f2f]">
                      <SelectedProductPrice />
                    </p>
                    <span className="text-[18px] font-medium text-[#6f6f6f]">
                      {product.unit}
                    </span>
                    <SelectedProductMrp className="text-[18px] font-medium text-[#9d9d9d] line-through" />
                  </div>
                  <SelectedProductStockNotice className="mt-2 block text-[12px] font-black uppercase tracking-[0.14em] text-[#b23b2b]" />

                  <p className="mt-5 text-[18px] font-normal text-[#4e4e4e]">
                    Expected delivery by {expectedDeliveryLabel}
                  </p>

                  <ProductDeliveryAddressPicker />

                  <div className="mt-5">
                    <ProductOptionGroupsSelector variant="desktop" />
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 md:mt-8">
                    <AddToCartButton
                      productId={product.id}
                      availableStock={product.stock}
                      minOrderQuantity={product.minOrderQuantity}
                      showQuantityControls
                      className="w-full rounded-none bg-[#4c8d5b] text-white shadow-none"
                    />
                    <ProductBuyNowButton
                      productId={product.id}
                      availableStock={product.stock}
                      minOrderQuantity={product.minOrderQuantity}
                      className="rounded-none border border-[#b5b5b5] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#2f2f2f] md:px-5 md:py-3"
                    >
                      Buy Now
                    </ProductBuyNowButton>
                  </div>
                </div>

                <section className="border-t border-[#dddddd]">
                  {detailSections.map((item) => (
                    <details
                      key={item.title}
                      className="group border-b border-[#dddddd] last:border-b-0"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4">
                        <div>
                          <p className="text-[16px] font-medium text-[#3a3a3a] md:text-[18px]">
                            {item.title}
                          </p>
                          <p className="mt-1 text-[14px] text-[#6f6f6f] md:text-[15px]">
                            {item.description.split(/\r?\n/)[0]}
                          </p>
                        </div>
                        <ChevronDown
                          className="shrink-0 text-[#6d6d6d] transition group-open:rotate-180"
                          size={18}
                        />
                      </summary>

                      <div className="pb-4">
                        <div className="border-t border-[#dddddd] pt-3">
                          <div className="space-y-2.5 text-[14px] leading-6 text-[#4f4f4f] md:text-[15px]">
                            {item.description
                              .split(/\r?\n/)
                              .map((line) => line.trim())
                              .filter(Boolean)
                              .map((line) => (
                                <p key={line}>{line}</p>
                              ))}
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </section>

                <ProductReviewsPanel
                  productId={product.id}
                  productName={product.name}
                  reviewData={reviewData}
                />
              </div>
            </div>

            <SeeInActionCarousel
              key={`${product.id}-desktop-real-view`}
              clips={product.videoClips}
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
