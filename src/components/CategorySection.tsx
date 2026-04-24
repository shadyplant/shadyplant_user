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
import { categoryBar } from "@/content/store";

const categoryIcons = [
  { label: "For You", icon: Home },
  { label: "Indoor", icon: Sprout },
  { label: "Outdoor", icon: Trees },
  { label: "Lawns", icon: Scissors },
  { label: "Ferns", icon: Flower2 },
  { label: "Planters", icon: Package2 },
  { label: "Tools", icon: Wrench },
];

/**
 * Isolated Category Section Component
 */
export default function CategorySection() {
  return (
    <div className="border-b border-[#dfe6d8] bg-white/95">
      {/* Icon Navigation */}
      <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 py-2 md:gap-4 md:px-6 md:py-2.5 scrollbar-hide">
        {categoryIcons.map(({ label, icon: Icon }, index) => (
          <Link
            href={`/order?category=${encodeURIComponent(label)}`}
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

      {/* Text Pills (Desktop Only) */}
      <div className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-sm font-semibold text-[#214f14] md:flex md:px-6 scrollbar-hide">
        {categoryBar.map((category) => (
          <Link
            key={category}
            href={`/order?category=${encodeURIComponent(category)}`}
            className="whitespace-nowrap rounded-full border border-[#d8dfd4] bg-[#f5f7f2] px-3 py-1.5 transition-colors hover:bg-[#eaf3de]"
          >
            {category}
          </Link>
        ))}
      </div>
    </div>
  );
}
