"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useRef, useState } from "react";

type MobileProductImageCarouselProps = {
  images: string[];
  productName: string;
  rating?: string;
};

export default function MobileProductImageCarousel({
  images,
  productName,
  rating,
}: MobileProductImageCarouselProps) {
  const galleryImages = images.filter(Boolean);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const resolvedActiveIndex = Math.min(
    activeIndex,
    Math.max(galleryImages.length - 1, 0),
  );

  function handleScroll() {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const nextIndex = Math.round(scroller.scrollLeft / scroller.clientWidth);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), galleryImages.length - 1));
  }

  function goToImage(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), galleryImages.length - 1);
    setActiveIndex(nextIndex);

    const targetSlide = slideRefs.current[nextIndex];
    if (targetSlide) {
      targetSlide.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
      return;
    }

    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    scroller.scrollTo({
      left: nextIndex * scroller.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <section className="bg-[#f7f8f5]">
      <div className="relative overflow-hidden">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        >
          {galleryImages.length ? (
            galleryImages.map((image, index) => (
              <div
                key={`${image}-${index}`}
                ref={(node) => {
                  slideRefs.current[index] = node;
                }}
                className="relative aspect-[1.03] min-h-[280px] w-full shrink-0 snap-center min-[390px]:min-h-[320px]"
              >
                <Image
                  src={image}
                  alt={`${productName} image ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="430px"
                  className="object-cover"
                />
              </div>
            ))
          ) : (
            <div className="flex aspect-[1.03] min-h-[280px] w-full shrink-0 items-center justify-center text-sm font-semibold text-[#6d8464]">
              Image unavailable
            </div>
          )}
        </div>

        <span className="absolute right-3 top-3 px-2.5 py-1 text-[9px] bg-white font-black uppercase tracking-[0.18em] text-[#214f14]">
          Real Image
        </span>
        {rating ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md bg-white/50 px-2 py-1 text-xs font-black text-[#171410] shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <Star size={13} fill="currentColor" className="text-[#f4b400]" />
            {rating}
          </span>
        ) : null}
      </div>

      {galleryImages.length > 1 ? (
        <div className="mt-3 px-3 pb-1">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {galleryImages.map((image, index) => {
              const isActive = index === resolvedActiveIndex;

              return (
                <button
                  key={`${image}-thumb-${index}`}
                  type="button"
                  onClick={() => goToImage(index)}
                  aria-label={`Show ${productName} image ${index + 1}`}
                  aria-pressed={isActive}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white transition ${
                    isActive
                      ? "border-[#214f14] ring-2 ring-[#214f14]/15"
                      : "border-[#d6e6bd] hover:border-[#8ca773]"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${productName} thumbnail ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

    </section>
  );
}
