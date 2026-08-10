"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import ReviewBottomSheet from "@/components/ReviewBottomSheet";
import type { ProductReviewsData } from "@/lib/productReviews";

export default function MobileProductReviewsSummary({
  productId,
  reviewData,
  productName,
}: {
  productId: string;
  reviewData: ProductReviewsData;
  productName: string;
}) {
  const { summary } = reviewData;
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
    <section className="border-t border-[#e7e7e7] bg-white px-4 pb-6 pt-5">
      <h2 className="text-center text-[15px] text-[#111111]">
        Rating &amp; Reviews
      </h2>

      <div
        className={`mt-6 grid items-center gap-4 ${
          hasRatings ? "grid-cols-[40%_60%]" : "justify-center"
        }`}
      >
        <div
          className={`flex flex-col items-center text-center ${
            hasRatings ? "border-r border-[#f0f0f0] pr-2" : "mx-auto max-w-[220px]"
          }`}
        >
          <p className="text-[34px] font-bold leading-none text-[#111111]">
            {hasRatings ? summary.averageRating.toFixed(1) : "New"}
          </p>

          <div className="mt-2.5 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => {
              const filled = index < Math.round(summary.averageRating);
              return (
                <Star
                  key={index}
                  size={14}
                  fill={filled ? "currentColor" : "none"}
                  className={filled ? "text-[#338f23]" : "text-[#e0e0e0]"}
                />
              );
            })}
          </div>

          <p className="mt-2 text-[11px] font-medium leading-relaxed text-[#8b8b8b]">
            <span className="text-[#338f23]">
              {hasRatings ? "Verified ratings" : "No ratings yet"}
            </span>
            <br />
            {hasRatings
              ? `${summary.totalRatings} ratings`
              : "Be the first to review"}
          </p>
        </div>

        {hasRatings ? (
          <div className="flex flex-col justify-center px-1">
            <div className="space-y-2">
              {summary.ratingBreakdown.map((item) => (
                <div
                  key={item.stars}
                  className="grid grid-cols-[12px_1fr_28px] items-center gap-3"
                >
                  <span className="text-[10px] font-medium text-[#4f4f4f]">
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
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex justify-center">
        <ReviewBottomSheet
          productId={productId}
          productName={productName}
          triggerLabel={hasRatings ? "Review Us" : "Write First Review"}
          triggerClassName="h-10 w-full max-w-[160px] rounded-full border border-gray-300 bg-white text-[13px] font-semibold text-gray-700 active:scale-95 transition-transform"
        />
      </div>
    </section>
  );
}
