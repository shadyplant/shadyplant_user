"use client";

import React, { useState } from "react";
import { Play, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselItem {
  id: string;
  image: string;
  views?: string;
  products?: number;
  isVideo?: boolean;
}

const mockData: CarouselItem[] = [
  {
    id: "1",
    image:
      "https://mindtrip.ai/cdn-cgi/image/format=webp,w=720/https://images.mindtrip.ai/airports/1b17/f21d/5c70/5cc4/fdb2/7b32/45c8/9407",
    isVideo: false,
  },
  {
    id: "2",
    image:
      "https://media.cntraveler.com/photos/53d9cafe6dec627b149d40fd/16:9/w_1280,c_limit/Amsterdam_Airport.jpg",
    views: "29.7K",
    products: 1,
    isVideo: true,
  },
  {
    id: "3",
    image:
      "https://airportindustry-news.com/wp-content/uploads/sites/2/2026/02/Screenshot-2026-02-18-at-13.40.55-scaled.png",
    isVideo: false,
  },
  {
    id: "4",
    image:
      "https://airportindustry-news.com/wp-content/uploads/sites/2/2026/02/Screenshot-2026-02-18-at-13.40.55-scaled.png",
    isVideo: false,
  },
];

export default function SeeInActionCarousel() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeIndex < mockData.length - 1) {
      setActiveIndex((prev) => prev + 1);
    }
    if (isRightSwipe && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  // Desktop Navigation Handlers
  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (activeIndex < mockData.length - 1) setActiveIndex((prev) => prev + 1);
  };

  return (
    <section className="w-full overflow-hidden py-6 md:py-16">
      {/* Section Header */}
      <div className="mx-auto mb-4 w-full max-w-5xl px-1 text-left md:mb-8 md:px-4">
        <h2 className="text-[14px] font-black leading-4 text-[#111111] md:text-xl md:leading-6">
          Real life view
        </h2>
        <p className="mt-0.5 text-[11px] leading-4 text-[#555555] md:text-sm">
          Experience the view of greenery after the installation
        </p>
      </div>

      {/* Wrapper for Carousel and Desktop Arrows */}
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-center px-4">
        {/* Desktop Left Arrow */}
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="hidden md:flex absolute left-4 xl:-left-8 z-40 p-3 bg-white/90 backdrop-blur-sm shadow-lg rounded-full text-gray-800 hover:bg-white hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        {/* 3D Carousel Container */}
        <div
          className="relative w-full max-w-4xl h-[520px] flex justify-center items-center [perspective:1200px]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {mockData.map((item, index) => {
            const offset = index - activeIndex;
            const isCenter = offset === 0;

            // Calculate 3D transforms based on the card's position relative to the active index
            let transformStyle = "";
            let zIndex = 10;
            let opacity = 1;

            if (offset === 0) {
              // Center active card
              transformStyle = "translateX(0) scale(1) rotateY(0deg)";
              zIndex = 30;
            } else if (offset === -1) {
              // Left card
              transformStyle = "translateX(-65%) scale(0.85) rotateY(15deg)";
              zIndex = 20;
            } else if (offset === 1) {
              // Right card
              transformStyle = "translateX(65%) scale(0.85) rotateY(-15deg)";
              zIndex = 20;
            } else {
              // Hidden cards (further left/right)
              transformStyle = `translateX(${
                offset > 0 ? "120%" : "-120%"
              }) scale(0.5) rotateY(0deg)`;
              opacity = 0;
              zIndex = 0;
            }

            return (
              <div
                key={item.id}
                onClick={() => setActiveIndex(index)}
                className="absolute w-[300px] h-[500px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out shadow-xl select-none"
                style={{
                  transform: transformStyle,
                  zIndex,
                  opacity,
                  transformStyle: "preserve-3d",
                }}
              >
                <img
                  src={item.image}
                  alt="Product showcase"
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />

                {/* Dim side cards for better depth perception */}
                {!isCenter && (
                  <div className="absolute inset-0 bg-black/15 transition-opacity duration-500" />
                )}

                {/* Overlays for the active video item */}
                {isCenter && item.isVideo && (
                  <>
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 text-white text-sm font-medium drop-shadow-md">
                      <Play className="w-5 h-5 fill-white" />
                      <span>{item.views}</span>
                    </div>

                    <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-2 rounded-xl flex items-center gap-2 text-white text-sm font-medium border border-white/20 hover:bg-black/50 transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {item.products} Product
                        {item.products && item.products > 1 ? "s" : ""}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Right Arrow */}
        <button
          onClick={handleNext}
          disabled={activeIndex === mockData.length - 1}
          className="hidden md:flex absolute right-4 xl:-right-8 z-40 p-3 bg-white/90 backdrop-blur-sm shadow-lg rounded-full text-gray-800 hover:bg-white hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Next slide"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>
    </section>
  );
}
