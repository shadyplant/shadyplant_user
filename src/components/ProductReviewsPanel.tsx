 "use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Star, ThumbsUp } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import ReviewBottomSheet from "@/components/ReviewBottomSheet";
import type { ProductReviewsData } from "@/lib/productReviews";

type ProductReviewsPanelProps = {
  productId: string;
  productName?: string;
  reviewData: ProductReviewsData;
};

function RatingStars({
  rating,
  size = 16,
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


export default function ProductReviewsPanel({
  productId,
  productName,
  reviewData,
}: ProductReviewsPanelProps) {
  const { summary, reviews } = reviewData;
  const { fetchWithAuth, isAuthenticated, isReady } = useAuth();
  const highestBreakdownCount = Math.max(
    ...summary.ratingBreakdown.map((item) => item.count),
    1,
  );
  const hasRatings = summary.totalRatings > 0;
  const [canReview, setCanReview] = useState(false);
  const [eligibilityResolved, setEligibilityResolved] = useState(hasRatings);

  useEffect(() => {
    if (hasRatings) {
      setCanReview(true);
      setEligibilityResolved(true);
      return;
    }

    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      setCanReview(false);
      setEligibilityResolved(true);
      return;
    }

    let cancelled = false;

    async function loadEligibility() {
      try {
        const response = await fetchWithAuth<{
          data?: {
            eligibility?: {
              canReview?: boolean;
            };
          };
        }>(`/products/${encodeURIComponent(productId)}/reviews/mine`);

        if (cancelled) {
          return;
        }

        setCanReview(response?.data?.eligibility?.canReview === true);
      } catch {
        if (!cancelled) {
          setCanReview(false);
        }
      } finally {
        if (!cancelled) {
          setEligibilityResolved(true);
        }
      }
    }

    void loadEligibility();

    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, hasRatings, isAuthenticated, isReady, productId]);

  if (!hasRatings && !eligibilityResolved) {
    return null;
  }

  if (!hasRatings && !canReview) {
    return null;
  }

  return (
    <section className="border-t border-[#e7e7e7] bg-white px-4 pb-8 pt-6 md:px-0 md:pb-10 md:pt-7">
      <h2 className="text-center text-[15px] font-semibold tracking-tight text-[#111111] md:text-[18px]">
        Rating &amp; Reviews
      </h2>

      <div
        className={`mt-6 grid items-center gap-6 md:gap-8 ${
          hasRatings
            ? "md:grid-cols-[220px_minmax(0,1fr)]"
            : "justify-center"
        }`}
      >
        <div
          className={`flex flex-col items-center pb-6 text-center ${
            hasRatings
              ? "border-b border-[#f0f0f0] md:border-b-0 md:border-r md:pb-0 md:pr-6"
              : "mx-auto max-w-[280px] border-b-0 pb-0"
          }`}
        >
          <p className="text-[34px] font-semibold leading-none text-[#111111] md:text-[48px]">
            {hasRatings ? summary.averageRating.toFixed(1) : "New"}
          </p>

          <div className="mt-2.5">
            <RatingStars
              rating={summary.averageRating}
              size={14}
              activeClassName="text-[#338f23]"
              inactiveClassName="text-[#e0e0e0]"
            />
          </div>

          <p className="mt-2 text-[11px] font-medium leading-relaxed text-[#8b8b8b] md:text-[13px]">
            <span className="text-[#338f23]">
              {hasRatings ? "Verified ratings" : "No ratings yet"}
            </span>
            <br />
            {hasRatings
              ? `${summary.totalRatings} ratings`
              : "Be the first to review"}
          </p>

          <ReviewBottomSheet
            productId={productId}
            productName={productName}
            triggerLabel={hasRatings ? "Review Us" : "Write First Review"}
            triggerClassName="mt-8 h-10 w-full max-w-[160px] rounded-full border border-[#e0e0e0] bg-white text-[13px] font-semibold text-[#111111] shadow-sm transition-transform hover:bg-[#fafafa] md:active:scale-95"
          />
        </div>

        <div className="hidden px-1 md:block">
          {hasRatings ? (
            <div className="space-y-2 md:space-y-3">
              {summary.ratingBreakdown.map((item) => (
                <div
                  key={item.stars}
                  className="grid grid-cols-[12px_minmax(0,1fr)_32px] items-center gap-3 md:grid-cols-[16px_minmax(0,1fr)_40px]"
                >
                  <span className="text-[10px] font-bold text-[#111111] md:text-sm">
                    {item.stars}
                  </span>
                  <div className="h-[5px] overflow-hidden rounded-full bg-[#f0f0f0]">
                    <div
                      className="h-full rounded-full bg-[#338f23]"
                      style={{
                        width: `${(item.count / highestBreakdownCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-right text-[10px] font-medium text-[#8b8b8b] md:text-sm">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {hasRatings ? (
        <div className="mt-6 space-y-2 px-1 md:hidden">
          {summary.ratingBreakdown.map((item) => (
            <div
              key={`mobile-${item.stars}`}
              className="grid grid-cols-[12px_minmax(0,1fr)_32px] items-center gap-3"
            >
              <span className="text-[10px] font-bold text-[#111111]">
                {item.stars}
              </span>
              <div className="h-[5px] overflow-hidden rounded-full bg-[#f0f0f0]">
                <div
                  className="h-full rounded-full bg-[#338f23]"
                  style={{
                    width: `${(item.count / highestBreakdownCount) * 100}%`,
                  }}
                />
              </div>
              <span className="text-right text-[10px] font-medium text-[#8b8b8b]">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-8 pt-8">
        {!reviews.length ? (
          null
        ) : (
          <div className="mt-6 grid gap-4">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-xl border border-[#e6eadf] bg-[#fbfcf8] p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-4xl">
                    <RatingStars
                      rating={review.rating}
                      size={16}
                      activeClassName="text-[#338f23]"
                      inactiveClassName="text-[#e0e0e0]"
                    />
                    <p className="mt-3 text-sm leading-relaxed text-[#353535] md:text-base">
                      {review.body}
                    </p>
                    {review.adminReply?.body ? (
                      <div className="mt-4 rounded-[1rem] border border-[#d8e6cf] bg-white px-4 py-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5f7a52]">
                          {review.adminReply.authorName || "Store team"} replied
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[#25412a] md:text-base">
                          {review.adminReply.body}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {review.verifiedBuyer ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5d7167] shadow-sm md:text-[11px]">
                      <BadgeCheck size={12} />
                      Verified buyer
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7ede0] pt-4 text-xs text-[#7b7b7b] md:text-sm">
                  <div>
                    <p className="font-semibold text-[#111111]">{review.author}</p>
                    <p className="mt-0.5">
                      {[review.location, review.date].filter(Boolean).join(" - ")}
                    </p>
                  </div>
                  {review.helpfulCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#6f6f6f] shadow-sm md:text-sm">
                      <ThumbsUp size={14} className="text-[#64a93c]" />
                      {review.helpfulCount} found this helpful
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
