import Link from "next/link";
import {
  AlignLeft,
  ChevronDown,
  ChevronRight,
  Leaf,
  ShieldCheck,
  Star,
  Truck,
  Undo2,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import ProductDeliveryAddressPicker from "@/components/ProductDeliveryAddressPicker";
import MobileSearchHeader from "@/components/MobileSearchHeader";
import MobileProductImageCarousel from "@/components/MobileProductImageCarousel";
import ProductMobileActionBar from "@/components/ProductMobileActionBar";
import ProductReviewsPanel from "@/components/ProductReviewsPanel";
import ProductBuyNowButton from "@/components/ProductBuyNowButton";
import { getProductExperience } from "@/components/ProductDetailsSections";
import ProductImageGallery from "@/components/ProductImageGallery";
import ReviewBottomSheet from "@/components/ReviewBottomSheet";
import ProductShareButton from "@/components/ProductShareButton";
import {
  ProductOptionGroupsSelector,
  ProductOptionSelectionProvider,
  SelectedProductAvailabilityRow,
  SelectedProductPackLabel,
  SelectedProductPrice,
  SelectedProductStockNotice,
} from "@/components/ProductOptionSelectionContext";
import SiteShell from "@/components/SiteShell";
import WishlistButton from "@/components/WishlistButton";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  fetchProductById,
  fetchProducts,
  type Product,
  type ProductOptionGroup,
} from "@/lib/products";
import {
  fetchProductReviews,
  type ProductReviewsData,
} from "@/lib/productReviews";
import { getProductHref, slugifyProductName } from "@/lib/productUrls";
import SeeInActionCarousel from "@/components/carousal/SeeInActionCarousel";

function buildFallbackProductOptionGroups(product: Product): ProductOptionGroup[] {
  if (product.category === "Lawn Grass") {
    const currentCoverage =
      product.packLabel.replace(/^Pack of\s*/i, "").trim() || "20 sq ft";

    return [
      {
        key: "coverage",
        title: "Select Coverage",
        subtitle: "Choose the option that fits your space best",
        guideLabel: "Coverage guide",
        options: [
          {
            key: "10-sq-ft",
            label: "10 sq ft",
            unit: "sq ft",
            value: 10,
            note: "",
            price: null,
            stock: null,
            packLabel: "",
            weight: null,
            isDefault: false,
            isDisabled: false,
          },
          {
            key: "current-coverage",
            label: currentCoverage,
            unit: "",
            value: null,
            note: "Popular",
            price: null,
            stock: null,
            packLabel: "",
            weight: null,
            isDefault: true,
            isDisabled: false,
          },
          {
            key: "40-sq-ft",
            label: "40 sq ft",
            unit: "sq ft",
            value: 40,
            note: "Best value",
            price: null,
            stock: null,
            packLabel: "",
            weight: null,
            isDefault: false,
            isDisabled: false,
          },
          {
            key: "80-sq-ft",
            label: "80 sq ft",
            unit: "sq ft",
            value: 80,
            note: "",
            price: null,
            stock: null,
            packLabel: "",
            weight: null,
            isDefault: false,
            isDisabled: true,
          },
        ],
      },
    ];
  }

  if (product.category === "Indoor Plants" || product.category === "Ferns") {
    return [
      {
        key: "size",
        title: "Select Size",
        subtitle: "Choose the option that fits your space best",
        guideLabel: product.category === "Ferns" ? "Pot size guide" : "Plant size guide",
        options: [
          { key: "s", label: "S", unit: "", value: null, note: "", price: null, stock: null, packLabel: "", weight: null, isDefault: false, isDisabled: false },
          { key: "m", label: "M", unit: "", value: null, note: "Ready now", price: null, stock: null, packLabel: "", weight: null, isDefault: false, isDisabled: false },
          { key: "l", label: "L", unit: "", value: null, note: "", price: null, stock: null, packLabel: "", weight: null, isDefault: true, isDisabled: false },
          { key: "xl", label: "XL", unit: "", value: null, note: "Low stock", price: null, stock: null, packLabel: "", weight: null, isDefault: false, isDisabled: false },
        ],
      },
    ];
  }

  return [
    {
      key: "size",
      title: "Select Size",
      subtitle: "Choose the option that fits your space best",
      guideLabel: "Plant size guide",
      options: [
        { key: "s", label: "S", unit: "", value: null, note: "", price: null, stock: null, packLabel: "", weight: null, isDefault: false, isDisabled: false },
        { key: "m", label: "M", unit: "", value: null, note: "", price: null, stock: null, packLabel: "", weight: null, isDefault: true, isDisabled: false },
        { key: "l", label: "L", unit: "", value: null, note: "Low stock", price: null, stock: null, packLabel: "", weight: null, isDefault: false, isDisabled: false },
        { key: "xl", label: "XL", unit: "", value: null, note: "", price: null, stock: null, packLabel: "", weight: null, isDefault: false, isDisabled: true },
      ],
    },
  ];
}

function resolveProductOptionGroups(product: Product) {
  return product.optionGroups.length
    ? product.optionGroups
    : buildFallbackProductOptionGroups(product);
}

function MobileRatingSummary({
  productId,
  reviewData,
  productName,
}: {
  productId: string;
  reviewData: ProductReviewsData;
  productName: string;
}) {
  const { summary } = reviewData;
  const highestBreakdownCount = Math.max(
    ...summary.ratingBreakdown.map((item) => item.count),
    1,
  );
  const hasRatings = summary.totalRatings > 0;

  return (
    <section className="border-t border-[#e7e7e7] bg-white px-4 pb-6 pt-5">
      <h2 className="text-center text-[15px] font-black tracking-tight text-[#111111]">
        Rating &amp; Reviews
      </h2>

      <div className="mt-6 grid grid-cols-[40%_60%] items-center gap-4">
        <div className="flex flex-col items-center border-r border-[#f0f0f0] pr-2 text-center">
          <p className="text-[34px] font-bold leading-none text-[#111111]">
            {hasRatings ? summary.averageRating.toFixed(1) : "New"}
          </p>

          <div className="mt-2.5 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => {
              const filled = index < Math.round(summary.averageRating);
              return (
                <Star
                  key={index}
                  size={14}
                  fill={filled ? "currentColor" : "none"}
                  className={filled ? "text-[#338f23]" : "text-[#e0e0e0]"}
                />
              );
            })}
          </div>

          <p className="mt-2 text-[11px] font-medium leading-relaxed text-[#8b8b8b]">
            <span className="text-[#338f23]">
              {hasRatings ? "Verified ratings" : "No ratings yet"}
            </span>
            <br />
            {hasRatings
              ? `${summary.totalRatings} ratings`
              : "Be the first to review"}
          </p>
        </div>

        <div className="flex flex-col justify-center px-1">
          <div className="space-y-2">
            {summary.ratingBreakdown.map((item) => (
              <div
                key={item.stars}
                className="grid grid-cols-[12px_1fr_28px] items-center gap-3"
              >
                <span className="text-[10px] font-bold text-[#111111]">
                  {item.stars}
                </span>
                <div className="h-[5px] overflow-hidden rounded-full bg-[#f0f0f0]">
                  <div
                    className="h-full rounded-full bg-[#338f23]"
                    style={{
                      width: `${(item.count / highestBreakdownCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium text-[#8b8b8b] text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <ReviewBottomSheet
          productId={productId}
          productName={productName}
          triggerLabel={hasRatings ? "Review Us" : "Write First Review"}
          triggerClassName="h-10 w-full max-w-[160px] rounded-full border border-[#e0e0e0] bg-white text-[13px] font-semibold text-[#111111] shadow-sm active:scale-95 transition-transform"
        />
      </div>
    </section>
  );
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
  const productOptionGroups = resolveProductOptionGroups(product);
  const originalPrice =
    product.price + Math.max(35, Math.round(product.price * 0.35));
  const hasRatings = reviewData.summary.totalRatings > 0;
  const detailSections = productExperience.accordions.map((item) => {
    const Icon = item.title.includes("Delivery")
      ? Truck
      : item.title.includes("Care") || item.title.includes("Installation")
        ? Leaf
        : AlignLeft;

    return { ...item, Icon };
  });

  return (
    <SiteShell hideMobileHeader hideMobileBottomNav>
      <div className="bg-white">
        <MobileSearchHeader />
        <section className="bg-white pb-24 md:hidden px-[0.3rem]">
          <ProductOptionSelectionProvider
            product={product}
            optionGroups={productOptionGroups}
          >
            <div className="min-h-screen w-full">
              <div className="mx-auto w-full max-w-2xl px-2 pb-8 pt-2 sm:px-4">
                <MobileProductImageCarousel
                  images={product.images}
                  productName={product.name}
                  rating={
                    hasRatings
                      ? reviewData.summary.averageRating.toFixed(1)
                      : "New"
                  }
                />

                <section className="pt-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[14px] font-normal leading-4 text-[#777777]">
                      {product.category}
                    </p>
                    <h1 className="mt-0.5 text-[24px] font-black leading-7 text-[#050505]">
                      {product.name}
                    </h1>
                    <p className="mt-1 text-[15px] font-normal leading-5 text-[#b8b8b8]">
                      <SelectedProductPackLabel />
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pt-4">
                    <WishlistButton
                      productId={product.id}
                      size={27}
                      className="h-6 w-6 text-[#159100]"
                    />
                    <ProductShareButton
                      title={product.name}
                      text={product.description}
                      size={24}
                      className="h-6 w-6 rounded-none text-black"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[18px] font-black leading-none text-[#111111]">
                    <SelectedProductPrice />
                  </span>
                  <span className="text-[14px] font-medium text-[#9d9d9d] line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                </div>
                <SelectedProductStockNotice className="mt-2 block text-[12px] font-black uppercase tracking-[0.14em] text-[#b23b2b]" />
              </section>

                <ProductDeliveryAddressPicker />

                <ProductOptionGroupsSelector variant="mobile" />

                <section className="mt-3 border-y border-[#dddddd] bg-white">
                {detailSections.slice(0, 2).map((item, index) => (
                  <details
                    key={item.title}
                    className="group border-b border-[#dddddd] py-2.5 last:border-b-0"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <span>
                        <span className="block text-[14px] font-black leading-4 text-[#111111]">
                          {index === 0 ? "All details" : "Product highlights"}
                        </span>
                        <span className="mt-0.5 block text-[10px] leading-3 text-[#4f4f4f]">
                          {item.subtitle}
                        </span>
                      </span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f1f1] text-[#111111]">
                        <ChevronDown
                          size={18}
                          className="transition group-open:rotate-180"
                        />
                      </span>
                    </summary>
                    <div className="space-y-2 pb-1 pt-3 text-[12px] leading-5 text-[#4f4f4f]">
                      {item.content.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </details>
                ))}
                </section>

                <MobileRatingSummary
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
                    <h2 className="text-[16px] font-black text-[#171410]">
                      Related Products
                    </h2>
                    <Link
                      href="/search"
                      className=" text-sm font-bold text-[#55ad35]"
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
            <ProductMobileActionBar productId={product.id} stock={product.stock} />
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
                />
              </div>

              <div className="space-y-6 md:space-y-8">
                <div className="rounded-2xl p-5 md:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#173d12] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                      {product.badge}
                    </span>
                    <span className="rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#6b8b58]">
                      {product.category}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#6b8b58]">
                        {product.badge}
                      </p>
                      <h1 className="mt-1 max-w-2xl text-xl font-bold leading-snug text-[#163915] md:text-2xl">
                        {product.name}
                      </h1>
                      <p className="mt-1 text-sm text-[#6d8464]">
                        <SelectedProductPackLabel />
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-lg border border-[#d6e6bd] bg-white px-3 py-2 text-xs font-bold text-[#214f14] shadow-sm md:text-sm">
                      <Star
                        size={14}
                        className="text-[#f1bf4a]"
                        fill="currentColor"
                      />
                      <span>
                        {hasRatings
                          ? reviewData.summary.averageRating.toFixed(1)
                          : "New"}
                      </span>
                      <span className="h-3 w-px bg-[#d8e4c8]" />
                      <span>
                        {hasRatings
                          ? `${reviewData.summary.totalRatings} ratings`
                          : "No ratings yet"}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#58724f] md:text-base">
                    {product.description}
                  </p>

                  <div className="mt-6 flex flex-wrap items-end gap-x-2 gap-y-1">
                    <p className="text-2xl font-bold leading-none text-[#214f14] md:text-3xl">
                      <SelectedProductPrice />
                    </p>
                    <span className="pb-0.5 text-xs font-semibold text-[#6c8a63] md:text-sm">
                      {product.unit}
                    </span>
                    <span className="rounded bg-white px-2 py-1 text-xs font-medium text-[#6d8464] shadow-sm md:px-3 md:py-1.5 md:text-sm">
                      <SelectedProductPackLabel />
                    </span>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#214f14] shadow-sm md:px-4 md:py-2.5 md:text-sm">
                    <Leaf size={14} className="text-[#6fb44c]" />
                    {reviewData.summary.recommendPercent !== null
                      ? `${reviewData.summary.recommendPercent}% of buyers recommend this product`
                      : "This product is ready for its first verified review"}
                  </div>

                  <ProductOptionGroupsSelector variant="desktop" />

                  <div className="mt-6 grid gap-2.5 rounded-xl bg-white p-4 md:mt-8 md:p-5">
                    <SelectedProductAvailabilityRow />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#5c7752] md:text-sm">
                        Care level
                      </span>
                      <span className="text-xs font-semibold text-[#214f14] md:text-sm">
                        {product.badge}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#5c7752] md:text-sm">
                        Category
                      </span>
                      <span className="text-xs font-semibold text-[#214f14] md:text-sm">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] md:mt-8">
                    <AddToCartButton
                      productId={product.id}
                      availableStock={product.stock}
                      className="flex items-center justify-between rounded-lg border border-[#174f18] bg-white px-4 py-2.5 text-sm font-semibold text-[#174f18] shadow-[2px_3px_0_rgba(23,79,24,0.12)] transition-colors hover:bg-[#f4fbf2] md:px-5 md:py-3"
                    />
                    <WishlistButton
                      productId={product.id}
                      size={18}
                      className="h-10 w-10 rounded-lg border border-[#174f18] bg-white text-[#174f18] shadow-[2px_3px_0_rgba(23,79,24,0.12)] md:h-12 md:w-12"
                    />
                    <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                      <ProductBuyNowButton
                        productId={product.id}
                        availableStock={product.stock}
                        className="theme-button rounded-[0.5rem] px-4 py-2.5 text-center text-sm font-semibold md:px-5 md:py-3"
                      >
                        Buy now
                      </ProductBuyNowButton>
                      <Link
                        href="/cart"
                        className="rounded-lg border border-[#174f18] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#174f18] shadow-[2px_3px_0_rgba(23,79,24,0.12)] transition-colors hover:bg-[#f4fbf2] md:px-5 md:py-3"
                      >
                        View cart
                      </Link>
                    </div>
                  </div>

                  <ProductDeliveryAddressPicker />

                  <div className="mt-6 grid gap-3 p-4 md:mt-8 md:p-5">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-[#214f14] md:text-sm">
                      <Truck size={16} />
                      Same-day dispatch on ready nursery stock
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-[#214f14] md:text-sm">
                      <ShieldCheck size={16} />
                      Plant-safe packaging for healthy delivery
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-[#214f14] md:text-sm">
                      <Undo2 size={16} />
                      Expert help for plant selection and care
                    </div>
                  </div>
                </div>

                <section className="">
                  {detailSections.map((item) => (
                    <details
                      key={item.title}
                      className="group border-b border-[#e3edd7] last:border-b-0"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f8ee] text-[#5d7b56]">
                            <item.Icon size={18} />
                          </span>
                          <div>
                            <p className="text-sm font-bold text-[#163915] md:text-base">
                              {item.title}
                            </p>
                            <p className="mt-0.5 text-xs text-[#6d8464] md:text-sm">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className="shrink-0 text-[#5d7b56] transition group-open:rotate-180"
                          size={18}
                        />
                      </summary>

                      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        <div className="border-t border-[#e3edd7] pt-3">
                          <div className="space-y-2.5 text-xs leading-relaxed text-[#58724f] sm:text-sm">
                            {item.content.map((line) => (
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
