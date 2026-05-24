"use client";

import Image from "next/image";
import React from "react";
import type { ProductVideoClip } from "@/lib/productMedia";

type SeeInActionCarouselProps = {
  clips: ProductVideoClip[];
  productName: string;
};

export default function SeeInActionCarousel({
  clips,
  productName,
}: SeeInActionCarouselProps) {
  if (!clips.length) {
    return null;
  }

  return (
    <section className="w-full py-4 md:py-8 md:px-6">
      {/* Header section with minimal edge padding */}
      <div className="w-full md:px-4 mb-3 md:mb-6">
        <h2 className="text-medium font-semibold leading-4 text-[#111111] md:text-xl md:leading-6">
          Real life view
        </h2>
        <p className="mt-0.5 text-[11px] leading-4 text-[#555555] md:text-sm">
          Real customer-style clips and previews for {productName}
        </p>
      </div>

      {/* Full Width Horizontal Scroll Container */}
      <div className="w-full">
        <div className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2 md:px-4 md:gap-4 scrollbar-hide">
          {clips.map((item) => {
            const mediaAlt = item.title || `${productName} showcase clip`;

            return (
              <div
                key={item.id}
                className="relative h-[360px] w-[230px] shrink-0 snap-start select-none overflow-hidden rounded-2xl shadow-sm md:h-[500px] md:w-[300px]"
              >
                {item.src ? (
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
                    sizes="(max-width: 768px) 230px, 300px"
                    className="pointer-events-none object-cover"
                    unoptimized
                  />
                )}

              

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
