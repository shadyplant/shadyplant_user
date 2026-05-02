import {
  BadgeCheck,
  CreditCard,
  Star,
  ThumbsUp,
  Truck,
  Undo2,
} from "lucide-react";
import ReviewBottomSheet from "@/components/ReviewBottomSheet";
import type { ProductExperience } from "@/components/ProductDetailsSections";

type ProductReviewsPanelProps = {
  experience: ProductExperience;
  productName?: string;
};

function RatingStars({
  rating,
  size = 16, // Reduced default size to match the image better
  activeClassName = "text-[#f1bf4a]",
  inactiveClassName = "text-[#d9e2cf]",
}: {
  rating: number;
  size?: number;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(rating);

        return (
          <Star
            key={index}
            size={size}
            className={filled ? activeClassName : inactiveClassName}
            fill={filled ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}

const trustHighlights = [
  {
    title: "100% Genuine Product",
    icon: BadgeCheck,
  },
  {
    title: "100% Secure Payment",
    icon: CreditCard,
  },
  {
    title: "Easy Returns & Instant Refunds",
    icon: Undo2,
  },
] as const;

export default function ProductReviewsPanel({
  experience,
  productName,
}: ProductReviewsPanelProps) {
  const highestBreakdownCount = Math.max(
    ...experience.ratingBreakdown.map((item) => item.count),
    1,
  );
  const featuredReviews = experience.reviews.slice(0, 1);
  const reviewFilters = [
    "Most Helpful",
    "Most Recent",
    "Product Quality",
    "Fit",
  ];

  return (
    <section className="rounded-[2.2rem] border border-[#d6e6bd] bg-white p-6 shadow-[0_24px_56px_rgba(33,79,20,0.06)] md:p-8 lg:p-10">
      <div className="grid gap-8 border-b border-[#edf1e7] pb-8 md:grid-cols-3 md:pb-10">
        {trustHighlights.map(({ title, icon: Icon }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e3ebd8] bg-[#f8fbf4] text-[#6b778d] md:h-14 md:w-14">
              <Icon size={24} />
            </div>
            <p className="mt-3 max-w-[190px] text-[10px] font-semibold uppercase leading-snug tracking-wider text-[#8a93ab] md:text-[11px]">
              {title}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-[#f4f4f8] p-1.5 md:mt-10">
        <div className="grid gap-1.5 md:grid-cols-2">
          <button
            type="button"
            className="rounded-lg border border-[#e1e4ed] bg-white px-4 py-3 text-sm font-semibold text-[#163915] shadow-sm md:text-base"
          >
            Product Reviews
          </button>
          <button
            type="button"
            className="rounded-lg px-4 py-3 text-sm font-medium text-[#98a0b7] md:text-base"
          >
            Brand Reviews
          </button>
        </div>
      </div>

      <div className="mt-6 inline-flex max-w-xl flex-wrap items-center gap-2 text-xs text-[#163915] md:mt-8 md:text-sm">
        <ThumbsUp size={16} className="text-[#64a93c] md:h-4 md:w-4" />
        <span className="font-bold text-[#64a93c]">
          {experience.recommendPercent}%
        </span>
        <span className="font-medium text-gray-700">
          of verified buyers recommend this product
        </span>
      </div>

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <div className="flex flex-col items-center rounded-[1.8rem] px-6 py-6 text-center md:px-8 md:py-8">
          <p className="text-5xl font-normal tracking-tight text-gray-900 md:text-[3.5rem] leading-none">
            {experience.rating.toFixed(1)}
          </p>
          <p className="mt-2 text-xs font-medium text-gray-500 md:text-sm">
            {experience.totalRatings} ratings
          </p>
          <div className="mt-3">
            <RatingStars rating={experience.rating} size={18} />
          </div>
          <ReviewBottomSheet
            productName={productName}
            triggerLabel="RATE"
            triggerClassName="mt-6 rounded border border-gray-300 bg-white px-6 py-2 text-xs font-semibold tracking-wide text-blue-600 transition hover:bg-gray-50 md:px-8 md:py-2.5 md:text-sm"
          />
        </div>

        <div className="rounded-[1.8rem] py-6 md:py-8">
          <div className="space-y-3 md:space-y-4">
            {experience.ratingBreakdown.map((item) => (
              <div
                key={item.stars}
                className="grid grid-cols-[20px_minmax(0,1fr)_40px] items-center gap-3 md:gap-4"
              >
                <span className="text-sm font-medium text-gray-800 md:text-base">
                  {item.stars}
                </span>
                <div className="h-[4px] overflow-hidden rounded-full bg-[#e4e6ee] md:h-[5px]">
                  <div
                    className={`h-full rounded-full ${
                      item.stars >= 4
                        ? "bg-[#68a73e]"
                        : item.stars === 3
                          ? "bg-[#efbe73]"
                          : "bg-[#d7dce5]"
                    }`}
                    style={{
                      width: `${(item.count / highestBreakdownCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-right text-xs text-gray-500 md:text-sm">
                  ({item.count})
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-[#e4ebd9] bg-white px-4 py-3 md:px-5 md:py-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2f7ea] text-[#5f8d3d] md:h-10 md:w-10">
                <Truck size={16} />
              </span>
              <p className="text-xs leading-relaxed text-[#5d6f64] md:text-sm md:leading-relaxed">
                Buyers mention reliable packing, healthy arrival, and a finish
                that matches the product photos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-[#edf1e7] pt-8">
        <h3 className="text-lg font-bold text-gray-900 md:text-xl">
          Hear what our customers say ({featuredReviews.length})
        </h3>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {reviewFilters.map((filter, index) => (
            <button
              key={filter}
              type="button"
              className={`rounded-lg border px-4 py-2 text-xs font-medium transition md:px-5 md:py-2.5 md:text-sm ${
                index === 0
                  ? "border-[#efc86f] bg-[#fff4d7] text-[#9d7018]"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {featuredReviews.map((review) => (
            <article
              key={`${review.author}-${review.date}`}
              className="rounded-xl border border-[#e6eadf] bg-[#fbfcf8] p-5 md:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-4xl">
                  <RatingStars
                    rating={review.rating}
                    size={16}
                    activeClassName="text-[#2c313d]"
                    inactiveClassName="text-[#cfd5df]"
                  />
                  <p className="mt-3 text-sm leading-relaxed text-gray-800 md:text-base">
                    {review.body}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5d7167] shadow-sm md:text-[11px]">
                  <BadgeCheck size={12} />
                  Verified buyer
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7ede0] pt-4 text-xs text-gray-500 md:text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{review.author}</p>
                  <p className="mt-0.5">
                    {review.location} - {review.date}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm md:text-sm">
                  <ThumbsUp size={14} className="text-[#64a93c]" />
                  {review.helpfulCount} found this helpful
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
