import { ApiError, getApiBaseUrl, requestJson, type ApiResponse } from "@/lib/api";

export type ProductReview = {
  id: string;
  author: string;
  location: string;
  date: string;
  rating: number;
  title: string;
  body: string;
  helpfulCount: number;
  verifiedBuyer: boolean;
};

export type ProductReviewSummary = {
  averageRating: number;
  totalRatings: number;
  recommendPercent: number | null;
  ratingBreakdown: Array<{ stars: number; count: number }>;
};

export type ProductReviewsData = {
  summary: ProductReviewSummary;
  reviews: ProductReview[];
};

export type SubmitProductReviewPayload = {
  rating: number;
  title: string;
  review: string;
};

const EMPTY_RATING_BREAKDOWN = [5, 4, 3, 2, 1].map((stars) => ({
  stars,
  count: 0,
}));

export const EMPTY_PRODUCT_REVIEWS_DATA: ProductReviewsData = {
  summary: {
    averageRating: 0,
    totalRatings: 0,
    recommendPercent: null,
    ratingBreakdown: EMPTY_RATING_BREAKDOWN,
  },
  reviews: [],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeCount(value: unknown) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.round(count) : 0;
}

function normalizeRating(value: unknown) {
  const rating = Number(value);
  return Number.isFinite(rating) ? clamp(Number(rating.toFixed(1)), 0, 5) : 0;
}

function normalizeBreakdown(input: unknown) {
  const byStars = new Map<number, number>();

  if (Array.isArray(input)) {
    input.forEach((entry) => {
      if (!entry || typeof entry !== "object") {
        return;
      }

      const stars = Number(
        "stars" in entry ? entry.stars : "rating" in entry ? entry.rating : 0,
      );

      if (!Number.isFinite(stars)) {
        return;
      }

      byStars.set(
        Math.round(stars),
        normalizeCount(
          "count" in entry
            ? entry.count
            : "total" in entry
              ? entry.total
              : "value" in entry
                ? entry.value
                : 0,
        ),
      );
    });
  } else if (input && typeof input === "object") {
    Object.entries(input).forEach(([key, value]) => {
      const stars = Number(key);
      if (Number.isFinite(stars)) {
        byStars.set(Math.round(stars), normalizeCount(value));
      }
    });
  }

  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: byStars.get(stars) ?? 0,
  }));
}

function normalizeReview(review: unknown, index: number): ProductReview | null {
  if (!review || typeof review !== "object") {
    return null;
  }

  const id = String(
    "id" in review
      ? review.id
      : "reviewId" in review
        ? review.reviewId
        : `review-${index + 1}`,
  ).trim();
  const body = String(
    "body" in review
      ? review.body
      : "review" in review
        ? review.review
        : "comment" in review
          ? review.comment
          : "",
  ).trim();

  if (!body) {
    return null;
  }

  return {
    id,
    author: String(
      "author" in review
        ? review.author
        : "name" in review
          ? review.name
          : "userName" in review
            ? review.userName
            : "Anonymous buyer",
    ).trim() || "Anonymous buyer",
    location: String(
      "location" in review
        ? review.location
        : "city" in review
          ? review.city
          : "",
    ).trim(),
    date: String(
      "date" in review
        ? review.date
        : "createdAt" in review
          ? review.createdAt
          : "",
    ).trim(),
    rating: normalizeRating("rating" in review ? review.rating : 0),
    title: String("title" in review ? review.title : "").trim(),
    body,
    helpfulCount: normalizeCount(
      "helpfulCount" in review
        ? review.helpfulCount
        : "helpful" in review
          ? review.helpful
          : 0,
    ),
    verifiedBuyer:
      "verifiedBuyer" in review ? Boolean(review.verifiedBuyer) : true,
  };
}

function normalizeProductReviewsPayload(payload: unknown): ProductReviewsData {
  const source =
    payload && typeof payload === "object" && "data" in payload
      ? payload.data
      : payload;
  const summarySource =
    source && typeof source === "object" && "summary" in source
      ? source.summary
      : source && typeof source === "object" && "reviewSummary" in source
        ? source.reviewSummary
        : source;
  const reviewsSource =
    source && typeof source === "object" && "reviews" in source
      ? source.reviews
      : [];

  const normalizedReviews = Array.isArray(reviewsSource)
    ? reviewsSource
        .map((review, index) => normalizeReview(review, index))
        .filter((review): review is ProductReview => Boolean(review))
    : [];

  const totalRatings = normalizeCount(
    summarySource &&
      typeof summarySource === "object" &&
      "totalRatings" in summarySource
      ? summarySource.totalRatings
      : summarySource &&
          typeof summarySource === "object" &&
          "ratingsCount" in summarySource
        ? summarySource.ratingsCount
        : normalizedReviews.length,
  );

  const ratingBreakdown = normalizeBreakdown(
    summarySource &&
      typeof summarySource === "object" &&
      "ratingBreakdown" in summarySource
      ? summarySource.ratingBreakdown
      : summarySource &&
          typeof summarySource === "object" &&
          "breakdown" in summarySource
        ? summarySource.breakdown
        : undefined,
  );

  const computedAverage =
    normalizedReviews.length > 0
      ? normalizedReviews.reduce((sum, review) => sum + review.rating, 0) /
        normalizedReviews.length
      : 0;
  const averageRating = normalizeRating(
    summarySource &&
      typeof summarySource === "object" &&
      "averageRating" in summarySource
      ? summarySource.averageRating
      : summarySource &&
          typeof summarySource === "object" &&
          "rating" in summarySource
        ? summarySource.rating
        : computedAverage,
  );

  const recommendValue =
    summarySource &&
    typeof summarySource === "object" &&
    "recommendPercent" in summarySource
      ? Number(summarySource.recommendPercent)
      : NaN;

  return {
    summary: {
      averageRating,
      totalRatings,
      recommendPercent: Number.isFinite(recommendValue)
        ? clamp(Math.round(recommendValue), 0, 100)
        : null,
      ratingBreakdown,
    },
    reviews: normalizedReviews,
  };
}

export async function fetchProductReviews(
  productId: string,
): Promise<ProductReviewsData> {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/products/${encodeURIComponent(productId)}/reviews`,
      {
        cache: "no-store",
      },
    );

    if (response.status === 404) {
      return EMPTY_PRODUCT_REVIEWS_DATA;
    }

    if (!response.ok) {
      return EMPTY_PRODUCT_REVIEWS_DATA;
    }

    return normalizeProductReviewsPayload(await response.json());
  } catch {
    return EMPTY_PRODUCT_REVIEWS_DATA;
  }
}

export async function submitProductReview(
  productId: string,
  payload: SubmitProductReviewPayload,
) {
  try {
    return await requestJson<ApiResponse<{ review?: ProductReview }>>(
      `/products/${encodeURIComponent(productId)}/reviews`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new Error("Unable to submit your review right now.");
  }
}
