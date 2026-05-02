"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useRef, useState } from "react";

type MobileProductImageCarouselProps = {
  images: string[];
  productName: string;
  rating: string;
};

export default function MobileProductImageCarousel({
  images,
  productName,
  rating,
}: MobileProductImageCarouselProps) {
  const galleryImages = images.filter(Boolean);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll() {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const nextIndex = Math.round(scroller.scrollLeft / scroller.clientWidth);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), galleryImages.length - 1));
  }

  function goToImage(index: number) {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    scroller.scrollTo({
      left: index * scroller.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <section className="relative overflow-hidden rounded-[1.25rem] border border-[#eeeeee] bg-[#f7f8f5] shadow-[0_10px_28px_rgba(23,20,16,0.06)]">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {galleryImages.length ? (
          galleryImages.map((image, index) => (
            <div
              key={`${image}-${index}`}
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

      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[#214f14] shadow-sm backdrop-blur">
        Best Seller
      </span>
      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-black text-[#171410] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <Star size={13} fill="currentColor" className="text-[#f4b400]" />
        {rating}
      </span>

      {galleryImages.length > 1 ? (
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/75 px-2 py-1 shadow-sm backdrop-blur">
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-dot-${index}`}
              type="button"
              onClick={() => goToImage(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-4 bg-[#171410]" : "w-1.5 bg-[#171410]/45"
              }`}
              aria-label={`Show ${productName} image ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
