"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface SliderProps {
  banners: Banner[];
  autoPlay?: boolean;       // default true
  intervalMs?: number;      // default 5000
  className?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  href?: string;       // optional link the banner should navigate to
  ctaLabel?: string;   // optional button text, e.g. "Shop now"
}



// Example data — same shape your API response should return.
// Swap this for a real fetch once your endpoint is ready (see lib/getBanners.ts).
export const exampleBanners: Banner[] = [
  {
    id: "1",
    title: "Summer Sale is Here",
    subtitle: "Up to 50% off on selected items",
    imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1600&q=80",
    href: "/sale",
    ctaLabel: "Shop the sale",
  },
  {
    id: "2",
    title: "New Arrivals",
    subtitle: "Fresh drops every week",
    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80",
    href: "/new-arrivals",
    ctaLabel: "Explore now",
  },
  {
    id: "3",
    title: "Free Shipping",
    subtitle: "On all orders over $50",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    href: "/shipping",
    ctaLabel: "Learn more",
  },
  {
    id: "4",
    title: "Member Rewards",
    subtitle: "Earn points on every purchase",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80",
    href: "/rewards",
    ctaLabel: "Join now",
  },
];

export default function Slider({
  banners,
  autoPlay = true,
  intervalMs = 5000,
  className = "",
}: SliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const count = banners.length;

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      const next = ((index % count) + count) % count; // wrap both directions
      setActiveIndex(next);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Autoplay
  useEffect(() => {
    if (!autoPlay || isPaused || count <= 1) return;
    const id = setInterval(goNext, intervalMs);
    return () => clearInterval(id);
  }, [autoPlay, isPaused, intervalMs, goNext, count]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
  };

  // Touch / swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const handleTouchEnd = () => {
    const threshold = 50;
    if (touchDeltaX.current > threshold) goPrev();
    else if (touchDeltaX.current < -threshold) goNext();
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  if (count === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-500">
        No banners to show
      </div>
    );
  }

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-2xl bg-neutral-100 ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional banners"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides track */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <BannerSlide key={banner.id} banner={banner} isActive={index === activeIndex} />
        ))}
      </div>

      {/* Prev / Next arrows — visible on hover for desktop, always usable via keyboard */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-neutral-800 opacity-0 shadow-md transition-opacity duration-200 hover:bg-white group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-neutral-800 opacity-0 shadow-md transition-opacity duration-200 hover:bg-white group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <ChevronIcon direction="right" />
          </button>
        </>
      )}

      {/* Dot pagination */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === activeIndex}
              className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                index === activeIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BannerSlide({ banner, isActive }: { banner: Banner; isActive: boolean }) {
  const content = (
    <div className="relative aspect-[16/7] w-full flex-shrink-0 sm:aspect-[28/6]">
      <Image
        src={banner.imageUrl}
        alt={banner.title}
        fill
        priority={isActive}
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-10 left-6 right-6 text-white sm:bottom-12 sm:left-10">
        <h2 className="text-xl font-semibold drop-shadow sm:text-3xl">{banner.title}</h2>
        {banner.subtitle && (
          <p className="mt-1 max-w-md text-sm text-white/90 drop-shadow sm:text-base">
            {banner.subtitle}
          </p>
        )}
        {banner.ctaLabel && (
          <span className="mt-4 inline-block rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900">
            {banner.ctaLabel}
          </span>
        )}
      </div>
    </div>
  );

  return banner.href ? (
    <Link href={banner.href} className="w-full flex-shrink-0" tabIndex={-1}>
      {content}
    </Link>
  ) : (
    content
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {direction === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  );
}





/**
 * Fetches banners for the slider. Runs on the server (called from a
 * Server Component or Route Handler), so it's safe to use secrets,
 * internal URLs, or a DB/CMS client here.
 *
 * Swap the body of this function for your real API call — the shape
 * returned must match Banner[] (see types/banner.ts). Everything else
 * (the slider component, dot pagination, etc.) stays the same.
 */
export async function getBanners(): Promise<Banner[]> {
  const apiUrl = process.env.BANNERS_API_URL;

  // No API configured yet — use local example data so the UI works out of the box.
  if (!apiUrl) {
    return exampleBanners;
  }

  try {
    const res = await fetch(apiUrl, {
      headers: {
        // Add auth if your API needs it:
        // Authorization: `Bearer ${process.env.BANNERS_API_TOKEN}`,
      },
      // Cache for 60s and let Next.js revalidate in the background.
      // Use { cache: "no-store" } instead if banners must always be fresh.
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch banners: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as Banner[];
    return data;
  } catch (error) {
    console.error("getBanners() failed, falling back to example data:", error);
    return exampleBanners;
  }
}