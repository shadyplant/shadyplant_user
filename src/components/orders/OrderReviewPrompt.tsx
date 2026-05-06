"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Pencil, Star, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { type ApiResponse } from "@/lib/api";

type OrderReviewPromptProps = {
  productId: string;
  productName: string;
};

type MyProductReview = {
  id: string;
  author: string;
  location: string;
  date: string;
  rating: number;
  title: string;
  body: string;
  helpfulCount: number;
  verifiedBuyer: boolean;
  status: "pending" | "approved" | "rejected";
  updatedAt?: string;
};

type MyProductReviewResponse = ApiResponse<{
  productId: string;
  review: MyProductReview | null;
}>;

const statusLabelMap = {
  pending: "Pending",
  approved: "Published",
  rejected: "Needs update",
} as const;

function StarRow({
  activeRating,
  onSelect,
  onHover,
  onLeave,
  size = 20,
}: {
  activeRating: number;
  onSelect: (value: number) => void;
  onHover?: (value: number) => void;
  onLeave?: () => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const value = index + 1;
        const isActive = value <= activeRating;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            onMouseEnter={() => onHover?.(value)}
            onMouseLeave={() => onLeave?.()}
            className="rounded-full p-0.5 transition hover:-translate-y-0.5"
            aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
          >
            <Star
              size={size}
              className={isActive ? "text-[#f2be4f]" : "text-[#d1d8c7]"}
              fill={isActive ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewStatusPill({ status }: { status: MyProductReview["status"] }) {
  const tone =
    status === "approved"
      ? "border-[#cde3bf] bg-[#f3faee] text-[#2a6a21]"
      : status === "rejected"
        ? "border-[#f0c8bf] bg-[#fff5f2] text-[#a24834]"
        : "border-[#e7ddbf] bg-[#fff9ec] text-[#8a6714]";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${tone}`}
    >
      {statusLabelMap[status]}
    </span>
  );
}

export default function OrderReviewPrompt({
  productId,
  productName,
}: OrderReviewPromptProps) {
  const { fetchWithAuth, isAuthenticated, isReady } = useAuth();
  const [review, setReview] = useState<MyProductReview | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isExpandedDesktop, setIsExpandedDesktop] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadMyReview = useCallback(async () => {
    if (!isReady || !isAuthenticated || !productId) {
      return;
    }

    setIsLoadingReview(true);

    try {
      const response = await fetchWithAuth<MyProductReviewResponse>(
        `/products/${encodeURIComponent(productId)}/reviews/mine`,
      );
      const nextReview = response.data.review;
      setReview(nextReview);
      setRating(nextReview?.rating || 0);
      setTitle(nextReview?.title || "");
      setBody(nextReview?.body || "");
      setSubmitError(null);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to load your review.",
      );
    } finally {
      setIsLoadingReview(false);
    }
  }, [fetchWithAuth, isAuthenticated, isReady, productId]);

  useEffect(() => {
    void loadMyReview();
  }, [loadMyReview]);

  useEffect(() => {
    if (!isMobileSheetOpen) {
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSheetOpen]);

  const activeRating = hoveredRating || rating;
  const canSubmit =
    rating > 0 && title.trim().length > 2 && body.trim().length > 9;
  const hasReview = Boolean(review);
  const reviewStatus = review?.status ?? null;
  const cardHeading = hasReview ? "Your review" : "Rate this order";
  const actionLabel = hasReview ? "Update review" : "Submit review";
  const compactSummary = useMemo(
    () => (hasReview ? `${rating}/5` : "Tap to rate"),
    [hasReview, rating],
  );

  function openEditorForDesktop(starValue?: number) {
    if (typeof starValue === "number") {
      setRating(starValue);
    }
    setIsExpandedDesktop(true);
    setSubmitError(null);
  }

  function openEditorForMobile(starValue?: number) {
    if (typeof starValue === "number") {
      setRating(starValue);
    }
    setIsMobileSheetOpen(true);
    setSubmitError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await fetchWithAuth(
        `/products/${encodeURIComponent(productId)}/reviews`,
        {
          method: "POST",
          body: JSON.stringify({
            rating,
            title: title.trim(),
            review: body.trim(),
          }),
        },
      );
      await loadMyReview();
      setIsExpandedDesktop(false);
      setIsMobileSheetOpen(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit your review right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderFormContent(isMobile = false) {
    return (
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between gap-3">
          <StarRow
            activeRating={activeRating}
            onSelect={setRating}
            onHover={setHoveredRating}
            onLeave={() => setHoveredRating(0)}
            size={isMobile ? 26 : 22}
          />
          {reviewStatus ? <ReviewStatusPill status={reviewStatus} /> : null}
        </div>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Review title"
          className="w-full rounded-2xl border border-[#dce8ce] bg-white px-4 py-3 text-sm text-[#163915] outline-none transition placeholder:text-[#a0af97] focus:border-[#9dc07b] focus:ring-4 focus:ring-[#edf7e8]"
        />

        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write your review"
          rows={isMobile ? 4 : 3}
          className="w-full resize-none rounded-2xl border border-[#dce8ce] bg-white px-4 py-3 text-sm leading-6 text-[#163915] outline-none transition placeholder:text-[#a0af97] focus:border-[#9dc07b] focus:ring-4 focus:ring-[#edf7e8]"
        />

        {submitError ? (
          <p className="text-sm font-medium text-[#b43f2a]">{submitError}</p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#214f14] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#173f10] disabled:cursor-not-allowed disabled:bg-[#cbd8c1]"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MessageSquare size={16} />
            )}
            {isSubmitting ? "Saving..." : actionLabel}
          </button>
          {!isMobile ? (
            <button
              type="button"
              onClick={() => {
                setIsExpandedDesktop(false);
                setSubmitError(null);
                if (review) {
                  setRating(review.rating);
                  setTitle(review.title);
                  setBody(review.body);
                }
              }}
              className="text-sm font-semibold text-[#607657]"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    );
  }

  if (!isReady || !isAuthenticated || !productId) {
    return null;
  }

  return (
    <>
      <section className="border-t border-gray-300 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-[#163915]">{cardHeading}</p>
            <p className="mt-1 line-clamp-1 text-xs font-medium text-[#6e8664]">
              {productName}
            </p>
          </div>

          {isLoadingReview ? (
            <Loader2 size={16} className="animate-spin text-[#6e8664]" />
          ) : reviewStatus ? (
            <ReviewStatusPill status={reviewStatus} />
          ) : null}
        </div>

        <div className="mt-4 hidden md:block">
          {isExpandedDesktop ? (
            renderFormContent(false)
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StarRow
                  activeRating={activeRating}
                  onSelect={(value) => openEditorForDesktop(value)}
                  onHover={setHoveredRating}
                  onLeave={() => setHoveredRating(0)}
                />
                <span className="text-sm font-semibold text-[#6e8664]">
                  {compactSummary}
                </span>
              </div>

              <button
                type="button"
                onClick={() => openEditorForDesktop()}
                className="inline-flex items-center gap-2 rounded-full border border-[#d2e0c1] px-4 py-2 text-sm font-bold text-[#214f14] transition hover:bg-[#f1f8ea]"
              >
                <Pencil size={15} />
                {hasReview ? "Edit" : "Review"}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => openEditorForMobile()}
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#dce8ce] bg-white px-4 py-3 text-left md:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={18}
                  className={
                    index < rating ? "text-[#f2be4f]" : "text-[#d1d8c7]"
                  }
                  fill={index < rating ? "currentColor" : "none"}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-[#607657]">
              {compactSummary}
            </span>
          </div>
          <Pencil size={16} className="text-[#214f14]" />
        </button>
      </section>

      {isMobileSheetOpen ? (
        <div className="fixed inset-0 z-[95] flex items-end bg-black/45 px-0 backdrop-blur-[2px] md:hidden">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close review editor"
            onClick={() => setIsMobileSheetOpen(false)}
          />
          <div className="relative w-full rounded-t-[1.9rem] bg-white px-5 pb-6 pt-3 shadow-[0_-18px_70px_rgba(0,0,0,0.22)]">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-[#d8e3cd]" />
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black text-[#163915]">
                  {cardHeading}
                </p>
                <p className="mt-1 text-sm text-[#6e8664]">{productName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dce8ce] text-[#46653f]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5">{renderFormContent(true)}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
