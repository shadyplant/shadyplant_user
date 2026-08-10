"use client";

import { type TouchEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LawnGrassBulkOrderPopup from "@/components/LawnGrassBulkOrderPopup";
import type { HomeSliderBanner } from "@/lib/homeSliderBanners";

type HomeSliderProps = {
  slides?: HomeSliderBanner[];
};

export default function HomeSlider({ slides = [] }: HomeSliderProps) {
  const items = slides;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [isLawnGrassPopupOpen, setIsLawnGrassPopupOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const currentIndex = activeIndex >= items.length ? 0 : activeIndex;

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setIsTransitionEnabled(true);
      setActiveIndex((current) => current + 1);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    if (activeIndex <= items.length) {
      return;
    }

    setIsTransitionEnabled(false);
    setActiveIndex(0);

    const frame = window.requestAnimationFrame(() => {
      setIsTransitionEnabled(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeIndex, items.length]);

  if (!items.length) {
    return null;
  }

  const goToPrevious = () => {
    setIsTransitionEnabled(true);
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setIsTransitionEnabled(true);
    setActiveIndex((current) => current + 1);
  };

  const handleTransitionEnd = () => {
    if (activeIndex >= items.length) {
      setIsTransitionEnabled(false);
      setActiveIndex(0);
      requestAnimationFrame(() => {
        setIsTransitionEnabled(true);
      });
    }
  };

  const renderSlideImage = (slide: HomeSliderBanner, index: number) => (
    <>
      <Image
        src={slide.mobileImage || slide.desktopImage}
        alt={slide.title}
        fill
        priority={index === 0}
        sizes="(max-width: 767px) 100vw, 0px"
        className="!object-cover object-center md:hidden"
        style={{ objectFit: "cover", objectPosition: "center" }}
        quality={100}
      />
      <Image
        src={slide.desktopImage || slide.mobileImage}
        alt={slide.title}
        fill
        priority={index === 0}
        sizes="(max-width: 767px) 0px, 100vw"
        className="hidden !object-cover object-center md:block"
        style={{ objectFit: "cover", objectPosition: "center" }}
        quality={100}
      />
    </>
  );

  const getPopupKey = (slide: HomeSliderBanner) => {
    if (slide.actionType !== "popup") {
      return "";
    }

    return String(slide.popupKey || "lawn-grass-estimate").toLowerCase();
  };

  const isLawnGrassPopupSlide = (slide: HomeSliderBanner) => {
    return getPopupKey(slide) === "lawn-grass-estimate";
  };

  const isPopupAction = (slide: HomeSliderBanner) => slide.actionType === "popup";

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 1) {
      return;
    }

    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touchStartX = touchStartXRef.current;
    const touchStartY = touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (touchStartX === null || touchStartY === null) {
      return;
    }

    const touchEnd = event.changedTouches[0];

    if (!touchEnd) {
      return;
    }

    const deltaX = touchEnd.clientX - touchStartX;
    const deltaY = touchEnd.clientY - touchStartY;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      goToNext();
    } else {
      goToPrevious();
    }
  }

  return (
    <section className="px-0 pt-0 md:px-0">
      <div className="w-full">
        <div className="px-0 md:p-0">
          <div className="relative aspect-[390/210] w-full overflow-hidden border border-[#d7e1d3] bg-[#eef4ea] sm:aspect-[390/190] md:aspect-[2000/598]">
            <div
              className={`flex h-full ${
                isTransitionEnabled
                  ? "transition-transform duration-700 ease-in-out"
                  : ""
              }`}
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              onTransitionEnd={handleTransitionEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {[...items, items[0]].map((slide, index) => (
                <div
                  key={`${slide.title}-${index}`}
                  className="relative h-full min-w-full shrink-0 basis-full overflow-hidden"
                >
                  {isLawnGrassPopupSlide(slide) ? (
                    <button
                      type="button"
                      onClick={() => setIsLawnGrassPopupOpen(true)}
                      className="relative block h-full w-full overflow-hidden text-left"
                      aria-label={slide.title}
                    >
                      {renderSlideImage(slide, index)}
                    </button>
                  ) : isPopupAction(slide) ? (
                    <div className="relative h-full w-full overflow-hidden">
                      {renderSlideImage(slide, index)}
                    </div>
                  ) : slide.href ? (
                    <Link
                      href={slide.href}
                      className="relative block h-full w-full overflow-hidden"
                      aria-label={slide.title}
                    >
                      {renderSlideImage(slide, index)}
                    </Link>
                  ) : (
                    <div className="relative h-full w-full overflow-hidden">
                      {renderSlideImage(slide, index)}
                    </div>
                  )}
                </div>
              ))}
            </div>

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
                onClick={() => {
                  setIsTransitionEnabled(true);
                  setActiveIndex(index);
                }}
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
      <LawnGrassBulkOrderPopup
        open={isLawnGrassPopupOpen}
        onOpenChange={setIsLawnGrassPopupOpen}
      />
    </section>
  );
}
