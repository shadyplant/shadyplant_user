"use client";

import Link from "next/link";
import { ArrowUpDown, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import SiteShell from "@/components/SiteShell";
import type { Product } from "@/lib/products";

type SortKey = "relevance" | "price-asc" | "price-desc" | "name-asc";

type PriceRange = {
  id: string;
  label: string;
  matches: (price: number) => boolean;
};

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
];

const priceRanges: PriceRange[] = [
  { id: "under-100", label: "Under Rs. 100", matches: (price) => price < 100 },
  {
    id: "100-300",
    label: "Rs. 100 to Rs. 300",
    matches: (price) => price >= 100 && price <= 300,
  },
  {
    id: "301-450",
    label: "Rs. 301 to Rs. 450",
    matches: (price) => price >= 301 && price <= 450,
  },
  {
    id: "451-plus",
    label: "Above Rs. 450",
    matches: (price) => price > 450,
  },
];

function computeRelevanceScore(product: Product, normalizedQuery: string) {
  if (!normalizedQuery) {
    return 0;
  }

  const productName = product.name.toLowerCase();
  const category = product.category.toLowerCase();
  const badge = product.badge.toLowerCase();
  const description = product.description.toLowerCase();

  let score = 0;

  if (productName === normalizedQuery) {
    score += 100;
  }

  if (productName.startsWith(normalizedQuery)) {
    score += 40;
  }

  if (productName.includes(normalizedQuery)) {
    score += 28;
  }

  if (category.includes(normalizedQuery)) {
    score += 16;
  }

  if (badge.includes(normalizedQuery)) {
    score += 12;
  }

  if (description.includes(normalizedQuery)) {
    score += 8;
  }

  return score;
}

function joinSearchParams(
  query: string,
  categories: string[],
  badges: string[],
  prices: string[],
  sort: SortKey,
) {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set("q", query.trim());
  }

  categories.forEach((category) => params.append("category", category));
  badges.forEach((badge) => params.append("badge", badge));
  prices.forEach((price) => params.append("price", price));

  if (sort !== "relevance") {
    params.set("sort", sort);
  }

  const serializedParams = params.toString();
  return serializedParams ? `/search?${serializedParams}` : "/search";
}

export default function SearchResultsPageClient({
  products,
}: {
  products: Product[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryOptions = Array.from(
    new Set(products.map((product) => product.category)),
  );
  const badgeOptions = Array.from(
    new Set(products.map((product) => product.badge)),
  );

  const query = searchParams?.get("q") ?? "";
  const selectedCategories = searchParams?.getAll("category") ?? [];
  const selectedBadges = searchParams?.getAll("badge") ?? [];
  const selectedPriceRanges = searchParams?.getAll("price") ?? [];
  const sort = (searchParams?.get("sort") as SortKey | null) ?? "relevance";
  const normalizedQuery = query.trim().toLowerCase();
  const results = products
    .map((product, index) => ({
      product,
      index,
      relevance: computeRelevanceScore(product, normalizedQuery),
    }))
    .filter(({ product, relevance }) => {
      const matchesQuery = !normalizedQuery || relevance > 0;
      const matchesCategory =
        !selectedCategories.length ||
        selectedCategories.includes(product.category);
      const matchesBadge =
        !selectedBadges.length || selectedBadges.includes(product.badge);
      const matchesPrice =
        !selectedPriceRanges.length ||
        selectedPriceRanges.some((rangeId) =>
          priceRanges.find((range) => range.id === rangeId)?.matches(product.price),
        );

      return matchesQuery && matchesCategory && matchesBadge && matchesPrice;
    });

  results.sort((left, right) => {
    switch (sort) {
      case "price-asc":
        return left.product.price - right.product.price;
      case "price-desc":
        return right.product.price - left.product.price;
      case "name-asc":
        return left.product.name.localeCompare(right.product.name);
      default:
        if (normalizedQuery) {
          return right.relevance - left.relevance || left.index - right.index;
        }

        return left.index - right.index;
    }
  });

  const resultProducts = results.map((entry) => entry.product);
  const hasActiveFilters =
    Boolean(query.trim()) ||
    selectedCategories.length > 0 ||
    selectedBadges.length > 0 ||
    selectedPriceRanges.length > 0 ||
    sort !== "relevance";

  function pushSearchState(next: {
    query?: string;
    categories?: string[];
    badges?: string[];
    prices?: string[];
    sort?: SortKey;
  }) {
    router.push(
      joinSearchParams(
        next.query ?? query,
        next.categories ?? selectedCategories,
        next.badges ?? selectedBadges,
        next.prices ?? selectedPriceRanges,
        next.sort ?? sort,
      ),
    );
  }

  function toggleValue(currentValues: string[], value: string) {
    return currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
  }

  return (
    <SiteShell>
      <section className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
            <aside className="h-fit rounded-[1.9rem] border border-[#dbe8cd] bg-white/95 p-5 shadow-[0_18px_45px_rgba(33,79,20,0.06)] lg:sticky lg:top-24">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6b8b58]">
                    Filter By
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                    Refine results
                  </h2>
                </div>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      router.push("/search");
                    }}
                    className="text-sm font-semibold text-[#214f14]"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>

              <div className="mt-6 space-y-5">
                <details
                  open
                  className="rounded-[1.4rem] border border-[#e3edd8] bg-[#fbfdf8] p-4"
                >
                  <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.18em] text-[#214f14]">
                    Category
                  </summary>
                  <div className="mt-4 space-y-3">
                    {categoryOptions.map((category) => {
                      const active = selectedCategories.includes(category);

                      return (
                        <label
                          key={category}
                          className="flex items-center gap-3 text-sm text-[#4d6844]"
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() =>
                              pushSearchState({
                                categories: toggleValue(
                                  selectedCategories,
                                  category,
                                ),
                              })
                            }
                            className="h-4 w-4 accent-[#214f14]"
                          />
                          <span>{category}</span>
                        </label>
                      );
                    })}
                  </div>
                </details>

                <details
                  open
                  className="rounded-[1.4rem] border border-[#e3edd8] bg-[#fbfdf8] p-4"
                >
                  <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.18em] text-[#214f14]">
                    Care Tags
                  </summary>
                  <div className="mt-4 space-y-3">
                    {badgeOptions.map((badge) => {
                      const active = selectedBadges.includes(badge);

                      return (
                        <label
                          key={badge}
                          className="flex items-center gap-3 text-sm text-[#4d6844]"
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() =>
                              pushSearchState({
                                badges: toggleValue(selectedBadges, badge),
                              })
                            }
                            className="h-4 w-4 accent-[#214f14]"
                          />
                          <span>{badge}</span>
                        </label>
                      );
                    })}
                  </div>
                </details>

                <details
                  open
                  className="rounded-[1.4rem] border border-[#e3edd8] bg-[#fbfdf8] p-4"
                >
                  <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.18em] text-[#214f14]">
                    Price
                  </summary>
                  <div className="mt-4 space-y-3">
                    {priceRanges.map((range) => {
                      const active = selectedPriceRanges.includes(range.id);

                      return (
                        <label
                          key={range.id}
                          className="flex items-center gap-3 text-sm text-[#4d6844]"
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() =>
                              pushSearchState({
                                prices: toggleValue(
                                  selectedPriceRanges,
                                  range.id,
                                ),
                              })
                            }
                            className="h-4 w-4 accent-[#214f14]"
                          />
                          <span>{range.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </details>
              </div>
            </aside>

            <div>
              <div className="mb-6 flex flex-col gap-4 rounded-[1.8rem] border border-[#dbe8cd] bg-white/95 p-4 shadow-[0_18px_45px_rgba(33,79,20,0.06)] md:flex-row md:items-center md:justify-between">
                {/* LEFT SIDE */}
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b8b58]">
                  Showing {resultProducts.length} result(s)
                  {query.trim() ? ` for "${query.trim()}"` : ""}
                </p>

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#214f14] whitespace-nowrap">
                    <ArrowUpDown size={16} />
                    Sort by
                  </label>

                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(event) =>
                        pushSearchState({
                          sort: event.target.value as SortKey,
                        })
                      }
                      className="rounded-full border border-[#d6e6bd] bg-[#f6faef] px-4 py-2.5 pr-10 text-sm font-semibold text-[#214f14] outline-none"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <SlidersHorizontal
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5c7752]"
                    />
                  </div>
                </div>
              </div>

              {hasActiveFilters ? (
                <div className="mb-5 flex flex-wrap gap-2">
                  {query.trim() ? (
                    <button
                      type="button"
                      onClick={() => {
                        pushSearchState({ query: "" });
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#edf5e1] px-3 py-2 text-sm font-semibold text-[#214f14]"
                    >
                      q: {query.trim()}
                      <X size={14} />
                    </button>
                  ) : null}

                  {selectedCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        pushSearchState({
                          categories: selectedCategories.filter(
                            (item) => item !== category,
                          ),
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-[#edf5e1] px-3 py-2 text-sm font-semibold text-[#214f14]"
                    >
                      {category}
                      <X size={14} />
                    </button>
                  ))}

                  {selectedBadges.map((badge) => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() =>
                        pushSearchState({
                          badges: selectedBadges.filter(
                            (item) => item !== badge,
                          ),
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-[#edf5e1] px-3 py-2 text-sm font-semibold text-[#214f14]"
                    >
                      {badge}
                      <X size={14} />
                    </button>
                  ))}

                  {selectedPriceRanges.map((rangeId) => {
                    const label = priceRanges.find(
                      (range) => range.id === rangeId,
                    )?.label;

                    if (!label) {
                      return null;
                    }

                    return (
                      <button
                        key={rangeId}
                        type="button"
                        onClick={() =>
                          pushSearchState({
                            prices: selectedPriceRanges.filter(
                              (item) => item !== rangeId,
                            ),
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-[#edf5e1] px-3 py-2 text-sm font-semibold text-[#214f14]"
                      >
                        {label}
                        <X size={14} />
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {resultProducts.length ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
                  {resultProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-[#dbe8cd] bg-white/95 p-8 text-center shadow-[0_22px_60px_rgba(33,79,20,0.08)]">
                  <h2 className="text-3xl font-black tracking-[-0.04em] text-[#163915]">
                    No products matched this search
                  </h2>
                  <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#5c7752]">
                    Try a broader keyword, remove a few filters, or start again
                    from the full search page.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        router.push("/search");
                      }}
                      className="theme-button inline-flex items-center justify-center rounded-full px-6 py-4 text-sm font-semibold"
                    >
                      Clear all filters
                    </button>
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center rounded-full border border-[#d6e6bd] bg-white px-6 py-4 text-sm font-semibold text-[#214f14]"
                    >
                      Back to home
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
