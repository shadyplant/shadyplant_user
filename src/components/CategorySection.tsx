import Image from "next/image";
import Link from "next/link";
import type { HomeCategoryItem } from "@/lib/homeCategoryItems";
import { ChevronRight } from "lucide-react";

type CategorySectionProps = {
  items?: HomeCategoryItem[];
  pulseIndices?: number | number[];
};

const FALLBACK_IMAGE = "/hero_image.png";

export default function CategorySection({
  items = [],
}: CategorySectionProps) {
  const categoryStories = items
    .filter((item) => item.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({
      label: item.label,
      href: item.href || "/search",
      image: item.image || FALLBACK_IMAGE,
      accentStyle: {
        backgroundImage: `linear-gradient(135deg, ${item.accentFrom}, ${item.accentVia}, ${item.accentTo})`,
      },
      showOfferBadge: item.showOfferBadge,
    }));

  if (!categoryStories.length) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-2 md:px-2 md:py-6">
        <div className="mb-4 flex w-full items-center justify-center md:mb-10">
          <span className="text-center text-lg leading-none text-[#163915] md:text-2xl">
            Shop by category
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto px-1 scrollbar-hide md:justify-center md:gap-8">
          {categoryStories.map((story) => (
            <Link
              href={story.href}
              key={story.label}
              className="group/story flex min-w-[88px] shrink-0 flex-col items-center gap-3 text-center transition-transform active:scale-95 md:min-w-[108px]"
            >
              <div
                style={story.accentStyle}
                className="relative flex h-[6rem] w-[6rem] items-center justify-center rounded-2xl p-[2.5px] transition-all duration-300 group-hover/story:-translate-y-1 group-hover/story:shadow-lg md:h-[7rem] md:w-[7rem]"
              >
                <div className="relative h-full w-full overflow-hidden rounded-[13px] bg-white">
                  {story.showOfferBadge ? (
                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#ff9d8b_0%,#ff6f67_62%,#ff5a5a_100%)] text-white">
                      <span className="text-[2.5rem] font-black leading-none md:text-[2.75rem]">
                        %
                      </span>
                    </div>
                  ) : (
                    <Image
                      src={story.image}
                      alt={story.label}
                      fill
                      sizes="112px"
                      className="object-cover transition duration-300 group-hover/story:scale-105"
                    />
                  )}
                </div>
              </div>

              <span className="w-full text-[0.8rem] font-medium leading-snug tracking-tight text-[#233d1d] md:text-[0.875rem]">
                {story.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
