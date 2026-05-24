"use client";

import {
  BadgeCheck,
  HandHelping,
  PackageCheck,
  Sprout,
  Truck,
} from "lucide-react";

const trustItems = [
  {
    label: "Beginner-Friendly Guidance Included",
    icon: Sprout,
  },
  {
    label: "Trusted by 3.5L+ Garden Lovers",
    icon: BadgeCheck,
  },
  {
    label: "Ships Across India",
    icon: Truck,
  },
  {
    label: "Safe Delivery for Live Plants",
    icon: PackageCheck,
  },
  {
    label: "Care & planting support included",
    icon: HandHelping,
  },
];

export default function TrustMarquee() {
  const repeatedItems = [...trustItems, ...trustItems];

  return (
    <section className="px-3 py-0 md:px-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[0.5rem] bg-[#ffffff]">
        <div className="flex min-w-full w-max will-change-transform animate-[home-trust-marquee-scroll_26s_linear_infinite] hover:[animation-play-state:paused]">
          <div className="flex shrink-0 items-center">
            {repeatedItems.map(({ label, icon: Icon }, index) => (
              <div
                key={`${label}-${index}`}
                className="inline-flex shrink-0 items-center gap-[0.7rem] px-0 py-[0.55rem] pl-4 text-[0.82rem] font-semibold text-[#314330] md:gap-[0.9rem] md:px-0 md:py-4 md:pl-5 md:text-[0.92rem]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef5e7] text-[#356b27]">
                  <Icon size={20} strokeWidth={2.1} />
                </div>
                <span>{label}</span>
                <span className="ml-[1.15rem] font-normal text-[#b7c5b0]" aria-hidden="true">
                  |
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes home-trust-marquee-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </section>
  );
}
