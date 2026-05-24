"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeSliderBanner } from "@/lib/homeSliderBanners";
import { buildProductHref } from "@/lib/productUrls";

const fallbackSlides: HomeSliderBanner[] = [
  {
    id: "fallback-areca-palm",
    itemKey: "well-crafted-greenery",
    title: "Well-crafted greenery",
    desktopImage:
      "https://www.ugaoo.com/cdn/shop/files/Website_Banner-New.webp?v=1775469492&width=2000",
    mobileImage:
      "https://www.ugaoo.com/cdn/shop/files/Website_Banner-New.webp?v=1775469492&width=900",
    href: buildProductHref({ name: "Areca Palm", productId: "PRD386762349" }),
    isActive: true,
    sortOrder: 10,
  },
  {
    id: "fallback-lawn-grass",
    itemKey: "fresh-lawn-grass",
    title: "Fresh lawn grass",
    desktopImage:
      "https://www.ugaoo.com/cdn/shop/files/Desktop_3b72e57e-bcbe-416e-9b6a-79738d23892e.jpg?v=1778946988&width=2000",
    mobileImage:
      "https://www.ugaoo.com/cdn/shop/files/Desktop_3b72e57e-bcbe-416e-9b6a-79738d23892e.jpg?v=1778946988&width=900",
    href: "/checkout",
    isActive: true,
    sortOrder: 20,
  },
  {
    id: "fallback-snake-plant",
    itemKey: "statement-indoor-plants",
    title: "Statement indoor plants",
    desktopImage:
      "https://www.ugaoo.com/cdn/shop/files/New.webp?v=1774954211&width=2000",
    mobileImage:
      "https://www.ugaoo.com/cdn/shop/files/New.webp?v=1774954211&width=900",
    href: buildProductHref({
      name: "Snake Plant Laurentii",
      productId: "PRD753739678",
    }),
    isActive: true,
    sortOrder: 30,
  },
];

type HomeSliderProps = {
  slides?: HomeSliderBanner[];
};

export default function HomeSlider({ slides = [] }: HomeSliderProps) {
  const items = slides.length ? slides : fallbackSlides;
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndex = activeIndex >= items.length ? 0 : activeIndex;

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [items.length]);

  if (!items.length) {
    return null;
  }

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % items.length);
  };

  return (
    <section className="px-0 pt-0 md:px-0">
      <div className="w-full">
        <div className=" px-0 md:p-0">
          <div className="relative aspect-[390/210] w-full overflow-hidden border border-[#d7e1d3] bg-[#eef4ea] sm:aspect-[390/190] md:aspect-[2000/598]">
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {items.map((slide, index) => (
                <div key={slide.title} className="relative h-full min-w-full">
                  {slide.href ? (
                    <Link
                      href={slide.href}
                      className="relative block h-full w-full"
                      aria-label={slide.title}
                    >
                      <Image
                        src={slide.mobileImage || slide.desktopImage}
                        alt={slide.title}
                        fill
                        priority={index === 0}
                        sizes="(max-width: 767px) 100vw, 0px"
                        className="object-cover md:hidden"
                      />
                      <Image
                        src={slide.desktopImage || slide.mobileImage}
                        alt={slide.title}
                        fill
                        priority={index === 0}
                        sizes="(max-width: 767px) 0px, 100vw"
                        className="hidden object-cover md:block"
                      />
                    </Link>
                  ) : (
                    <>
                      <Image
                        src={slide.mobileImage || slide.desktopImage}
                        alt={slide.title}
                        fill
                        priority={index === 0}
                        sizes="(max-width: 767px) 100vw, 0px"
                        className="object-cover md:hidden"
                      />
                      <Image
                        src={slide.desktopImage || slide.mobileImage}
                        alt={slide.title}
                        fill
                        priority={index === 0}
                        sizes="(max-width: 767px) 0px, 100vw"
                        className="hidden object-cover md:block"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Prev button */}
            <button
              type="button"
              aria-label="Previous slide"
              onClick={goToPrevious}
              className="absolute left-1.5 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-white transition sm:right-2 sm:h-7 sm:w-7 md:right-5 md:h-10 md:w-10 md:rounded-full md:backdrop-blur-sm md:hover:bg-black/35"
            >
              <ChevronLeft
                size={13}
                className="sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]"
              />
            </button>

            {/* Next button */}
            <button
              type="button"
              aria-label="Next slide"
              onClick={goToNext}
              className="absolute right-1.5 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-white transition sm:right-2 sm:h-7 sm:w-7 md:right-5 md:h-10 md:w-10 md:rounded-full md:backdrop-blur-sm md:hover:bg-black/35"
            >
              <ChevronRight
                size={13}
                className="sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]"
              />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 sm:py-4 md:gap-2">
            {items.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "h-1.2 w-7 bg-[#4c8b5d] sm:h-2 sm:w-8 md:h-2 md:w-7"
                    : "h-1.2 w-1.2 bg-[#64825066] sm:h-2 sm:w-2 md:h-2 md:w-2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
