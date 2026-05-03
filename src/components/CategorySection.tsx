"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";

type CategorySectionProps = {
  products?: Product[];
};

type CategoryStory = {
  label: string;
  href: string;
  image: string;
  accent: string;
  showOfferBadge?: boolean;
};

const FALLBACK_IMAGE = "/hero_image.png";

function findCategoryImage(
  products: Product[],
  categories: string[],
  fallbackImage: string,
) {
  const match = products.find((product) => categories.includes(product.category));
  return match?.image || fallbackImage;
}

function buildCategoryStories(products: Product[]): CategoryStory[] {
  const featuredImage =
    products.find((product) => product.isFeaturedLatest)?.image ||
    products[0]?.image ||
    FALLBACK_IMAGE;
  const trendingImage =
    products.find((product) => product.isOnTrend)?.image ||
    products[1]?.image ||
    featuredImage;

  return [
    {
      label: "Offers",
      href: "/search",
      image: featuredImage,
      accent: "from-[#ff6666] via-[#ff7f64] to-[#ffb347]",
      showOfferBadge: true,
    },
    {
      label: "Indoor",
      href: "/search?category=Indoor%20Plants",
      image: findCategoryImage(products, ["Indoor Plants"], featuredImage),
      accent: "from-[#d8c38f] via-[#f0d9a6] to-[#fbf3cf]",
    },
    {
      label: "Outdoor",
      href: "/search?category=Outdoor%20Plants",
      image: findCategoryImage(products, ["Outdoor Plants"], featuredImage),
      accent: "from-[#b1d872] via-[#d9f0aa] to-[#f7ffd9]",
    },
    {
      label: "Lawns",
      href: "/search?category=Lawn%20Grass",
      image: findCategoryImage(products, ["Lawn Grass"], trendingImage),
      accent: "from-[#7dbb53] via-[#b7df7f] to-[#f0f8d6]",
    },
    {
      label: "Ferns",
      href: "/search?category=Ferns",
      image: findCategoryImage(products, ["Ferns"], featuredImage),
      accent: "from-[#9bce8b] via-[#d7eeb8] to-[#f5fbe7]",
    },
    {
      label: "Featured",
      href: "/search",
      image: featuredImage,
      accent: "from-[#d5bc8d] via-[#e8d1aa] to-[#fbf2d9]",
    },
    {
      label: "Trending",
      href: "/search",
      image: trendingImage,
      accent: "from-[#a2bce8] via-[#bfd3f5] to-[#e8f0ff]",
    },
    {
      label: "Nursery",
      href: "/search",
      image: products[2]?.image || featuredImage,
      accent: "from-[#ffcda8] via-[#ffe0c7] to-[#fff3ea]",
    },
  ];
}

export default function CategorySection({
  products = [],
}: CategorySectionProps) {
  const categoryStories = buildCategoryStories(products);

  return (
    <section className="border-b border-[#eef1ea] bg-white">
      <div className="mx-auto max-w-7xl px-3 py-3 md:px-6 md:py-4">
        <div className="flex gap-4 overflow-x-auto px-1 scrollbar-hide md:justify-center md:gap-5">
          {categoryStories.map((story) => (
            <Link
              href={story.href}
              key={story.label}
              className="group/story flex min-w-[68px] shrink-0 flex-col items-center gap-2 text-center transition-transform active:scale-95 md:min-w-[82px]"
            >
              <div
                className={`flex h-[4.4rem] w-[4.4rem] items-center justify-center rounded-full bg-gradient-to-br p-[2px] shadow-[0_10px_24px_rgba(23,20,16,0.08)] transition-transform duration-300 group-hover/story:-translate-y-0.5 md:h-[5rem] md:w-[5rem] ${story.accent}`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full border border-white/90 bg-white">
                  {story.showOfferBadge ? (
                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#ff9d8b_0%,#ff6f67_62%,#ff5a5a_100%)] text-white">
                      <span className="text-[2rem] font-black leading-none md:text-[2.25rem]">
                        %
                      </span>
                    </div>
                  ) : (
                    <Image
                      src={story.image}
                      alt={story.label}
                      fill
                      sizes="80px"
                      className="object-cover transition duration-300 group-hover/story:scale-110"
                    />
                  )}
                </div>
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#233d1d] md:text-[10px]">
                {story.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
