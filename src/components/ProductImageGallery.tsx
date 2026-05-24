"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useState } from "react";

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
  overlayContent?: ReactNode;
};

export default function ProductImageGallery({
  images,
  productName,
  overlayContent,
}: ProductImageGalleryProps) {
  const galleryImages = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = galleryImages.length > 1;
  const showThumbnailRail = galleryImages.length > 0;

  if (!galleryImages.length) {
    return (
      <div className="rounded-[2rem] border border-[#d6e6bd] bg-white p-4 shadow-[0_24px_56px_rgba(33,79,20,0.08)]">
        <div className="flex aspect-[4/5] items-center justify-center rounded-[1.6rem] bg-[#edf5e1] text-sm font-semibold text-[#6c8a63]">
          Image unavailable
        </div>
      </div>
    );
  }

  const resolvedActiveIndex = Math.min(activeIndex, galleryImages.length - 1);
  const activeImage = galleryImages[resolvedActiveIndex];

  const goToPrevious = () => {
    setActiveIndex(
      resolvedActiveIndex === 0
        ? galleryImages.length - 1
        : resolvedActiveIndex - 1,
    );
  };

  const goToNext = () => {
    setActiveIndex(
      resolvedActiveIndex === galleryImages.length - 1
        ? 0
        : resolvedActiveIndex + 1,
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)] lg:gap-5 lg:items-start">
      {showThumbnailRail ? (
        <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:max-h-[720px] lg:flex-col lg:overflow-y-auto lg:pb-0 lg:pr-2">
          {galleryImages.map((image, index) => {
            const isActive = index === resolvedActiveIndex;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                // 1. Removed "relative" from here so the image doesn't anchor to the button
                // 2. Added "flex items-center justify-center" to perfectly center the inner image
                className={`flex shrink-0 items-center justify-center rounded-xl bg-white transition-all ${
                  isActive
                    ? "border-2 border-[#214f14] p-1 shadow-[0_8px_16px_rgba(33,79,20,0.1)]"
                    : "border border-[#d6e6bd] hover:border-[#8ca773]"
                }`}
                aria-label={`Show ${productName} image ${index + 1}`}
              >
                {/* 3. CRITICAL: This div must have "relative" and "overflow-hidden" */}
                <div
                  className={`relative h-20 w-16 overflow-hidden sm:h-24 sm:w-20 lg:h-[108px] lg:w-[88px] ${
                    isActive ? "rounded-md" : "rounded-[0.5rem]"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${productName} thumbnail ${index + 1}`}
                    fill
                    sizes="(max-width: 1024px) 80px, 88px"
                    className="object-cover"
                  />
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="order-1 rounded-[2rem] p-0 sm:p-0 lg:order-2">
        <div className="relative overflow-hidden rounded-[1.6rem]">
          <span className="absolute right-4 top-4 z-10 rounded-full bg-white/92 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#214f14] shadow-sm backdrop-blur">
            Real Image
          </span>
          <div className="relative aspect-[4/5] min-h-[320px] sm:aspect-[5/6] lg:min-h-[640px] xl:min-h-[720px]">
            <Image
              src={activeImage}
              alt={`${productName} image ${resolvedActiveIndex + 1}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 52vw, 760px"
              className="object-cover"
            />
          </div>
          {overlayContent ? (
            <div className="absolute left-4 top-4 z-10">{overlayContent}</div>
          ) : null}

          {hasMultipleImages ? (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-[#214f14] shadow-md transition hover:bg-white lg:hidden"
                aria-label="Show previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-[#214f14] shadow-md transition hover:bg-white lg:hidden"
                aria-label="Show next image"
              >
                <ChevronRight size={20} />
              </button>

              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-white/90 px-3 py-2 shadow-sm backdrop-blur lg:hidden">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-dot-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Show ${productName} image ${index + 1}`}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      index === resolvedActiveIndex
                        ? "bg-[#214f14]"
                        : "bg-[#c5d7b1]"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/*  */}
    </div>
  );
}
