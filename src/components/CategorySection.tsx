import Image from "next/image";
import Link from "next/link";
import type { HomeCategoryItem } from "@/lib/homeCategoryItems";

type CategorySectionProps = {
  items?: HomeCategoryItem[];
  pulseIndices?: number | number[];
};

const FALLBACK_IMAGE = "/hero_image.png";

export default function CategorySection({
  items = [],
  pulseIndices = [],
}: CategorySectionProps) {
  const pulseArray = Array.isArray(pulseIndices)
    ? pulseIndices
    : [pulseIndices];

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
    <section className="border-b border-[#eef1ea] bg-white">
      <div className="mx-auto max-w-7xl px-3 py-3 md:px-6 md:py-4">
        <div className="flex gap-4 overflow-x-auto px-1 scrollbar-hide md:justify-center md:gap-5">
          {categoryStories.map((story, index) => {
            const shouldPulse = pulseArray.includes(index);

            return (
              <Link
                href={story.href}
                key={story.label}
                className="group/story flex min-w-[68px] shrink-0 flex-col items-center gap-2 text-center transition-transform active:scale-95 md:min-w-[82px]"
              >
                <div className="relative isolate">
                  {shouldPulse && (
                    <>
                      <span
                        aria-hidden="true"
                        className="category-story-pulse-ring"
                      />
                      <span
                        aria-hidden="true"
                        className="category-story-pulse-ring category-story-pulse-ring-delay"
                      />
                    </>
                  )}

                  <div
                    style={story.accentStyle}
                    className="relative flex h-[4.4rem] w-[4.4rem] items-center justify-center rounded-full bg-gradient-to-br p-[2px] shadow-[0_10px_24px_rgba(23,20,16,0.08)] transition-transform duration-300 group-hover/story:-translate-y-0.5 md:h-[5rem] md:w-[5rem]"
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-full border border-white/90 bg-white">
                      {story.showOfferBadge ? (
                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#ff9d8b_0%,#ff6f67_62%,#ff5a5a_100%)] text-white">
                          <span className="text-[2rem] font-black leading-none md:text-[2.25rem]">
                            %
                          </span>
                        </div>
                      ) : (
                        <Image
                          src={story.image}
                          alt={story.label}
                          fill
                          sizes="80px"
                          className="object-cover transition duration-300 group-hover/story:scale-110"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#233d1d] md:text-[10px]">
                  {story.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
