"use client";

import Image from "next/image";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Play, ShoppingBag } from "lucide-react";
import type { ProductVideoClip } from "@/lib/productMedia";

type SeeInActionCarouselProps = {
  clips: ProductVideoClip[];
  productName: string;
};

export default function SeeInActionCarousel({
  clips,
  productName,
}: SeeInActionCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  if (!clips.length) {
    return null;
  }

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeIndex < clips.length - 1) {
      setActiveIndex((prev) => prev + 1);
    }

    if (isRightSwipe && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < clips.length - 1) {
      setActiveIndex((prev) => prev + 1);
    }
  };

  return (
    <section className="w-full overflow-hidden py-6 md:py-16">
      <div className="mx-auto mb-4 w-full max-w-5xl px-1 text-left md:mb-8 md:px-4">
        <h2 className="text-[14px] font-black leading-4 text-[#111111] md:text-xl md:leading-6">
          Real life view
        </h2>
        <p className="mt-0.5 text-[11px] leading-4 text-[#555555] md:text-sm">
          Real customer-style clips and previews for {productName}
        </p>
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-center px-4">
        {clips.length > 1 ? (
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="absolute left-4 z-40 hidden rounded-full bg-white/90 p-3 text-gray-800 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 md:flex xl:-left-8"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        ) : null}

        <div
          className="relative flex h-[360px] w-full max-w-4xl items-center justify-center [perspective:1200px] md:h-[520px]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {clips.map((item, index) => {
            const offset = index - activeIndex;
            const isCenter = offset === 0;

            let transformStyle = "";
            let zIndex = 10;
            let opacity = 1;

            if (offset === 0) {
              transformStyle = "translateX(0) scale(1) rotateY(0deg)";
              zIndex = 30;
            } else if (offset === -1) {
              transformStyle = "translateX(-65%) scale(0.85) rotateY(15deg)";
              zIndex = 20;
            } else if (offset === 1) {
              transformStyle = "translateX(65%) scale(0.85) rotateY(-15deg)";
              zIndex = 20;
            } else {
              transformStyle = `translateX(${
                offset > 0 ? "120%" : "-120%"
              }) scale(0.5) rotateY(0deg)`;
              opacity = 0;
              zIndex = 0;
            }

            const mediaAlt = item.title || `${productName} showcase clip`;

            return (
              <div
                key={item.id}
                onClick={() => setActiveIndex(index)}
                className="absolute h-[320px] w-[210px] select-none overflow-hidden rounded-2xl shadow-xl transition-all duration-500 ease-out md:h-[500px] md:w-[300px]"
                style={{
                  transform: transformStyle,
                  zIndex,
                  opacity,
                  transformStyle: "preserve-3d",
                }}
              >
                {isCenter && item.src ? (
                  <video
                    src={item.src}
                    poster={item.poster}
                    className="h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={item.poster}
                    alt={mediaAlt}
                    fill
                    sizes="(max-width: 768px) 210px, 300px"
                    className="pointer-events-none object-cover"
                    unoptimized
                  />
                )}

                {!isCenter ? (
                  <div className="absolute inset-0 bg-black/15 transition-opacity duration-500" />
                ) : null}

                {isCenter ? (
                  <>
                    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/45 to-transparent px-4 pb-12 pt-4 text-white">
                      <div className="flex items-center gap-1.5 text-sm font-medium drop-shadow-md">
                        <Play className="h-5 w-5 fill-white" />
                        <span>{item.views || "Live view"}</span>
                      </div>
                      <p className="mt-2 max-w-[85%] text-sm font-semibold leading-5 drop-shadow-md md:text-base">
                        {item.title}
                      </p>
                    </div>

                    <div className="absolute bottom-4 left-4 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/50">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        <span>
                          {item.products || 1} Product
                          {(item.products || 1) > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>

        {clips.length > 1 ? (
          <button
            onClick={handleNext}
            disabled={activeIndex === clips.length - 1}
            className="absolute right-4 z-40 hidden rounded-full bg-white/90 p-3 text-gray-800 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 md:flex xl:-right-8"
            aria-label="Next slide"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
