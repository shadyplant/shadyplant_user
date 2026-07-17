"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ListFilter,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import MobileSearchHeader from "@/components/MobileSearchHeader";
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
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isDesktopSortOpen, setIsDesktopSortOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const desktopSortRef = useRef<HTMLDivElement | null>(null);
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
  const activeSortOption =
    sortOptions.find((option) => option.value === sort) || sortOptions[0];
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

  useEffect(() => {
    const previousBackground = document.body.style.background;
    const previousBackgroundImage = document.body.style.backgroundImage;
    const previousBackgroundAttachment = document.body.style.backgroundAttachment;

    document.body.style.background = "#ffffff";
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundAttachment = "scroll";

    return () => {
      document.body.style.background = previousBackground;
      document.body.style.backgroundImage = previousBackgroundImage;
      document.body.style.backgroundAttachment = previousBackgroundAttachment;
    };
  }, []);

  useEffect(() => {
    if (!isFilterSheetOpen && !isSortSheetOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterSheetOpen(false);
        setIsSortSheetOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFilterSheetOpen, isSortSheetOpen]);

  useEffect(() => {
    if (!isDesktopSortOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!desktopSortRef.current?.contains(event.target as Node)) {
        setIsDesktopSortOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDesktopSortOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDesktopSortOpen]);

  const filterGroups = (
    <div className="space-y-4">
      <details
        open
        className="rounded-[0.5rem] border border-gray-300 p-4"
      >
        <summary className="cursor-pointer list-none text-sm text-gray-600">
          Category
        </summary>
        <div className="mt-4 space-y-3">
          {categoryOptions.map((category) => {
            const active = selectedCategories.includes(category);

            return (
              <label
                key={category}
                className="flex items-center gap-3 text-sm text-gray-600"
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() =>
                    pushSearchState({
                      categories: toggleValue(selectedCategories, category),
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
        className="rounded-[0.5rem] border border-[#e3edd8] p-4"
      >
        <summary className="cursor-pointer list-none text-sm text-gray-600">
          Care Tags
        </summary>
        <div className="mt-4 space-y-3">
          {badgeOptions.map((badge) => {
            const active = selectedBadges.includes(badge);

            return (
              <label
                key={badge}
                className="flex items-center gap-3 text-sm text-gray-600"
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
        className="rounded-[0.5rem] border border-[#e3edd8] p-4"
      >
        <summary className="cursor-pointer list-none text-sm text-gray-600">
          Price
        </summary>
        <div className="mt-4 space-y-3">
          {priceRanges.map((range) => {
            const active = selectedPriceRanges.includes(range.id);

            return (
              <label
                key={range.id}
                className="flex items-center gap-3 text-sm text-gray-600"
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() =>
                    pushSearchState({
                      prices: toggleValue(selectedPriceRanges, range.id),
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
  );

  return (
    <SiteShell hideMobileHeader showFooter>
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-50 bg-white md:hidden">
          <MobileSearchHeader
            initialQuery={query}
            sticky={false}
            onSearch={(nextQuery) => pushSearchState({ query: nextQuery })}
          />
          <div className="grid h-[46px] grid-cols-[1fr_auto_1fr] items-center border-t border-[#f1f1f1]">
            <button
              type="button"
              onClick={() => setIsSortSheetOpen(true)}
              className="flex h-full items-center justify-center gap-2 text-sm font-bold text-[#111111]"
            >
              <ArrowUpDown size={15} strokeWidth={1.8} />
              Sort
            </button>
            <div className="h-5 w-px bg-[#cfcfcf]" />
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="flex h-full items-center justify-center gap-2 text-sm font-bold text-[#111111]"
            >
              <SlidersHorizontal size={15} strokeWidth={1.8} />
              Filter
            </button>
          </div>
        </div>

        <section className="px-4 py-5 md:px-6 md:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-0 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
              <aside className=" shadow-[0_22px_60px_rgba(33,79,20,0.08)] hidden p-5 lg:sticky lg:top-24 lg:block lg:self-start">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600">
                      Filter By
                    </p>
                    <h2 className="mt-2 text-2xl text-[#163915]">
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

                <div className="mt-6">{filterGroups}</div>
              </aside>

              <div className="shadow-[0_22px_60px_rgba(33,79,20,0.08)] md:px-4">
                <div className="mb-2 hidden flex-col gap-4 p-4  md:flex md:flex-row md:items-center md:justify-between">
                  {/* LEFT SIDE */}
                  <p className="text-sm text-gray-600">
                    Showing {resultProducts.length} result(s)
                    {query.trim() ? ` for "${query.trim()}"` : ""}
                  </p>

                  {/* RIGHT SIDE */}
                  <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 md:flex md:w-auto md:gap-4">
                    <button
                      type="button"
                      onClick={() => setIsFilterSheetOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#d6e6bd] bg-[#f6faef] px-4 py-2.5 text-sm font-semibold text-gray-600 lg:hidden"
                    >
                      <SlidersHorizontal size={16} />
                      Filter
                    </button>

                    <label className="hidden items-center gap-2 whitespace-nowrap text-sm text-gray-600 md:inline-flex">
                      <ArrowUpDown size={16} />
                      Sort by
                    </label>

                    <div
                      ref={desktopSortRef}
                      className="relative min-w-0 md:min-w-[240px]"
                    >
                      <button
                        type="button"
                        onClick={() => setIsDesktopSortOpen((open) => !open)}
                        aria-haspopup="listbox"
                        aria-expanded={isDesktopSortOpen}
                        className="flex w-full items-center justify-between gap-3 rounded-[0.85rem] border border-gray-300 bg-white px-4 py-3 text-left text-sm font-normal text-gray-600 shadow-[0_10px_24px_rgba(33,79,20,0.05)] outline-none transition hover:border-[#b8cca3] md:w-auto md:min-w-[240px]"
                      >
                        <span className="truncate">{activeSortOption.label}</span>
                        <span className="flex items-center text-[#5c7752]">
                          <SlidersHorizontal size={16} />
                        </span>
                      </button>

                      {isDesktopSortOpen ? (
                        <div
                          role="listbox"
                          aria-label="Sort results"
                          className="absolute right-0 top-[calc(100%+0.55rem)] z-30 w-full overflow-hidden rounded-[0.85rem] border border-[#d6e6bd] bg-white shadow-[0_18px_34px_rgba(33,79,20,0.12)]"
                        >
                          {sortOptions.map((option) => {
                            const isActive = sort === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                onClick={() => {
                                  pushSearchState({ sort: option.value });
                                  setIsDesktopSortOpen(false);
                                }}
                                className={`flex w-full items-center justify-between gap-3 border-b border-[#edf3e6] px-4 py-3 text-left text-sm transition last:border-b-0 ${
                                  isActive
                                    ? "bg-[#3d63be] text-white"
                                    : "text-[#214f14] hover:bg-[#f6faef]"
                                }`}
                              >
                                <span>{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {hasActiveFilters ? (
                  <div className="mb-5 hidden flex-wrap gap-2 md:flex">

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
                <div className="flex flex-col items-center justify-center bg-white px-6 py-16 text-center sm:py-24">
  <h2 className="text-xl font-medium tracking-tight text-[#163915]">
    No products found
  </h2>
  <p className="mt-2 max-w-sm text-sm text-zinc-500">
    Try adjusting your keywords, removing some filters, or starting fresh.
  </p>
  
  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
    <button
      type="button"
      onClick={() => router.push("/search")}
      className="inline-flex items-center justify-center rounded-md bg-[#4c8b5d] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4c8b5d]/80 focus:outline-none focus:ring-2 focus:ring-[#163915] focus:ring-offset-2"
    >
      Clear all filters
    </button>
    <Link
      href="/"
      className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#163915] focus:ring-offset-2"
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

        {isFilterSheetOpen ? (
          <div
            className="fixed inset-0 z-[90] flex items-end bg-black/45 backdrop-blur-[2px] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Product filters"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              aria-label="Close filters"
              onClick={() => setIsFilterSheetOpen(false)}
            />

            <div className="relative w-full rounded-t-[1.8rem] bg-white shadow-[0_-18px_70px_rgba(0,0,0,0.22)]">
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[#d7e3cc]" />
              <div className="flex items-center justify-between gap-4 border-b border-[#e4edd9] px-5 py-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-600">
                    Filter By
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#163915]">
                    Refine results
                  </h2>
                </div>

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dce8ce] text-[#4e6d46]"
                  aria-label="Close filters"
                  onClick={() => setIsFilterSheetOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[68vh] overflow-y-auto px-5 py-5">
                {filterGroups}
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-[#e4edd9] bg-white px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    router.push("/search");
                    setIsFilterSheetOpen(false);
                  }}
                  className="rounded-full border border-[#cfe0b5] px-5 py-3 text-sm font-bold text-[#214f14]"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="rounded-full bg-[#214f14] px-5 py-3 text-sm font-bold text-white"
                >
                  Show results
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isSortSheetOpen ? (
          <div
            className="fixed inset-0 z-[90] flex items-end bg-black/45 backdrop-blur-[2px] md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Sort products"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              aria-label="Close sort options"
              onClick={() => setIsSortSheetOpen(false)}
            />

            <div className="relative w-full rounded-t-[1.3rem] bg-white shadow-[0_-18px_70px_rgba(0,0,0,0.22)]">
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[#d7d7d7]" />
              <div className="flex items-center justify-between border-b border-[#eeeeee] px-5 py-4">
                <div className="flex items-center gap-2 text-base font-bold text-[#111111]">
                  <ListFilter size={18} />
                  Sort
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dedede] text-[#222222]"
                  aria-label="Close sort options"
                  onClick={() => setIsSortSheetOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 py-3">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      pushSearchState({ sort: option.value });
                      setIsSortSheetOpen(false);
                    }}
                    className={`flex w-full items-center justify-between border-b border-[#f0f0f0] py-4 text-left text-sm font-semibold last:border-b-0 ${
                      sort === option.value ? "text-[#214f14]" : "text-[#222222]"
                    }`}
                  >
                    {option.label}
                    {sort === option.value ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#214f14]" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SiteShell>
  );
}
