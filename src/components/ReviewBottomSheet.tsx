"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { CheckCircle2, Leaf, Loader2, Send, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { submitProductReview } from "@/lib/productReviews";

type ReviewBottomSheetProps = {
  productId: string;
  productName?: string;
  triggerLabel?: string;
  triggerClassName?: string;
};

const ratingLabels = ["Poor", "Okay", "Good", "Great", "Excellent"];

export default function ReviewBottomSheet({
  productId,
  productName = "this plant",
  triggerLabel = "Write a review",
  triggerClassName = "rounded-full border border-[#cfe0b5] px-5 py-3 text-sm font-bold text-[#214f14] transition hover:bg-[#f2f8ea]",
}: ReviewBottomSheetProps) {
  const router = useRouter();
  const { fetchWithAuth, isAuthenticated, isReady } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);
  const [canReview, setCanReview] = useState(true);
  const [eligibilityMessage, setEligibilityMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isReady || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    async function loadEligibility() {
      setIsLoadingEligibility(true);
      setEligibilityMessage(null);

      try {
        const response = await fetchWithAuth<{
          data?: {
            eligibility?: {
              canReview?: boolean;
              reason?: string | null;
            };
          };
        }>(`/products/${encodeURIComponent(productId)}/reviews/mine`);
        const eligibility = response?.data?.eligibility;

        if (cancelled) {
          return;
        }

        setCanReview(eligibility?.canReview !== false);
        setEligibilityMessage(
          eligibility?.canReview === false
            ? eligibility.reason || "Only delivered orders are eligible for product reviews."
            : null,
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCanReview(true);
        setEligibilityMessage(
          error instanceof Error ? error.message : null,
        );
      } finally {
        if (!cancelled) {
          setIsLoadingEligibility(false);
        }
      }
    }

    void loadEligibility();

    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, isAuthenticated, isOpen, isReady, productId]);

  const activeRating = hoveredRating || rating;
  const canSubmit = canReview && rating > 0 && review.trim().length > 9;

  function closeSheet() {
    setIsOpen(false);
  }

  function handleOpen() {
    if (isReady && !isAuthenticated) {
      router.push(`/auth?next=${encodeURIComponent(`/products/${productId}`)}`);
      return;
    }

    setIsOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitProductReview(productId, {
        rating,
        review: review.trim(),
      });
      setSubmitted(true);
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

  function resetForm() {
    setRating(0);
    setHoveredRating(0);
    setReview("");
    setSubmitted(false);
    setSubmitError(null);
    setIsSubmitting(false);
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={handleOpen}>
        {triggerLabel}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 px-0 backdrop-blur-[2px] md:items-center md:px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close review form"
            onClick={closeSheet}
          />

          <div className="relative w-full max-w-[560px] rounded-t-[1.8rem] bg-white shadow-[0_-18px_70px_rgba(0,0,0,0.24)] md:rounded-[1.8rem] md:shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[#d7e3cc] md:hidden" />

            <div className="flex items-start justify-between gap-4 border-b border-[#e4edd9] px-5 py-5 md:px-7">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full bg-[#eef6e7] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#214f14]">
                  <Leaf size={13} />
                  Verified purchase review
                </p>
                <h2 id={titleId} className="mt-3 text-xl font-black text-[#163915] md:text-2xl">
                  Rate your experience
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#66805c]">
                  Share how {productName.toLowerCase()} arrived, settled, and looks in your space.
                </p>
              </div>

              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dce8ce] text-[#4e6d46] transition hover:bg-[#f4f8ee]"
                aria-label="Close review form"
                onClick={closeSheet}
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="px-5 py-8 text-center md:px-7 md:py-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf8e8] text-[#2f7d1d]">
                  <CheckCircle2 size={34} />
                </div>
                <h3 className="mt-5 text-2xl font-black text-[#163915]">Review received</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#66805c]">
                  Thanks for helping other plant lovers choose with confidence. Your review is ready
                  for moderation.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#cfe0b5] px-5 py-3 text-sm font-bold text-[#214f14] transition hover:bg-[#f2f8ea]"
                    onClick={resetForm}
                  >
                    Write another
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[#214f14] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#163915]"
                    onClick={closeSheet}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form className="max-h-[78vh] overflow-y-auto px-5 py-5 md:px-7" onSubmit={handleSubmit}>
                {isLoadingEligibility ? (
                  <div className="mb-5 flex items-center gap-2 rounded-2xl bg-[#f6f8f3] px-4 py-3 text-sm font-medium text-[#52724f]">
                    <Loader2 size={16} className="animate-spin" />
                    Checking review eligibility...
                  </div>
                ) : eligibilityMessage ? (
                  <div className="mb-5 rounded-2xl bg-[#f6f8f3] px-4 py-3 text-sm font-medium text-[#52724f]">
                    {eligibilityMessage}
                  </div>
                ) : null}

                <div>
                  <label className="text-sm font-bold text-[#163915]">Your rating</label>
                  <div className="mt-3 flex items-center gap-2">
                    {ratingLabels.map((label, index) => {
                      const value = index + 1;
                      const isActive = value <= activeRating;

                      return (
                        <button
                          key={label}
                          type="button"
                          disabled={!canReview || isLoadingEligibility}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dce8ce] bg-[#f9fcf5] text-[#bac8ad] transition hover:-translate-y-0.5 hover:border-[#efc86f] hover:text-[#f1bf4a] focus:outline-none focus:ring-2 focus:ring-[#9fc681]"
                          aria-label={`${value} star${value === 1 ? "" : "s"} - ${label}`}
                          onClick={() => setRating(value)}
                          onMouseEnter={() => setHoveredRating(value)}
                          onMouseLeave={() => setHoveredRating(0)}
                        >
                          <Star
                            size={22}
                            className={isActive ? "text-[#f1bf4a]" : "text-current"}
                            fill={isActive ? "currentColor" : "none"}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 min-h-5 text-sm font-semibold text-[#6b8b58]">
                    {activeRating ? ratingLabels[activeRating - 1] : "Tap a star to rate"}
                  </p>
                </div>

                <div className="mt-5 grid gap-4">
                  <label className="block">
                    <span className="text-sm font-bold text-[#163915]">Your review</span>
                    <textarea
                      value={review}
                      onChange={(event) => setReview(event.target.value)}
                      placeholder="Tell others about delivery, plant health, size, and how it looks after settling."
                      rows={5}
                      disabled={!canReview || isLoadingEligibility}
                      className="mt-2 w-full resize-none rounded-2xl border border-[#dce8ce] bg-[#fbfdf8] px-4 py-3 text-sm leading-6 text-[#163915] outline-none transition placeholder:text-[#9aad90] focus:border-[#8bb86a] focus:ring-4 focus:ring-[#edf7e8]"
                    />
                  </label>

                </div>

                <div className="sticky bottom-0 -mx-5 mt-6 border-t border-[#e4edd9] bg-white px-5 py-4 md:-mx-7 md:px-7">
                  {submitError ? (
                    <p className="mb-3 text-sm text-[#b43f2a]">{submitError}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || isLoadingEligibility}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#214f14] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#163915] disabled:cursor-not-allowed disabled:bg-[#c9d8bd] md:text-base"
                  >
                    {isSubmitting ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Send size={17} />
                    )}
                    {isSubmitting ? "Submitting..." : "Submit review"}
                  </button>
                  <p className="mt-2 text-center text-xs text-[#7b9270]">
                    Rating and a short review are required.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
