"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const slides = [
  {
    id: 1,
    title: "Lawn Grass Cultivation",
    description:
      "Premium quality lawn grass cultivated with care, delivered fresh to transform your outdoor space into a lush green paradise.",
    image:
      "https://5.imimg.com/data5/SELLER/Default/2022/11/BY/XE/BI/81351226/balaji-nursery-natural-lawn-grass-in-gurgaon-haryana-1000x1000.jpeg",
  },
  {
    id: 2,
    title: "Sod Installation Service",
    description:
      "Professional sod laying services with expert handling, ensuring perfect coverage and healthy root establishment from day one.",
    image:
      "https://content.jdmagicbox.com/v2/comp/barpeta/p1/9999p3665.3665.190525081504.d3p1/catalogue/green-grass-nursery-saupur-barpeta-plant-nurseries-dk9eho8j31.jpg",
  },
  {
    id: 3,
    title: "Artificial Turf Supply",
    description:
      "High-grade synthetic turf for year-round greenery. Ideal for gardens, sports grounds, and commercial landscaping projects.",
    image:
      "https://5.imimg.com/data5/SELLER/Default/2024/8/441747119/KH/JV/YH/133666458/whatsapp-image-2024-02-12-at-19-42-36-1000x1000.jpeg",
  },
  {
    id: 4,
    title: "Garden Landscaping",
    description:
      "Complete garden design and landscaping solutions, crafting beautiful outdoor environments tailored to your vision and space.",
    image:
      "https://5.imimg.com/data5/SELLER/Default/2025/8/540005508/VV/PY/ZA/72263552/natural-lawn-grass-near-me-noida-500x500.jpg",
  },
  {
    id: 5,
    title: "Grass Maintenance Kit",
    description:
      "Everything you need for a flourishing lawn — premium fertilizers, tools, and expert guidance for year-round upkeep.",
    image:
      "https://images.jdmagicbox.com/comp/barpeta/p1/9999p3665.3665.190525081504.d3p1/catalogue/grass-green-nursery-barpeta-lawn-grass-dealers-lkbx42orxe.jpg",
  },
];

export default function BestSellingCarousel() {
  const [active, setActive] = useState(2);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = slides.length;

  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % total);
    }, 10000);
  }, [total]);

  useEffect(() => {
    startAutoSlide();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoSlide]);

  const getPosition = (index: number) => {
    const diff = (index - active + total) % total;
    // Map to: -2, -1, 0, 1, 2 (center = 0)
    const pos = diff > total / 2 ? diff - total : diff;
    return pos;
  };

  const handleDotClick = (i: number) => {
    setActive(i);
    startAutoSlide();
  };

  function renderCarouselTrack(config: {
    containerClassName: string;
    centerW: number;
    centerH: number;
    adjacentW: number;
    adjacentH: number;
    farW: number;
    farH: number;
    adjacentScale: number;
    farScale: number;
    gap: number;
  }) {
    const {
      containerClassName,
      centerW,
      centerH,
      adjacentW,
      adjacentH,
      farW,
      farH,
      adjacentScale,
      farScale,
      gap,
    } = config;

    return (
      <div className={containerClassName}>
        {slides.map((slide, i) => {
          const pos = getPosition(i);
          const isCenter = pos === 0;
          const isAdjacent = Math.abs(pos) === 1;
          const isFar = Math.abs(pos) === 2;
          const isHidden = Math.abs(pos) > 2;

          const adjacentRendered = adjacentW * adjacentScale;
          const farRendered = farW * farScale;
          const x1 = centerW / 2 + gap + adjacentRendered / 2;
          const x2 = centerW / 2 + gap + adjacentRendered + gap + farRendered / 2;

          const translateX =
            pos === 0 ? 0
            : pos === 1 ? x1
            : pos === -1 ? -x1
            : pos === 2 ? x2
            : pos === -2 ? -x2
            : pos * 400;

          const scale = isCenter ? 1 : isAdjacent ? adjacentScale : farScale;
          const zIndex = isCenter ? 30 : isAdjacent ? 20 : isFar ? 10 : 0;
          const opacity = isHidden ? 0 : isFar ? 0.55 : isAdjacent ? 0.85 : 1;

          return (
            <div
              key={`${slide.id}-${containerClassName}`}
              onClick={() => {
                if (!isCenter) {
                  setActive(i);
                  startAutoSlide();
                }
              }}
              className="absolute overflow-hidden rounded-3xl transition-all duration-700 ease-in-out"
              style={{
                width: isCenter ? centerW : isAdjacent ? adjacentW : farW,
                height: isCenter ? centerH : isAdjacent ? adjacentH : farH,
                transform: `translateX(${translateX}px) scale(${scale})`,
                zIndex,
                opacity,
                cursor: isCenter ? "default" : "pointer",
                boxShadow: isCenter
                  ? "0 24px 56px rgba(0,0,0,0.0), 0 6px 18px rgba(0,0,0,0.0)"
                  : "0 8px 32px rgba(0,0,0,0.12)",
              }}
            >
              <div className="relative h-full w-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="(max-width: 767px) 260px, 420px"
                  className="object-cover"
                  draggable={false}
                />
              </div>

              {isCenter ? (
                <div
                  className="absolute inset-0 flex flex-col justify-end p-5 md:p-7"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)",
                  }}
                >
                  <h3 className="mb-2 text-[1.2rem] font-bold leading-tight text-white md:text-2xl md:leading-snug">
                    {slide.title}
                  </h3>
                  <p className="line-clamp-2 text-[13px] leading-6 text-white/80 md:line-clamp-none md:text-sm md:leading-relaxed">
                    {slide.description}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section
      className="relative flex w-full min-h-[auto] flex-col items-center justify-start overflow-hidden py-0 pb-2 md:min-h-screen md:justify-center md:py-12"
      style={{
       
        backgroundImage: "url('/bg-best-selling-pn-03.png')",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[100px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.92) 35%, rgba(255,255,255,0) 100%)",
        }}
      />

      {/* Title */}
      <div className="relative z-10 mb-6 mt-0 flex items-center gap-3 md:mb-12">
  
        <h2
          className="text-xl md:text-2xl"
          style={{
            color: "#173419",
            letterSpacing: "-0.02em",
          }}
        >
          Best Selling
        </h2>
      </div>

      {/* Carousel Track */}
      {renderCarouselTrack({
        containerClassName:
          "relative z-10 flex h-[360px] w-full items-center justify-center md:hidden",
        centerW: 260,
        centerH: 360,
        adjacentW: 110,
        adjacentH: 250,
        farW: 84,
        farH: 220,
        adjacentScale: 0.88,
        farScale: 0.72,
        gap: 10,
      })}

      {renderCarouselTrack({
        containerClassName:
          "relative z-10 hidden h-[460px] w-full items-center justify-center md:flex",
        centerW: 420,
        centerH: 420,
        adjacentW: 190,
        adjacentH: 370,
        farW: 140,
        farH: 330,
        adjacentScale: 0.72,
        farScale: 0.52,
        gap: 15,
      })}

      {/* Dots */}
      <div className="relative z-10 mb-6 mt-4 flex gap-2.5 md:mb-10 md:mt-8">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDotClick(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: active === i ? 24 : 10,
              height: 10,
              background:
                active === i ? "#4c8b5d" : "rgba(100,130,80,0.4)",
              border: "none",
              cursor: "pointer",
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Shop Now Button */}
      <button
        className="bg-[#4c8b5d] rounded-full relative z-10 mb-0 flex h-11 w-[170px] items-center justify-center px-4 text-white font-semibold  text-sm transition-all duration-200 hover:scale-105 active:scale-95 md:w-auto md:px-10 md:h-auto md:py-4 md:tracking-widest"
      >
        Shop Now
      </button>
    </section>
  );
}
