import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CategorySection from "@/components/CategorySection";
import HomeLocationStrip from "@/components/HomeLocationStrip";
import ProductCard from "@/components/ProductCard";
import type { HomeCategoryItem } from "@/lib/homeCategoryItems";
import type { HomeSliderBanner } from "@/lib/homeSliderBanners";
import type { Product } from "@/lib/products";
import BlogsSection from "@/pages/Home/components/BlogsSection";
import FAQSection from "@/pages/Home/components/6_Section";
import HomeSlider from "@/pages/Home/components/HomeSlider";
import ReviewsSection from "@/pages/Home/components/ReviewsSection";
import TrustMarquee from "@/pages/Home/components/TrustMarquee";
import BestSellingCarousel from "./components/BestSellSection";

type ProductSection = {
  title: string;
  products: Product[];
};

function ProductGridSection({ title, products }: ProductSection) {
  if (!products.length) {
    return null;
  }

  return (
    <section className="px-2 md:px-6">
      <div className="mx-auto max-w-7xl p-0 md:p-2">
        <div className="mb-2 flex items-center justify-between gap-4 md:mb-6">
          <div className="flex items-center gap-3 min-w-0 px-2 md:px-0">
            {/* <div className="flex h-8 w-6 shrink-0 items-center justify-center md:h-9 md:w-7">
              {icon}
            </div> */}
            <span className="block truncate text-md text-black/80 md:text-2xl">
              {title}
            </span>
          </div>
          <Link
            href="/search"
            className="shrink-0 inline-flex items-center justify-center gap-1 text-xs text-black/70 transition-all border border-transparent md:text-xs"
          >
            <span className="text-xs">View all</span>
            <ChevronRight color="#cccccc" size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-1 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage({
  categoryItems = [],
  homeSliderBanners = [],
  products = [],
  initialDeliveryAddress = "",
}: {
  categoryItems?: HomeCategoryItem[];
  homeSliderBanners?: HomeSliderBanner[];
  products?: Product[];
  initialDeliveryAddress?: string;
}) {
  const categoryPulseIndices = [0];
  const productSections: ProductSection[] = [
    {
      title: "Latest Items",
      products,
    },
    {
      title: "Indoor Collection",
      products: products.filter(
        (product) => product.category === "Indoor Plants",
      ),
    },
    {
      title: "Outdoor Collection",
      products: products.filter((product) =>
        ["Outdoor Plants", "Lawn Grass"].includes(product.category),
      ),
    },
    {
      title: "Fern collection spotlight",
      products: products.filter((product) => product.category === "Ferns"),
    },
  ];

  return (
    <div className="bg-white space-y-4 pb-20 pt-0 md:pb-12 md:pt-0">
      <div className="md:hidden">
        
        <HomeLocationStrip initialAddress={initialDeliveryAddress} />
      </div>

      <div className="space-y-0 md:space-y-1">
         <HomeSlider slides={homeSliderBanners} />
           <CategorySection
          items={categoryItems}
          pulseIndices={categoryPulseIndices}
        />
        {/* <BestSellingCarousel /> */}
     
      </div>

      {/* <BestSellingCarousel /> */}
      {productSections.map((section) => (
        <ProductGridSection
          key={section.title}
          title={section.title}
          products={section.products}
        />
      ))}

      {/* <ReviewsSection />
      <BlogsSection /> */}
      <FAQSection />
    </div>
  );
}
