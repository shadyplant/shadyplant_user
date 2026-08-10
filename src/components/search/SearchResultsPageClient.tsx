"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Heart,
  ListFilter,
  ShoppingBasket,
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
  const [filterSheetOffset, setFilterSheetOffset] = useState(0);
  const [sortSheetOffset, setSortSheetOffset] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const desktopSortRef = useRef<HTMLDivElement | null>(null);
  const filterSheetPanelRef = useRef<HTMLDivElement | null>(null);
  const sortSheetPanelRef = useRef<HTMLDivElement | null>(null);
  const filterSheetTouchStartY = useRef<number | null>(null);
  const filterSheetDragging = useRef(false);
  const filterSheetPointerId = useRef<number | null>(null);
  const sortSheetTouchStartY = useRef<number | null>(null);
  const sortSheetDragging = useRef(false);
  const sortSheetPointerId = useRef<number | null>(null);
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
          priceRanges
            .find((range) => range.id === rangeId)
            ?.matches(product.price),
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

  function setSheetTransform(
    panelRef: React.RefObject<HTMLDivElement | null>,
    offset: number,
  ) {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    panel.style.transform = `translateY(${Math.max(0, offset)}px)`;
  }

  function setSheetTransition(
    panelRef: React.RefObject<HTMLDivElement | null>,
    enabled: boolean,
  ) {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    panel.style.transition = enabled ? "" : "none";
  }

  function handleFilterSheetPointerDown(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    filterSheetPointerId.current = event.pointerId;
    filterSheetTouchStartY.current = event.clientY;
    filterSheetDragging.current = false;
    setSheetTransition(filterSheetPanelRef, false);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleFilterSheetPointerMove(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (
      filterSheetPointerId.current !== event.pointerId ||
      filterSheetTouchStartY.current === null
    ) {
      return;
    }

    const deltaY = event.clientY - filterSheetTouchStartY.current;

    if (deltaY <= 0) {
      setSheetTransform(filterSheetPanelRef, 0);
      return;
    }

    filterSheetDragging.current = true;
    setSheetTransform(filterSheetPanelRef, Math.min(deltaY, 180));
  }

  function handleFilterSheetPointerEnd(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (filterSheetPointerId.current !== event.pointerId) {
      return;
    }

    const panel = filterSheetPanelRef.current;
    const currentTransform = panel?.style.transform || "";
    const translatedValue = Number.parseFloat(
      currentTransform.replace("translateY(", "").replace("px)", ""),
    );
    const shouldDismiss =
      filterSheetDragging.current && translatedValue > 96;

    filterSheetPointerId.current = null;
    filterSheetTouchStartY.current = null;
    filterSheetDragging.current = false;
    setSheetTransition(filterSheetPanelRef, true);

    if (shouldDismiss) {
      setIsFilterSheetOpen(false);
      return;
    }

    setSheetTransform(filterSheetPanelRef, 0);
    setFilterSheetOffset(0);
  }

  function handleSortSheetPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    sortSheetPointerId.current = event.pointerId;
    sortSheetTouchStartY.current = event.clientY;
    sortSheetDragging.current = false;
    setSheetTransition(sortSheetPanelRef, false);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSortSheetPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (
      sortSheetPointerId.current !== event.pointerId ||
      sortSheetTouchStartY.current === null
    ) {
      return;
    }

    const deltaY = event.clientY - sortSheetTouchStartY.current;

    if (deltaY <= 0) {
      setSheetTransform(sortSheetPanelRef, 0);
      return;
    }

    sortSheetDragging.current = true;
    setSheetTransform(sortSheetPanelRef, Math.min(deltaY, 180));
  }

  function handleSortSheetPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (sortSheetPointerId.current !== event.pointerId) {
      return;
    }

    const panel = sortSheetPanelRef.current;
    const currentTransform = panel?.style.transform || "";
    const translatedValue = Number.parseFloat(
      currentTransform.replace("translateY(", "").replace("px)", ""),
    );
    const shouldDismiss =
      sortSheetDragging.current && translatedValue > 96;

    sortSheetPointerId.current = null;
    sortSheetTouchStartY.current = null;
    sortSheetDragging.current = false;
    setSheetTransition(sortSheetPanelRef, true);

    if (shouldDismiss) {
      setIsSortSheetOpen(false);
      return;
    }

    setSheetTransform(sortSheetPanelRef, 0);
    setSortSheetOffset(0);
  }

  useEffect(() => {
    const previousBackground = document.body.style.background;
    const previousBackgroundImage = document.body.style.backgroundImage;
    const previousBackgroundAttachment =
      document.body.style.backgroundAttachment;

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
    if (!isFilterSheetOpen) {
      setFilterSheetOffset(0);
      filterSheetTouchStartY.current = null;
      filterSheetDragging.current = false;
    }
  }, [isFilterSheetOpen]);

  useEffect(() => {
    if (!isSortSheetOpen) {
      setSortSheetOffset(0);
      sortSheetTouchStartY.current = null;
      sortSheetDragging.current = false;
    }
  }, [isSortSheetOpen]);

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
      <details open className="rounded-[0.5rem] border border-gray-200 p-4">
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

      <details open className="rounded-[0.5rem] border border-gray-200 p-4">
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

      <details open className="rounded-[0.5rem] border border-gray-200 p-4">
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
          <div className="grid h-[46px] grid-cols-[1fr_auto_1fr] items-center border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsSortSheetOpen(true)}
              className="flex h-full items-center justify-center gap-2 text-sm font-bold text-gray-700"
            >
              <ArrowUpDown size={15} strokeWidth={1.8} />
              Sort
            </button>
            <div className="h-5 w-px bg-[#cfcfcf]" />
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="flex h-full items-center justify-center gap-2 text-sm font-bold text-gray-700"
            >
              <SlidersHorizontal size={15} strokeWidth={1.8} />
              Filter
            </button>
          </div>
        </div>

        <section className="px-2 py-5 md:px-6 md:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-0 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
              <aside className=" shadow-[0_22px_60px_rgba(33,79,20,0.08)] hidden p-5 lg:sticky lg:top-24 lg:block lg:self-start">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Filter By</p>
                    <h2 className="mt-2 text-xl text-gray-700">
                      Refine results
                    </h2>
                  </div>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={() => {
                        router.push("/search");
                      }}
                      className="text-sm text-gray-700 hover:text-[#214f14] transition cursor-pointer"
                    >
                      Clear all
                    </button>
                  ) : null}
                </div>

                <div className="mt-6">{filterGroups}</div>
              </aside>

              <div className="md:shadow-[0_22px_60px_rgba(33,79,20,0.08)] md:px-4">
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
                        className="flex w-full items-center justify-between gap-3 rounded-[0.85rem] border border-gray-200 bg-white px-4 py-3 text-left text-sm font-normal text-gray-600 shadow-[0_10px_24px_rgba(33,79,20,0.05)] outline-none transition hover:border-gray-300 cursor-pointer md:w-auto md:min-w-[240px]"
                      >
                        <span className="truncate">
                          {activeSortOption.label}
                        </span>
                        <span className="flex items-center text-gray-600">
                          <ArrowUpDown size={16} />
                        </span>
                      </button>

                      {isDesktopSortOpen ? (
                        <div
                          role="listbox"
                          aria-label="Sort results"
                          className="absolute right-0 top-[calc(100%+0.55rem)] z-30 w-full overflow-hidden rounded-[0.85rem] border border-[#d6e6bd] bg-white shadow-[0_12px_24px_rgba(33,79,20,0.08)]"
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
                                    ? "bg-[#207958] text-white"
                                    : "text-gray-600 hover:bg-gray-50 focus:bg-gray-50 active:bg-gray-100"
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
                  <div className="grid grid-cols-2 gap-1 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
                    {resultProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center bg-white px-6 py-16 text-center sm:py-24">
                    {/* --------------- */}
                    <div className="mx-auto max-w-3xl p-8 text-center md:p-10">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center text-gray-700 bg-gray-100 rounded-full  ">
                        <ShoppingBasket size={30} />
                      </div>
                      <h2 className="mt-6 text-2xl md:text-2xl text-gray-800">
                        No products Found
                      </h2>
                      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <button
                          onClick={() => router.push("/search")}
                          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-4 md:px-5 md:py-3 cursor-pointer hover:bg-gray-100 text-sm text-gray-700"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                    {/* --------------- */}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row"></div>
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

            <div
              ref={filterSheetPanelRef}
              className="relative w-full rounded-t-[1.8rem] bg-white shadow-[0_-18px_70px_rgba(0,0,0,0.22)] transition-transform duration-200 ease-out"
              style={{ transform: `translateY(${filterSheetOffset}px)`, willChange: "transform" }}
            >
              <div
                className="select-none"
                onPointerDown={handleFilterSheetPointerDown}
                onPointerMove={handleFilterSheetPointerMove}
                onPointerUp={handleFilterSheetPointerEnd}
                onPointerCancel={handleFilterSheetPointerEnd}
                style={{ touchAction: "none", cursor: "grab" }}
              >
                <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-200" />
                <div className="flex items-center justify-between gap-4 border-b border-[#e4edd9] px-5 py-4">
                  <div>
                    <h2 className="mt-1 text-base text-gray-700">Filter By</h2>
                  </div>

                  {/* <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500"
                    aria-label="Close filters"
                    onClick={() => setIsFilterSheetOpen(false)}
                  >
                    <X size={18} />
                  </button> */}
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
                    className="rounded-full border border-gray-200 px-5 py-3 text-sm text-gray-700"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterSheetOpen(false)}
                    className="rounded-full bg-[#207958] px-5 py-3 text-sm text-white"
                  >
                    Show results
                  </button>
                </div>
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

            <div
              ref={sortSheetPanelRef}
              className="relative w-full rounded-t-[1.3rem] bg-white shadow-[0_-18px_70px_rgba(0,0,0,0.22)] transition-transform duration-200 ease-out"
              style={{ transform: `translateY(${sortSheetOffset}px)`, willChange: "transform" }}
            >
              <div
                className="select-none"
                onPointerDown={handleSortSheetPointerDown}
                onPointerMove={handleSortSheetPointerMove}
                onPointerUp={handleSortSheetPointerEnd}
                onPointerCancel={handleSortSheetPointerEnd}
                style={{ touchAction: "none", cursor: "grab" }}
              >
                <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[#d7d7d7]" />
                <div className="flex items-center justify-between border-b border-[#eeeeee] px-5 py-4">
                  <div className="flex items-center gap-2 text-base font-bold text-[#111111]">
                    <ListFilter size={18} />
                    Sort
                  </div>
                  {/* <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dedede] text-[#222222]"
                    aria-label="Close sort options"
                    onClick={() => setIsSortSheetOpen(false)}
                  >
                    <X size={18} />
                  </button> */}
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
                        sort === option.value
                          ? "text-[#214f14]"
                          : "text-[#222222]"
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
          </div>
        ) : null}
      </div>
    </SiteShell>
  );
}
