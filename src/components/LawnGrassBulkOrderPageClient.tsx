"use client";

import { useEffect, useState } from "react";
import LawnGrassBulkOrderEstimator from "@/components/LawnGrassBulkOrderEstimator";
import type { Product } from "@/lib/products";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { ChevronLeft } from "lucide-react";
import SiteFooter from "./SiteFooter";
import MobileSearchHeader from "./MobileSearchHeader";
import Slider, { Banner, getBanners } from "./slider/Slider";

type LawnGrassBulkOrderPageClientProps = {
  product: Product;
  recommendations: Product[];
};

type RecommendationSectionProps = {
  showRecommendations: boolean;
  recommendations: Product[];
};




export default function LawnGrassBulkOrderPageClient({
  product,
  recommendations,
}: LawnGrassBulkOrderPageClientProps) {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    let mounted = true;

    getBanners().then((data) => {
      if (mounted) {
        setBanners(data);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen">
      <MobileSearchHeader />
      <div className="mx-auto flex w-full max-w-7xl px-4 flex-col gap-0 md:gap-0">
        <div className="hidden md:block">{BackButtonBar()}</div>

        {/* <Slider banners={banners} autoPlay intervalMs={5000}/> */}

        <section className="bg-white pt-2 md:pt-5">
          <LawnGrassBulkOrderEstimator
            product={product}
          />
        </section>
        {getProductRecommendations({
          showRecommendations: recommendations.length > 0,
          recommendations,
        })}

      </div>f

       <SiteFooter />
    </main>
  );
}






function getProductRecommendations({ showRecommendations, recommendations }: RecommendationSectionProps) {
return(
  <>
  
      {showRecommendations ? (
        <section className="bg-white pt-10 md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-base text-gray-600 md:text-2xl">
                Recommended Products
              </p>
              {/* <p className="mt-1 text-sm text-gray-600 md:text-base">
                You may also like these products
              </p> */}
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-1 text-[11px] text-[#214f14] transition-all md:text-xs"
            >
              <span className="text-xs">View all</span>
              <span aria-hidden="true">›</span>
            </Link>
          </div>

          {recommendations.length ? (
            <div className="mt-4 grid grid-cols-2 gap-1 md:mt-6 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
              {recommendations.map((recommendation) => (
                <ProductCard key={recommendation.id} product={recommendation} />
              ))}
            </div>
          ) : (
            <div className="mt-6 border border-dashed border-gray-300 bg-gray-100 px-4 py-8 text-center text-sm text-gray-600">
              No recommendation products found yet.
            </div>
          )}
        </section>
      ) : null}
  </>
)
}


// Back button bar at left on top function 
function BackButtonBar() {
  return (
    <div className=" flex items-center gap-2 bg-white py-4 md:py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-600 transition-all md:text-base"
      >
        <span aria-hidden="true">
        <ChevronLeft size={16} />
        </span>
        <span>Back to Home</span>
      </Link>
    </div>
  );
}
