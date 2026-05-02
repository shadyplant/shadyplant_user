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
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import ProductDeliveryAddressPicker from "@/components/ProductDeliveryAddressPicker";
import MobileSearchHeader from "@/components/MobileSearchHeader";
import MobileProductImageCarousel from "@/components/MobileProductImageCarousel";
import ProductMobileActionBar from "@/components/ProductMobileActionBar";
import ProductReviewsPanel from "@/components/ProductReviewsPanel";
import {
  getProductExperience,
  type ProductExperience,
} from "@/components/ProductDetailsSections";
import ProductImageGallery from "@/components/ProductImageGallery";
import ReviewBottomSheet from "@/components/ReviewBottomSheet";
import ProductShareButton from "@/components/ProductShareButton";
import SiteShell from "@/components/SiteShell";
import WishlistButton from "@/components/WishlistButton";
import { formatCurrency } from "@/lib/formatCurrency";
import { fetchProductById, fetchProducts, type Product } from "@/lib/products";
import SeeInActionCarousel from "@/components/carousal/SeeInActionCarousel";

export const dynamic = "force-dynamic";

type VariationOption = {
  label: string;
  note?: string;
  selected?: boolean;
  disabled?: boolean;
};

function getProductVariations(product: Product) {
  if (product.category === "Lawn Grass") {
    const currentCoverage =
      product.packLabel.replace(/^Pack of\s*/i, "").trim() || "20 sq ft";

    return {
      title: "Select Coverage",
      guideLabel: "Coverage guide",
      options: [
        { label: "10 sq ft" },
        { label: currentCoverage, note: "Popular", selected: true },
        { label: "40 sq ft", note: "Best value" },
        { label: "80 sq ft", disabled: true },
      ] satisfies VariationOption[],
    };
  }

  if (product.category === "Indoor Plants" || product.category === "Ferns") {
    return {
      title: "Select Size",
      guideLabel: "Pot size guide",
      options: [
        { label: "S" },
        { label: "M", note: "Ready now" },
        { label: "L", selected: true },
        { label: "XL", note: "Low stock" },
      ] satisfies VariationOption[],
    };
  }

  return {
    title: "Select Size",
    guideLabel: "Plant size guide",
    options: [
      { label: "S" },
      { label: "M", selected: true },
      { label: "L", note: "Low stock" },
      { label: "XL", disabled: true },
    ] satisfies VariationOption[],
  };
}

function getCheckoutHref(product: Product) {
  if (product.category !== "Lawn Grass") {
    return "/checkout";
  }

  const coverageMatch = product.packLabel.match(/(\d+)/);
  const coverageSqft = coverageMatch ? Number(coverageMatch[1]) : null;

  if (!coverageSqft || !Number.isFinite(coverageSqft)) {
    return "/checkout";
  }

  return `/checkout?sqft=${coverageSqft}&product=${encodeURIComponent(product.id)}`;
}

function MobileRatingSummary({
  experience,
  productName,
}: {
  experience: ProductExperience;
  productName: string;
}) {
  const highestBreakdownCount = Math.max(
    ...experience.ratingBreakdown.map((item) => item.count),
    1,
  );

  return (
    <section className="border-t border-[#e7e7e7] bg-white px-3 pb-4 pt-4">
      <h2 className="text-center text-[14px] font-black text-[#111111]">
        Rating &amp; Reviews
      </h2>

      <div className="mt-3 grid grid-cols-[45%_55%] items-start">
        <div className="flex flex-col items-center pt-4 text-center">
          <p className="text-[30px] font-semibold leading-none text-[#303030]">
            {experience.rating.toFixed(1)}
          </p>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const filled = index < Math.round(experience.rating);

              return (
                <Star
                  key={index}
                  size={15}
                  fill={filled ? "currentColor" : "none"}
                  className={filled ? "text-[#338f23]" : "text-[#c9c9c9]"}
                />
              );
            })}
          </div>
          <p className="mt-1 text-[10px] leading-3 text-[#8b8b8b]">
            Very Good
            <br />
            {experience.totalRatings} ratings and
            <br />
            {experience.reviews.length * 23} reviews
          </p>
        </div>

        <div>
          <div className="space-y-1">
            {experience.ratingBreakdown.map((item) => (
              <div
                key={item.stars}
                className="grid grid-cols-[10px_minmax(0,1fr)_24px] items-center gap-1.5"
              >
                <span className="text-[8px] font-black text-[#111111]">
                  {item.stars}
                </span>
                <div className="h-[4px] overflow-hidden rounded-full bg-[#e5e5e5]">
                  <div
                    className="h-full rounded-full bg-[#338f23]"
                    style={{
                      width: `${(item.count / highestBreakdownCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[8px] text-[#8b8b8b]">{item.count}</span>
              </div>
            ))}
          </div>

          <ReviewBottomSheet
            productName={productName}
            triggerLabel="Review Us"
            triggerClassName="mx-auto mt-5 block h-8 w-28 rounded-lg border border-[#111111] bg-white text-[13px] font-medium text-[#111111]"
          />
        </div>
      </div>
    </section>
  );
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await fetchProducts({
    category: product.category,
    excludeId: product.id,
    limit: 3,
  });
  const productExperience = getProductExperience(product);
  const productVariations = getProductVariations(product);
  const checkoutHref = getCheckoutHref(product);
  const originalPrice = product.price + Math.max(35, Math.round(product.price * 0.35));
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
      <MobileSearchHeader />
      <section className="bg-white pb-24 md:hidden">
        <div className="min-h-screen w-full">
          <div className="mx-auto w-full max-w-2xl px-2 pb-8 pt-2 sm:px-4">
            <MobileProductImageCarousel
              images={product.images}
              productName={product.name}
              rating={productExperience.rating.toFixed(1)}
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
                    {product.packLabel}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 pt-4">
                  <WishlistButton
                    productId={product.id}
                    size={23}
                    className="h-6 w-6 text-[#159100]"
                  />
                  <ProductShareButton
                    title={product.name}
                    text={product.description}
                    size={18}
                    className="h-6 w-6 rounded-none text-black"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
                <span className="text-[18px] font-black leading-none text-[#111111]">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-[14px] font-medium text-[#9d9d9d] line-through">
                  {formatCurrency(originalPrice)}
                </span>
              </div>
            </section>

            <ProductDeliveryAddressPicker />

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
                      <ChevronDown size={18} className="transition group-open:rotate-180" />
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
              experience={productExperience}
              productName={product.name}
            />


            <SeeInActionCarousel />

            {relatedProducts.length ? (
              <section className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[16px] font-black text-[#171410]">Related Products</h2>
                  <Link href="/search" className="text-[11px] font-bold text-[#55ad35]">
                    view all
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {relatedProducts.map((relatedProduct) => (
                    <ProductCard key={relatedProduct.id} product={relatedProduct} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <ProductMobileActionBar productId={product.id} checkoutHref={checkoutHref} />
      </section>

      <section className="hidden px-4 py-8 md:block md:px-6 md:py-12">
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
                      {product.packLabel}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-lg border border-[#d6e6bd] bg-white px-3 py-2 text-xs font-bold text-[#214f14] shadow-sm md:text-sm">
                    <Star
                      size={14}
                      className="text-[#f1bf4a]"
                      fill="currentColor"
                    />
                    <span>{productExperience.rating.toFixed(1)}</span>
                    <span className="h-3 w-px bg-[#d8e4c8]" />
                    <span>{productExperience.totalRatings} ratings</span>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#58724f] md:text-base">
                  {product.description}
                </p>

                <div className="mt-6 flex flex-wrap items-end gap-x-2 gap-y-1">
                  <p className="text-2xl font-bold leading-none text-[#214f14] md:text-3xl">
                    {formatCurrency(product.price)}
                  </p>
                  <span className="pb-0.5 text-xs font-semibold text-[#6c8a63] md:text-sm">
                    {product.unit}
                  </span>
                  <span className="rounded bg-white px-2 py-1 text-xs font-medium text-[#6d8464] shadow-sm md:px-3 md:py-1.5 md:text-sm">
                    {product.packLabel}
                  </span>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#214f14] shadow-sm md:px-4 md:py-2.5 md:text-sm">
                  <Leaf size={14} className="text-[#6fb44c]" />
                  {productExperience.recommendPercent}% of buyers recommend this
                  product
                </div>

                <div className="mt-6 rounded-xl border border-[#dce8ce] bg-white p-4 md:mt-8 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-[#163915]">
                        {productVariations.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[#6d8464] md:text-sm">
                        Choose the option that fits your space best
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#2c6db3] transition hover:text-[#214f14] md:text-sm"
                    >
                      {productVariations.guideLabel}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 md:gap-3">
                    {productVariations.options.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        disabled={option.disabled}
                        className={`min-w-[64px] rounded-lg border px-3 py-2 text-center transition md:min-w-[76px] md:px-4 md:py-2.5 ${
                          option.selected
                            ? "border-[#214f14] bg-[#214f14] text-white shadow-sm"
                            : option.disabled
                              ? "border-[#dbe6cf] bg-[#f8fbf4] text-[#b1beaa]"
                              : "border-[#d8e6cb] bg-[#f9fcf5] text-[#163915] hover:border-[#aac58d] hover:bg-[#f2f8ea]"
                        }`}
                      >
                        <span className="block text-sm font-semibold md:text-base">
                          {option.label}
                        </span>
                        {option.note ? (
                          <span
                            className={`mt-0.5 block text-[10px] font-medium md:mt-1 md:text-[11px] ${
                              option.selected
                                ? "text-[#d6e6bd]"
                                : "text-[#d45b39]"
                            }`}
                          >
                            {option.note}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-2.5 rounded-xl bg-white p-4 md:mt-8 md:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#5c7752] md:text-sm">
                      Availability
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#214f14] md:text-sm">
                      <Leaf size={14} />
                      In stock
                    </span>
                  </div>
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
                    className="flex items-center justify-between rounded-lg border border-[#174f18] bg-white px-4 py-2.5 text-sm font-semibold text-[#174f18] shadow-[2px_3px_0_rgba(23,79,24,0.12)] transition-colors hover:bg-[#f4fbf2] md:px-5 md:py-3"
                  />
                  <WishlistButton
                      productId={product.id}
                      size={18}
                      className="h-10 w-10 rounded-lg border border-[#174f18] bg-white text-[#174f18] shadow-[2px_3px_0_rgba(23,79,24,0.12)] md:h-12 md:w-12"
                  />
                  <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                    <Link
                      href={checkoutHref}
                      className="theme-button rounded-lg px-4 py-2.5 text-center text-sm font-semibold md:px-5 md:py-3"
                    >
                      Buy now
                    </Link>
                    <Link
                      href="/cart"
                      className="rounded-lg border border-[#174f18] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#174f18] shadow-[2px_3px_0_rgba(23,79,24,0.12)] transition-colors hover:bg-[#f4fbf2] md:px-5 md:py-3"
                    >
                      View cart
                    </Link>
                  </div>
                </div>

                <ProductDeliveryAddressPicker />

                <div className="mt-6 grid gap-3 rounded-xl border border-[#dce8ce] bg-[#edf5e1] p-4 md:mt-8 md:p-5">
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

              <section className="rounded-2xl border border-[#d6e6bd] bg-white shadow-sm">
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

              <ProductReviewsPanel experience={productExperience} productName={product.name} />
            </div>
          </div>

          <SeeInActionCarousel />

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
      </section>
    </SiteShell>
  );
}
