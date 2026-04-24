"use client";

import Link from "next/link";

import {
  Flower2,
  Home,
  Package2,
  Scissors,
  Sprout,
  Trees,
  Wrench,
} from "lucide-react";

const categoryIcons = [
  { label: "For You", icon: Home, href: "/search" },
  { label: "Indoor", icon: Sprout, href: "/search?category=Indoor%20Plants" },
  { label: "Outdoor", icon: Trees, href: "/search?category=Outdoor%20Plants" },
  { label: "Lawns", icon: Scissors, href: "/search?category=Lawn%20Grass" },
  { label: "Ferns", icon: Flower2, href: "/search?category=Ferns" },
  { label: "Planters", icon: Package2, href: "/search?q=planters" },
  { label: "Tools", icon: Wrench, href: "/search?q=tools" },
];

/**
 * Isolated Category Section Component
 */
export default function CategorySection() {
  return (
    <div className="border-b border-[#dfe6d8] bg-white/95">
      {/* Icon Navigation */}
      <div className="mx-auto flex w-full max-w-7xl justify-start gap-3 overflow-x-auto px-4 py-2 scrollbar-hide md:justify-center md:gap-4 md:px-6 md:py-2.5">
        {categoryIcons.map(({ label, icon: Icon, href }, index) => (
          <Link
            href={href}
            key={label}
            className="flex min-w-[62px] flex-col items-center gap-1.5 text-center transition-transform active:scale-95 md:min-w-[70px]"
          >
            <div
              className={`rounded-[1rem] p-2 md:p-2.5 ${
                index === 0 ? "bg-[#eaf3de]" : "bg-[#f5f7f2]"
              }`}
            >
              <Icon size={15} className="text-[#24361b] md:h-4 md:w-4" />
            </div>
            <span
              className={`text-[10px] font-semibold leading-tight md:text-[11px] ${
                index === 0 ? "text-[#24361b]" : "text-[#4b5e40]"
              }`}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
