"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildProductHref } from "@/lib/productUrls";

const slides = [
  {
    title: "Well-crafted greenery",
    subtitle: "Shop now",
    description:
      "Fresh plants and lawn picks for homes, balconies, and garden corners.",
    image:
      "https://www.ugaoo.com/cdn/shop/files/1_1d02edd3-c551-4566-8adb-a8d83c389eb5.jpg?v=17745218870",
    href: buildProductHref({ name: "Areca Palm", productId: "PRD386762349" }),
    chip: "Best seller",
  },
  {
    title: "Fresh lawn grass",
    subtitle: "Book today",
    description:
      "Soft Korean grass and durable doob grass delivered for residential projects.",
    image:
      "https://m.media-amazon.com/images/I/71Obx3bzatL._AC_UF1000,1000_QL80_.jpg",
    href: "/checkout",
    chip: "Lawn care",
  },
  {
    title: "Statement indoor plants",
    subtitle: "Bring life home",
    description:
      "Low-maintenance greens that instantly lift living rooms, lobbies, and desks.",
    image:
      "https://unsolicitedplanttalks.com/cdn/shop/articles/indoor_plants.jpg?v=1750698299",
    href: buildProductHref({
      name: "Snake Plant Laurentii",
      productId: "PRD753739678",
    }),
    chip: "Indoor picks",
  },
];

export default function HomeSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, []);

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  return (
    <section className="px-0 pt-0 md:px-0">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[0.5rem] px-2 md:p-0">
          <div className="relative h-[200px] border border-[#d7e1d3] overflow-hidden rounded-[0.5rem] sm:h-[240px] md:h-[360px]">
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={slide.title} className="relative h-full min-w-full">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={index === 0}
                    className="object-cover"
                  />
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

          <div className="flex items-center justify-center gap-1.5 px-2 py-3 sm:py-4 md:gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "h-1.5 w-7 bg-[#ff7a22] sm:h-2 sm:w-8 md:h-2.5 md:w-10"
                    : "h-1.5 w-1.5 bg-[#ffd0b2] sm:h-2 sm:w-2 md:h-2.5 md:w-2.5"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
